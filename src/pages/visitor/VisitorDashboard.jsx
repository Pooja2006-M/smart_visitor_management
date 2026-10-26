import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { jsPDF } from 'jspdf';
import {
  FiActivity, FiCheckCircle, FiClock, FiXCircle,
  FiDownload, FiMapPin, FiMap, FiAward, FiGrid, FiRefreshCw,
} from 'react-icons/fi';
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { createVisitQrUrl } from '../../utils/visitQr';
import { sendRescheduleRequestEmail } from '../../utils/rescheduleEmail';

// Import new feature components
import WelcomeWidget from './WelcomeWidget';
import IndoorNavigation from './IndoorNavigation';
import VisitTimeline from './VisitTimeline';
import VisitorAchievements from './VisitorAchievements';


export default function VisitorDashboard() {
  const { userProfile } = useAuth();
  const { addToast } = useToast();

  const [visits, setVisits]                               = useState([]);
  const [selectedVisit, setSelectedVisit]                 = useState(null);
  const [showQR, setShowQR]                               = useState(false);
  const [showAppointmentLetter, setShowAppointmentLetter] = useState(false);
  const [scanAnimating, setScanAnimating]                 = useState(false);
  const [showReschedule, setShowReschedule]               = useState(false);
  const [rescheduleData, setRescheduleData]               = useState({ date: '', time: '' });
  const [currentLocation, setCurrentLocation]             = useState(null);
  const [locationLoading, setLocationLoading]             = useState(false);
  const [activeTab, setActiveTab]                         = useState('dashboard');

  const letterRef = React.useRef(null);
  const passQrRef = React.useRef(null);

  const officeDestination = 'Software, Madurai';
  const directionsUrl = currentLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${encodeURIComponent(officeDestination)}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(officeDestination)}&travelmode=driving`;

  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast('Current location is not supported by this browser.', 'warning');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationLoading(false);
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${coords.latitude},${coords.longitude}&destination=${encodeURIComponent(officeDestination)}&travelmode=driving`,
          '_blank',
          'noopener,noreferrer'
        );
      },
      () => {
        setLocationLoading(false);
        addToast('Location permission is required for an exact route.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  React.useEffect(() => {
    if (!userProfile?.email) return undefined;

    const registrationsQuery = query(
      collection(db, 'registrations'),
      where('email', '==', userProfile.email)
    );
    const unsubscribe = onSnapshot(registrationsQuery, (snapshot) => {
      const registeredVisits = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          hostName: data.hostName || 'Host not assigned',
          hostEmail: data.hostEmail || (data.hostId?.includes?.('@') ? data.hostId : ''),
          department: data.department || 'General',
          visitDate: data.visitDate || '',
          visitTime: data.visitTime || '',
          purpose: data.purpose || 'General Visit',
          status: data.status || 'pending',
          rescheduleRequest: data.rescheduleRequest || null,
          approvedByName: data.approvedByName || '',
          qrData: createVisitQrUrl(item.id),
          vehicle: data.vehicleNumber || 'None',
          isUrgent: data.isUrgent || false,
          entryOTP: data.entryOTP || null,
        };
      });

      setVisits(registeredVisits);
    }, () => {
      addToast('Unable to sync your latest visit requests.', 'warning');
    });

    return () => unsubscribe();
  }, [userProfile?.email, addToast]);

  const stats = [
    { icon: <FiActivity />,   label: 'Total Visits', value: visits.length,                                       color: '#3b82f6' },
    { icon: <FiCheckCircle />, label: 'Approved',     value: visits.filter(v => v.status === 'approved').length,  color: '#10b981' },
    { icon: <FiClock />,       label: 'Pending',      value: visits.filter(v => v.status === 'pending').length,   color: '#f59e0b' },
    { icon: <FiXCircle />,     label: 'Rejected',     value: visits.filter(v => v.status === 'rejected').length,  color: '#ef4444' },
  ];

  // Tab definitions
  const tabs = [
    { id: 'dashboard',    icon: <FiGrid />,     label: 'Dashboard' },
    { id: 'timeline',     icon: <FiActivity />, label: 'Timeline' },
    { id: 'navigation',   icon: <FiMap />,      label: 'Navigate' },
    { id: 'achievements', icon: <FiAward />,    label: 'Achievements' },
  ];

  // ── QR Scan simulation ────────────────────────────────────────────────────
  const handleSimulateScan = () => {
    setScanAnimating(true);
    setTimeout(() => {
      setScanAnimating(false);
      setShowQR(false);
      setShowAppointmentLetter(true);
    }, 2000);
  };

  // ── Print appointment letter ──────────────────────────────────────────────
  const handlePrintLetter = () => {
    const content = letterRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Appointment Letter</title>
      <style>body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a2e; } @media print { body { margin: 0; } }</style>
      </head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ── Reschedule ────────────────────────────────────────────────────────────
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleData.date || !rescheduleData.time) return;
    if (selectedVisit.rescheduleRequest?.status === 'pending') {
      addToast('A reschedule request is already waiting for host review.', 'warning');
      return;
    }

    try {
      await updateDoc(doc(db, 'registrations', selectedVisit.id), {
        rescheduleRequest: {
          date: rescheduleData.date,
          time: rescheduleData.time,
          status: 'pending',
          requestedAt: serverTimestamp(),
          requestedBy: userProfile?.email || '',
        },
      });
      try {
        await sendRescheduleRequestEmail(
          { ...selectedVisit, visitorName: userProfile?.name || 'Visitor' },
          rescheduleData
        );
        addToast('Reschedule request sent to the host by email. Your current schedule stays unchanged until approval.', 'success');
      } catch (emailError) {
        console.error('Reschedule request saved, but host email failed:', emailError);
        const reason = emailError?.text || emailError?.message || 'Unknown EmailJS error';
        addToast(`Request saved, but the host email failed: ${reason}`, 'warning');
      }
      setShowReschedule(false);
    } catch (error) {
      console.error('Unable to submit reschedule request:', error);
      addToast('Could not send the reschedule request. Please check your connection and try again.', 'error');
    }
  };

  // ── PDF Visitor Pass ──────────────────────────────────────────────────────
  const generatePDFPass = (visit) => {
    const doc = new jsPDF({ format: [100, 150] });
    doc.setDrawColor(37, 99, 235);
    doc.rect(2, 2, 96, 146);
    doc.setFillColor(37, 99, 235);
    doc.rect(2, 2, 96, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('VISITOR PASS', 50, 15, { align: 'center' });
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.text(visit.hostName, 10, 40);
    doc.setFontSize(10);
    doc.text(`ID: #${visit.id}`,          10, 52);
    doc.text(`Dept: ${visit.department}`, 10, 62);
    doc.text(`Purpose: ${visit.purpose}`, 10, 72);
    doc.text(`Date: ${visit.visitDate}`,  10, 82);
    doc.text(`Time: ${visit.visitTime}`,  10, 92);
    const qrCanvas = passQrRef.current;
    if (qrCanvas) {
      doc.addImage(qrCanvas.toDataURL('image/png'), 'PNG', 28, 98, 44, 44);
      doc.setFontSize(7);
      doc.text('Scan at the security gate', 50, 145, { align: 'center' });
    }
    doc.save(`Pass_${visit.id}.pdf`);
    addToast('PDF downloaded successfully.', 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">

        {/* Welcome Widget — Always visible at top */}
        <WelcomeWidget
          visits={visits}
          userName={userProfile?.name?.split(' ')[0] || 'Visitor'}
        />

        {/* Tab Navigation Bar */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '5px',
          marginBottom: '24px',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.52)',
          backdropFilter: 'blur(12px)',
          overflowX: 'auto',
          width: 'max-content',
          maxWidth: '100%',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                border: 'none',
                background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                borderRadius: '10px',
                padding: '9px 14px',
                color: activeTab === tab.id ? 'var(--accent-1)' : 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                fontWeight: activeTab === tab.id ? 700 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                transition: 'var(--transition)',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Dashboard Tab ═══ */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats */}
            <div className="stats-grid">
              {stats.map(s => (
                <div key={s.label} className="glass-card stat-card">
                  <div className="stat-icon">
                    <span style={{ fontSize: '1.3rem', color: '#6B7280' }}>{s.icon}</span>
                  </div>
                  <div className="stat-value" style={{ color: '#111827' }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Visits Table */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>My Visit Requests</h3>
              <div className="table-wrapper">
                <table className="visit-request-table">
                  <thead>
                    <tr>
                      <th style={{ width: '8%' }}>Visit ID</th>
                      <th style={{ width: '12%' }}>Host</th>
                      <th style={{ width: '16%' }}>Department</th>
                      <th style={{ width: '20%' }}>Date &amp; Time</th>
                      <th style={{ width: '18%' }}>Purpose</th>
                      <th style={{ width: '26%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                          No visit requests found for your account.
                        </td>
                      </tr>
                    ) : visits.map((v, index) => (
                      <tr key={v.id}>
                        <td className="visit-id-cell">{index + 1}</td>
                        <td className="visit-name-cell">{v.hostName}</td>
                        <td className="visit-dept-cell">{v.department}</td>
                        <td className="visit-date-cell">
                          <div className="visit-date-content">
                            <span>{v.visitDate}</span>
                            {v.visitTime && <span>{v.visitTime}</span>}
                          </div>
                        </td>
                        <td className="visit-purpose-cell">{v.purpose || 'Client Visit'}</td>
                        <td className="visit-action-cell">
                          <div className="visit-actions">
                            <button className="btn btn-primary btn-sm" onClick={() => { setSelectedVisit(v); setShowQR(true); }}>
                              <FiGrid aria-hidden="true" /> View QR
                            </button>
                            {(v.status === 'pending' || v.status === 'approved') && (
                              v.rescheduleRequest?.status === 'pending'
                                ? <span style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>Reschedule pending</span>
                                : <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedVisit(v); setRescheduleData({ date: v.visitDate, time: v.visitTime }); setShowReschedule(true); }}>
                                  <FiRefreshCw aria-hidden="true" /> Reschedule
                                </button>
                            )}
                            {v.rescheduleRequest?.status === 'rejected' && (
                              <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Reschedule declined</span>
                            )}
                            {v.status === 'approved' && (
                              <button className="btn btn-secondary btn-sm map-button" onClick={captureCurrentLocation} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FiMapPin /> {locationLoading ? 'Loading...' : 'Map'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══ Timeline Tab ═══ */}
        {activeTab === 'timeline' && (
          <VisitTimeline visits={visits} />
        )}

        {/* ═══ Navigation Tab ═══ */}
        {activeTab === 'navigation' && (
          <IndoorNavigation />
        )}

        {/* ═══ Achievements Tab ═══ */}
        {activeTab === 'achievements' && (
          <VisitorAchievements visits={visits} />
        )}

      </main>

      {/* QR Code Modal */}
      {showQR && selectedVisit && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Entry QR Code</h3>
              <button className="host-icon-button" onClick={() => setShowQR(false)}><FiXCircle /></button>
            </div>
            <div style={{ textAlign: 'center' }}>
              {selectedVisit.isUrgent && selectedVisit.entryOTP && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '2px dashed #ef4444', 
                  borderRadius: '12px', 
                  padding: '16px',
                  marginBottom: '16px',
                  animation: 'pulseDanger 2s infinite'
                }}>
                  <h4 style={{ color: '#ef4444', margin: '0 0 8px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    URGENT ACCESS PASS
                  </h4>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '6px', color: '#ef4444' }}>
                    {selectedVisit.entryOTP}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#ef4444', margin: '8px 0 0 0', fontWeight: '500' }}>
                    Tell the Guard this OTP for instant entry
                  </p>
                  <style>{`
                    @keyframes pulseDanger {
                      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                      70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                    }
                  `}</style>
                </div>
              )}
              <div style={{ position: 'relative', display: 'inline-block', margin: '12px auto' }}>
                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block' }}>
                  <QRCodeCanvas ref={passQrRef} value={selectedVisit.qrData} size={256} level="H" includeMargin />
                </div>
                {scanAnimating && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,99,235,0.18)', borderRadius: '12px', zIndex: 10 }}>
                    <div style={{ width: '180px', height: '4px', background: 'linear-gradient(90deg, transparent, #2563eb, transparent)', animation: 'scanLine 1s linear infinite', borderRadius: '2px' }} />
                    <p style={{ color: '#2563eb', fontWeight: 700, marginTop: '16px' }}>Scanning...</p>
                  </div>
                )}
              </div>
              <p style={{ marginBottom: '16px' }}>Show this to the guard at the entrance gate.</p>
              {!import.meta.env.VITE_PUBLIC_APP_URL && ['localhost', '127.0.0.1'].includes(window.location.hostname) && (
                <p style={{ color: 'var(--warning)', fontSize: '0.85rem', margin: '0 0 16px' }}>
                  For same-Wi-Fi phone testing, open this app on your computer using its network address (not localhost), then generate a new QR code. For scanning outside your Wi-Fi, deploy the app and set VITE_PUBLIC_APP_URL.
                </p>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => generatePDFPass(selectedVisit)}>
                  <FiDownload /> Download Digital Pass
                </button>
                <button className="btn btn-primary" onClick={handleSimulateScan} disabled={scanAnimating}>
                  {scanAnimating ? 'Scanning QR...' : 'Simulate QR Scan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Letter Modal */}
      {showAppointmentLetter && selectedVisit && (
        <div className="modal-overlay" onClick={() => setShowAppointmentLetter(false)}>
          <div className="modal" style={{ maxWidth: '580px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: 0, borderRadius: '18px', boxShadow: '0 25px 60px rgba(37,99,235,0.25)' }} onClick={e => e.stopPropagation()}>
            <div ref={letterRef}>
              {/* Letter Header */}
              <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', padding: '28px 32px 20px', borderRadius: '18px 18px 0 0', position: 'relative' }}>
                <button className="host-icon-button" onClick={() => setShowAppointmentLetter(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <FiXCircle />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCheckCircle style={{ color: 'white', fontSize: '1.8rem' }} /></div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Scan Successful</div>
                    <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0' }}>Appointment Confirmed</h2>
                  </div>
                </div>
                <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>Confirmation No.</span>
                  <span style={{ color: 'white', fontWeight: 800, letterSpacing: '1.5px', fontSize: '1rem' }}>APT-{selectedVisit.id}-{new Date().getFullYear()}</span>
                </div>
              </div>

              {/* Letter Body */}
              <div style={{ padding: '28px 32px', background: 'white', borderRadius: '0 0 18px 18px' }}>
                <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '22px', fontSize: '0.95rem' }}>
                  Dear <strong style={{ color: '#1e3a5f' }}>{userProfile?.name || 'Visitor'}</strong>,<br />
                  Your appointment has been <strong style={{ color: '#16a34a' }}>verified and confirmed</strong> at the entrance gate via QR scan. Please find your appointment details below.
                </p>

                {/* Details */}
                <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '22px' }}>
                  {[
                    { label: 'Host Name',   value: selectedVisit.hostName },
                    { label: 'Department',  value: selectedVisit.department },
                    { label: 'Purpose',     value: selectedVisit.purpose },
                    { label: 'Visit Date',  value: selectedVisit.visitDate },
                    { label: 'Visit Time',  value: selectedVisit.visitTime || 'As Scheduled' },
                    { label: 'Vehicle',     value: selectedVisit.vehicle || 'N/A' },
                    { label: 'Visit ID',    value: `#${selectedVisit.id}` },
                    { label: 'Status',      value: <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem' }}>APPROVED &amp; SCANNED</span> },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', background: i % 2 === 0 ? '#f9fafb' : 'white', borderBottom: i < 7 ? '1px solid #f3f4f6' : 'none' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.88rem' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Scan Time */}
                <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                  <FiClock style={{ color: '#2563eb', fontSize: '1.1rem', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>QR SCANNED AT</div>
                    <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.92rem' }}>
                      {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}&nbsp;•&nbsp;
                      {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>

                <p style={{ color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '20px', textAlign: 'center', borderTop: '1px dashed #e5e7eb', paddingTop: '16px' }}>
                  This letter serves as your official entry confirmation. Please carry this during your visit.<br />
                  For assistance, contact Reception: <strong>+91 98765 43210</strong>
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={handlePrintLetter} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}>
                    <FiDownload /> Print / Download Letter
                  </button>
                  <button onClick={() => setShowAppointmentLetter(false)} className="btn btn-secondary" style={{ padding: '10px 22px' }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showReschedule && selectedVisit && (
        <div className="modal-overlay" onClick={() => setShowReschedule(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reschedule Visit</h3>
              <button className="host-icon-button" onClick={() => setShowReschedule(false)}><FiXCircle /></button>
            </div>
            <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">New Date</label>
                <input type="date" className="form-input" required value={rescheduleData.date} onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">New Time</label>
                <input type="time" className="form-input" required value={rescheduleData.time} onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })} />
              </div>
              <button type="submit" className="host-new-button">Request Reschedule</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(-80px); }
          100% { transform: translateY(80px); }
        }
      `}</style>
    </div>
  );
}
