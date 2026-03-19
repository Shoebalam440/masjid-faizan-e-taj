import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Calendar, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel('public:app_settings')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.announcements'
      }, (payload) => {
        if (payload.new && payload.new.timings) {
          // Re-using "timings" column to store JSON array to avoid DB schema changes
          const raw = payload.new.timings;
          if (Array.isArray(raw)) {
            setAnnouncements(raw.sort((a,b) => b.timestamp - a.timestamp));
          }
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'announcements')
        .single();
        
      if (data && data.timings && Array.isArray(data.timings)) {
        setAnnouncements(data.timings.sort((a,b) => b.timestamp - a.timestamp));
      } else if (error && error.code === 'PGRST116') {
        // Create row if missing
        await supabase.from('app_settings').insert([{ id: 'announcements', timings: [] }]);
      }
    } catch (e) {
      console.warn('Failed to fetch announcements:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '6rem' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <h1 className="gold-gradient-text" style={{ fontSize: '2.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Megaphone size={32} /> Notices
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Important masjid updates & events</p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-panel" 
            style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}
          >
            <AlertCircle size={48} color="rgba(212,175,55,0.4)" style={{ margin: '0 auto 1rem' }} />
            <p>Koi naya notice nahi hai.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {announcements.map((ann, idx) => (
              <motion.div
                key={ann.id || idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel"
                style={{ 
                  padding: '1.5rem', 
                  borderLeft: ann.type === 'urgent' ? '4px solid #ef4444' : '4px solid var(--primary-gold)',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', 
                  alignItems: 'flex-start', marginBottom: '0.8rem' 
                }}>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                    color: ann.type === 'urgent' ? '#ef4444' : 'var(--primary-gold)',
                    background: ann.type === 'urgent' ? 'rgba(239,68,68,0.1)' : 'rgba(212,175,55,0.1)',
                    padding: '0.2rem 0.6rem', borderRadius: '4px'
                  }}>
                    {ann.type === 'urgent' ? 'Urgent' : 'Update'}
                  </span>
                  
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Clock size={12} /> {timeAgo(ann.timestamp)}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.2rem', color: '#FFF8DC', marginBottom: '0.5rem', fontWeight: 600 }}>
                  {ann.title}
                </h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-light)', lineHeight: 1.5, opacity: 0.9 }}>
                  {ann.message}
                </p>
                
                {ann.date && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1rem', color: 'var(--primary-gold)', fontSize: '0.85rem' }}>
                     <Calendar size={14} /> Event Date: {ann.date}
                   </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
