import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, AlertCircle, RefreshCw } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

const calculateQibla = (lat, lon) => {
  const lat1 = toRad(lat);
  const lat2 = toRad(KAABA_LAT);
  const dLon = toRad(KAABA_LON - lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((toDeg(Math.atan2(y, x)) + 360) % 360);
};

const QiblaPage = () => {
  const [location, setLocation] = useState(null);
  const [qiblaBearing, setQiblaBearing] = useState(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [error, setError] = useState(null);
  const [permStatus, setPermStatus] = useState('idle'); // idle | requesting | granted | denied
  const [accuracy, setAccuracy] = useState(null);
  const orientationRef = useRef(null);

  // Get GPS location
  useEffect(() => {
    const fetchLocation = async () => {
      setPermStatus('requesting');
      try {
        if (Capacitor.isNativePlatform()) {
          const perm = await Geolocation.checkPermissions();
          if (perm.location !== 'granted') {
            const req = await Geolocation.requestPermissions();
            if (req.location !== 'granted') {
              setError('Location access denied. Please enable it in Settings.');
              setPermStatus('denied');
              return;
            }
          }
        }
        
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setLocation({ lat: latitude, lon: longitude });
        setQiblaBearing(calculateQibla(latitude, longitude));
        setAccuracy(Math.round(acc));
        setPermStatus('granted');
      } catch (err) {
        setError('Location enable na ho saki. Please allow location access.');
        setPermStatus('denied');
      }
    };
    
    fetchLocation();
  }, []);

  // Compass / Device orientation
  useEffect(() => {
    const handleOrientation = (e) => {
      let heading = null;
      if (e.webkitCompassHeading !== undefined) {
        // iOS — gives absolute compass heading directly
        heading = e.webkitCompassHeading;
      } else if (e.absolute && e.alpha !== null) {
        // Android absolute
        heading = 360 - e.alpha;
      } else if (e.alpha !== null) {
        heading = 360 - e.alpha;
      }
      if (heading !== null) setCompassHeading(heading);
    };

    const requestPermAndListen = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+
        try {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        } catch (_) {}
      } else {
        // Android / older — just listen
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    };

    requestPermAndListen();
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // Needle angle = qibla bearing - compass heading
  const needleAngle = qiblaBearing !== null ? (qiblaBearing - compassHeading + 360) % 360 : 0;
  const isAligned = Math.abs(((needleAngle + 180) % 360) - 180) < 5;

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', paddingBottom: '5rem' }}>
        <AlertCircle size={48} color='#ef4444' style={{ margin: '2rem auto' }} />
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '12px',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            color: 'var(--primary-gold)', display: 'flex',
            alignItems: 'center', gap: '0.5rem', margin: '0 auto'
          }}
        >
          <RefreshCw size={16} /> Dobara Try Karein
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '500px', margin: '0 auto', paddingBottom: '6rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <h1 className="gold-gradient-text" style={{ fontSize: '2.2rem', fontWeight: 700 }}>🕋 Qibla</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Mecca ki direction compass se dhundhein
        </p>
      </motion.div>

      {/* Compass */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        {/* Compass ring */}
        <div style={{ position: 'relative', width: '280px', height: '280px' }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid rgba(212,175,55,0.3)',
            background: 'radial-gradient(circle, rgba(6,78,59,0.6) 0%, rgba(2,44,34,0.9) 100%)',
            boxShadow: '0 0 40px rgba(212,175,55,0.15), inset 0 0 40px rgba(0,0,0,0.3)',
          }} />

          {/* Cardinal directions */}
          {[
            { label: 'N', angle: 0, top: '8px', left: '50%', transform: 'translateX(-50%)' },
            { label: 'S', angle: 180, bottom: '8px', left: '50%', transform: 'translateX(-50%)' },
            { label: 'E', angle: 90, right: '8px', top: '50%', transform: 'translateY(-50%)' },
            { label: 'W', angle: 270, left: '8px', top: '50%', transform: 'translateY(-50%)' },
          ].map(({ label, top, bottom, left, right, transform }) => (
            <div key={label} style={{
              position: 'absolute', top, bottom, left, right, transform,
              color: label === 'N' ? '#ef4444' : 'rgba(212,175,55,0.7)',
              fontSize: '0.85rem', fontWeight: 700,
            }}>{label}</div>
          ))}

          {/* Compass needle (Qibla direction) */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <motion.div
              animate={{ rotate: needleAngle }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Kaaba icon at top of needle */}
              <div style={{
                position: 'absolute', top: '20px',
                fontSize: '1.6rem', filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.8))',
              }}>🕋</div>

              {/* Needle shaft */}
              <div style={{
                position: 'absolute',
                width: '3px',
                height: '100px',
                top: '50px',
                background: 'linear-gradient(to bottom, #D4AF37, rgba(212,175,55,0.1))',
                borderRadius: '3px',
                left: '50%',
                transform: 'translateX(-50%)',
              }} />
            </motion.div>
          </div>

          {/* Center dot */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#D4AF37',
            boxShadow: '0 0 12px rgba(212,175,55,0.8)',
            zIndex: 10,
          }} />
        </div>

        {/* Alignment indicator */}
        <AnimatePresence>
          {isAligned && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: '1rem', padding: '0.5rem 1.5rem',
                borderRadius: '20px', background: 'rgba(16,185,129,0.2)',
                border: '1px solid rgba(16,185,129,0.5)',
                color: '#10b981', fontWeight: 600, fontSize: '0.9rem',
              }}
            >
              ✅ Qibla ki taraf mukh hai!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Info cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {qiblaBearing !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass-panel" style={{ padding: '1.2rem 1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Qibla Direction</span>
              <span className="gold-gradient-text" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                {Math.round(qiblaBearing)}° {getDirection(qiblaBearing)}
              </span>
            </div>
          </motion.div>
        )}

        {location && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="glass-panel" style={{ padding: '1.2rem 1.5rem' }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <MapPin size={16} color='var(--primary-gold)' />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aapki Location</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
              {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E
            </p>
            {accuracy && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Accuracy: ±{accuracy}m
              </p>
            )}
          </motion.div>
        )}

        {permStatus === 'requesting' && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            📍 Location dhundha ja raha hai...
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{
            padding: '1rem', borderRadius: '12px',
            background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
            fontSize: '0.82rem', color: 'rgba(212,175,55,0.7)', textAlign: 'center', lineHeight: 1.6,
          }}
        >
          🕋 Kaaba, Mecca al-Mukarramah<br />
          {KAABA_LAT}°N, {KAABA_LON}°E<br />
          <span style={{ opacity: 0.6 }}>Phone ko flat rakhein aur needle ko Kaaba ki taraf karo</span>
        </motion.div>
      </div>
    </div>
  );
};

const getDirection = (bearing) => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(bearing / 45) % 8];
};

export default QiblaPage;
