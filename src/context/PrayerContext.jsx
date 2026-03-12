import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultTimings = {
  fajar: { azaan: '05:20', jamaat: '05:27' },
  zohr: { azaan: '12:30', jamaat: '12:45' },
  asr: { azaan: '16:45', jamaat: '17:00' },
  maghrib: { azaan: '18:25', jamaat: '18:28' },
  isha: { azaan: '19:35', jamaat: '19:50' },
  juma: { azaan: '12:30', jamaat: '13:00' }
};

const PrayerContext = createContext(null);

export const PrayerProvider = ({ children }) => {
  const [timings, setTimings] = useState(() => {
    const saved = localStorage.getItem('masjid_timings_v2');
    return saved ? JSON.parse(saved) : defaultTimings;
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Audio reference for azaan
  const azaanAudio = new Audio('https://www.islamcan.com/audio/adhan/azan3.mp3');

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
    const permission = Notification.permission;
    if (permission === 'granted') {
      new Notification(`Time for ${prayerName} prayer!`);
    } else if (permission !== 'denied') {
      Notification.requestPermission().then(newPerm => {
        if (newPerm === 'granted') {
          new Notification(`Time for ${prayerName} prayer!`);
        }
      });
    }

    azaanAudio.play().catch(e => console.error("Audio block by browser:", e));
  };

  const updateTiming = (prayer, type, time) => {
    setTimings(prev => ({
      ...prev,
      [prayer]: { ...prev[prayer], [type]: time }
    }));
  };

  return (
    <PrayerContext.Provider value={{ timings, updateTiming, currentTime }}>
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayer = () => useContext(PrayerContext);
