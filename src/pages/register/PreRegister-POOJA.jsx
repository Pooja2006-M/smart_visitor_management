import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';

const DEPARTMENTS = [
  'Human Resources', 'Engineering', 'Finance', 'Marketing',
  'Operations', 'IT Support', 'Legal', 'Sales', 'Administration'
];

const COMPANY_NAME = 'Chella Software';

const PURPOSES = [
  'Interview', 'Official Meeting', 'Document Submission', 'Client Visit',
  'Vendor Meeting', 'Delivery', 'Maintenance', 'Personal Visit', 'Other'
];

// All visitor pre-registration requests are routed to the designated host.
const PRIMARY_HOST_EMAIL = '2312122@nec.edu.in';

const parseTimeToMinutes = (timeValue = '') => {
  const raw = String(timeValue).trim();
  if (!raw) return null;
  if (/AM|PM/i.test(raw)) {
    const [clock, modifier] = raw.split(/\s+/);
    let [hours, minutes] = clock.split(':').map(Number);
    if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
  }
  const [hours, minutes] = raw.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const t = {
  title: 'Visitor Pre-Registration',
  subtitle: 'Register your visit in advance for a seamless check-in experience',
  personalInfo: 'Personal Information',
  visitDetails: 'Visit Details',
  fullName: 'Full Name *',
  email: 'Email Address *',
  phone: 'Phone Number *',
  company: 'Company / Organization',
  submit: 'Submit Registration'
};

export default function PreRegister() {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', company: COMPANY_NAME,
    department: '', hostId: '', hostName: '',
    purpose: '', customPurpose: '',
    visitDate: '', visitTime: '',
    isUrgent: false,
  });
  const [hosts, setHosts] = useState([]);
  const [bookedVisits, setBookedVisits] = useState([]);
  const [slotCapacity, setSlotCapacity] = useState(2);
  const [slotDuration, setSlotDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [settings, setSettings] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [visitorLocation, setVisitorLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('host-availability-config') || 'null');
      setSlotCapacity(Number(saved?.maxVisitorsPerSlot) || 2);
      setSlotDuration(Number(saved?.slotDuration) || 30);
    } catch {
      setSlotCapacity(2);
      setSlotDuration(30);
    }

    const unsubscribe = onSnapshot(collection(db, 'registrations'), (snapshot) => {
      setBookedVisits(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
    }, () => addToast('Unable to load live slot availability.', 'warning'));
    return () => unsubscribe();
  }, [addToast]);

  const selectedSlotCount = form.hostId && form.visitDate && form.visitTime
    ? bookedVisits.filter((visit) => {
      if (visit.hostId !== form.hostId || visit.visitDate !== form.visitDate) return false;
      if (!['pending', 'approved'].includes(visit.status || 'pending')) return false;
      const requestedStart = parseTimeToMinutes(form.visitTime);
      const bookedStart = parseTimeToMinutes(visit.visitTime);
      return requestedStart !== null && bookedStart !== null
        && requestedStart < bookedStart + slotDuration
        && bookedStart < requestedStart + slotDuration;
    }).length
    : 0;
  const remainingSlots = Math.max(slotCapacity - selectedSlotCount, 0);

  const hostsWithCompany = hosts.filter(host => host.company || host.companyName || host.organization);
  const matchingHosts = hosts.filter((host) => {
    const hostCompany = String(host.company || host.companyName || host.organization || '').trim().toLowerCase();

    // A visitor should always be able to select a registered host by name/email.
    // When a company is selected, hosts from that company are shown first; hosts
    // without a company assignment remain selectable until their profile is completed.
    return !form.company.trim() || !hostCompany || hostCompany === form.company.trim().toLowerCase();
  }).sort((a, b) => {
    if (!form.company.trim()) return 0;
    const selectedCompany = form.company.trim().toLowerCase();
    const aMatches = String(a.company || a.companyName || a.organization || '').trim().toLowerCase() === selectedCompany;
    const bMatches = String(b.company || b.companyName || b.organization || '').trim().toLowerCase() === selectedCompany;
    return Number(bMatches) - Number(aMatches);
  });

  // Fetch host employees
  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'host'));
        const snap = await getDocs(q);
        const hostList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHosts(hostList);
      } catch (e) {
        console.error('Error fetching hosts:', e);
      }
    };
    fetchHosts();

    const saved = localStorage.getItem('visitoriq-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    const savedFavs = localStorage.getItem('visitoriq-favorites');
    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => name === 'company'
      ? { ...prev, company: value, hostId: '', hostName: '' }
      : { ...prev, [name]: value });
    // Clear error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleHostChange = (e) => {
    const hostId = e.target.value;
    const host = hosts.find(h => h.uid === hostId);
    setForm(prev => ({
      ...prev,
      hostId,
      hostName: host ? host.name : ''
    }));
    if (errors.hostId) setErrors(prev => ({ ...prev, hostId: '' }));
  };

  const captureLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported by this browser.'));
      return;
    }

    setLocationLoading(true);
    setLocationStatus('Requesting your current location...');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = {
          latitude: Number(coords.latitude.toFixed(7)),
          longitude: Number(coords.longitude.toFixed(7)),
          accuracy: Math.round(coords.accuracy),
        };
        setVisitorLocation(location);
        setLocationStatus(`Location captured (accuracy ${location.accuracy}m)`);
        setLocationLoading(false);
        setErrors(prev => ({ ...prev, location: '' }));
        resolve(location);
      },
      (error) => {
        setLocationLoading(false);
        setLocationStatus(error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied.'
          : 'Unable to read your current location.');
        reject(new Error('Unable to capture current location.'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  const handleLocationClick = async () => {
    try {
      await captureLocation();
    } catch (error) {
      addToast(error.message, 'warning');
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email is required';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Valid 10-digit phone number required';
    if (!form.department) errs.department = 'Please select a department';
    if (!form.company.trim()) errs.company = 'Company or organization is required';
    if (!form.hostId) errs.hostId = 'Please select a host';
    if (!form.purpose) errs.purpose = 'Please select a purpose';
    if (form.purpose === 'Other' && !form.customPurpose.trim()) errs.customPurpose = 'Please specify the purpose';
    if (!form.visitDate) errs.visitDate = 'Please select a visit date';
    if (!form.visitTime) errs.visitTime = 'Please select a visit time';

    // Date must be today or future
    if (form.visitDate && new Date(form.visitDate) < new Date(new Date().toDateString())) {
      errs.visitDate = 'Visit date cannot be in the past';
    }

    // Settings validations
    if (settings && form.visitDate) {
      if (settings.holidays.includes(form.visitDate)) {
        errs.visitDate = 'Selected date is a holiday. Office is closed.';
      }
    }
    if (settings && form.visitTime) {
      if (form.visitTime < settings.workStart || form.visitTime > settings.workEnd) {
        errs.visitTime = `Visiting hours are ${settings.workStart} to ${settings.workEnd}`;
      }
    }
    if (form.hostId && form.visitDate && form.visitTime && remainingSlots <= 0) {
      errs.visitTime = 'This slot is full. Please choose another time.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please fix the errors in the form.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      let capturedLocation = visitorLocation;
      if (!capturedLocation) {
        try {
          capturedLocation = await captureLocation();
        } catch {
          addToast('Location was not shared. Your visit request will still be submitted.', 'info');
        }
      }
      const finalPurpose = form.purpose === 'Other' ? form.customPurpose : form.purpose;
      
      const selectedHost = hosts.find(h => h.uid === form.hostId) || { email: PRIMARY_HOST_EMAIL };
      const hostEmailToUse = selectedHost.email;

      await addDoc(collection(db, 'registrations'), {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        company: form.company,
        department: form.department,
        hostId: form.hostId || PRIMARY_HOST_EMAIL,
        hostName: form.hostName || PRIMARY_HOST_EMAIL,
        hostEmail: hostEmailToUse,
        purpose: finalPurpose,
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        visitorLocation: capturedLocation || null,
        locationCapturedAt: capturedLocation ? serverTimestamp() : null,
        isUrgent: form.isUrgent,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      addToast('Registration submitted for approval.', 'success');

      // Save to favorites
      if (form.hostId) {
        const newFav = { id: form.hostId, name: form.hostName };
        const updatedFavs = [newFav, ...favorites.filter(f => f.id !== form.hostId)].slice(0, 3);
        setFavorites(updatedFavs);
        localStorage.setItem('visitoriq-favorites', JSON.stringify(updatedFavs));
      }

      setSubmitted(true);
      addToast('You will be notified once the visit is approved.', 'info');
    } catch (err) {
      console.error(err);
      addToast(`Failed to submit registration: ${err.message || 'Please try again.'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  if (settings && settings.maintenanceMode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>Maintenance</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>System Under Maintenance</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            We are currently upgrading our systems to serve you better. Pre-registration is temporarily disabled. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', padding: '24px'
      }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', margin: '0 auto 24px',
            animation: 'fadeInUp 0.6s ease'
          }}>OK</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
            Registration Submitted!
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '8px' }}>
            Your visit request has been sent to <strong style={{ color: 'var(--text-primary)' }}>{form.hostName || 'the host'}</strong> 
            {' '}in the <strong style={{ color: 'var(--text-primary)' }}>{form.department}</strong> department.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '32px' }}>
            You'll receive an email notification once your request is approved or rejected. 
            Please carry a valid ID proof for verification at entry.
          </p>

          <div style={{
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px', textAlign: 'left'
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>VISIT DETAILS</p>
            <div style={{ display: 'grid', gap: '6px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{form.visitDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Time</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{form.visitTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span className="badge badge-pending">PENDING APPROVAL</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => {
              setSubmitted(false);
              setCompanyMode('');
              setVisitorLocation(null);
              setLocationStatus('');
              setForm({
                fullName: '', email: '', phone: '', company: COMPANY_NAME,
                department: '', hostId: '', hostName: '',
                purpose: '', customPurpose: '',
                visitDate: '', visitTime: '',
                department: '', hostId: '', hostName: '',
                purpose: '', customPurpose: '', visitDate: '', visitTime: '', isUrgent: false,
                company: COMPANY_NAME, fullName: '', email: '', phone: ''
              });
            }}>
              + Register Another Visit
            </button>
            <Link to="/login" className="btn btn-secondary">
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      padding: '32px 24px',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px', background: 'var(--gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', margin: '0 auto 16px'
          }}>V</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {t.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
            {t.subtitle}
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px'
        }}>
          {['Personal Info', 'Visit Details'].map((step, i) => (
            <div key={step} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-1)'
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-1)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700
              }}>{i + 1}</span>
              {step}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Personal Info */}
          <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t.personalInfo}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">{t.fullName}</label>
                <input
                  id="reg-fullname"
                  className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                  name="fullName" value={form.fullName} onChange={handleChange}
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">{t.email}</label>
                <input
                  id="reg-email"
                  type="email" className={`form-input ${errors.email ? 'input-error' : ''}`}
                  name="email" value={form.email} onChange={handleChange}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">{t.phone}</label>
                <input
                  id="reg-phone"
                  type="tel" className={`form-input ${errors.phone ? 'input-error' : ''}`}
                  name="phone" value={form.phone} onChange={handleChange}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">{t.company}</label>
                <input id="reg-company-select" className="form-input" value={COMPANY_NAME} readOnly aria-label="Company" />
                {errors.company && <span className="error-text">{errors.company}</span>}
              </div>
              
              {/* Urgent Toggle */}
              <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: form.isUrgent ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: form.isUrgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)', transition: 'all 0.3s ease' }}>
                  <input
                    type="checkbox"
                    name="isUrgent"
                    checked={form.isUrgent}
                    onChange={(e) => setForm(prev => ({ ...prev, isUrgent: e.target.checked }))}
                    style={{ width: '20px', height: '20px', accentColor: '#ef4444' }}
                  />
                  <div>
                    <span style={{ fontWeight: 'bold', color: form.isUrgent ? '#ef4444' : 'var(--text-primary)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {form.isUrgent ? 'URGENT WALK-IN' : 'Mark as Urgent Walk-in?'}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Check this box if you are already at the reception or need an immediate sudden meeting.
                    </span>
                  </div>
                </label>
              </div>

            </div>
          </div>

          {/* Section 2: Visit Details */}
          <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t.visitDetails}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select
                  id="reg-department"
                  className={`form-select ${errors.department ? 'input-error' : ''}`}
                  name="department" value={form.department} onChange={handleChange}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <span className="error-text">{errors.department}</span>}
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Host Employee *</label>
                  {favorites.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {favorites.map(f => (
                        <button
                          key={f.id}
                          type="button"
                          className="btn btn-sm"
                          style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--accent-1)', color: 'white', border: 'none' }}
                          onClick={() => {
                            setForm(p => ({ ...p, hostId: f.id, hostName: f.name }));
                          }}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select
                  id="reg-host"
                  className="form-select"
                  value={form.hostId} onChange={handleHostChange}
                >
                  <option value="">Select host</option>
                  {matchingHosts.map(h => (
                    <option key={h.uid} value={h.uid}>{h.name} — {h.email}</option>
                  ))}
                </select>
                {form.company && hostsWithCompany.length > 0 && matchingHosts.length === 0 && (
                  <span className="error-text">No host is assigned to this company yet.</span>
                )}
                {errors.hostId && <span className="error-text">{errors.hostId}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Purpose of Visit *</label>
                <select
                  id="reg-purpose"
                  className={`form-select ${errors.purpose ? 'input-error' : ''}`}
                  name="purpose" value={form.purpose} onChange={handleChange}
                >
                  <option value="">Select Purpose</option>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.purpose && <span className="error-text">{errors.purpose}</span>}
              </div>
              {form.purpose === 'Other' && (
                <div className="form-group">
                  <label className="form-label">Specify Purpose *</label>
                  <input
                    className={`form-input ${errors.customPurpose ? 'input-error' : ''}`}
                    name="customPurpose" value={form.customPurpose} onChange={handleChange}
                    placeholder="Describe the purpose"
                  />
                  {errors.customPurpose && <span className="error-text">{errors.customPurpose}</span>}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Visit Date *</label>
                <input
                  id="reg-date"
                  type="date" className={`form-input ${errors.visitDate ? 'input-error' : ''}`}
                  name="visitDate" value={form.visitDate} onChange={handleChange}
                  min={today}
                />
                {errors.visitDate && <span className="error-text">{errors.visitDate}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Visit Time *</label>
                <input
                  id="reg-time"
                  type="time" className={`form-input ${errors.visitTime ? 'input-error' : ''}`}
                  name="visitTime" value={form.visitTime} onChange={handleChange}
                />
                {form.hostId && form.visitDate && form.visitTime && (
                  <span style={{
                    display: 'block', marginTop: '6px', fontSize: '0.78rem', fontWeight: 600,
                    color: remainingSlots > 0 ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {remainingSlots > 0
                      ? `${remainingSlots} spot${remainingSlots === 1 ? '' : 's'} left of ${slotCapacity}`
                      : `Slot full (${slotCapacity}/${slotCapacity} spots booked)`}
                  </span>
                )}
                {errors.visitTime && <span className="error-text">{errors.visitTime}</span>}
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Current Location *</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleLocationClick}
                    disabled={locationLoading}
                  >
                    {locationLoading ? 'Getting location...' : visitorLocation ? 'Location Set' : 'Use Current Location'}
                  </button>
                  {visitorLocation && (
                    <>
                      <input
                        className="form-input"
                        value={`${visitorLocation.latitude}, ${visitorLocation.longitude}`}
                        readOnly
                        aria-label="Captured current location"
                        style={{ flex: '1 1 230px', minWidth: '230px' }}
                      />
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${visitorLocation.latitude},${visitorLocation.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--accent-1)', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        Open in Google Maps
                      </a>
                    </>
                  )}
                </div>
                {visitorLocation && (
                  <div style={{ marginTop: '14px', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', height: '220px' }}>
                    <iframe
                      title="Route from current location to selected company"
                      src={`https://maps.google.com/maps?saddr=${visitorLocation.latitude},${visitorLocation.longitude}&daddr=${encodeURIComponent(`${form.company || 'Chella Software'}, Kovilpatti, Tamil Nadu, India`)}&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0, display: 'block' }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
                {visitorLocation && form.company && (
                  <p style={{ color: 'var(--accent-1)', fontSize: '0.8rem', marginTop: '8px', fontWeight: 600 }}>
                    Route preview: your current location to {form.company}
                  </p>
                )}
                <p style={{ color: errors.location ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.78rem', marginTop: '8px' }}>
                  {errors.location || locationStatus || 'Location is used to help staff track your visit safely.'}
                </p>
              </div>
            </div>
          </div>

          {/* Terms & Submit */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>Info</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                By submitting this form, you agree to share your personal information with the host organization 
                for the purpose of this visit. Your data will be handled as per the organization's privacy policy.
                Please carry a valid ID proof for verification at the gate.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                id="reg-submit"
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
                disabled={submitting}
              >
                {submitting ? (
                  <><span className="animate-spin">⟳</span> Submitting...</>
                ) : (
                  'Submit Registration'
                )}
              </button>
              <Link to="/" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                Cancel
              </Link>
            </div>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--accent-1)', fontWeight: 600 }}>Sign in to track your visit →</Link>
        </p>
      </div>
    </div>
  );
}
