import React from 'react';
import { usePrayer } from '../context/PrayerContext';
import PrayerCard from '../components/PrayerCard';
import Clock from '../components/Clock';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
    const { timings, currentTime } = usePrayer();

    const getActivePrayer = () => {
        if (!currentTime || !timings) return null;

        const isFriday = currentTime.getDay() === 5;
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        const orderedPrayers = ['fajar', 'zohr', 'juma', 'asr', 'maghrib', 'isha'];

        for (let prayer of orderedPrayers) {
            if (prayer === 'juma' && !isFriday) continue;
            if (prayer === 'zohr' && isFriday) continue;

            const timeObj = timings[prayer];
            if (!timeObj || !timeObj.azaan) continue;

            const [hours, minutes] = timeObj.azaan.split(':').map(Number);
            const prayerMinutes = hours * 60 + minutes;

            if (prayerMinutes > currentMinutes) {
                return prayer;
            }
        }

        return 'fajar';
    };

    const activePrayer = getActivePrayer();

    const formatTime12Hour = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        const formattedHours = h < 10 ? `0${h}` : h;
        return `${formattedHours}:${minutes} ${ampm}`;
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <h1 className="gold-gradient-text" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                        Masjid Faizan e Taj
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Live Prayer Timings & Azaan Notifications</p>
                </motion.div>

                <Link to="/admin">
                    <button style={{
                        color: 'var(--primary-gold)',
                        padding: '0.75rem',
                        borderRadius: '50%',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        boxShadow: 'var(--glass-shadow)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Settings size={28} />
                    </button>
                </Link>
            </header>

            <Clock />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {Object.entries(timings)
                    .map(([prayer, timeObj], idx) => (
                        <PrayerCard
                            key={prayer}
                            name={prayer}
                            azaan={formatTime12Hour(timeObj.azaan)}
                            jamaat={timeObj.jamaat ? formatTime12Hour(timeObj.jamaat) : null}
                            delay={idx * 0.1}
                            isActive={prayer === activePrayer}
                        />
                    ))}
            </div>
        </div>
    );
};

export default Home;
