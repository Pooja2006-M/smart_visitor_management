import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function KioskPage() {
  const navigate = useNavigate();
  const [voiceModal, setVoiceModal] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [transcriptHost, setTranscriptHost] = useState('');
  const [transcriptPurpose, setTranscriptPurpose] = useState('');
  const [checkInName, setCheckInName] = useState('');
  const [checkInHost, setCheckInHost] = useState('');
  const [checkInPurpose, setCheckInPurpose] = useState('');
  const [printerOpen, setPrinterOpen] = useState(false);
  const [badgeInfo, setBadgeInfo] = useState(null);

  const handleStartVoiceCheckIn = () => {
    setVoiceModal(true);
    setVoiceStatus('idle');
    setTranscriptHost('');
    setTranscriptPurpose('');
    setCheckInName('');
    setCheckInHost('');
    setCheckInPurpose('');
  };

  const handleSimulateVoiceInput = () => {
    setVoiceStatus('listening');
    setTimeout(() => {
      setTranscriptHost('Dr. Priya Sharma');
      setTranscriptPurpose('Facility tour and vendor onboarding');
      setCheckInName('Aarav Kumar');
      setCheckInHost('Dr. Priya Sharma');
      setCheckInPurpose('Facility tour and vendor onboarding');
      setVoiceStatus('processed');
    }, 1900);
  };

  const handleConfirmCheckIn = (event) => {
    event.preventDefault();
    const visitorName = checkInName.trim() || 'Guest Visitor';
    const hostName = checkInHost.trim() || 'Unknown Host';
    const purpose = checkInPurpose.trim() || 'Business Visit';
    const visitorId = `V-${Math.floor(1000 + Math.random() * 9000)}`;
    setBadgeInfo({ visitorName, hostName, purpose, visitorId, wifi: 'Guest_Vertex_5G', qrValue: `KIOSK-${visitorId}` });
    setPrinterOpen(true);
    setVoiceModal(false);
  };

  const thermalBadgeCard = badgeInfo ? (
    <div style={{ padding: '28px', width: '100%', maxWidth: '420px', background: 'linear-gradient(180deg, #111827 0%, #1e293b 100%)', borderRadius: '28px', color: 'white', boxShadow: '0 28px 80px rgba(15,23,42,0.25)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>Thermal Badge Print</div>
          <h3 style={{ margin: '8px 0 0', fontSize: '1.4rem' }}>Visitor Pass Ready</h3>
        </div>
        <div style={{ width: '55px', height: '55px', borderRadius: '18px', background: '#111827', border: '1px solid rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center' }}>Print</div>
      </div>
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '20px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Visitor ID</span>
            <strong style={{ fontSize: '1.05rem' }}>{badgeInfo.visitorId}</strong>
          </div>
          <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}><span>Name</span><strong>{badgeInfo.visitorName}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}><span>Host</span><strong>{badgeInfo.hostName}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}><span>Purpose</span><strong>{badgeInfo.purpose}</strong></div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '14px', padding: '16px', borderRadius: '20px', border: '1px solid rgba(148,163,184,0.2)', background: 'linear-gradient(180deg, rgba(15,23,42,0.85), rgba(15,23,42,0.7))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}><span>Wi-Fi</span><strong>{badgeInfo.wifi}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}><span>QR Code</span><strong style={{ fontSize: '0.9rem' }}>{badgeInfo.qrValue}</strong></div>
          <div style={{ width: '100%', height: '128px', borderRadius: '18px', background: '#111827', border: '1px dashed rgba(148,163,184,0.2)', display: 'grid', placeItems: 'center', fontSize: '0.95rem', letterSpacing: '0.06em', color: '#cbd5e1' }}>
            [QR CODE]
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setPrinterOpen(false)} style={{ flex: 1 }}>Close</button>
          <button className="btn btn-primary" onClick={() => alert('Thermal badge sent to printer simulator')} style={{ flex: 1 }}>Simulate Print</button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div style={{ textAlign: 'center', marginBottom: '40px', zIndex: 1 }}>
        <h1 style={{ fontSize: '3rem', background: 'var(--gradient)', WebkitBackgroundClip: 'text', color: 'transparent', margin: '0 0 16px 0' }}>
          Smart Visitor Kiosk
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Welcome! Choose a fast, secure check-in flow.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '28px', zIndex: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div
          className="glass-card kiosk-card"
          style={{ width: '320px', padding: '34px', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/guard/scan')}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '22px' }}>QR</div>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '12px' }}>QR Check-In</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Pre-registered visitors can scan a secure pass instantly.
          </p>
        </div>

        <div
          className="glass-card kiosk-card"
          style={{ width: '320px', padding: '34px', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/register')}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '22px' }}>Register</div>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '12px' }}>Walk-in Register</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            New visitors can register here and notify their host immediately.
          </p>
        </div>

        <div
          className="glass-card kiosk-card"
          style={{ width: '320px', padding: '34px', textAlign: 'center', cursor: 'pointer' }}
          onClick={handleStartVoiceCheckIn}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '22px' }}>Voice</div>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '12px' }}>Voice AI Check-In</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Speak your host or reason for visit and the kiosk fills the form automatically.
          </p>
        </div>
      </div>

      <style>
        {`
          .kiosk-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.12);
            border-color: rgba(59,130,246,0.3);
          }
          .kiosk-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
          .kiosk-label { color: var(--text-secondary); font-size: 0.95rem; }
          .input-card { width: 100%; display: grid; gap: 12px; }
          .input-card input, .input-card textarea { width: 100%; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; font-size: 0.95rem; }
          .printer-modal-bg { position: fixed; inset: 0; background: rgba(15,23,42,0.72); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
          .printer-modal { width: min(100%, 760px); max-width: 760px; }
          .voice-modal { width: min(100%, 540px); }
        `}
      </style>

      {voiceModal && (
        <div className="printer-modal-bg" onClick={() => setVoiceModal(false)}>
          <div className="glass-card voice-modal" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', position: 'relative' }}>
            <button style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '1.3rem', cursor: 'pointer' }} onClick={() => setVoiceModal(false)}>×</button>
            <h2 style={{ marginBottom: '12px' }}>Voice-Controlled Check-In</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '22px' }}>
              Speak to the kiosk and let AI pull your host, visit reason, and badge details.
            </p>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', borderRadius: '18px', background: 'rgba(37,99,235,0.06)' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Status</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{voiceStatus === 'idle' ? 'Ready to listen' : voiceStatus === 'listening' ? 'Listening… please speak clearly' : 'Text captured'}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleSimulateVoiceInput} disabled={voiceStatus === 'listening'}>
                  {voiceStatus === 'listening' ? 'Listening…' : 'Simulate Voice Input'}
                </button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '18px', padding: '16px', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>AI Transcription</p>
                <p style={{ margin: '10px 0 0 0', lineHeight: 1.6, color: 'var(--text-primary)' }}><strong>Host:</strong> {transcriptHost || '—'}</p>
                <p style={{ margin: '6px 0 0 0', lineHeight: 1.6, color: 'var(--text-primary)' }}><strong>Purpose:</strong> {transcriptPurpose || '—'}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmCheckIn} style={{ display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Visitor Name
                <input value={checkInName} onChange={(e) => setCheckInName(e.target.value)} placeholder="Aarav Kumar" />
              </label>
              <label style={{ display: 'grid', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Host Name
                <input value={checkInHost} onChange={(e) => setCheckInHost(e.target.value)} placeholder="Dr. Priya Sharma" />
              </label>
              <label style={{ display: 'grid', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Reason for Visit
                <textarea rows={3} value={checkInPurpose} onChange={(e) => setCheckInPurpose(e.target.value)} placeholder="Business review, vendor onboarding, etc." />
              </label>
              <button className="btn btn-primary" type="submit">Confirm Check-In & Print Badge</button>
            </form>
          </div>
        </div>
      )}

      {printerOpen && badgeInfo && (
        <div className="printer-modal-bg" onClick={() => setPrinterOpen(false)}>
          <div className="glass-card printer-modal" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', position: 'relative' }}>
            <button style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '1.3rem', cursor: 'pointer' }} onClick={() => setPrinterOpen(false)}>×</button>
            <h2 style={{ marginBottom: '12px' }}>Thermal Badge Printer Simulator</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              A simulated thermal sticker badge has been generated for your visitor.
            </p>
            {thermalBadgeCard}
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: '24px', zIndex: 1 }}>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Back to Main Website
        </Link>
      </div>
    </div>
  );
}
