import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useToast } from '../../context/ToastContext';

// Mock live data for evacuation
const INITIAL_OCCUPANCY = [
  { id: '1', name: 'Arun Selvam', role: 'Visitor', location: 'Lobby', host: 'Dr. Priya Sharma', status: 'pending' },
  { id: '2', name: 'Kavitha Rajan', role: 'Visitor', location: 'Conference Room A', host: 'Mr. Rajan Kumar', status: 'pending' },
  { id: '3', name: 'Rahul Nair', role: 'Contractor', location: 'Server Room', host: 'IT Dept', status: 'pending' },
  { id: '4', name: 'Sneha P', role: 'Visitor', location: 'HR Dept', host: 'HR Manager', status: 'pending' }
];

export default function AdminEvacuation() {
  const { addToast } = useToast();
  const [occupants, setOccupants] = useState(INITIAL_OCCUPANCY);
  const [alarmActive, setAlarmActive] = useState(false);
  const toggleAlarm = () => {
    setAlarmActive(!alarmActive);
    if (!alarmActive) {
      addToast('EVACUATION ALARM TRIGGERED! Notifications sent to all hosts and guards.', 'error');
    } else {
      addToast('Alarm disabled. Evacuation cancelled.', 'info');
      // Reset checklist for demo purposes
      setOccupants(INITIAL_OCCUPANCY.map(o => ({ ...o, status: 'pending' })));
    }
  };

  const markSafe = (id) => {
    setOccupants(prev => prev.map(o => o.id === id ? { ...o, status: 'safe' } : o));
    addToast('Person marked as safe.', 'success');
  };

  const safeCount = occupants.filter(o => o.status === 'safe').length;
  const totalCount = occupants.length;

  return (
    <div className={`dashboard-layout ${alarmActive ? 'emergency-mode' : ''}`}>
      <Sidebar />
      <style>
        {`
          .emergency-mode .main-content {
            background-color: rgba(239, 68, 68, 0.1);
            animation: pulse-bg 2s infinite;
          }
          @keyframes pulse-bg {
            0% { background-color: rgba(239, 68, 68, 0.05); }
            50% { background-color: rgba(239, 68, 68, 0.15); }
            100% { background-color: rgba(239, 68, 68, 0.05); }
          }
        `}
      </style>
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ color: alarmActive ? 'var(--danger)' : 'var(--text-primary)' }}>
              Emergency Evacuation List
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Real-time checklist of all personnel currently inside the premises.
            </p>
          </div>
          <button
            className={`btn ${alarmActive ? 'btn-secondary' : 'btn-danger'}`}
            style={{ fontWeight: 800, padding: '16px 32px', fontSize: '1.2rem' }}
            onClick={toggleAlarm}
          >
            {alarmActive ? 'CANCEL ALARM' : 'TRIGGER EVACUATION'}
          </button>
        </div>

        {alarmActive && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>EVACUATION IN PROGRESS</h3>
            <p style={{ color: 'var(--danger)' }}>
              Instruct everyone to proceed to the designated assembly point. Mark individuals as safe as they arrive.
            </p>
            <div style={{
              marginTop: '16px', background: 'white', padding: '16px', borderRadius: '8px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Evacuation Progress:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: safeCount === totalCount ? 'var(--success)' : 'var(--danger)' }}>
                {safeCount} / {totalCount} Safe
              </span>
            </div>
          </div>
        )}

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Live Personnel Checklist</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Last Known Location</th>
                  <th>Host / Contact</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {occupants.map(o => (
                  <tr key={o.id} style={{ opacity: o.status === 'safe' ? 0.6 : 1 }}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.name}</td>
                    <td>{o.role}</td>
                    <td>{o.location}</td>
                    <td>{o.host}</td>
                    <td>
                      {o.status === 'safe'
                        ? <span className="badge badge-approved">SAFE</span>
                        : <span className="badge badge-rejected">UNACCOUNTED</span>
                      }
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-success"
                        disabled={o.status === 'safe'}
                        onClick={() => markSafe(o.id)}
                      >
                        Mark Safe
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

















