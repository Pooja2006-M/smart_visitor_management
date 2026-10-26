import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import emailjs from '@emailjs/browser';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { userProfile } = useAuth();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Visitor Arrived', text: 'Arun Selvam is at the gate.', time: 'Just now', unread: true },
    { id: 2, title: 'Visit Approved', text: 'Dr. Priya Sharma approved Arun Selvam.', time: '2m ago', unread: true },
    { id: 3, title: 'Visitor Checked Out', text: 'Muthu Krishnan left the premises.', time: '1h ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read
    if (notif.unread) {
      setNotifications(notifications.map(n => n.id === notif.id ? { ...n, unread: false } : n));
      
      // Send email
      if (userProfile?.email) {
        try {
          addToast(`Sending email to ${userProfile.email}...`, 'info');
          // Note: Replace these with actual EmailJS credentials
          await emailjs.send(
            'YOUR_SERVICE_ID', 
            'YOUR_TEMPLATE_ID', 
            {
              to_email: userProfile.email,
              to_name: userProfile.name || 'User',
              notification_title: notif.title,
              notification_message: notif.text,
            },
            'YOUR_PUBLIC_KEY'
          );
          addToast('Email notification sent successfully!', 'success');
        } catch (error) {
          console.error('EmailJS Error:', error);
          // Show error but explain that keys are needed
          addToast('Failed to send email. Please configure EmailJS keys in NotificationCenter.jsx', 'error');
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: '1.5rem', position: 'relative', padding: '8px', color: 'var(--text-primary)'
        }}
      >
        Notifications
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '0px', right: '0px',
            background: 'var(--danger)', color: 'white',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '0.7rem', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: '0',
          width: '320px', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100,
          overflow: 'hidden', marginTop: '8px'
        }}>
          <div style={{ 
            padding: '16px', borderBottom: '1px solid var(--border)', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
          }}>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>Notifications</h4>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                style={{ background: 'none', border: 'none', color: 'var(--accent-1)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No new notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => handleNotificationClick(notif)}
                  style={{ 
                    padding: '16px', borderBottom: '1px solid var(--border)',
                    background: notif.unread ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    cursor: notif.unread ? 'pointer' : 'default'
                  }}
                  title={notif.unread ? "Click to mark read and send email notification" : ""}
                >
                  <div style={{ fontSize: '1.5rem' }}>
                    {notif.title.includes('Arrived') ? 'Arrival' :
                     notif.title.includes('Approved') ? 'Approved' :
                     notif.title.includes('Out') ? 'Exit' : 'Message'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{notif.title}</h5>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{notif.text}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                  </div>
                  {notif.unread && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-1)', marginTop: '6px' }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
