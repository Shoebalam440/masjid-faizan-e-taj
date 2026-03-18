import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

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
  // Request Notification permission properly via user gesture
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Try playing an empty/silent tick or just play and pause immediately
  azaanAudio.play().then(() => {
    azaanAudio.pause();
    azaanAudio.currentTime = 0;
  }).catch(() => { }); // ignore errors if it doesn't work yet

  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
};

if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
}

export const PrayerProvider = ({ children }) => {
  const [timings, setTimings] = useState(() => {
    const saved = localStorage.getItem('masjid_timings_v2');
    return saved ? JSON.parse(saved) : defaultTimings;
  });

  // Real-time listener for Supabase
  useEffect(() => {
    if (!supabase) return; // if Supabase isn't configured, do nothing
    
    // Fetch initial timings
    const fetchTimings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'timings')
        .single();
        
      if (data && data.timings) {
        setTimings(data.timings);
        localStorage.setItem('masjid_timings_v2', JSON.stringify(data.timings));
      } else if (error && error.code === 'PGRST116') {
        // Row doesn't exist, try to push default locally cached timings
        await supabase.from('app_settings').insert([{ id: 'timings', timings: timings }]);
      }
    };
    
    fetchTimings();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('app_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: 'id=eq.timings' }, payload => {
        if (payload.new && payload.new.timings) {
          setTimings(payload.new.timings);
          localStorage.setItem('masjid_timings_v2', JSON.stringify(payload.new.timings));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    localStorage.setItem('masjid_timings_v2', JSON.stringify(timings));
  }, [timings]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkPrayerTime(now);
    }, 1000);
    return () => clearInterval(timer);
  }, [timings]);

  const checkPrayerTime = (now) => {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    if (seconds === '00') {
      const isFriday = now.getDay() === 5;

      Object.entries(timings).forEach(([prayer, timeObj]) => {
        // Skip Zohr on Fridays and Juma on non-Fridays 
        if (isFriday && prayer === 'zohr') return;
        if (!isFriday && prayer === 'juma') return;

        if (timeObj.azaan === timeString) {
          playAzaan(prayer);
        }
      });
    }
  };

  const playAzaan = (prayerName) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(`Time for ${prayerName} prayer!`, {
            body: `It is time for ${prayerName} azaan.`,
            icon: '/icon.svg',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
          });
        }).catch(err => {
          new Notification(`Time for ${prayerName} prayer!`);
        });
      } else {
        new Notification(`Time for ${prayerName} prayer!`);
      }
    }

    azaanAudio.currentTime = 0;
    azaanAudio.play().catch(e => console.error("Audio block by browser:", e));
  };

  const updateTiming = async (prayer, type, time) => {
    const newTimings = {
      ...timings,
      [prayer]: { ...timings[prayer], [type]: time }
    };
    
    // Update local state immediately for fast response
    setTimings(newTimings);
    
    // Push changes to Supabase if configured
    if (supabase) {
      try {
        await supabase
          .from('app_settings')
          .update({ timings: newTimings })
          .eq('id', 'timings');
      } catch (error) {
        console.error("Failed to update Supabase:", error);
      }
    }
  };

  return (
    <PrayerContext.Provider value={{ timings, updateTiming, currentTime }}>
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayer = () => useContext(PrayerContext);
