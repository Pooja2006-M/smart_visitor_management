import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Sidebar from '../../components/Sidebar';
import { useToast } from '../../context/ToastContext';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase/config';

const weeklyData = [
  { day: 'Mon', visitors: 24, approved: 20, rejected: 4 },
  { day: 'Tue', visitors: 31, approved: 28, rejected: 3 },
  { day: 'Wed', visitors: 18, approved: 15, rejected: 3 },
  { day: 'Thu', visitors: 42, approved: 38, rejected: 4 },
  { day: 'Fri', visitors: 29, approved: 25, rejected: 4 },
  { day: 'Sat', visitors: 10, approved: 9, rejected: 1 },
  { day: 'Sun', visitors: 5, approved: 5, rejected: 0 },
];

const recentVisits = [
  { id: 'V001', visitor: 'Arun Selvam', host: 'Dr. Priya Sharma', dept: 'HR', time: '10:00 AM', status: 'checked-in' },
  { id: 'V002', visitor: 'Kavitha Rajan', host: 'Mr. Rajan Kumar', dept: 'Engineering', time: '11:30 AM', status: 'pending' },
  { id: 'V003', visitor: 'Muthu Krishnan', host: 'Ms. Anita Nair', dept: 'Finance', time: '02:00 PM', status: 'checked-out' },
  { id: 'V004', visitor: 'Preethi S', host: 'Dr. Kumar V', dept: 'IT', time: '03:30 PM', status: 'approved' },
];

const deptData = [
  { name: 'HR', value: 35, color: '#2563eb' },
  { name: 'Engineering', value: 28, color: '#3b82f6' },
  { name: 'Finance', value: 18, color: '#60a5fa' },
  { name: 'IT', value: 12, color: '#93c5fd' },
  { name: 'Admin', value: 7, color: '#1d4ed8' },
];

export default function AdminDashboard() {
  const { addToast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [occupancy] = useState(47);
  const [maxCapacity] = useState(200);
  const pct = Math.round((occupancy / maxCapacity) * 100);
  const occupancyColor = pct < 50 ? 'var(--success)' : pct < 80 ? 'var(--warning)' : 'var(--danger)';

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'registrations')), (snapshot) => {
      setRegistrations(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    return () => unsubscribe();
  }, []);

  const liveVisitors = registrations.length > 0 ? registrations : recentVisits;
  const liveApproved = registrations.filter((item) => item.status === 'approved').length;
  const livePending = registrations.filter((item) => item.status === 'pending').length;
  const liveInside = registrations.filter((item) => item.checkIn && !item.checkOut).length;
  const today = new Date().toISOString().split('T')[0];
  const todayVisitors = registrations
    .filter((item) => item.visitDate === today)
    .sort((a, b) => String(a.visitTime || '').localeCompare(String(b.visitTime || '')));

  const stats = [
    { label: "Today's Visitors", value: todayVisitors.length, icon: 'Today', color: '#06b6d4', change: 'Scheduled' },
    { label: 'Total Visitors', value: registrations.length || 0, icon: 'Visitors', color: '#3b82f6', change: 'Live' },
    { label: 'Inside Now', value: liveInside, icon: 'Inside', color: occupancyColor, change: 'Live' },
    { label: 'Approved', value: liveApproved, icon: 'Approved', color: '#10b981', change: 'Live' },
    { label: 'Blacklisted', value: 3, icon: 'Blocked', color: '#ef4444', change: '' },
  ];

  const statusBadge = (status) => {
    const map = {
      'checked-in': { cls: 'badge-active', label: 'INSIDE' },
      'checked-out': { cls: 'badge-approved', label: 'OUT' },
      'pending': { cls: 'badge-pending', label: 'PENDING' },
      'approved': { cls: 'badge-approved', label: 'APPROVED' },
    };
    const b = map[status] || { cls: '', label: status };
    return <span className={`badge ${b.cls}`}>{b.label}</span>;
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2>Admin Overview</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Real-time visitor activity — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => addToast('Emergency mode activated. All security notified via Firebase.', 'error')}>
            Emergency Alert
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label} className="glass-card stat-card">
              <div className="stat-icon">
                <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ color: '#111827' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              {s.change && <div className="stat-change">{s.change} vs yesterday</div>}
            </div>
          ))}
        </div>

        {/* Occupancy Bar */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem' }}>Live Building Occupancy</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                {occupancy} / {maxCapacity} capacity
              </p>
            </div>
            <span style={{ color: occupancyColor, fontWeight: 700, fontSize: '1.5rem' }}>{pct}%</span>
          </div>
          <div style={{ background: 'var(--border)', borderRadius: 'var(--radius-full)', height: '12px' }}>
            <div style={{
              height: '100%', borderRadius: 'var(--radius-full)',
              background: pct < 50 ? 'var(--success)' : pct < 80 ? 'var(--warning)' : 'var(--danger)',
              width: `${pct}%`, transition: 'var(--transition-slow)',
              boxShadow: `0 0 16px ${occupancyColor}60`
            }} />
          </div>
        </div>

        {/* Today's scheduled visitors */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '1rem' }}>Today's Visitors</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Visitors scheduled for {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <span className="badge badge-active">{todayVisitors.length} scheduled</span>
          </div>
          {todayVisitors.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No visitors are scheduled for today.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Host</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayVisitors.map((visitor) => (
                    <tr key={visitor.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{visitor.fullName || 'Guest Visitor'}</td>
                      <td>{visitor.hostName || 'Not assigned'}</td>
                      <td>{visitor.visitTime || 'Not set'}</td>
                      <td>{visitor.purpose || 'General Visit'}</td>
                      <td>{statusBadge(visitor.status || 'pending')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Weekly Bar Chart */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Weekly Visitor Traffic</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Bar dataKey="approved" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dept Pie */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>By Department</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {deptData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {deptData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '1rem' }}>All Visitor Records</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                Every registration across the system
              </p>
            </div>
            <span className="badge badge-active">{liveVisitors.length} records</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Email</th>
                  <th>Host</th>
                  <th>Department</th>
                  <th>Purpose</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {liveVisitors.map(v => {
                  const visitor = {
                    visitor: v.fullName || v.visitor || 'Guest Visitor',
                    email: v.email || '—',
                    host: v.hostName || v.host || 'Not assigned',
                    dept: v.department || v.dept || 'General',
                    purpose: v.purpose || 'General Visit',
                    date: v.visitDate || '—',
                    time: v.visitTime || v.time || 'Not set',
                    status: v.status || 'pending',
                  };
                  return (
                  <tr key={v.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{visitor.visitor}</td>
                    <td>{visitor.email}</td>
                    <td>{visitor.host}</td>
                    <td>{visitor.dept}</td>
                    <td>{visitor.purpose}</td>
                    <td>{visitor.date}</td>
                    <td>{visitor.time}</td>
                    <td>{statusBadge(visitor.status)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
