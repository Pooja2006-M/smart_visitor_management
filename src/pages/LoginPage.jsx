import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FcGoogle } from 'react-icons/fc';

const roleRoutes = {
  visitor: '/visitor/dashboard',
  student: '/visitor/dashboard',
  host: '/host/dashboard',
  guard: '/guard/scan',
  admin: '/admin/dashboard',
  employee: '/employee/dashboard',
};

const demoCredentials = {
  visitor: 'visitor@gmail.com / Visitor@73',
  student: 'student@gmail.com / Student@73',
  host: 'host@gmail.com / Host@73',
  guard: 'guard@gmail.com / Guard@73',
  admin: 'admin@gmail.com / Admin@73',
  employee: 'employee@gmail.com / Employee@73',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('visitor');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin, userProfile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile?.role) {
      navigate(roleRoutes[userProfile.role] || '/');
    }
  }, [userProfile, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, selectedRole);
      addToast('Welcome back!', 'success');
    } catch (err) {
      addToast(err.message || 'Login failed. Check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await googleLogin();
      addToast('Signed in with Google.', 'success');
    } catch (err) {
      const message = {
        'auth/operation-not-allowed': 'Google sign-in is disabled in Firebase. Enable Google provider in Firebase Authentication.',
        'auth/unauthorized-domain': 'This website domain is not authorized in Firebase Authentication settings.',
        'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups and try again.',
        'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
        'auth/cancelled-popup-request': 'Another Google sign-in window is already open.',
      }[err.code] || err.message || 'Google sign-in failed.';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '24px', position: 'relative'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px', background: 'var(--gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', margin: '0 auto 16px'
          }}>V</div>
          <h2 style={{ fontFamily: 'var(--font-display)' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            Sign in to continue to your workspace
          </p>
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>
          <form
            onSubmit={handleLogin}
            autoComplete="off"
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
              >
                <option value="visitor">Visitor</option>
                <option value="student">Student</option>
                <option value="host">Host</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="guard">Guard</option>
              </select>
            </div>
            <div style={{
              marginTop: '-8px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.18)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              lineHeight: 1.5
            }}>
              Quick demo access for {selectedRole}: {demoCredentials[selectedRole]}
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="off"
                className="form-input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="new-password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
              disabled={loading}
            >
              {loading ? <span className="animate-spin">⟳</span> : null}
              {loading ? 'Signing you in...' : 'Let’s go →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <span style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
            OR
            <span style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <FcGoogle aria-hidden="true" size={20} /> Continue with Google
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            New here?{' '}
            <Link to="/register" style={{ color: 'var(--accent-1)', fontWeight: 600 }}>
              Pre-register your visit now →
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
