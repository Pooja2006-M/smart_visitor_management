import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLinks = () => {
    const role = userProfile?.role;
    if (role === 'admin') return [
      { section: 'Overview' },
      { to: '/admin/dashboard', label: 'Dashboard' },
      { to: '/admin/occupancy', label: 'Live Occupancy' },
      { section: 'Management' },

      { to: '/admin/evacuation', label: 'Emergency' },
      { to: '/admin/feedback', label: 'Feedback' },
      { section: 'Reports & Data' },
      { to: '/admin/analytics', label: 'Analytics' },
      { to: '/admin/reports', label: 'Export Reports' },
      { to: '/admin/audit-logs', label: 'Audit Logs' },
      { section: 'System' },
      { to: '/admin/settings', label: 'Settings' },
      { to: '/admin/email-templates', label: 'Email Templates' },
      { section: 'Account' },
      { to: '/profile', label: 'Profile' },
    ];
    if (role === 'host') return [
      { section: 'My portal' },
      { to: '/host/dashboard', label: 'My Visits' },
      { to: '/pre-register', label: 'Send Visit Request' },
      { section: 'Workspace' },
      { to: '/host/availability', label: 'My Availability' },
      { section: 'Account' },
      { to: '/profile', label: 'Profile' },
    ];
    if (role === 'guard') return [
      { section: 'Operations' },
      { to: '/guard/scan', label: 'QR Scanner' },
      { section: 'Account' },
      { to: '/profile', label: 'Profile' },
    ];
    if (role === 'employee') return [
      { section: 'My Portal' },
      { to: '/employee/dashboard', label: 'Employee Dashboard' },
      { to: '/employee/visitors', label: 'My Visitors' },
      { to: '/employee/meetings', label: 'Meetings & Appointments' },
      { to: '/employee/notifications', label: 'Notifications' },
      { section: 'Visitor Management' },
      { to: '/employee/invite', label: 'Invite Visitor' },
      { to: '/employee/requests', label: 'Visitor Requests' },
      { to: '/employee/history', label: 'Visitor History' },
      { to: '/employee/passes', label: 'Access Passes' },
      { section: 'Learning' },
      { to: '/employee/training', label: 'VR Skill Assessment & Training' },
      { to: '/employee/tasks', label: 'Practical Tasks' },
      { section: 'Security' },
      { to: '/employee/safety', label: 'Emergency & Safety' },
      { to: '/employee/guidelines', label: 'Security Guidelines' },
      { section: 'Account' },
      { to: '/profile', label: 'Profile' },
    ];
    if (role === 'visitor' || role === 'student') return [
      { section: 'My Portal' },
      { to: '/visitor/dashboard', label: 'My Visitor Details' },
      { to: '/pre-register', label: 'Send Visit Request' },
      { to: '/emergency-appointment', label: 'Emergency Appointment' },
      { section: 'Company' },
      { to: '/visitor/about-company', label: 'About Company' },
      { section: 'Account' },
      { to: '/profile', label: 'Profile' },
    ];
    return [];
  };

  return (
    <aside style={{
      width: '220px',
      minWidth: '220px',
      background: 'rgba(255,255,255,0.72)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflow: 'hidden',
      backdropFilter: 'blur(12px)',
      boxShadow: 'inset -1px 0 0 rgba(148,163,184,0.08)'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '18px 16px 14px'
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '12px',
          background: 'var(--gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', color: 'white', flexShrink: 0
        }}>
          V
        </div>
        <div>
          <h2 style={{ fontSize: '1.06rem', margin: 0, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>VisitorIQ</h2>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.4px', fontWeight: 700 }}>
            {userProfile?.role ? userProfile.role.toUpperCase() : 'USER'}
          </span>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 10px' }}>
        {getLinks().filter(item => {
          const hiddenEmployeeItems = ['VR Skill Assessment & Training', 'Practical Tasks', 'Emergency & Safety', 'Security Guidelines', 'Learning', 'Security'];
          return userProfile?.role !== 'employee' || !hiddenEmployeeItems.includes(item.label || item.section);
        }).map((item, idx) => {
          if (item.section) {
            return (
              <div key={item.section} style={{
                fontSize: '0.62rem', color: 'var(--text-muted)', padding: '14px 10px 6px',
                textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1.4px',
                borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                marginTop: idx > 0 ? '8px' : '0'
              }}>
                {item.section}
              </div>
            );
          }
          const isCurrent = location.pathname === item.to;
          return (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              className={() => `sidebar-link ${isCurrent ? 'active' : ''}`}
              style={isCurrent ? {
                background: 'rgba(15, 23, 42, 0.06)',
                color: '#1f2937',
                fontWeight: 700,
                borderRadius: '10px',
                boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.12)'
              } : undefined}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 12px 14px',
        display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: 'white', fontSize: '0.8rem', flexShrink: 0, overflow: 'hidden'
          }}>
            {userProfile?.uid ? (() => {
              const saved = localStorage.getItem(`ftpass_profile_photo_${userProfile.uid}`);
              return saved ? (
                <img src={saved} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{userProfile?.name?.charAt(0).toUpperCase() || 'U'}</span>
              );
            })() : (userProfile?.name?.charAt(0).toUpperCase() || 'U')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userProfile?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userProfile?.email || ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '7px 0', borderRadius: '10px' }}
            onClick={() => navigate('/profile')}
          >
            Profile
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '7px 0', color: 'var(--danger)', borderColor: 'var(--danger)', borderRadius: '10px' }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
