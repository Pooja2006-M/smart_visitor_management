import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { collection, onSnapshot, query } from 'firebase/firestore';
import Sidebar from '../../components/Sidebar';
import { db } from '../../firebase/config';

const defaultTraffic = Array.from({ length: 10 }, (_, index) => {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  return { time: hours[index], visitors: 0 };
});

const defaultPurposeData = [
  { name: 'Meeting', count: 0 },
  { name: 'Interview', count: 0 },
  { name: 'Delivery', count: 0 },
  { name: 'Maintenance', count: 0 },
  { name: 'Personal', count: 0 },
];

const purposeMinutes = {
  Meeting: 60,
  Interview: 90,
  Delivery: 30,
  Maintenance: 45,
  Personal: 25,
  'Vendor Meeting': 50,
  'Client Demo': 75,
  'Business Discussion': 55,
  'Facility Tour': 35,
  'Project Review': 70,
};

export default function AdminAnalytics() {
  const [registrations, setRegistrations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'registrations')), (snapshot) => {
      setRegistrations(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });

    return () => unsubscribe();
  }, []);

  const selectedDayVisitors = useMemo(() => {
    const dateValue = selectedDate || new Date().toISOString().split('T')[0];
    return registrations.filter((item) => (item.visitDate || item.date) === dateValue);
  }, [registrations, selectedDate]);

  const trafficData = useMemo(() => {
    const buckets = defaultTraffic.map((entry) => ({ ...entry, visitors: 0 }));

    selectedDayVisitors.forEach((visitor) => {
      const rawTime = visitor.visitTime || visitor.time || '09:00';
      const match = String(rawTime).match(/(\d{1,2}):(\d{2})/);
      if (!match) return;
      const hour = Number(match[1]);
      const hourKey = `${String(hour).padStart(2, '0')}:00`;
      const existing = buckets.find((item) => item.time === hourKey);
      if (existing) existing.visitors += 1;
    });

    return buckets;
  }, [selectedDayVisitors]);

  const purposeData = useMemo(() => {
    const map = new Map();

    selectedDayVisitors.forEach((visitor) => {
      const purpose = visitor.purpose || 'General Visit';
      const normalized = purpose.replace(/\s+/g, ' ').trim();
      map.set(normalized, (map.get(normalized) || 0) + 1);
    });

    const sorted = [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const fallback = [...defaultPurposeData];
    const merged = [...fallback];
    sorted.forEach((item) => {
      const existing = merged.find((entry) => entry.name === item.name);
      if (existing) {
        existing.count = item.count;
      } else {
        merged.push(item);
      }
    });

    return merged.slice(0, 5);
  }, [selectedDayVisitors]);

  const repeatVisitorData = useMemo(() => {
    const map = new Map();

    selectedDayVisitors.forEach((visitor) => {
      const name = visitor.fullName || visitor.visitorName || 'Guest Visitor';
      map.set(name, (map.get(name) || 0) + 1);
    });

    return [...map.entries()]
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);
  }, [selectedDayVisitors]);

  const durationData = useMemo(() => {
    const departmentMap = new Map();

    selectedDayVisitors.forEach((visitor) => {
      const department = visitor.department || visitor.dept || 'General';
      const purpose = visitor.purpose || 'Meeting';
      const baseMinutes = purposeMinutes[purpose] || purposeMinutes.Meeting || 45;
      const current = departmentMap.get(department) || { total: 0, count: 0 };
      current.total += baseMinutes;
      current.count += 1;
      departmentMap.set(department, current);
    });

    return [...departmentMap.entries()]
      .map(([dept, value]) => ({ dept, minutes: Math.round(value.total / value.count) }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);
  }, [selectedDayVisitors]);

  const peakHour = useMemo(() => {
    if (!trafficData.length) return 'No data';
    const max = trafficData.reduce((top, item) => (item.visitors > top.visitors ? item : top), trafficData[0]);
    return `${max.time} (${max.visitors} visitors)`;
  }, [trafficData]);

  const averageStay = useMemo(() => {
    if (!durationData.length) return '0 mins';
    const avg = Math.round(durationData.reduce((sum, item) => sum + item.minutes, 0) / durationData.length);
    return `${avg} mins`;
  }, [durationData]);

  const topRepeatName = repeatVisitorData[0] ? `${repeatVisitorData[0].name} (${repeatVisitorData[0].visits})` : 'No data';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2>Analytics & Reports</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Real visitor traffic for {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
              style={{ minWidth: '170px' }}
            />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Hourly Traffic (Peak Time Analysis)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
              <Area type="monotone" dataKey="visitors" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisitors)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Visit Purposes</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={purposeData} layout="vertical">
                <XAxis type="number" stroke="var(--text-muted)" allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={110} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Top Repeat Visitors</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={repeatVisitorData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" interval={0} angle={-10} textAnchor="end" height={50} />
                <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
                <Bar dataKey="visits" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Avg Visit Duration by Dept (Mins)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={durationData} layout="vertical">
                <XAxis type="number" stroke="var(--text-muted)" allowDecimals={false} />
                <YAxis dataKey="dept" type="category" stroke="var(--text-muted)" width={110} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
                <Bar dataKey="minutes" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Key Metrics Insights</h3>
             <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <li style={{ background: 'rgba(59,130,246,0.1)', padding: '16px', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--accent-1)' }}>Peak Hour:</strong> {peakHour}
                </li>
                <li style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--success)' }}>Avg Stay Duration:</strong> {averageStay}
                </li>
                <li style={{ background: 'rgba(245,158,11,0.1)', padding: '16px', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--warning)' }}>Top Repeat Visitor:</strong> {topRepeatName}
                </li>
             </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
