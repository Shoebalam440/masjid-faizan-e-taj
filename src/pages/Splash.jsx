import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState('enter'); // enter → tagline → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 1200);
    const t2 = setTimeout(() => setPhase('exit'), 3000);
    const t3 = setTimeout(() => onComplete(), 3700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at 50% 30%, #0d6b53 0%, #064E3B 40%, #022c22 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Stars background */}
          <Stars />

          {/* Decorative arch top */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '140%', height: '320px',
            background: 'radial-gradient(ellipse at center top, rgba(212,175,55,0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 180, damping: 14 }}
            style={{ marginBottom: '2rem', position: 'relative' }}
          >
            {/* Glow ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: '-20px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)',
              }}
            />
            <img
              src="/icon.png"
              alt="Masjid Faizan-E-Taj"
              style={{
                width: '120px', height: '120px',
                borderRadius: '28px',
                boxShadow: '0 0 60px rgba(212,175,55,0.5), 0 20px 40px rgba(0,0,0,0.5)',
                border: '2px solid rgba(212,175,55,0.4)',
                position: 'relative', zIndex: 1,
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </motion.div>

          {/* Masjid Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            style={{
              fontSize: '2.4rem', fontWeight: '700', textAlign: 'center',
              lineHeight: 1.2, marginBottom: '0.4rem',
              background: 'linear-gradient(135deg, #D4AF37, #FFF8DC, #D4AF37)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              letterSpacing: '-0.5px'
            }}
          >
            Masjid<br />Faizan-E-Taj
          </motion.h1>

          {/* Urdu tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'tagline' ? 1 : 0 }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: '1.1rem', color: 'rgba(212,175,55,0.8)',
              marginTop: '0.8rem', letterSpacing: '0.05em',
              fontStyle: 'italic',
            }}
          >
            اللهُ أَكْبَر — الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'tagline' ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: '0.9rem', color: 'rgba(203,213,225,0.7)',
              marginTop: '0.5rem', textAlign: 'center',
            }}
          >
            Live Azaan Times & Notifications
          </motion.p>

          {/* Bottom shimmer bar */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
            style={{
              position: 'absolute', bottom: '60px',
              width: '160px', height: '2px',
              background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
              borderRadius: '2px',
            }}
          />

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'tagline' ? 1 : 0 }}
            style={{
              position: 'absolute', bottom: '35px',
              display: 'flex', gap: '6px',
            }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#D4AF37',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

// Twinkling stars background
const Stars = () => {
  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 70,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 2,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {stars.map(star => (
        <motion.div
          key={star.id}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: star.delay }}
          style={{
            position: 'absolute',
            left: `${star.x}%`, top: `${star.y}%`,
            width: `${star.size}px`, height: `${star.size}px`,
            borderRadius: '50%',
            background: '#D4AF37',
          }}
        />
      ))}
    </div>
  );
};

export default SplashScreen;
