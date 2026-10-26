import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useToast } from '../../context/ToastContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function HostAvailability() {
  const { addToast } = useToast();
  const defaultAvailability = {
    Monday:    { enabled: true,  start: '09:00', end: '17:00' },
    Tuesday:   { enabled: true,  start: '09:00', end: '17:00' },
    Wednesday: { enabled: true,  start: '09:00', end: '17:00' },
    Thursday:  { enabled: true,  start: '09:00', end: '17:00' },
    Friday:    { enabled: true,  start: '09:00', end: '13:00' },
    Saturday:  { enabled: false, start: '10:00', end: '12:00' },
    Sunday:    { enabled: false, start: '10:00', end: '12:00' },
  };
  const [availability, setAvailability] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('host-availability-config') || 'null');
      return saved?.availability || defaultAvailability;
    } catch {
      return defaultAvailability;
    }
  });
  const [blockedDates, setBlockedDates] = useState(['2025-12-25', '2025-12-31']);
  const [newBlock, setNewBlock] = useState('');
  const [maxVisitorsPerSlot, setMaxVisitorsPerSlot] = useState(() => {
    try { return JSON.parse(localStorage.getItem('host-availability-config') || 'null')?.maxVisitorsPerSlot || 2; } catch { return 2; }
  });
  const [slotDuration, setSlotDuration] = useState(() => {
    try { return JSON.parse(localStorage.getItem('host-availability-config') || 'null')?.slotDuration || 30; } catch { return 30; }
  });
  const [acceptingAppointments, setAcceptingAppointments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('host-availability-config') || 'null')?.acceptingAppointments ?? true; } catch { return true; }
  });
  const [saved, setSaved] = useState(false);

  const toggleDay = (day) =>
    setAvailability(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));

  const updateTime = (day, field, val) =>
    setAvailability(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } }));

  const addBlockedDate = () => {
    if (!newBlock) return;
    setBlockedDates(prev => [...prev, newBlock]);
    setNewBlock('');
    addToast('Date blocked successfully.', 'success');
  };

  const removeBlockedDate = (date) => setBlockedDates(prev => prev.filter(d => d !== date));

  const handleSave = () => {
    const payload = { availability, blockedDates, slotDuration, maxVisitorsPerSlot, acceptingAppointments };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('host-availability-config', JSON.stringify(payload));
    }
    setSaved(true);
    addToast(`Availability settings saved. New appointments are ${acceptingAppointments ? 'enabled' : 'paused'}.`, 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '32px' }}>
          <h2>Availability Settings</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Define when visitors can schedule appointments with you.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '22px 28px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '5px' }}>Accept New Appointments</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              {acceptingAppointments ? 'Visitors can book appointments with you.' : 'New appointment bookings are currently paused.'}
            </p>
          </div>
          <button
            id="toggle-appointments"
            type="button"
            role="switch"
            aria-checked={acceptingAppointments}
            aria-label="Accept new appointments"
            onClick={() => setAcceptingAppointments(value => !value)}
            style={{
              width: 48, height: 26, padding: 0, border: 'none', borderRadius: 13,
              cursor: 'pointer', background: acceptingAppointments ? 'var(--gradient)' : 'var(--border)',
              position: 'relative', transition: 'var(--transition)', flexShrink: 0
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: acceptingAppointments ? 25 : 3,
              width: 20, height: 20, borderRadius: '50%', background: 'white',
              transition: 'var(--transition)'
            }} />
          </button>
        </div>

        {/* Slot Settings */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '20px' }}>Slot Configuration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="form-group">
              <label className="form-label">Slot Duration (minutes)</label>
              <select id="slot-duration" className="form-select" value={slotDuration} onChange={e => setSlotDuration(+e.target.value)}>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max Visitors Per Slot</label>
              <select id="max-visitors" className="form-select" value={maxVisitorsPerSlot} onChange={e => setMaxVisitorsPerSlot(+e.target.value)}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '20px' }}>Weekly Schedule</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DAYS.map(day => {
              const d = availability[day];
              return (
                <div key={day} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px', borderRadius: 'var(--radius-md)',
                  background: d.enabled ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${d.enabled ? 'rgba(59,130,246,0.2)' : 'var(--border)'}`
                }}>
                  {/* Toggle */}
                  <div
                    id={`toggle-${day.toLowerCase()}`}
                    onClick={() => toggleDay(day)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                      background: d.enabled ? 'var(--gradient)' : 'var(--border)',
                      position: 'relative', transition: 'var(--transition)', flexShrink: 0
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, width: 18, height: 18,
                      borderRadius: '50%', background: 'white',
                      left: d.enabled ? 23 : 3, transition: 'var(--transition)'
                    }} />
                  </div>

                  <span style={{ width: '100px', fontWeight: 600, color: d.enabled ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.9rem' }}>{day}</span>

                  {d.enabled ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <input
                        type="time" className="form-input"
                        style={{ width: '130px' }}
                        value={d.start}
                        onChange={e => updateTime(day, 'start', e.target.value)}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>to</span>
                      <input
                        type="time" className="form-input"
                        style={{ width: '130px' }}
                        value={d.end}
                        onChange={e => updateTime(day, 'end', e.target.value)}
                      />
                      <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>AVAILABLE</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Day off — not available</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Blocked Dates */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '20px' }}>Blocked Dates (Leave / Holidays)</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              id="block-date-input"
              type="date" className="form-input"
              value={newBlock}
              onChange={e => setNewBlock(e.target.value)}
            />
            <button id="add-block-date" className="btn btn-danger" onClick={addBlockedDate}>Block Date</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {blockedDates.map(date => (
              <div key={date} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.85rem', color: 'var(--danger)'
              }}>
                {date}
                <button onClick={() => removeBlockedDate(date)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </div>

        <button id="save-availability" className="btn btn-primary btn-lg" onClick={handleSave} style={{ minWidth: '200px' }}>
          {saved ? 'Saved!' : 'Save Availability'}
        </button>
      </main>
    </div>
  );
}
