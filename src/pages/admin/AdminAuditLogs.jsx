import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';

// Mock audit logs
const INITIAL_LOGS = [
  { id: 1, action: 'User Logged In', user: 'admin@demo.com', role: 'Admin', timestamp: '2023-10-27 09:00 AM', details: 'Successful login' },
  { id: 2, action: 'Visitor Approved', user: 'host@demo.com', role: 'Host', timestamp: '2023-10-27 09:15 AM', details: 'Approved V001 (Arun Selvam)' },
  { id: 3, action: 'Visitor Checked In', user: 'guard@demo.com', role: 'Guard', timestamp: '2023-10-27 10:00 AM', details: 'Checked in V001' },
  { id: 4, action: 'Added to Blacklist', user: 'admin@demo.com', role: 'Admin', timestamp: '2023-10-27 11:30 AM', details: 'Blacklisted kavitha@test.com' },
  { id: 5, action: 'Visitor Checked Out', user: 'guard@demo.com', role: 'Guard', timestamp: '2023-10-27 02:00 PM', details: 'Checked out V003' },
  { id: 6, action: 'Visitor Rejected', user: 'host@demo.com', role: 'Host', timestamp: '2023-10-27 03:00 PM', details: 'Rejected V005 (Unexpected visit)' }
];

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [filter, setFilter] = useState('All');

  const filteredLogs = filter === 'All' ? logs : logs.filter(l => l.role === filter);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2>Audit Logs</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Track all system activities and security events.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select className="form-input" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Host">Host</option>
              <option value="Guard">Guard</option>
            </select>
            <button className="btn btn-primary" onClick={() => window.print()}>Export PDF</button>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Role</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{log.timestamp}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.action.includes('Rejected') || log.action.includes('Blacklist') ? 'Alert: ' : ''}
                      {log.action.includes('Approved') || log.action.includes('In') ? 'Success: ' : ''}
                      {log.action}
                    </td>
                    <td>{log.user}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem',
                        background: log.role === 'Admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: log.role === 'Admin' ? 'var(--success)' : 'var(--accent-1)'
                      }}>
                        {log.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{log.details}</td>
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
