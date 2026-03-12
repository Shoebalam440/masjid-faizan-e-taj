import React from 'react';
import { usePrayer } from '../context/PrayerContext';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Clock as ClockIcon, Calendar } from 'lucide-react';
import moment from 'moment-hijri';

const Clock = () => {
    const { currentTime } = usePrayer();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{ padding: '2rem', textAlign: 'center', marginBottom: '3rem' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <ClockIcon color="var(--primary-gold)" size={32} />
                <h2 style={{ fontSize: '3rem', fontWeight: 'bold' }} className="gold-gradient-text">
                    {format(currentTime, 'hh:mm:ss a')}
                </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} />
                    <p style={{ fontSize: '1.2rem' }}>
                        {format(currentTime, 'EEEE, do MMMM yyyy')}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-gold)' }}>
                    <Calendar size={16} />
                    <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                        {moment(currentTime).subtract(1, 'days').format('iD iMMMM, iYYYY')} AH
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default Clock;
