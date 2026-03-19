import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PrayerProvider } from './context/PrayerContext';
import Home from './pages/Home';
import Admin from './pages/Admin';
import SplashScreen from './pages/Splash';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      {!showSplash && (
        <PrayerProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Router>
        </PrayerProvider>
      )}
    </>
  );
}

export default App;
