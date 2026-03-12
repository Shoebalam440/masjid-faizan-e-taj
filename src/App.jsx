import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PrayerProvider } from './context/PrayerContext';
import Home from './pages/Home';
import Admin from './pages/Admin';

function App() {
  return (
    <PrayerProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </PrayerProvider>
  );
}

export default App;
