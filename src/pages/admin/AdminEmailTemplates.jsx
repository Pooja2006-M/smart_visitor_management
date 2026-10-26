import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useToast } from '../../context/ToastContext';

const DEFAULT_TEMPLATES = {
  approval: {
    subject: 'Your Visit Has Been Approved',
    body: `Dear {visitor_name},

Your visit to {department} on {visit_date} at {visit_time} has been approved by {host_name}.

Please carry your QR code and a valid ID proof for verification at the gate.

Best regards,
VisitorIQ System`
  },
  rejection: {
    subject: 'Visit Request Declined',
    body: `Dear {visitor_name},

Unfortunately, your visit request to {department} on {visit_date} has been declined by the host.

Please contact the host directly for further details or reschedule your visit.

Best regards,
VisitorIQ System`
  },
  reminder: {
    subject: 'Visit Reminder - Tomorrow',
    body: `Dear {visitor_name},

This is a reminder that you have a scheduled visit to {department} tomorrow at {visit_time}.

Host: {host_name}
Purpose: {purpose}

Please arrive 5 minutes early and carry your ID proof.

Best regards,
VisitorIQ System`
  }
};

export default function AdminEmailTemplates() {
  const { addToast } = useToast();
  const [activeTemplate, setActiveTemplate] = useState('approval');
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);

  const handleSave = () => {
    addToast(`${activeTemplate} template saved successfully!`, 'success');
  };

  const tabs = [
    { key: 'approval', label: 'Approval', color: 'var(--success)' },
    { key: 'rejection', label: 'Rejection', color: 'var(--danger)' },
    { key: 'reminder', label: 'Reminder', color: 'var(--warning)' },
  ];

  const variables = ['{visitor_name}', '{host_name}', '{department}', '{visit_date}', '{visit_time}', '{purpose}'];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '32px' }}>
          <h2>Email Templates</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Customize the email content sent to visitors on approval, rejection, and reminders.
          </p>
        </div>

        {/* Template Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`btn ${activeTemplate === t.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTemplate(t.key)}
              style={{ fontSize: '0.85rem' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Editor */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.05rem' }}>
              Edit Template: <span style={{ color: 'var(--accent-1)' }}>{activeTemplate}</span>
            </h3>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Subject Line</label>
              <input
                type="text"
                className="form-input"
                value={templates[activeTemplate].subject}
                onChange={e => setTemplates(p => ({
                  ...p,
                  [activeTemplate]: { ...p[activeTemplate], subject: e.target.value }
                }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Email Body</label>
              <textarea
                className="form-textarea"
                rows={12}
                value={templates[activeTemplate].body}
                onChange={e => setTemplates(p => ({
                  ...p,
                  [activeTemplate]: { ...p[activeTemplate], body: e.target.value }
                }))}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSave} style={{ justifyContent: 'center' }}>
              Save Template
            </button>
          </div>

          {/* Variables */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.05rem' }}>Available Variables</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Use these placeholders in your templates. They will be replaced with actual data when the email is sent.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {variables.map(v => (
                <div key={v} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.15)', borderRadius: '8px'
                }}>
                  <code style={{ fontSize: '0.85rem', color: 'var(--accent-1)', fontWeight: 600 }}>{v}</code>
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                    onClick={() => {
                      navigator.clipboard.writeText(v);
                      addToast(`Copied ${v}`, 'info');
                    }}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '4px' }}>Tip</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Keep subject lines under 60 characters for best email open rates.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
