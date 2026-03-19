import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, CalendarDays, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/qibla', icon: Compass, label: 'Qibla' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { path: '/announcements', icon: Megaphone, label: 'Notices' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(2,44,34,0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(212,175,55,0.25)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom, 8px))',
      zIndex: 200,
    }}>
      {tabs.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path;
        return (
          <motion.button
            key={path}
            whileTap={{ scale: 0.85 }}
            onClick={() => navigate(path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '0.3rem 1.2rem', cursor: 'pointer',
              background: 'none', border: 'none', position: 'relative',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="navIndicator"
                style={{
                  position: 'absolute', top: '-8px',
                  width: '32px', height: '3px',
                  background: 'linear-gradient(90deg, #D4AF37, #FFF8DC)',
                  borderRadius: '0 0 4px 4px',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
              color={isActive ? '#D4AF37' : 'rgba(203,213,225,0.45)'}
            />
            <span style={{
              fontSize: '0.68rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#D4AF37' : 'rgba(203,213,225,0.45)',
              fontFamily: 'Outfit, sans-serif',
            }}>
              {label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
