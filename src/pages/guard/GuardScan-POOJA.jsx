import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import VisitorBadge from '../../components/VisitorBadge';
import { sendGuardTomorrowSlotsEmail } from '../../utils/emailService';
import { collection, onSnapshot, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';


const DEMO_VISITS = {
  'VISIT-V001-2025': { id: 'V001', visitorName: 'Arun Selvam', host: 'Dr. Priya Sharma', dept: 'HR', purpose: 'Interview', date: '2025-12-20', time: '10:00', status: 'approved', faceVerified: true, checkIn: null, checkOut: null, vehicle: 'TN-01-AB-1234 (Car)', emergencyContact: 'Raj Selvam (9876543210)', idExpiry: '2030-12-31' },
  'VISIT-V002-2025': { id: 'V002', visitorName: 'Kavitha Rajan', host: 'Mr. Rajan Kumar', dept: 'Engineering', purpose: 'Meeting', date: '2025-12-22', time: '14:00', status: 'approved', faceVerified: true, checkIn: null, checkOut: null, vehicle: 'None', emergencyContact: 'Rajan (9988776655)', idExpiry: '2024-01-01' },
  'VISIT-REJECTED': { id: 'R001', visitorName: 'Unknown', host: '', dept: '', purpose: '', date: '', time: '', status: 'rejected', faceVerified: false, vehicle: 'None' },
};

export default function GuardScan() {
  const { addToast } = useToast();
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scanner');
  const [scannerMode, setScannerMode] = useState('qr');
  const [urgentOTP, setUrgentOTP] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success' | 'error' | 'checkedout'
  const [showBadge, setShowBadge] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const webcamRef = useRef(null);
  const [logs, setLogs] = useState([
    { time: '09:32 AM', visitor: 'Muthu Krishnan', action: 'Check-In', status: 'success' },
    { time: '10:15 AM', visitor: 'Preethi S', action: 'Check-In', status: 'success' },
    { time: '11:45 AM', visitor: 'Muthu Krishnan', action: 'Check-Out', status: 'success' },
  ]);

  const [packages, setPackages] = useState([
    { id: 'PKG1', recipient: 'Dr. Priya Sharma', courier: 'Amazon', time: '10:00 AM', status: 'Waiting Pickup' },
    { id: 'PKG2', recipient: 'Mr. Rajan Kumar', courier: 'BlueDart', time: '11:30 AM', status: 'Picked Up' },
  ]);
  const [pkgForm, setPkgForm] = useState({ recipient: '', courier: '' });
  const [trainingStatus, setTrainingStatus] = useState('idle');
  const [trainingMessage, setTrainingMessage] = useState('');
  const [liveVisits, setLiveVisits] = useState([]);

  React.useEffect(() => {
    const approvedVisitsQuery = query(collection(db, 'registrations'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(approvedVisitsQuery, (snapshot) => {
      const approvedVisits = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          visitorName: data.fullName || 'Guest Visitor',
          host: data.hostName || 'Host not assigned',
          dept: data.department || 'General',
          purpose: data.purpose || 'General Visit',
          date: data.visitDate || '',
          time: data.visitTime || '',
          status: data.status,
          qrData: `VISIT-${item.id}`,
          vehicle: data.vehicleNumber || 'None',
          faceVerified: false,
          checkIn: data.checkIn || null,
          checkOut: data.checkOut || null,
        };
      });
      setLiveVisits(approvedVisits);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().slice(0, 10);
      const tomorrowVisits = approvedVisits.filter((visit) => visit.date === tomorrowDate);
      const emailKey = `guard-tomorrow-slots:${userProfile?.email}:${tomorrowDate}`;
      if (userProfile?.email && !localStorage.getItem(emailKey)) {
        localStorage.setItem(emailKey, 'sent');
        sendGuardTomorrowSlotsEmail(userProfile.email, tomorrowVisits)
          .then(() => addToast('Tomorrow visitor slots email sent.', 'success'))
          .catch((error) => addToast(`Tomorrow slots loaded, but email failed: ${error.message}`, 'warning'));
      }
    }, () => {
      addToast('Unable to load today\'s appointments.', 'warning');
    });
    return () => unsubscribe();
  }, [addToast, userProfile?.email]);

  const startEmergencyTraining = () => {
    setTrainingStatus('running');
    setTrainingMessage('VR Emergency/Security Training in progress...');
    setTimeout(() => {
      const success = Math.random() > 0.15;
      setTrainingStatus(success ? 'success' : 'failed');
      setTrainingMessage(success ? 'Emergency training completed successfully.' : 'Training scenario ended with feedback for improvement.');
      addToast(success ? 'VR Emergency/Security training completed.' : 'VR Emergency/Security training requires retry.', success ? 'success' : 'error');
    }, 2200);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const processQR = (code) => {
    const trimmed = code.trim().toUpperCase();
    const visit = liveVisits.find((item) => item.qrData === trimmed)
      || DEMO_VISITS[trimmed]
      || DEMO_VISITS[code.trim()];

    if (!visit) {
      setScanResult(null);
      setScanStatus('error');
      addToast('Invalid QR code. No matching visit found.', 'error');
      return;
    }

    if (visit.status !== 'approved') {
      setScanResult(visit);
      setScanStatus('error');
      addToast('This visit is not approved. Entry denied.', 'error');
      return;
    }

    // Expired ID Alert
    if (visit.idExpiry) {
      const today = new Date().toISOString().split('T')[0];
      if (visit.idExpiry < today) {
        addToast('Warning: Visitor ID is expired. Please verify manually.', 'warning');
      }
    }

    setScanResult(visit);
    setScanStatus('success');
    
    if (!visit.checkIn) {
      const badge = window.prompt(`Assign Badge Number for ${visit.visitorName}:`, `B-${Math.floor(Math.random() * 100) + 1}`);
      if (!badge) {
        addToast('Check-in cancelled: Badge number is required.', 'warning');
        return;
      }
      visit.badgeNumber = badge;
      visit.checkIn = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      addToast(`Check-in recorded. Badge ${badge} assigned.`, 'success');
    } else {
      visit.checkOut = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      addToast(`Check-out recorded. Badge ${visit.badgeNumber} collected.`, 'success');
      visit.badgeNumber = null;
    }

    const action = visit.checkOut ? 'Check-Out' : 'Check-In';

    // Add to log
    setLogs(prev => [{
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      visitor: visit.visitorName,
      action,
      status: 'success'
    }, ...prev]);
  };

  const handleManualScan = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processQR(manualCode);
    setManualCode('');
  };

  const handleDemoScan = (key) => {
    processQR(key);
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedPhoto(imageSrc);
    addToast('Live photo captured successfully.', 'success');
  }, [webcamRef]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!urgentOTP || urgentOTP.length !== 4) {
      addToast('Please enter a valid 4-digit OTP.', 'error');
      return;
    }
    setVerifyingOTP(true);
    try {
      const q = query(
        collection(db, 'registrations'),
        where('entryOTP', '==', urgentOTP),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        addToast('Invalid OTP or visit not approved.', 'error');
      } else {
        const visitDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'registrations', visitDoc.id), {
          status: 'checked-in',
          checkedInAt: serverTimestamp()
        });
        addToast('OTP verified. Check-in successful.', 'success');
        setUrgentOTP('');
      }
    } catch (err) {
      addToast('Error verifying OTP.', 'error');
    } finally {
      setVerifyingOTP(false);
    }
  };

  if (showBadge && scanResult) {
    return <VisitorBadge visit={scanResult} onBack={() => setShowBadge(false)} />;
  }

  const handlePackageSubmit = (e) => {
    e.preventDefault();
    if (!pkgForm.recipient || !pkgForm.courier) return;
    setPackages(prev => [{
      id: `PKG${Date.now()}`,
      recipient: pkgForm.recipient,
      courier: pkgForm.courier,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'Waiting Pickup'
    }, ...prev]);
    addToast('Package logged. Host notified to pick it up.', 'success');
    setPkgForm({ recipient: '', courier: '' });
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      padding: '24px', maxWidth: '600px', margin: '0 auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-full)', padding: '4px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['scanner', 'walkin', 'appointments', 'packages'].map(tab => (
          <button
            key={tab}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'scanner' ? 'QR Scanner' : 
             tab === 'walkin' ? 'Walk-in Registration' : 
             tab === 'appointments' ? 'Appointments' : 'Package Log'}
          </button>
        ))}
      {activeTab === 'scanner' && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 240 }}>
              <h3 style={{ marginBottom: '10px' }}>VR Emergency/Security Training</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Practice emergency entry control, gate security response, and identity verification in a simulated VR scenario.
              </p>
            </div>
            <button className="btn btn-primary" onClick={startEmergencyTraining} disabled={trainingStatus === 'running'}>
              {trainingStatus === 'running' ? 'Running Training…' : 'Start Training'}
            </button>
          </div>
          {trainingStatus !== 'idle' && (
            <div style={{ marginTop: '18px', color: trainingStatus === 'success' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              {trainingMessage}
            </div>
          )}
        </div>
      )}
      </div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '20px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 16px'
        }}>Security</div>
        <h2>Visitor Verification</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
          {activeTab === 'scanner' ? 'Scan visitor QR codes to manage gate entry & exit' : 'Log incoming courier packages'}
        </p>
      </div>

      {activeTab === 'scanner' ? (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
            <button className={`btn btn-sm ${scannerMode === 'qr' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setScannerMode('qr')}>
              Scan QR
            </button>
            <button className={`btn btn-sm ${scannerMode === 'otp' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setScannerMode('otp')}>
              Enter Urgent OTP
            </button>
          </div>

          {scannerMode === 'qr' ? (
            <>
          {/* Camera QR Scanner placeholder / Live Photo */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
            {showCamera ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                {!capturedPhoto ? (
                  <>
                    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--accent-1)' }}>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={320}
                        height={240}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-primary" onClick={capturePhoto}>Capture Photo</button>
                      <button className="btn btn-secondary" onClick={() => setShowCamera(false)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--success)' }}>
                      <img src={capturedPhoto} alt="Captured" width={320} height={240} style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-secondary" onClick={() => setCapturedPhoto(null)}>Retake</button>
                      <button className="btn btn-primary" onClick={() => { addToast('Photo saved to visit record.', 'success'); setShowCamera(false); }}>Save & Close</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{
                width: '100%', height: '220px',
                background: 'rgba(6,182,212,0.05)', border: '2px dashed rgba(6,182,212,0.3)',
                borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px'
              }}>
                <div style={{ fontSize: '3rem' }}>Camera</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Live Photo / QR Scanner</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Capture visitor photo or scan QR</p>
                <button id="start-camera" className="btn btn-primary btn-sm" onClick={() => setShowCamera(true)}>
                  Start Camera
                </button>
              </div>
            )}

        {/* Manual Input */}
        <form onSubmit={handleManualScan} style={{ display: 'flex', gap: '10px' }}>
          <input
            id="manual-qr-input"
            type="text" className="form-input"
            placeholder="Enter QR code manually..."
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
          />
          <button id="manual-scan-btn" type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            Scan
          </button>
        </form>
      </div>

      {/* Demo Scan Buttons */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 600 }}>
          DEMO — QUICK SCAN
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button id="demo-scan-approved1" className="btn btn-success btn-sm" onClick={() => handleDemoScan('VISIT-V001-2025')}>
            Scan Approved Visit (Arun Selvam)
          </button>
          <button id="demo-scan-approved2" className="btn btn-success btn-sm" onClick={() => handleDemoScan('VISIT-V002-2025')}>
            Scan Approved Visit (Kavitha Rajan)
          </button>
          <button id="demo-scan-rejected" className="btn btn-danger btn-sm" onClick={() => handleDemoScan('VISIT-REJECTED')}>
            Scan Rejected Visit
          </button>
          <button id="demo-scan-invalid" className="btn btn-secondary btn-sm" onClick={() => handleDemoScan('INVALID-CODE-XYZ')}>
            Scan Invalid QR Code
          </button>
        </div>
      </div>

      {/* Scan Result Card */}
      {scanResult && (
        <div className="glass-card" style={{
          padding: '24px', marginBottom: '24px',
          borderColor: scanStatus === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)',
          background: scanStatus === 'success' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>{scanStatus === 'success' ? 'SUCCESS' : 'DENIED'}</span>
            <div>
              <h3 style={{ color: scanStatus === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: '1rem' }}>
                {scanStatus === 'success' ? 'ENTRY ALLOWED' : 'ENTRY DENIED'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {new Date().toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              ['Visitor', scanResult.visitorName],
              ['Host', scanResult.host],
              ['Department', scanResult.dept],
              ['Purpose', scanResult.purpose],
              ['Vehicle', scanResult.vehicle],
              ['Date', scanResult.date],
              ['Time', scanResult.time],
              ['Badge Assigned', scanResult.badgeNumber],
              ['Emergency Contact', scanResult.emergencyContact],
              ['ID Expiry', scanResult.idExpiry],
              ['Face Verified', scanResult.faceVerified ? 'Yes' : 'No'],
            ].filter(([, v]) => v).map(([k, v]) => {
              const isExpired = k === 'ID Expiry' && v < new Date().toISOString().split('T')[0];
              return (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: isExpired ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 500 }}>
                    {v} {isExpired && ' (EXPIRED)'}
                  </span>
                </div>
              );
            })}
          </div>
          {scanStatus === 'success' && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Confirm Check-In
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowBadge(true)}>
                Print Badge
              </button>
            </div>
          )}
        </div>
      )}
            </>
          ) : (
            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Enter Urgent OTP</h3>
              <form onSubmit={handleVerifyOTP} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  maxLength="4"
                  className="form-input"
                  placeholder="Enter 4-digit OTP"
                  value={urgentOTP}
                  onChange={e => setUrgentOTP(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={verifyingOTP} style={{ flexShrink: 0 }}>
                  {verifyingOTP ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            </div>
          )}

      {/* Today's Log */}
      <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Today's Entry Log</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{log.visitor}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{log.time}</p>
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: log.action === 'Check-In' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                color: log.action === 'Check-In' ? 'var(--success)' : 'var(--accent-1)'
              }}>
                {log.action}
              </span>
            </div>
          ))}
        </div>
      </div>
        </>
      ) : activeTab === 'walkin' ? (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Walk-in Registration</h3>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={e => { e.preventDefault(); addToast('Walk-in registered successfully! Host notified.', 'success'); setActiveTab('scanner'); }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" required placeholder="e.g. Rahul Nair" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" required placeholder="+91 98765 43210" />
            </div>
            <div className="form-group">
              <label className="form-label">Host Name / Department</label>
              <input type="text" className="form-input" required placeholder="e.g. HR Dept" />
            </div>
            <div className="form-group">
              <label className="form-label">Purpose of Visit</label>
              <input type="text" className="form-input" required placeholder="e.g. Delivery / Interview" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              Register & Notify Host
            </button>
          </form>
        </div>
      ) : activeTab === 'appointments' ? (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Today's Appointments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(liveVisits.length > 0
              ? liveVisits.filter(v => v.date === new Date().toISOString().split('T')[0])
              : Object.values(DEMO_VISITS).filter(v => v.status === 'approved')
            ).map((v, i) => (
              <div key={i} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>{v.visitorName}</h4>
                  <span className="badge badge-approved">{v.time}</span>
                </div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Host: <strong>{v.host}</strong> ({v.dept})</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Purpose: {v.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Package Log Tab */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Log New Package</h3>
            <form onSubmit={handlePackageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Recipient (Host Name)</label>
                <input type="text" className="form-input" placeholder="e.g. Dr. Priya Sharma" value={pkgForm.recipient} onChange={e => setPkgForm(p => ({ ...p, recipient: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Courier Company</label>
                <input type="text" className="form-input" placeholder="e.g. Amazon, BlueDart, DTDC" value={pkgForm.courier} onChange={e => setPkgForm(p => ({ ...p, courier: e.target.value }))} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Log Package & Notify Host
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Today's Packages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {packages.map((pkg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{pkg.recipient}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                      {pkg.courier} · Arrived at {pkg.time}
                    </p>
                  </div>
                  <span className={`badge ${pkg.status === 'Picked Up' ? 'badge-approved' : 'badge-pending'}`}>
                    {pkg.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
