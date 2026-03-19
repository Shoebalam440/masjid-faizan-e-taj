import React, { useState, useEffect } from 'react';
import { usePrayer } from '../context/PrayerContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, Clock, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';

const Admin = () => {
    const { timings, updateAllTimings } = usePrayer();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [localTimings, setLocalTimings] = useState(timings);
    const [activeTab, setActiveTab] = useState('timings'); // 'timings' | 'notices'
    
    // Notices state
    const [announcements, setAnnouncements] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const [newMsg, setNewMsg] = useState('');
    const [newType, setNewType] = useState('update');
    const [newDate, setNewDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const navigate = useNavigate();

    // Sync timings
    useEffect(() => {
        setLocalTimings(timings);
    }, [timings]);

    // Fetch notices on auth
    useEffect(() => {
        if (isAuthenticated && activeTab === 'notices') {
            fetchNotices();
        }
    }, [isAuthenticated, activeTab]);

    const fetchNotices = async () => {
        const { data } = await supabase.from('app_settings').select('timings').eq('id', 'announcements').single();
        if (data && Array.isArray(data.timings)) {
            setAnnouncements(data.timings.sort((a,b) => b.timestamp - a.timestamp));
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'admin123') setIsAuthenticated(true);
        else alert('Incorrect password');
    };

    // --- TIMINGS METHODS ---
    const handleChangeTiming = (prayer, type, value) => {
        setLocalTimings(prev => ({
            ...prev,
            [prayer]: { ...prev[prayer], [type]: value }
        }));
    };

    const handleSaveTimings = async () => {
        await updateAllTimings(localTimings);
        alert('Timings updated successfully!');
    };

    // --- NOTICES METHODS ---
    const handleAddNotice = async () => {
        if (!newTitle.trim() || !newMsg.trim()) return alert('Title aur message dono likhein!');
        setIsSaving(true);
        
        const newNotice = {
            id: Date.now().toString(),
            title: newTitle,
            message: newMsg,
            type: newType, // 'update' or 'urgent'
            date: newDate,
            timestamp: Date.now()
        };

        const updated = [newNotice, ...announcements];
        
        await supabase.from('app_settings').update({ timings: updated }).eq('id', 'announcements');
        setAnnouncements(updated);
        
        setNewTitle(''); setNewMsg(''); setNewDate(''); setNewType('update');
        setIsSaving(false);
    };

    const handleDeleteNotice = async (id) => {
        if (!window.confirm('Yeh notice delete karein?')) return;
        const updated = announcements.filter(a => a.id !== id);
        await supabase.from('app_settings').update({ timings: updated }).eq('id', 'announcements');
        setAnnouncements(updated);
    };


    if (!isAuthenticated) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px', borderRadius: '24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <img src="/icon.png" alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '20px', margin: '0 auto 1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} />
                        <h2 className="gold-gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Admin Login</h2>
                    </div>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <input
                            type="password"
                            placeholder="Enter Admin Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '1.25rem', borderRadius: '16px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none', fontSize: '1.1rem' }}
                        />
                        <button type="submit" style={{ padding: '1.25rem', borderRadius: '16px', background: 'var(--primary-gold)', color: 'var(--bg-dark)', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}>
                            Login
                        </button>
                    </form>
                    <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                        Return to App
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem', paddingBottom: '3rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Link to="/">
                    <button style={{ color: 'var(--primary-gold)', background: 'var(--glass-bg)', padding: '0.75rem', borderRadius: '50%', border: '1px solid var(--glass-border)', display: 'flex' }}>
                        <ArrowLeft size={24} />
                    </button>
                </Link>
                <img src="/icon.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
                <h1 className="gold-gradient-text" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Admin Panel</h1>
            </header>

            {/* Toggle Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '12px' }}>
                <button 
                  onClick={() => setActiveTab('timings')}
                  style={{ 
                    flex: 1, padding: '0.8rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center',
                    background: activeTab === 'timings' ? 'var(--primary-gold)' : 'transparent',
                    color: activeTab === 'timings' ? 'var(--bg-dark)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'timings' ? 700 : 500
                  }}>
                  <Clock size={18} /> Update Timings
                </button>
                <button 
                  onClick={() => setActiveTab('notices')}
                  style={{ 
                    flex: 1, padding: '0.8rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center',
                    background: activeTab === 'notices' ? 'var(--primary-gold)' : 'transparent',
                    color: activeTab === 'notices' ? 'var(--bg-dark)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'notices' ? 700 : 500
                  }}>
                  <Megaphone size={18} /> Send Notice
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'timings' ? (
                    <motion.div key="timings" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {['fajar', 'zohr', 'asr', 'maghrib', 'isha', 'juma'].map((prayer) => (
                                <div key={prayer} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ color: 'var(--primary-gold)', textTransform: 'capitalize', fontSize: '1.3rem', marginBottom: '1rem' }}>
                                        {prayer}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Azaan</label>
                                            <input type="time" value={localTimings[prayer]?.azaan || ''} onChange={(e) => handleChangeTiming(prayer, 'azaan', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Jamaat</label>
                                            <input type="time" value={localTimings[prayer]?.jamaat || ''} onChange={(e) => handleChangeTiming(prayer, 'jamaat', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)' }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={handleSaveTimings} style={{ marginTop: '1rem', padding: '1.2rem', borderRadius: '16px', background: 'var(--primary-gold)', color: 'var(--bg-dark)', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Save size={24} /> Save Timings
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="notices" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        {/* New Notice Form */}
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                            <h3 style={{ color: '#FFF8DC', marginBottom: '1rem' }}>Naya Notice Bhejein</h3>
                            
                            <input 
                              placeholder="Notice Title (e.g., Juma Khutba Topic)" 
                              value={newTitle} onChange={e => setNewTitle(e.target.value)}
                              style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}
                            />
                            
                            <textarea 
                              placeholder="Message details here..." 
                              value={newMsg} onChange={e => setNewMsg(e.target.value)}
                              rows="3"
                              style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)', marginBottom: '1rem', resize: 'none' }}
                            />
                            
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Date (Optional)</label>
                                    <input 
                                      type="date" 
                                      value={newDate} onChange={e => setNewDate(e.target.value)}
                                      style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Priority</label>
                                    <select 
                                      value={newType} onChange={e => setNewType(e.target.value)}
                                      style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)' }}
                                    >
                                        <option value="update" style={{ background: '#022c22' }}>Normal Update</option>
                                        <option value="urgent" style={{ background: '#022c22' }}>Urgent / Important</option>
                                    </select>
                                </div>
                            </div>
                            
                            <button onClick={handleAddNotice} disabled={isSaving} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'var(--primary-gold)', color: 'var(--bg-dark)', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                <Plus size={20} /> {isSaving ? 'Saving...' : 'Publish Notice'}
                            </button>
                        </div>

                        {/* List of Existing Notices */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginLeft: '0.5rem' }}>Active Notices</h3>
                            {announcements.map(ann => (
                                <div key={ann.id} className="glass-panel" style={{ padding: '1.2rem', position: 'relative' }}>
                                    <button onClick={() => handleDeleteNotice(ann.id)} style={{ position: 'absolute', top: '1r<ctrl61>em', right: '1rem', color: '#ef4444' }}>
                                        <Trash2 size={20} />
                                    </button>
                                    <h4 style={{ color: '#FFF8DC', fontSize: '1.1rem', marginBottom: '4px', paddingRight: '2rem' }}>{ann.title}</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>{ann.message}</p>
                                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
                                        <span style={{ color: ann.type === 'urgent' ? '#ef4444' : 'var(--primary-gold)' }}>{ann.type === 'urgent' ? 'Urgent' : 'Update'}</span>
                                        {ann.date && <span style={{ color: 'var(--text-muted)' }}>• {ann.date}</span>}
                                    </div>
                                </div>
                            ))}
                            {announcements.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No active notices.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Admin;
