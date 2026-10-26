import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import VisitorBadge from '../../components/VisitorBadge';
import { sendGuardTomorrowSlotsEmail, sendGuardOtpEmail, sendGuardHostNotifyEmail } from '../../utils/emailService';
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { createVisitQrUrl } from '../../utils/visitQr';

const createEntryOTP = () => {
  const upperBound = Math.floor(0x100000000 / 10000) * 10000;
  const randomValue = new Uint32Array(1);
  do {
    window.crypto.getRandomValues(randomValue);
  } while (randomValue[0] >= upperBound);
  return String(randomValue[0] % 10000).padStart(4, '0');
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatLocalTime = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

// Demo visit database for scanning
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
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success' | 'error' | 'checkedout'
  const [showBadge, setShowBadge] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const webcamRef = useRef(null);
  const processQRRef = useRef(null);
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
  const [walkinForm, setWalkinForm] = useState({ fullName: '', phone: '', email: '', purpose: '', hostName: '', hostEmail: '' });
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);
  const [walkinOtp, setWalkinOtp] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifiedVisit, setOtpVerifiedVisit] = useState(null);

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
          entryOTP: data.entryOTP || '',
          email: data.email || '',
          phone: data.phone || '',
          isUrgent: data.isUrgent || false,
          qrData: createVisitQrUrl(item.id),
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
    const trimmed = code.trim();
    const normalized = trimmed.toUpperCase();
    let linkedVisitId = '';
    try {
      const scannedUrl = new URL(trimmed);
      if (scannedUrl.origin === window.location.origin && scannedUrl.pathname.startsWith('/visit/qr/')) {
        linkedVisitId = decodeURIComponent(scannedUrl.pathname.slice('/visit/qr/'.length));
      }
    } catch {
      // The code may be a plain visit token rather than a URL.
    }
    const visit = liveVisits.find((item) => item.id === linkedVisitId || item.qrData === trimmed || item.qrData.toUpperCase() === normalized)
      || DEMO_VISITS[normalized]
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

  processQRRef.current = processQR;

  React.useEffect(() => {
    if (!showQRScanner || activeTab !== 'scanner') return undefined;

    let cancelled = false;
    let decoded = false;
    let started = false;
    let cleared = false;
    let scanner = null;
    let startPromise = Promise.resolve();
    const startTimer = window.setTimeout(() => {
      if (cancelled) return;

      scanner = new Html5Qrcode('guard-qr-reader');
      const clearScanner = () => {
        if (cleared) return;
        scanner.clear();
        cleared = true;
      };

      startPromise = scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (decodedText) => {
          if (cancelled || decoded) return;
          decoded = true;
          scanner.stop()
            .then(clearScanner)
            .then(() => {
              if (cancelled) return;
              setShowQRScanner(false);
              processQRRef.current(decodedText);
            })
            .catch((error) => {
              console.error('Unable to stop QR scanner:', error);
              addToast('QR scan completed, but the camera could not be closed cleanly.', 'warning');
            });
        },
        () => {}
      ).then(() => {
        started = true;
        if (cancelled && scanner.isScanning) {
          return scanner.stop().then(clearScanner);
        }
        return undefined;
      }).catch((error) => {
        if (cancelled) {
          clearScanner();
          return;
        }
        console.error('Unable to start QR scanner:', error);
        setShowQRScanner(false);
        addToast('Could not start the QR camera. Allow camera access and open this page over HTTPS.', 'error');
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (!scanner) return;
      const clearScanner = () => {
        if (cleared) return;
        scanner.clear();
        cleared = true;
      };
      if (started && scanner.isScanning) {
        scanner.stop()
          .then(clearScanner)
          .catch((error) => console.error('Unable to stop QR scanner:', error));
      } else if (started) {
        try {
          clearScanner();
        } catch (error) {
          console.error('Unable to clear QR scanner:', error);
        }
      } else {
        startPromise
          .then(() => scanner.isScanning ? scanner.stop() : undefined)
          .then(clearScanner)
          .catch((error) => console.error('Unable to clear QR scanner:', error));
      }
    };
  }, [showQRScanner, activeTab, addToast]);

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
  }, [addToast]);

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

  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    if (!walkinForm.fullName.trim()) {
      addToast('Enter the visitor full name.', 'warning');
      return;
    }
    const normalizedEmail = walkinForm.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      addToast('Enter a valid visitor email address.', 'warning');
      return;
    }
    if (!walkinForm.hostName.trim()) {
      addToast('Enter the host name / department.', 'warning');
      return;
    }

    setWalkinSubmitting(true);
    const now = new Date();
    const entryOTP = createEntryOTP();
    const visitDate = formatLocalDate(now);
    const visitTime = formatLocalTime(now);
    const hostEmail = walkinForm.hostEmail.trim().toLowerCase() || '2312122@nec.edu.in';

    const visit = {
      fullName: walkinForm.fullName.trim(),
      visitorName: walkinForm.fullName.trim(),
      email: normalizedEmail,
      phone: walkinForm.phone.trim() || '',
      purpose: walkinForm.purpose.trim() || 'Walk-in Visit',
      department: walkinForm.hostName.trim(),
      hostName: walkinForm.hostName.trim(),
      hostId: hostEmail,
      hostEmail,
      visitDate,
      visitTime,
      isUrgent: false,
      entryOTP,
      status: 'approved',
      createdBy: 'guard',
      createdAt: serverTimestamp(),
      checkIn: null,
      checkOut: null,
    };

    try {
      const registration = await addDoc(collection(db, 'registrations'), visit);
      setWalkinOtp({ ...visit, id: registration.id });
      addToast(`Walk-in registered. Entry OTP: ${entryOTP}`, 'success');

      const visitorEmailSent = await sendGuardOtpEmail(visit, entryOTP);
      if (!visitorEmailSent.success) {
        addToast('Visitor email could not be sent. Check that the email server is running.', 'warning');
      }
      const hostEmailSent = await sendGuardHostNotifyEmail(visit, entryOTP, hostEmail);
      if (!hostEmailSent.success) {
        addToast('Host notification email could not be sent. Check that the email server is running.', 'warning');
      }
      setWalkinForm({ fullName: '', phone: '', email: '', purpose: '', hostName: '', hostEmail: '' });
    } catch (error) {
      console.error('Failed to register walk-in visit:', error);
      addToast(`Could not register the walk-in: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setWalkinSubmitting(false);
    }
  };

  const handleOtpVerify = () => {
    const otp = otpInput.trim();
    if (!otp) {
      addToast('Enter the visitor OTP.', 'warning');
      return;
    }
    const today = formatLocalDate(new Date());
    const match = liveVisits.find((visit) => visit.entryOTP === otp && visit.date === today);
    if (!match) {
      addToast('No matching appointment found for this OTP.', 'error');
      setOtpVerifiedVisit(null);
      return;
    }
    if (match.checkIn) {
      setOtpVerifiedVisit(match);
      addToast(`This OTP was already checked in at ${match.checkIn}.`, 'warning');
      return;
    }
    setOtpVerifiedVisit(match);
    addToast(`OTP matched with ${match.visitorName}.`, 'success');
  };

  const handleOtpCheckIn = async () => {
    if (!otpVerifiedVisit) return;
    try {
      await updateDoc(doc(db, 'registrations', otpVerifiedVisit.id), {
        checkIn: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        badgeNumber: `B-${Math.floor(Math.random() * 100) + 1}`,
      });
      setLogs(prev => [{
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        visitor: otpVerifiedVisit.visitorName,
        action: 'Check-In',
        status: 'success'
      }, ...prev]);
      addToast(`${otpVerifiedVisit.visitorName} checked in via OTP.`, 'success');
      setOtpInput('');
      setOtpVerifiedVisit(null);
    } catch (error) {
      console.error('OTP check-in failed:', error);
      addToast(`Check-in failed: ${error.message || 'Please try again.'}`, 'error');
    }
  };

  const todayEmergency = liveVisits
    .filter((v) => v.isUrgent && v.date === formatLocalDate(new Date()) && !v.checkOut);

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
          {activeTab === 'scanner' ? 'Scan visitor QR codes to manage gate entry & exit' : 'View appointments, entry OTPs and visitor details'}
        </p>
      </div>

      {todayEmergency.length > 0 && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--danger)' }}>Emergency / Urgent Incoming</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                These visitors are expected today. Verify them with the OTP shown here.
              </p>
            </div>
            <span className="badge badge-active">{todayEmergency.length} incoming</span>
          </div>
          {todayEmergency.map(v => (
            <div key={v.id} style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{v.visitorName}</strong>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.3em', color: 'var(--danger)' }}>{v.entryOTP || '—'}</div>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Host: {v.host} ({v.dept}) · Purpose: {v.purpose}</span>
                <span>Expected: {v.time} · {v.date}</span>
                {v.email && <span>Email: {v.email}</span>}
                {v.phone && <span>Phone: {v.phone}</span>}
                {v.checkIn && <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Already checked in at {v.checkIn}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'scanner' ? (
        <>
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '8px' }}>Scan Visitor QR Code</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Use the phone's rear camera to scan the visitor's pass.
            </p>
            {showQRScanner ? (
              <>
                <div id="guard-qr-reader" style={{ maxWidth: '480px', margin: '0 auto 16px' }} />
                <button className="btn btn-secondary" onClick={() => setShowQRScanner(false)}>
                  Stop QR Scanner
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowQRScanner(true)}>
                Start QR Scanner
              </button>
            )}
          </div>

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
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Capture Visitor Photo</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Use the QR scanner above to scan visitor passes.</p>
                <button id="start-camera" className="btn btn-primary btn-sm" onClick={() => setShowCamera(true)}>
                  Capture Photo
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
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleWalkinSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" required placeholder="e.g. Rahul Nair" value={walkinForm.fullName} onChange={e => setWalkinForm(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" placeholder="+91 98765 43210" value={walkinForm.phone} onChange={e => setWalkinForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Visitor Email *</label>
              <input type="email" className="form-input" required placeholder="name@example.com" value={walkinForm.email} onChange={e => setWalkinForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Host Name / Department *</label>
              <input type="text" className="form-input" required placeholder="e.g. HR Dept" value={walkinForm.hostName} onChange={e => setWalkinForm(f => ({ ...f, hostName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Host Email</label>
              <input type="email" className="form-input" placeholder="host@company.com (defaults to primary host)" value={walkinForm.hostEmail} onChange={e => setWalkinForm(f => ({ ...f, hostEmail: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Purpose of Visit</label>
              <input type="text" className="form-input" placeholder="e.g. Delivery / Interview" value={walkinForm.purpose} onChange={e => setWalkinForm(f => ({ ...f, purpose: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={walkinSubmitting}>
              {walkinSubmitting ? 'Registering...' : 'Register & Generate OTP'}
            </button>
          </form>
          {walkinOtp && (
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '6px' }}>Entry OTP for {walkinOtp.visitorName} (emailed to the visitor & host)</p>
              <div aria-label={`Entry OTP ${walkinOtp.entryOTP}`} style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: 'var(--success)', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '0.35em' }}>
                {walkinOtp.entryOTP}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'appointments' ? (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Today's Appointments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(liveVisits.length > 0
              ? liveVisits.filter(v => v.date === formatLocalDate(new Date()))
              : Object.values(DEMO_VISITS).filter(v => v.status === 'approved')
            ).map((v, i) => (
              <div key={i} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0 }}>{v.visitorName} {v.isUrgent && <span className="badge badge-pending">EMERGENCY</span>}</h4>
                  <span className="badge badge-approved">{v.time}</span>
                </div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Host: <strong>{v.host}</strong> ({v.dept})</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Purpose: {v.purpose}</p>
                {v.email && <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email: {v.email}</p>}
                {v.phone && <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone: {v.phone}</p>}
                {v.entryOTP && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem' }}>
                    Entry OTP: <strong style={{ color: 'var(--success)', letterSpacing: '0.25em' }}>{v.entryOTP}</strong>
                    {v.checkIn && <span style={{ color: 'var(--warning)', fontWeight: 600 }}> · Checked in at {v.checkIn}</span>}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Verify Entry OTP</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 12px 0' }}>
              Ask the visitor for their OTP (e.g. a delivery boy with a 10:00 emergency appointment), enter it here and confirm check-in.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                inputMode="numeric"
                maxLength={4}
                placeholder="Enter 4-digit OTP"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value)}
              />
              <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={handleOtpVerify}>Verify</button>
            </div>
            {otpVerifiedVisit && (
              <div style={{ marginTop: '14px', padding: '14px', borderRadius: '10px', background: otpVerifiedVisit.checkIn ? 'rgba(250,204,21,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${otpVerifiedVisit.checkIn ? 'rgba(250,204,21,0.35)' : 'rgba(16,185,129,0.35)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{otpVerifiedVisit.visitorName}</strong>
                  <span style={{ fontSize: '0.75rem', color: otpVerifiedVisit.checkIn ? 'var(--text-muted)' : 'var(--success)', fontWeight: 600 }}>
                    {otpVerifiedVisit.checkIn ? `Already checked in at ${otpVerifiedVisit.checkIn}` : 'OTP valid'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Host: {otpVerifiedVisit.host} · Purpose: {otpVerifiedVisit.purpose} · {otpVerifiedVisit.time}
                </p>
                {(otpVerifiedVisit.email || otpVerifiedVisit.phone) && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {otpVerifiedVisit.email && `Email: ${otpVerifiedVisit.email}`}{otpVerifiedVisit.email && otpVerifiedVisit.phone && ' · '}{otpVerifiedVisit.phone && `Phone: ${otpVerifiedVisit.phone}`}
                  </p>
                )}
                {!otpVerifiedVisit.checkIn && (
                  <button className="btn btn-success btn-sm" style={{ marginTop: '12px' }} onClick={handleOtpCheckIn}>
                    Confirm Check-In
                  </button>
                )}
              </div>
            )}
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
