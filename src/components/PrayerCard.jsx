import React from 'react';
import { motion } from 'framer-motion';

const PrayerCard = ({ name, azaan, jamaat, delay = 0, isActive = false }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.4 }}
            className="glass-panel"
            style={{
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '0.75rem 0',
                border: isActive ? '1px solid var(--primary-gold)' : '1px solid var(--glass-border)',
                boxShadow: isActive ? '0 0 20px rgba(212, 175, 55, 0.4)' : 'var(--glass-shadow)',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.3s ease-in-out',
                background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'var(--glass-bg)'
            }}
        >
            <h3 style={{ fontSize: '1.5rem', textTransform: 'capitalize' }} className={isActive ? 'gold-gradient-text' : ''}>
                {name}
            </h3>
            <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Azaan</div>
                    <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        background: 'var(--bg-dark)',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        color: 'var(--primary-gold)'
                    }}>
                        {azaan}
                    </div>
                </div>
                {jamaat && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {name.toLowerCase() === 'juma' ? 'Khutba' : 'Jamaat'}
                        </div>
                        <div style={{
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            background: 'var(--bg-dark)',
                            padding: '0.5rem 1rem',
                            borderRadius: '12px',
                            color: 'var(--primary-gold)'
                        }}>
                            {jamaat}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default PrayerCard;
