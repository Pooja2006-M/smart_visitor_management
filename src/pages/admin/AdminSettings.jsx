import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useToast } from '../../context/ToastContext';

export default function AdminSettings() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    workStart: '09:00',
    workEnd: '18:00',
    holidays: [],
    maintenanceMode: false
  });
  const [newHoliday, setNewHoliday] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('visitoriq-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('visitoriq-settings', JSON.stringify(settings));
    addToast('Settings saved successfully!', 'success');
  };

  const addHoliday = () => {
    if (!newHoliday) return;
    if (settings.holidays.includes(newHoliday)) {
      addToast('Holiday already exists!', 'warning');
      return;
    }
    setSettings(prev => ({
      ...prev,
      holidays: [...prev.holidays, newHoliday].sort()
    }));
    setNewHoliday('');
  };

  const removeHoliday = (date) => {
    setSettings(prev => ({
      ...prev,
      holidays: prev.holidays.filter(h => h !== date)
    }));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '32px' }}>
          <h2>System Settings</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Configure working hours and official holidays.
          </p>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Working Hours */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '24px' }}>Working Hours</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={settings.workStart}
                  onChange={e => setSettings(p => ({ ...p, workStart: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={settings.workEnd}
                  onChange={e => setSettings(p => ({ ...p, workEnd: e.target.value }))}
                  required
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Visitors will not be able to schedule visits outside of these hours.
              </p>
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Save Hours
              </button>
            </form>
          </div>

          {/* Holidays */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '24px' }}>Holiday Calendar</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input 
                type="date" 
                className="form-input"
                value={newHoliday}
                onChange={e => setNewHoliday(e.target.value)}
              />
              <button className="btn btn-primary" onClick={addHoliday}>Add</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {settings.holidays.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '12px' }}>
                  No holidays configured.
                </p>
              )}
              {settings.holidays.map(date => (
                <div key={date} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '12px 16px', background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border)', borderRadius: '8px' 
                }}>
                  <span style={{ fontWeight: 500 }}>{date}</span>
                  <button 
                    onClick={() => removeHoliday(date)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}
              onClick={handleSave}
            >
              Save Holidays
            </button>
          </div>

          {/* Maintenance Mode */}
          <div className="glass-card" style={{ padding: '32px', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: '8px', color: settings.maintenanceMode ? 'var(--danger)' : 'var(--text-primary)' }}>
                  Maintenance Mode
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  When enabled, visitors cannot pre-register or access public-facing pages. Only Admins and Guards can log in.
                </p>
              </div>
              <div
                onClick={() => {
                  const newState = !settings.maintenanceMode;
                  setSettings(p => ({ ...p, maintenanceMode: newState }));
                  localStorage.setItem('visitoriq-settings', JSON.stringify({ ...settings, maintenanceMode: newState }));
                  addToast(`Maintenance Mode ${newState ? 'ENABLED' : 'DISABLED'}`, newState ? 'warning' : 'success');
                }}
                style={{
                  width: 56, height: 32, borderRadius: 16, cursor: 'pointer',
                  background: settings.maintenanceMode ? 'var(--danger)' : 'var(--border)',
                  position: 'relative', transition: 'var(--transition)', flexShrink: 0
                }}
              >
                <div style={{
                  position: 'absolute', top: 4, width: 24, height: 24,
                  borderRadius: '50%', background: 'white',
                  left: settings.maintenanceMode ? 28 : 4, transition: 'var(--transition)'
                }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
