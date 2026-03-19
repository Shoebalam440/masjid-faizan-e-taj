import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const defaultTimings = {
  fajar:   { azaan: '05:20', jamaat: '05:27' },
  zohr:    { azaan: '12:30', jamaat: '12:45' },
  asr:     { azaan: '16:45', jamaat: '17:00' },
  maghrib: { azaan: '18:25', jamaat: '18:28' },
  isha:    { azaan: '19:35', jamaat: '19:50' },
  juma:    { azaan: '12:30', jamaat: '13:00' }
};

const PRAYER_NAMES = {
  fajar: 'Fajar', zohr: 'Zohr', asr: 'Asr',
  maghrib: 'Maghrib', isha: 'Isha', juma: 'Juma'
};

// Unique IDs for each prayer (stable, never change)
const PRAYER_IDS = { fajar: 10, zohr: 20, asr: 30, maghrib: 40, isha: 50, juma: 20 };

const PrayerContext = createContext(null);
const isNative = Capacitor.isNativePlatform();

// ─── Audio for Web ───────────────────────────────────────────────────────────
let azaanAudio = null;
if (!isNative && typeof window !== 'undefined') {
  azaanAudio = new Audio('/azan.mp3');
  const unlockAudio = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    azaanAudio.play().then(() => { azaanAudio.pause(); azaanAudio.currentTime = 0; }).catch(() => {});
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
}

// ─── Setup Notification Channel (Android) ───────────────────────────────────
const setupNotificationChannel = async () => {
  if (!isNative) return;
  try {
    await LocalNotifications.createChannel({
      id: 'azaan_v2',
      name: 'Azaan Prayer Times',
      description: 'Azaan notifications for all 5 daily prayers at Masjid Faizan e Taj',
      importance: 5,       // IMPORTANCE_HIGH — heads-up notification
      sound: 'azan',       // res/raw/azan.mp3
      visibility: 1,       // VISIBILITY_PUBLIC — visible on lockscreen
      vibration: true,
      lights: true,
      lightColor: '#C9A84C'
    });
  } catch (e) {
    console.warn('[Azaan] Channel setup failed:', e.message);
  }
};

// ─── Request All Required Permissions ────────────────────────────────────────
const requestAllPermissions = async () => {
  if (!isNative) return;
  try {
    // Notification permission (Android 13+)
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      const result = await LocalNotifications.requestPermissions();
      console.log('[Azaan] Notification permission:', result.display);
    }

    // Exact alarm permission (Android 12+)
    try {
      const exactStatus = await LocalNotifications.checkExactNotificationSetting();
      if (exactStatus.exactAlarm !== 'granted') {
        // Guide user to enable exact alarm
        console.warn('[Azaan] Exact alarm not granted — redirecting to settings');
        await LocalNotifications.changeExactNotificationSetting();
      }
    } catch (e) {
      // Not available on older Android or web
    }
  } catch (e) {
    console.warn('[Azaan] Permission request failed:', e.message);
  }
};

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
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  // Keep ref in sync with state
  useEffect(() => {
    timingsRef.current = timings;
    localStorage.setItem('masjid_timings_v2', JSON.stringify(timings));
  }, [timings]);

  // ─── App Init: Setup channel + permissions + fetch from Supabase ───────────
  useEffect(() => {
    const init = async () => {
      await setupNotificationChannel();
      await requestAllPermissions();

      // Check permission status for UI feedback
      if (isNative) {
        try {
          const s = await LocalNotifications.checkPermissions();
          setPermissionStatus(s.display);
        } catch (_) {}
      }

      if (supabase) {
        await fetchAndSchedule();
      }
    };
    init();
  }, []);

  // ─── Supabase: Fetch + Real-time + Polling ────────────────────────────────
  useEffect(() => {
    if (!supabase) return;

    // Real-time subscription — instant updates
    const channel = supabase
      .channel('azaan_realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_settings',
        filter: 'id=eq.timings'
      }, (payload) => {
        console.log('[Azaan] Real-time update:', payload.new?.timings);
        if (payload.new?.timings) {
          applyNewTimings(payload.new.timings);
        }
      })
      .subscribe(status => console.log('[Azaan] Realtime:', status));

    // Polling fallback — every 20s (catches Supabase realtime drops)
    const poll = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('app_settings').select('timings').eq('id', 'timings').single();
        if (data?.timings) {
          const fresh = JSON.stringify(data.timings);
          const curr = JSON.stringify(timingsRef.current);
          if (fresh !== curr) {
            console.log('[Azaan] Polling: update detected');
            applyNewTimings(data.timings);
          }
        }
      } catch (e) { /* network error — ignore */ }
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, []);

  // ─── Fetch timings from Supabase and schedule notifications ─────────────────
  const fetchAndSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings').select('*').eq('id', 'timings').single();
      if (data?.timings) {
        applyNewTimings(data.timings);
      } else if (error?.code === 'PGRST116') {
        // First time — create row
        await supabase.from('app_settings')
          .insert([{ id: 'timings', timings: timingsRef.current }]);
      }
    } catch (e) {
      console.warn('[Azaan] Fetch failed:', e.message);
    }
  };

  // ─── Apply new timings: update state + localStorage + reschedule ───────────
  const applyNewTimings = (newTimings) => {
    setTimings(newTimings);
    scheduleAllNotifications(newTimings);
  };

  // ─── Schedule Notifications ─────────────────────────────────────────────────
  // This is the CORE function. Called:
  // 1. On app open (from Supabase fetch)
  // 2. On real-time update from admin
  // 3. On polling detection
  // 4. On admin save
  const scheduleAllNotifications = async (currentTimings) => {
    if (!isNative) return; // Web doesn't need native scheduling

    try {
      // Cancel ALL existing notifications first (clean slate)
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
        console.log('[Azaan] Cancelled', pending.notifications.length, 'old notifications');
      }

      const today = new Date();
      const isFriday = today.getDay() === 5;
      const notifications = [];

      // Schedule for TODAY + next 7 DAYS for reliability
      // This ensures even if app isn't opened for a week, notifications keep coming
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        const targetDayIsFriday = targetDate.getDay() === 5;

        const prayers = targetDayIsFriday
          ? ['fajar', 'juma', 'asr', 'maghrib', 'isha']
          : ['fajar', 'zohr', 'asr', 'maghrib', 'isha'];

        prayers.forEach((prayer) => {
          const timeStr = currentTimings[prayer]?.azaan;
          if (!timeStr) return;

          const [h, m] = timeStr.split(':').map(Number);
          const scheduleDate = new Date(targetDate);
          scheduleDate.setHours(h, m, 0, 0);

          // Skip times that have already passed
          if (scheduleDate <= new Date()) return;

          // Unique ID: prayer base ID + day offset (to avoid collisions)
          const notifId = PRAYER_IDS[prayer] + dayOffset;

          notifications.push({
            id: notifId,
            title: `🕌 ${PRAYER_NAMES[prayer]} ki Azaan`,
            body: `Masjid Faizan e Taj — Namaz ka waqt ho gaya. Allahu Akbar!`,
            schedule: {
              at: scheduleDate,
              allowWhileIdle: true, // fires even in Doze mode
            },
            sound: 'azan',          // res/raw/azan.mp3
            channelId: 'azaan_v2',  // high importance channel
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#C9A84C',
            actionTypeId: '',
            extra: { prayer, day: dayOffset }
          });
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`[Azaan] ✅ Scheduled ${notifications.length} notifications (7-day window)`);
      } else {
        console.log('[Azaan] No notifications to schedule (all times passed today?)');
        // Schedule for tomorrow in case all today's prayers passed
        await scheduleFromTomorrow(currentTimings);
      }
    } catch (error) {
      console.error('[Azaan] Scheduling error:', error.message);
    }
  };

  // ─── Fallback: Schedule starting from tomorrow ────────────────────────────
  const scheduleFromTomorrow = async (currentTimings) => {
    const notifications = [];
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const isFriday = targetDate.getDay() === 5;

      const prayers = isFriday
        ? ['fajar', 'juma', 'asr', 'maghrib', 'isha']
        : ['fajar', 'zohr', 'asr', 'maghrib', 'isha'];

      prayers.forEach((prayer) => {
        const timeStr = currentTimings[prayer]?.azaan;
        if (!timeStr) return;
        const [h, m] = timeStr.split(':').map(Number);
        const scheduleDate = new Date(targetDate);
        scheduleDate.setHours(h, m, 0, 0);
        notifications.push({
          id: PRAYER_IDS[prayer] + dayOffset,
          title: `🕌 ${PRAYER_NAMES[prayer]} ki Azaan`,
          body: `Masjid Faizan e Taj — Namaz ka waqt ho gaya. Allahu Akbar!`,
          schedule: { at: scheduleDate, allowWhileIdle: true },
          sound: 'azan',
          channelId: 'azaan_v2',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#C9A84C',
          actionTypeId: '',
          extra: { prayer, day: dayOffset }
        });
      });
    }
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log(`[Azaan] ✅ Tomorrow+ scheduled: ${notifications.length} notifications`);
    }
  };

  // ─── Web: Clock-based check ──────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (!isNative) {
        // Web only: play audio + browser notification manually
        checkAndPlayForWeb(now);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkAndPlayForWeb = (now) => {
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (seconds !== '00') return; // only check at :00

    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hh}:${mm}`;
    const isFriday = now.getDay() === 5;
    const current = timingsRef.current;

    Object.entries(current).forEach(([prayer, timeObj]) => {
      if (isFriday && prayer === 'zohr') return;
      if (!isFriday && prayer === 'juma') return;
      if (timeObj.azaan === timeString) {
        playAzaanWeb(prayer);
      }
    });
  };

  const playAzaanWeb = (prayerName) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(`🕌 ${prayerName} ki Azaan!`, {
            body: 'Masjid Faizan e Taj — Namaz ka waqt ho gaya.',
            icon: '/icon.png',
            vibrate: [300, 100, 300, 100, 300],
            requireInteraction: true,
          });
        }).catch(() => new Notification(`🕌 ${prayerName} ki Azaan!`));
      } else {
        new Notification(`🕌 ${prayerName} ki Azaan!`);
      }
    }
    if (azaanAudio) {
      azaanAudio.currentTime = 0;
      azaanAudio.play().catch(e => console.error('[Azaan] Audio error:', e));
    }
  };

  // ─── Admin functions ──────────────────────────────────────────────────────────
  const updateTiming = async (prayer, type, time) => {
    const newTimings = {
      ...timingsRef.current,
      [prayer]: { ...timingsRef.current[prayer], [type]: time }
    };
    applyNewTimings(newTimings);
    if (supabase) {
      const { error } = await supabase.from('app_settings')
        .update({ timings: newTimings }).eq('id', 'timings');
      if (error) console.error('[Azaan] updateTiming Supabase error:', error);
    }
  };

  const updateAllTimings = async (newTimingsObject) => {
    applyNewTimings(newTimingsObject);
    if (supabase) {
      const { error } = await supabase.from('app_settings')
        .update({ timings: newTimingsObject }).eq('id', 'timings');
      if (error) console.error('[Azaan] updateAllTimings Supabase error:', error);
      else console.log('[Azaan] ✅ Timings saved — all devices updating');
    }
  };

  return (
    <PrayerContext.Provider value={{
      timings,
      updateTiming,
      updateAllTimings,
      currentTime,
      permissionStatus,
      scheduleAllNotifications
    }}>
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayer = () => useContext(PrayerContext);
