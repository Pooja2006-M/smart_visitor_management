import React, { useState, useEffect } from 'react';
import { 
  FiWifi, 
  FiMapPin, 
  FiCoffee, 
  FiInfo
} from 'react-icons/fi';

export default function WelcomeWidget({
  visits = [],
  userName = 'Guest',
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute for the greeting
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const memberCode = userName === 'Visitor' ? '2312108' : (userName || '2312108');

  const dateString = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(currentTime);

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '1.5rem',
      color: '#172033',
      border: '1px solid #d7e0ea',
      boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      overflow: 'hidden'
    }}>
      {/* Top Section: Greeting */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '500', color: '#526077', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getGreeting()}
          </h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {memberCode}
            </h1>
          </div>
          <p style={{ fontSize: '1.1rem', color: '#526077', marginBottom: '0.25rem' }}>
            Welcome! Your first visit
          </p>
          <p style={{ fontSize: '0.9rem', color: '#7b8798' }}>
            {dateString}
          </p>
        </div>

      </div>

      {/* Quick Info Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem'
      }}>
        {[
          { icon: <FiWifi />, title: 'Wi‑Fi', l1: 'Network: Guest_VisitorIQ', l2: 'Password: Welcome@2026' },
          { icon: <FiMapPin />, title: 'Parking', l1: 'Basement Level 1', l2: 'Bay Area B' },
          { icon: <FiCoffee />, title: 'Cafeteria', l1: 'Ground Floor', l2: 'Open 9AM–6PM' },
          { icon: <FiInfo />, title: 'Washroom', l1: 'Every Floor', l2: 'Near elevator' },
        ].map((info, i) => (
          <div key={i} className="glass-card-hover" style={{
            background: '#f8fafc',
            border: '1px solid #d7e0ea',
            borderRadius: '10px',
            padding: '0.85rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <div style={{ color: '#0d9488', marginTop: '0.25rem' }}>{info.icon}</div>
            <div>
              <h4 style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{info.title}</h4>
              <p style={{ fontSize: '0.8rem', color: '#526077', margin: 0 }}>{info.l1}</p>
              <p style={{ fontSize: '0.8rem', color: '#526077', margin: 0 }}>{info.l2}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
