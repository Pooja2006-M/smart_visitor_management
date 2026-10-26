import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  FiCalendar, FiUsers, FiBell, FiUserPlus, FiChevronRight, FiShield, 
  FiMapPin, FiCheckSquare, FiAlertCircle, FiSearch, 
  FiPlus, FiDownload, FiCheckCircle, FiClock, FiMail, FiPhone, FiCheck, FiX, FiGrid
} from 'react-icons/fi';
import { sendApprovalEmail, sendScheduleEmail } from '../../utils/emailService';
import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { QRCodeCanvas } from 'qrcode.react';

const initialTodayVisitors = [
  { id: 'v1', name: 'Rahul Sharma', time: '09:30 AM', purpose: 'Interview', status: 'Confirmed', phone: '+91 98765 43210', email: 'rahul@example.com' },
  { id: 'v2', name: 'Priya Nair', time: '11:00 AM', purpose: 'Vendor meeting', status: 'Waiting', phone: '+91 98765 43211', email: 'priya@example.com' },
  { id: 'v3', name: 'Karan Patel', time: '02:15 PM', purpose: 'Project review', status: 'Checked-in', phone: '+91 98765 43212', email: 'karan@example.com' },
  { id: 'v4', name: 'Sneha Verma', time: '04:00 PM', purpose: 'Product Demo', status: 'Confirmed', phone: '+91 98765 43213', email: 'sneha@example.com' },
];

const initialPendingRequests = [
  { id: 'r1', name: 'Rahul Sharma', time: '11:30 AM', message: 'Project alignment review', company: 'TechCorp' },
  { id: 'r2', name: 'Ananya Roy', time: '01:45 PM', message: 'Training onboarding session', company: 'Global Solutions' },
  { id: 'r3', name: 'Vikram Seth', time: '03:30 PM', message: 'Software Architecture Discussion', company: 'DevStudio' },
];

const initialUpcomingMeetings = [
  { id: 'm1', title: 'Weekly Ops Sync', time: '10:00 AM', location: 'Conference Room A', attendees: '4 People' },
  { id: 'm2', title: 'Client Demo - Vertex', time: '01:30 PM', location: 'Meeting Room 3', attendees: '6 People' },
  { id: 'm3', title: 'Security Briefing', time: '04:00 PM', location: 'HQ Lobby', attendees: 'All Staff' },
];

const initialVisitorHistory = [
  { id: 'h1', name: 'Aarav Singh', date: '12 Aug 2026', purpose: 'Supplier follow-up', status: 'Completed', passId: 'PASS-8921' },
  { id: 'h2', name: 'Meera Iyer', date: '10 Aug 2026', purpose: 'New joiner onboarding', status: 'Checked-out', passId: 'PASS-8920' },
  { id: 'h3', name: 'Arjun Das', date: '08 Aug 2026', purpose: 'Vendor audit', status: 'Approved', passId: 'PASS-8919' },
  { id: 'h4', name: 'Kavita Reddy', date: '05 Aug 2026', purpose: 'Contract signing', status: 'Completed', passId: 'PASS-8918' },
];

const initialNotifications = [
  { id: 'n1', title: 'Visitor Arrived', text: 'Rahul Sharma checked in at the main lobby gate.', time: '10m ago', type: 'info', read: false },
  { id: 'n2', title: 'Meeting Reminder', text: 'Client demo with Vertex starts in 30 minutes in Room 3.', time: '30m ago', type: 'success', read: false },
  { id: 'n3', title: 'Approval Pending', text: 'Ananya Roy requested a meeting for 01:45 PM today.', time: '1h ago', type: 'warning', read: false },
  { id: 'n4', title: 'Safety Drill Scheduled', text: 'Quarterly evacuation drill tomorrow at 11:00 AM.', time: '3h ago', type: 'info', read: true },
];

const EmployeeDashboard = () => {
  const { userProfile } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [visitors, setVisitors] = useState(initialTodayVisitors);
  const [requests, setRequests] = useState(initialPendingRequests);
  const [meetings, setMeetings] = useState(initialUpcomingMeetings);
  const [history, setHistory] = useState(initialVisitorHistory);
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    const registrationsQuery = query(collection(db, 'registrations'));
    const unsubscribe = onSnapshot(registrationsQuery, (snapshot) => {
      const allVisitors = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .map((item) => ({
          id: item.id,
          name: item.fullName || 'Guest Visitor',
          time: item.visitTime || 'Time not set',
          purpose: item.purpose || 'General visit',
          status: item.status === 'approved' ? 'Confirmed' : item.status === 'completed' ? 'Checked-in' : item.status === 'rejected' ? 'Rejected' : 'Waiting',
          phone: item.phone || '',
          email: item.email || '',
        }));
      const pendingRequests = allVisitors
        .map((item) => ({
          id: item.id,
          ...item,
        }))
        .filter((item) => item.status === 'Waiting')
        .map((item) => ({
          ...item,
          message: item.purpose,
          company: 'Company visitor',
        }));

      setVisitors(allVisitors);
      setRequests(pendingRequests);
      setNotifications((previous) => pendingRequests.length > 0
        ? [{
          id: 'live-visitor-requests',
          title: 'New Visitor Request',
          text: `${pendingRequests.length} visitor request${pendingRequests.length > 1 ? 's' : ''} waiting for review.`,
          time: 'Live',
          type: 'warning',
          read: false,
        }, ...previous.filter((item) => item.id !== 'live-visitor-requests')]
        : previous.filter((item) => item.id !== 'live-visitor-requests'));
    }, (error) => {
      console.error('Employee visitor sync failed:', error);
      addToast(`Visitor sync failed: ${error.message}`, 'error');
    });

    return () => unsubscribe();
  }, [addToast]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Invite Form State
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '', purpose: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
  const [createdPass, setCreatedPass] = useState(null);

  // New Meeting Form State
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ title: '', time: '11:00 AM', location: 'Meeting Room 1', attendees: '3 People' });

  // Handle Request Accept/Reject
  const handleAcceptRequest = async (req) => {
    const visitorEmail = req.email || `${req.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    
    if (req.id && !req.id.startsWith('r')) {
      await updateDoc(doc(db, 'registrations', req.id), {
        status: 'approved',
        approvedByName: userProfile?.name || userProfile?.email || 'Company Employee',
        approvedAt: new Date().toISOString(),
      });
    }
    setRequests(prev => prev.filter(r => r.id !== req.id));
    setVisitors(prev => [...prev, { id: `v-${Date.now()}`, name: req.name, time: req.time, purpose: req.message, status: 'Confirmed', phone: '+91 99000 11223', email: visitorEmail }]);
    addToast('Visit approved.', 'success');
  };

  const handleRejectRequest = (req) => {
    if (req.id && !req.id.startsWith('r')) {
      updateDoc(doc(db, 'registrations', req.id), { status: 'rejected' }).catch(() => {});
    }
    setRequests(prev => prev.filter(r => r.id !== req.id));
    addToast(`Rejected visit request from ${req.name}`, 'error');
  };

  const handleExportHistory = () => {
    const headers = ['Pass ID', 'Visitor Name', 'Date', 'Purpose', 'Status'];
    const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = history.map(visitor => [
      visitor.passId,
      visitor.name,
      visitor.date,
      visitor.purpose,
      visitor.status,
    ]);
    const csv = [headers, ...rows].map(row => row.map(escapeCsvValue).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `visitor-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
    addToast('Visitor history sheet downloaded.', 'success');
  };

  // Handle Send Invite
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;
    const newPass = {
      passId: `PASS-${Math.floor(1000 + Math.random() * 9000)}`,
      visitorName: inviteForm.name,
      email: inviteForm.email,
      phone: inviteForm.phone,
      purpose: inviteForm.purpose || 'General Visit',
      date: inviteForm.date,
      time: inviteForm.time,
      hostName: userProfile?.name || 'Employee Host'
    };

    setCreatedPass(newPass);
    setVisitors(prev => [{ id: `v-${Date.now()}`, name: inviteForm.name, time: inviteForm.time, purpose: inviteForm.purpose || 'General Visit', status: 'Confirmed', phone: inviteForm.phone, email: inviteForm.email }, ...prev]);
    setHistory(prev => [{ id: `h-${Date.now()}`, name: inviteForm.name, date: inviteForm.date, purpose: inviteForm.purpose || 'General Visit', status: 'Approved', passId: newPass.passId }, ...prev]);

    try {
      await sendApprovalEmail(newPass);
      addToast(`Invitation pass generated & sent to ${inviteForm.email}!`, 'success');
    } catch (error) {
      const errorMessage = error?.message || error?.text || 'Email service is unavailable.';
      addToast(`Digital pass generated, but email was not sent: ${errorMessage}`, 'warning');
    }
    setInviteForm({ name: '', email: '', phone: '', purpose: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
  };

  // Handle Create Meeting
  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.title) return;
    const schedule = {
      ...meetingForm,
      date: new Date().toLocaleDateString('en-IN'),
    };
    setMeetings(prev => [{ id: `m-${Date.now()}`, ...schedule }, ...prev]);
    setShowMeetingModal(false);
    addToast(`Meeting "${meetingForm.title}" scheduled successfully!`, 'success');
    try {
      await sendScheduleEmail(schedule, userProfile?.email);
      addToast(`Schedule email sent to ${userProfile?.email}.`, 'success');
    } catch (error) {
      addToast(`Meeting saved, but schedule email failed: ${error.message}`, 'warning');
    }
    setMeetingForm({ title: '', time: '11:00 AM', location: 'Meeting Room 1', attendees: '3 People' });
  };

  // Determine current active sub-page view
  const path = location.pathname;
  const isDashboard = path === '/employee/dashboard' || path === '/employee';
  const isVisitors = path === '/employee/visitors';
  const isMeetings = path === '/employee/meetings';
  const isNotifications = path === '/employee/notifications';
  const isInvite = path === '/employee/invite';
  const isRequests = path === '/employee/requests';
  const isHistory = path === '/employee/history';
  const isPasses = path === '/employee/passes';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: '8px' }}>
              {isVisitors && 'My Visitors'}
              {isMeetings && 'Meetings & Appointments'}
              {isNotifications && 'Employee Notifications'}
              {isInvite && 'Invite a Visitor'}
              {isRequests && 'Visitor Requests'}
              {isHistory && 'Visitor History & Logs'}
              {isPasses && 'Active Access Passes'}
              {isDashboard && 'Employee Dashboard'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
              Welcome back, <strong>{userProfile?.name || 'Vignesh Kumar'}</strong>! Manage your visits, schedule appointments, and control guest access.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/employee/invite')}>
              <FiUserPlus /> Invite Visitor
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => addToast('Page data refreshed.', 'info')}>
              Refresh
            </button>
          </div>
        </div>

        {/* ── 1. OVERVIEW DASHBOARD VIEW ── */}
        {isDashboard && (
          <>
            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
                <div style={{ padding: '18px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/employee/visitors')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#3b82f6' }}><FiUsers size={20} /> <strong>Today's Visitors</strong></div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{visitors.length}</div>
                </div>
                <div style={{ padding: '18px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/employee/meetings')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#10b981' }}><FiCalendar size={20} /> <strong>Upcoming Meetings</strong></div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{meetings.length}</div>
                </div>
                <div style={{ padding: '18px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/employee/requests')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#f59e0b' }}><FiCheckSquare size={20} /> <strong>Pending Requests</strong></div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{requests.length}</div>
                </div>
                <div style={{ padding: '18px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/employee/passes')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#8b5cf6' }}><FiGrid size={20} /> <strong>Active Passes</strong></div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{history.length}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {/* Quick Actions */}
              <div className="glass-card" style={{ padding: '22px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px' }} onClick={() => navigate('/employee/invite')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FiUserPlus size={18} /> Invite New Visitor</span>
                    <FiChevronRight />
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px' }} onClick={() => navigate('/employee/meetings')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FiCalendar size={18} /> Schedule Meeting</span>
                    <FiChevronRight />
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px' }} onClick={() => navigate('/employee/requests')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheckSquare size={18} /> Review Visitor Requests ({requests.length})</span>
                    <FiChevronRight />
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px' }} onClick={() => navigate('/employee/passes')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FiGrid size={18} /> View Access Passes</span>
                    <FiChevronRight />
                  </button>
                </div>
              </div>

              {/* Notifications Widget */}
              <div className="glass-card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><FiBell /> Notifications</h3>
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate('/employee/notifications')}>View All</button>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {notifications.slice(0, 3).map((n) => (
                    <div key={n.id} style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <strong>{n.title}</strong>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>{n.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Today's visitors preview */}
            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Today's Visitors Schedule</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/employee/visitors')}>See All Visitors →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {visitors.slice(0, 3).map((v) => (
                  <div key={v.id} style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{v.name}</strong>
                      <span className={`badge ${v.status === 'Confirmed' ? 'badge-approved' : 'badge-pending'}`}>{v.status}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>{v.purpose}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiClock /> Expected: {v.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── 2. MY VISITORS VIEW (`/employee/visitors`) ── */}
        {isVisitors && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
                <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search visitors by name or purpose..."
                  style={{ paddingLeft: '40px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['All', 'Confirmed', 'Waiting', 'Checked-in'].map((st) => (
                  <button
                    key={st}
                    className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Visitor Name</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors
                    .filter(v => statusFilter === 'All' || v.status === statusFilter)
                    .filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((v) => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600 }}>{v.name}</td>
                        <td>{v.time}</td>
                        <td>{v.purpose}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{v.phone}</td>
                        <td>
                          <span className={`badge ${v.status === 'Confirmed' ? 'badge-approved' : v.status === 'Checked-in' ? 'badge-approved' : 'badge-pending'}`}>
                            {v.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => addToast(`Pass details viewed for ${v.name}`, 'info')}
                          >
                            View Pass
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 3. MEETINGS & APPOINTMENTS VIEW (`/employee/meetings`) ── */}
        {isMeetings && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Upcoming Meetings Schedule</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowMeetingModal(true)}>
                <FiPlus /> Schedule New Meeting
              </button>
            </div>

            {/* Meetings Cards */}
            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              {meetings.map((m) => (
                <div key={m.id} style={{ padding: '18px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem' }}>{m.title}</h4>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      <span><FiClock /> {m.time}</span>
                      <span><FiMapPin /> {m.location}</span>
                      <span><FiUsers /> {m.attendees}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => addToast(`Reminder set for "${m.title}"`, 'success')}>Set Reminder</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => addToast(`Meeting link copied to clipboard`, 'info')}>Copy Link</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Schedule Meeting Modal */}
            {showMeetingModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', background: 'var(--bg-secondary)', borderRadius: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ margin: 0 }}>Schedule New Meeting</h3>
                    <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowMeetingModal(false)}>×</button>
                  </div>
                  <form onSubmit={handleCreateMeeting} style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <label className="form-label">Meeting Title</label>
                      <input type="text" className="form-input" placeholder="e.g. Design Review Sync" required value={meetingForm.title} onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">Time</label>
                        <input type="text" className="form-input" placeholder="11:00 AM" required value={meetingForm.time} onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })} />
                      </div>
                      <div>
                        <label className="form-label">Location / Room</label>
                        <input type="text" className="form-input" placeholder="Meeting Room 2" required value={meetingForm.location} onChange={e => setMeetingForm({ ...meetingForm, location: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Attendees</label>
                      <input type="text" className="form-input" placeholder="e.g. 5 People" value={meetingForm.attendees} onChange={e => setMeetingForm({ ...meetingForm, attendees: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowMeetingModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Meeting</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 4. NOTIFICATIONS VIEW (`/employee/notifications`) ── */}
        {isNotifications && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Notification History</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => { setNotifications(notifications.map(n => ({ ...n, read: true }))); addToast('Marked all notifications as read', 'success'); }}>
                Mark all as read
              </button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ padding: '16px', borderRadius: '14px', background: n.read ? 'var(--bg-card)' : 'rgba(59,130,246,0.06)', border: `1px solid ${n.read ? 'var(--border)' : 'rgba(59,130,246,0.2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '0.98rem' }}>{n.title}</strong>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{n.text}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'inline-block' }}>{n.time}</span>
                  </div>
                  {!n.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px' }}></span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. INVITE VISITOR VIEW (`/employee/invite`) ── */}
        {isInvite && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '18px' }}>Pre-Register & Send Pass</h3>
              <form onSubmit={handleSendInvite} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label className="form-label">Visitor Full Name *</label>
                  <input type="text" className="form-input" placeholder="e.g. Ramesh Kumar" required value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-input" placeholder="visitor@company.com" required value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-input" placeholder="+91 98765 43210" value={inviteForm.phone} onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Visit Date</label>
                    <input type="date" className="form-input" value={inviteForm.date} onChange={e => setInviteForm({ ...inviteForm, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Expected Time</label>
                    <input type="time" className="form-input" value={inviteForm.time} onChange={e => setInviteForm({ ...inviteForm, time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Purpose of Visit</label>
                  <input type="text" className="form-input" placeholder="e.g. Client Demo / Business Discussion" value={inviteForm.purpose} onChange={e => setInviteForm({ ...inviteForm, purpose: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '14px', justifyContent: 'center' }}>
                  <FiMail /> Generate & Send Digital Pass
                </button>
              </form>
            </div>

            {/* Pass Preview Box */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              {createdPass ? (
                <div style={{ width: '100%', padding: '20px', borderRadius: '18px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#94a3b8', marginBottom: '8px' }}>GUEST VISITOR PASS</div>
                  <h3 style={{ color: '#fff', margin: '0 0 16px 0' }}>{createdPass.visitorName}</h3>
                  <div style={{ padding: '16px', background: '#1e293b', borderRadius: '12px', display: 'grid', gap: '8px', fontSize: '0.85rem', textAlign: 'left' }}>
                    <div><span style={{ color: '#94a3b8' }}>Pass ID:</span> <strong>{createdPass.passId}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>Host:</span> <strong>{createdPass.hostName}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>Date & Time:</span> <strong>{createdPass.date} @ {createdPass.time}</strong></div>
                    <div><span style={{ color: '#94a3b8' }}>Purpose:</span> <strong>{createdPass.purpose}</strong></div>
                  </div>
                  <div style={{ marginTop: '16px', padding: '18px', background: '#fff', borderRadius: '12px', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <QRCodeCanvas
                      value={JSON.stringify({
                        passId: createdPass.passId,
                        visitorName: createdPass.visitorName,
                        hostName: createdPass.hostName,
                        date: createdPass.date,
                        time: createdPass.time,
                        purpose: createdPass.purpose,
                      })}
                      size={148}
                      level="H"
                      includeMargin
                    />
                    <strong style={{ fontSize: '0.78rem', letterSpacing: '0.08em' }}>SCAN DIGITAL PASS</strong>
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }} onClick={() => addToast('Pass sent to email!', 'success')}>
                    Resend Pass Email
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', padding: '40px 20px' }}>
                  <FiGrid size={48} style={{ marginBottom: '14px', opacity: 0.5 }} />
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Digital Pass Preview</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Fill out the form on the left to generate an instant QR pass for your guest.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 6. VISITOR REQUESTS VIEW (`/employee/requests`) ── */}
        {isRequests && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Pending Approval Requests</h3>
            {requests.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FiCheckCircle size={40} style={{ color: '#10b981', marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '1rem' }}>No pending visitor requests right now!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {requests.map((r) => (
                  <div key={r.id} style={{ padding: '18px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '1.05rem' }}>{r.name}</strong>
                        <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 600 }}>{r.company}</span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>"{r.message}"</p>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', display: 'inline-block' }}>Requested Time: {r.time}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-sm btn-primary" style={{ background: '#10b981', border: 'none' }} onClick={() => handleAcceptRequest(r)}>
                        <FiCheck /> Approve Request
                      </button>
                      <button className="btn btn-sm btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleRejectRequest(r)}>
                        <FiX /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 7. VISITOR HISTORY VIEW (`/employee/history`) ── */}
        {isHistory && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Past Visitors & Entry Logs</h3>
              <button className="btn btn-sm btn-secondary" onClick={handleExportHistory}>
                <FiDownload /> Export CSV Log
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Pass ID</th>
                    <th>Visitor Name</th>
                    <th>Date</th>
                    <th>Purpose</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{h.passId}</td>
                      <td style={{ fontWeight: 600 }}>{h.name}</td>
                      <td>{h.date}</td>
                      <td>{h.purpose}</td>
                      <td><span className="badge badge-approved">{h.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 8. ACCESS PASSES VIEW (`/employee/passes`) ── */}
        {isPasses && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Active Access Passes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {history.map((h) => (
                <div key={h.id} style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-1)', fontWeight: 'bold', fontFamily: 'monospace' }}>{h.passId}</span>
                    <span className="badge badge-approved">Active</span>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>{h.name}</h4>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{h.purpose} • {h.date}</span>
                  </div>
                  <div style={{ padding: '12px', background: '#1e293b', color: '#fff', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    [ QR SCANNER ENCRYPTED KEY ]
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button className="btn btn-sm btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => addToast(`Pass ${h.passId} resent to visitor`, 'success')}>
                      Resend
                    </button>
                    <button className="btn btn-sm btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => addToast(`Pass ${h.passId} revoked`, 'error')}>
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default EmployeeDashboard;
