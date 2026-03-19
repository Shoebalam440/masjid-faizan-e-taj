import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import moment from 'moment-hijri';
import { Calendar as CalendarIcon, Moon, Star } from 'lucide-react';

const islamicMonths = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

// Some fixed approximate dates for demonstration
const upcomingEvents = [
  { name: 'Ramadan Begins', hijriDate: '1 Ramadan 1447', approxGregorian: 'March 2026' },
  { name: 'Eid al-Fitr', hijriDate: '1 Shawwal 1447', approxGregorian: 'April 2026' },
  { name: 'Hajj Begins', hijriDate: '8 Dhu al-Hijjah 1447', approxGregorian: 'May 2026' },
  { name: 'Eid al-Adha', hijriDate: '10 Dhu al-Hijjah 1447', approxGregorian: 'May 2026' },
  { name: 'Islamic New Year', hijriDate: '1 Muharram 1448', approxGregorian: 'June 2026' },
];

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(moment()), 60000);
    return () => clearInterval(timer);
  }, []);

  const gregorianDate = currentDate.format('dddd, D MMMM YYYY');
  
  // Format: iYYYY/iM/iD (e.g., 1447/9/1)
  const hijriYear = currentDate.iYear();
  const hijriMonth = islamicMonths[currentDate.iMonth()];
  const hijriDay = currentDate.iDate();

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '6rem' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <h1 className="gold-gradient-text" style={{ fontSize: '2.2rem', fontWeight: 700 }}>Hijri Calendar</h1>
        <p style={{ color: 'var(--text-muted)' }}>Islamic Date & Upcoming Events</p>
      </motion.div>

      {/* Today's Date Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ delay: 0.1 }}
        className="glass-panel" 
        style={{ 
          padding: '2rem', textAlign: 'center', marginBottom: '2rem',
          position: 'relative', overflow: 'hidden'
        }}
      >
        <Moon size={120} color="rgba(212,175,55,0.05)" style={{ position: 'absolute', right: '-20px', top: '-20px' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Aaj ki Tareekh</p>
          <h2 className="gold-gradient-text" style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '0.5rem' }}>
            {hijriDay}
          </h2>
          <h3 style={{ fontSize: '1.8rem', color: '#FFF8DC', marginBottom: '1.5rem', fontWeight: 600 }}>
            {hijriMonth} {hijriYear}
          </h3>
          
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', 
            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <CalendarIcon size={16} color="var(--primary-gold)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{gregorianDate}</span>
          </div>
        </div>
      </motion.div>

      {/* Upcoming Events */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 style={{ fontSize: '1.3rem', color: '#FFF8DC', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={20} color="var(--primary-gold)" />
          Upcoming Islamic Events
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {upcomingEvents.map((event, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className="glass-panel"
              style={{ 
                padding: '1.2rem', display: 'flex', justifyContent: 'space-between', 
                alignItems: 'center', borderLeft: '4px solid var(--primary-gold)'
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.1rem', color: '#FFF8DC', marginBottom: '0.2rem' }}>{event.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--primary-gold)' }}>{event.hijriDate}</p>
              </div>
              <div style={{ 
                background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', 
                borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)'
              }}>
                ~ {event.approxGregorian}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CalendarPage;
