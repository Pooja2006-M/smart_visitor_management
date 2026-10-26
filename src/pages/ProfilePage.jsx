import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { userProfile } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [profileImage, setProfileImage] = useState('');
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    mobile: userProfile?.mobile || '',
    email: userProfile?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!userProfile?.uid) return;
    const saved = localStorage.getItem(`ftpass_profile_photo_${userProfile.uid}`);
    setProfileImage(saved || '');
  }, [userProfile?.uid]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('Image must be smaller than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      setProfileImage(imageData);
      if (userProfile?.uid) {
        localStorage.setItem(`ftpass_profile_photo_${userProfile.uid}`, imageData);
      }
      addToast('Profile picture updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    // Simulate API call
    addToast('Profile updated successfully!', 'success');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      addToast('Passwords do not match!', 'error');
      return;
    }
    // Simulate API call
    addToast('Password changed successfully!', 'success');
    setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '32px' }}>
          <h2>My Profile</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage your personal information and account security.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Profile Information */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Personal Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white',
                overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 12px 24px rgba(37, 99, 235, 0.12)'
              }}>
                {profileImage ? (
                  <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{(formData.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/jpg"
                  hidden
                  onChange={handleImageUpload}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                  Change Picture
                </button>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>JPG, GIF or PNG. Max size of 2MB</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" name="email" className="form-input" value={formData.email} disabled />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email cannot be changed</span>
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input type="tel" name="mobile" className="form-input" value={formData.mobile} onChange={handleChange} placeholder="+1 234 567 8900" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>Save Changes</button>
            </form>
          </div>

          {/* Security & Password */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Security</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" name="currentPassword" className="form-input" value={formData.currentPassword} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" name="newPassword" className="form-input" value={formData.newPassword} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" name="confirmPassword" className="form-input" value={formData.confirmPassword} onChange={handleChange} required />
              </div>
              <button type="submit" className="btn btn-danger" style={{ marginTop: '8px' }}>Update Password</button>
            </form>

            <div style={{ marginTop: '40px', padding: '16px', border: '1px solid var(--danger)', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)' }}>
              <h4 style={{ color: 'var(--danger)', margin: '0 0 8px 0' }}>Role & Permissions</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                You are currently logged in as a <strong>{userProfile?.role?.toUpperCase() || 'USER'}</strong>. 
                Contact the system administrator to request additional privileges.
              </p>
            </div>
          </div>
        </div>

        {/* Device History & Failed Logins */}
        <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Login Security & History</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Recent Logins */}
            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Recent Devices</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { device: 'MacBook Pro - Chrome', location: 'Chennai, India', time: 'Just now', status: 'Active' },
                  { device: 'iPhone 14 - Safari', location: 'Chennai, India', time: '2 hours ago', status: 'Logged Out' },
                  { device: 'Windows Desktop - Edge', location: 'Bangalore, India', time: 'Yesterday', status: 'Logged Out' }
                ].map((log, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>{log.device}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.location} • {log.time}</p>
                    </div>
                    {log.status === 'Active' ? (
                      <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>ACTIVE</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.status}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Failed Attempts */}
            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Failed Login Attempts</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { ip: '192.168.1.45', time: 'Today, 10:45 AM', reason: 'Incorrect Password' },
                  { ip: '45.22.19.102', time: 'Yesterday, 02:15 PM', reason: 'Unknown Device' }
                ].map((log, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--danger)' }}>Attempt blocked</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IP: {log.ip} • {log.time}</p>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{log.reason}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
