import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { LocalNotifications } from '@capacitor/local-notifications';

const defaultTimings = {
  fajar: { azaan: '05:20', jamaat: '05:27' },
  zohr: { azaan: '12:30', jamaat: '12:45' },
  asr: { azaan: '16:45', jamaat: '17:00' },
  maghrib: { azaan: '18:25', jamaat: '18:28' },
  isha: { azaan: '19:35', jamaat: '19:50' },
  juma: { azaan: '12:30', jamaat: '13:00' }
};

const PrayerContext = createContext(null);

// Audio reference for azaan (created outside to prevent re-creation on every tick)
const azaanAudio = new Audio('/azan.mp3');

// Unlock audio on mobile with first user interaction
const unlockAudio = () => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  azaanAudio.play().then(() => {
    azaanAudio.pause();
    azaanAudio.currentTime = 0;
  }).catch(() => { });
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
};

if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
}

export const PrayerProvider = ({ children }) => {
  const [timings, setTimings] = useState(() => {
    try {
      const saved = localStorage.getItem('masjid_timings_v2');
      return saved ? JSON.parse(saved) : defaultTimings;
    } catch {
      return defaultTimings;
    }
  });

  const timingsRef = useRef(timings);

  // Keep ref updated whenever timings state changes
  useEffect(() => {
    timingsRef.current = timings;
    localStorage.setItem('masjid_timings_v2', JSON.stringify(timings));
  }, [timings]);

  // ─── Real-time Supabase listener ───────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;

    // Request native notification permission and create channel
    const requestNativePermission = async () => {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }

        // Create high importance channel for Azaan
        await LocalNotifications.createChannel({
          id: 'azaan_channel_v1',
          name: 'Azaan Notifications',
          description: 'Azaan sounds for prayer times',
          importance: 5, // High Importance (plays sound and stays on screen)
          sound: 'azan', // Use just the filename 'azan' (without .mp3 extension for Android resources)
          visibility: 1, // Visible on lockscreen
          vibration: true
        });
      } catch (e) {
        console.warn('LocalNotifications setup failed (likely web):', e.message);
      }
    };
    requestNativePermission();

    // Fetch latest timings from Supabase on mount
    const fetchTimings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'timings')
        .single();

      if (data && data.timings) {
        setTimings(data.timings);
        scheduleAllNotifications(data.timings);
      } else if (error && error.code === 'PGRST116') {
        // Row doesn't exist yet — create it with defaults
        const current = timingsRef.current;
        await supabase.from('app_settings').insert([{ id: 'timings', timings: current }]);
      }
    };

    fetchTimings();

    // ── Supabase Realtime subscription ──
    // This fires on ANY device when the admin updates timings in Supabase.
    // Make sure "Replication" is turned ON for the `app_settings` table in Supabase.
    const channel = supabase
      .channel('realtime:app_settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',  // listen for UPDATE events
          schema: 'public',
          table: 'app_settings',
          filter: 'id=eq.timings'
        },
        (payload) => {
          console.log('🔴 Real-time update received:', payload);
          if (payload.new && payload.new.timings) {
            const newTimings = payload.new.timings;
            setTimings(newTimings);                    // UI updates immediately
            scheduleAllNotifications(newTimings);      // Reschedule notifications
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Supabase realtime status:', status);
      });

    // ─── Polling fallback (har 15 second mein check) ───────────────────────
    // Real-time WebSocket kabhi kabhi Capacitor WebView mein silently fail
    // ho jata hai. Polling ensure karta hai ke changes hamesha milein.
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('timings')
          .eq('id', 'timings')
          .single();

        if (data && data.timings) {
          const fetched = JSON.stringify(data.timings);
          const current = JSON.stringify(timingsRef.current);
          if (fetched !== current) {
            console.log('🔄 Polling: Naye timings mile, update ho raha hai...');
            setTimings(data.timings);
            scheduleAllNotifications(data.timings);
          }
        }
      } catch (e) {
        console.warn('Polling error:', e.message);
      }
    }, 15000); // 15 seconds

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  // ─── Schedule local notifications for all prayers ─────────────────────────
  const scheduleAllNotifications = async (currentTimings) => {
    try {
      // Cancel all existing scheduled notifications first
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      const notifications = [];
      const isFriday = new Date().getDay() === 5;

      // Prayer display names
      const prayerNames = {
        fajar: 'Fajar',
        zohr: 'Zohr',
        asr: 'Asr',
        maghrib: 'Maghrib',
        isha: 'Isha',
        juma: 'Juma'
      };

      // On Friday: use Juma instead of Zohr
      const prayersToSchedule = isFriday
        ? ['fajar', 'juma', 'asr', 'maghrib', 'isha']
        : ['fajar', 'zohr', 'asr', 'maghrib', 'isha'];

      prayersToSchedule.forEach((prayer, index) => {
        const timeStr = currentTimings[prayer]?.azaan;
        if (!timeStr) return;

        const [hours, minutes] = timeStr.split(':').map(Number);

        const scheduleDate = new Date();
        scheduleDate.setHours(hours, minutes, 0, 0);

        // If prayer time already passed today, schedule for tomorrow
        if (scheduleDate <= new Date()) {
          scheduleDate.setDate(scheduleDate.getDate() + 1);
        }

        notifications.push({
          title: `🕌 ${prayerNames[prayer]} ki Azaan`,
          body: `Masjid Faizan e Taj mein namaz ka waqt ho gaya.`,
          id: index + 1,
          schedule: { at: scheduleDate, repeats: true, every: 'day', allowWhileIdle: true },
          sound: 'azan', // Android resource name (azan)
          channelId: 'azaan_channel_v1', // Link to the high importance channel
          actionTypeId: '',
          extra: null
        });
      });

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`✅ ${notifications.length} notifications scheduled.`);
      }
    } catch (error) {
      console.warn('Error scheduling native notifications (may be web context):', error.message);
    }
  };

  // ─── Clock & web-based azaan check ────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkPrayerTime(now);
    }, 1000);
    return () => clearInterval(timer);
  }, []); // empty deps — always uses timingsRef.current (always fresh)

  const checkPrayerTime = (now) => {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    if (seconds === '00') {
      const isFriday = now.getDay() === 5;
      const current = timingsRef.current; // always read latest timings

      Object.entries(current).forEach(([prayer, timeObj]) => {
        if (isFriday && prayer === 'zohr') return;
        if (!isFriday && prayer === 'juma') return;
        if (timeObj.azaan === timeString) {
          playAzaan(prayer);
        }
      });
    }
  };

  const playAzaan = (prayerName) => {
    // Web notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(`🕌 ${prayerName} ki Azaan!`, {
            body: `Masjid Faizan e Taj mein namaz ka waqt ho gaya.`,
            icon: '/icon.svg',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
          });
        }).catch(() => {
          new Notification(`🕌 ${prayerName} ki Azaan!`);
        });
      } else {
        new Notification(`🕌 ${prayerName} ki Azaan!`);
      }
    }

    // Play audio
    azaanAudio.currentTime = 0;
    azaanAudio.play().catch(e => console.error('Audio blocked by browser:', e));
  };

  // ─── Admin update functions ────────────────────────────────────────────────
  const updateTiming = async (prayer, type, time) => {
    const newTimings = {
      ...timingsRef.current,
      [prayer]: { ...timingsRef.current[prayer], [type]: time }
    };
    setTimings(newTimings);

    if (supabase) {
      try {
        const { error } = await supabase
          .from('app_settings')
          .update({ timings: newTimings })
          .eq('id', 'timings');
        if (error) throw error;
      } catch (error) {
        console.error('Failed to update Supabase:', error);
      }
    }
  };

  const updateAllTimings = async (newTimingsObject) => {
    setTimings(newTimingsObject);
    if (supabase) {
      try {
        const { error } = await supabase
          .from('app_settings')
          .update({ timings: newTimingsObject })
          .eq('id', 'timings');
        if (error) throw error;
        console.log('✅ Timings saved to Supabase — all devices will update.');
      } catch (error) {
        console.error('Failed to update Supabase bulk:', error);
      }
    }
  };

  return (
    <PrayerContext.Provider value={{ timings, updateTiming, updateAllTimings, currentTime }}>
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayer = () => useContext(PrayerContext);
