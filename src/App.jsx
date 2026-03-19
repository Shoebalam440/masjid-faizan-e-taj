import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { PrayerProvider } from './context/PrayerContext';
import Home from './pages/Home';
import Admin from './pages/Admin';
import SplashScreen from './pages/Splash';
import BottomNav from './components/BottomNav';
import QiblaPage from './pages/Qibla';
import CalendarPage from './pages/Calendar';
import AnnouncementsPage from './pages/Announcements';

const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div style={{ paddingBottom: isAdmin ? '2rem' : '5rem' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/qibla" element={<QiblaPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
      </Routes>
      {!isAdmin && <BottomNav />}
    </div>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      {!showSplash && (
        <PrayerProvider>
          <Router>
            <AppContent />
          </Router>
        </PrayerProvider>
      )}
    </>
  );
}

export default App;
