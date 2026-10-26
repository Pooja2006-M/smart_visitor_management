import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiActivity, FiArrowLeft, FiBell, FiCalendar, FiCamera, FiCheckCircle, FiDownload, FiGrid, FiMap, FiMapPin, FiMessageSquare, FiPlus, FiShield, FiSmartphone, FiTruck } from 'react-icons/fi';
import Sidebar from '../../components/Sidebar';

const smartTools = {
  'vr-reception': {
    id: 'vr-reception',
    icon: FiCamera,
    label: 'VR Reception Training',
    description: 'Reception staff can train in realistic front-desk scenarios for visitor handling, check-in, and escalation.',
    details: ['Scenario training', 'Front-desk rehearsal', 'Security-ready communication'],
  },
  'live-tracking': {
    id: 'live-tracking',
    icon: FiMapPin,
    label: 'Live Visitor Tracking',
    description: 'Track visitor movement from reception to meeting room and exit in a live operational flow.',
    details: ['Reception to room', 'Exit verification', 'Location visibility'],
  },
  'calendar-integration': {
    id: 'calendar-integration',
    icon: FiCalendar,
    label: 'Smart Calendar Integration',
    description: 'Sync appointments with Google Calendar, Outlook, and internal scheduling to avoid conflicts and delays.',
    details: ['Google sync', 'Outlook sync', 'Internal booking view'],
  },
  'auto-reminders': {
    id: 'auto-reminders',
    icon: FiBell,
    label: 'Smart Notifications & Auto Reminders',
    description: 'Notify host and visitors before meetings begin with time-based reminders and status updates.',
    details: ['30-minute alerts', '15-minute alerts', 'Host reminders'],
  },
  'digital-pass': {
    id: 'digital-pass',
    icon: FiDownload,
    label: 'Digital Visitor Pass (PDF Download)',
    description: 'Generate secure PDF visitor passes for quick download, sharing, and check-in verification.',
    details: ['PDF pass generation', 'Guest sharing', 'Secure visitor info'],
  },
  'qr-checkin': {
    id: 'qr-checkin',
    icon: FiSmartphone,
    label: 'QR-Based Entry & Secure Pass',
    description: 'Deliver one-time QR passes with expiry tracking to improve security and reduce unauthorized access.',
    details: ['One-time QR pass', 'Timed expiry', 'Secure entry control'],
  },
  'ai-analytics': {
    id: 'ai-analytics',
    icon: FiActivity,
    label: 'AI Analytics & Trends',
    description: 'Track visitor traffic, identify patterns, and discover peak hours and department usage trends.',
    details: ['Peak hour analysis', 'Department insights', 'Traffic forecasting'],
  },
  'feedback': {
    id: 'feedback',
    icon: FiMessageSquare,
    label: 'Visitor Feedback & Satisfaction',
    description: 'Collect visitor feedback to improve experience quality, staffing, and reception performance.',
    details: ['Visitor rating', 'Service comments', 'Improvement insights'],
  },
  'parking': {
    id: 'parking',
    icon: FiTruck,
    label: 'Smart Parking Allocation',
    description: 'Assign parking slots automatically and reserve capacity for approved visitors and guests.',
    details: ['Parking reservation', 'Visitor slot booking', 'Traffic management'],
  },
  'live-chat': {
    id: 'live-chat',
    icon: FiMessageSquare,
    label: 'Live Chat',
    description: 'Chat with reception or guests in real time for faster check-in assistance and visitor guidance.',
    details: ['Reception chat', 'Guest support', 'Live coordination'],
  },
  'indoor-nav': {
    id: 'indoor-nav',
    icon: FiMap,
    label: 'Indoor Company Navigation',
    description: 'Guide guests to meeting rooms and assigned workspaces using a clear indoor navigation flow.',
    details: ['Meeting room routes', 'Walkway guidance', 'Visitor directions'],
  },
};

export default function SmartToolPage() {
  const navigate = useNavigate();
  const { toolId } = useParams();
  const tool = smartTools[toolId] || smartTools['vr-reception'];
  const Icon = tool.icon;

  return (
    <div className="dashboard-layout host-dashboard">
      <Sidebar />
      <main className="main-content host-main">
        <header className="host-topbar" style={{ marginBottom: '24px' }}>
          <div>
            <p className="host-eyebrow">SMART VISITOR OPERATIONS</p>
            <h1 style={{ margin: '8px 0 0' }}>{tool.label}</h1>
          </div>
          <button className="host-new-button" onClick={() => navigate('/host/dashboard')}>
            <FiArrowLeft /> Back to dashboard
          </button>
        </header>

        <section className="host-panel" style={{ padding: '32px', minHeight: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px' }}>
            <div className="smart-tool-icon" style={{ width: 56, height: 56, marginBottom: 0 }}>
              <Icon />
            </div>
            <div>
              <p className="host-eyebrow" style={{ margin: 0 }}>FEATURE</p>
              <h2 style={{ margin: '4px 0 0', fontSize: '2rem' }}>{tool.label}</h2>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.08rem', lineHeight: 1.8, maxWidth: '780px', marginBottom: '24px' }}>
            {tool.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {tool.details.map((item, index) => (
              <div key={index} style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {item}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="host-new-button" onClick={() => navigate('/host/dashboard')}>
              <FiPlus /> Open in dashboard
            </button>
            <button className="host-outline-button" onClick={() => navigate('/host/dashboard')}>
              <FiCheckCircle /> Continue
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
