import React, { useState } from 'react';
import { usePrayer } from '../context/PrayerContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const Admin = () => {
  const { timings, updateAllTimings, currentTime } = usePrayer();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [localTimings, setLocalTimings] = useState(timings);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleChange = (prayer, type, value) => {
    setLocalTimings(prev => ({
      ...prev,
      [prayer]: { ...prev[prayer], [type]: value }
    }));
  };

  const handleSave = async () => {
    await updateAllTimings(localTimings);
    alert('Timings updated successfully!');
    navigate('/');
  };

    if (!isAuthenticated) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
                    <h2 className="gold-gradient-text" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>Admin Login</h2>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="password"
                            placeholder="Admin Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white', fontSize: '1.2rem', outline: 'none' }}
                            autoFocus
                        />
                        <button type="submit" style={{ padding: '1rem', borderRadius: '12px', background: 'var(--primary-gold)', color: 'var(--bg-dark)', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '1rem' }}>
                            Login
                        </button>
                        <Link to="/" style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', textDecoration: 'none' }}>Back to Home</Link>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link to="/">
                    <button style={{ color: 'var(--primary-gold)', background: 'var(--glass-bg)', padding: '0.75rem', borderRadius: '50%', border: '1px solid var(--glass-border)', display: 'flex' }}>
                        <ArrowLeft size={24} />
                    </button>
                </Link>
                <h1 className="gold-gradient-text" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Update Timings</h1>
            </header>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.entries(localTimings).map(([prayer, timeObj]) => (
                    <div key={prayer} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ fontSize: '1.4rem', textTransform: 'capitalize', color: 'var(--primary-gold)', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>{prayer}</h3>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Azaan Time</label>
                                <input
                                    type="time"
                                    value={timeObj.azaan || ''}
                                    onChange={(e) => handleChange(prayer, 'azaan', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        background: 'var(--bg-dark)',
                                        color: 'white',
                                        border: '1px solid var(--glass-border)',
                                        outline: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Jamaat Time</label>
                                <input
                                    type="time"
                                    value={timeObj.jamaat || ''}
                                    onChange={(e) => handleChange(prayer, 'jamaat', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        background: 'var(--bg-dark)',
                                        color: 'white',
                                        border: '1px solid var(--glass-border)',
                                        outline: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button onClick={handleSave} style={{
                    marginTop: '2rem',
                    padding: '1.25rem',
                    borderRadius: '16px',
                    background: 'var(--primary-gold)',
                    color: 'var(--bg-dark)',
                    fontWeight: 'bold',
                    fontSize: '1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}>
                    <Save size={24} /> Save Changes
                </button>
            </motion.div>
        </div>
    );
};

export default Admin;
