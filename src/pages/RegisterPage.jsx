import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { checkBlacklist } from '../firebase/firestore';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [faceVerified, setFaceVerified] = useState(null); // null | 'verified' | 'failed' | 'pending'
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', branch: 'Chennai HQ',
    company: '',
    role: 'visitor', visitorType: 'Guest', purpose: '', hostName: '', department: '',
    visitDate: '', visitTime: '', vehicleNo: '', vehicleType: 'None',
    idType: '', idNumber: '', ndaAgreed: false,
    selfieFile: null, idFile: null, selfiePreview: '', idPreview: ''
  });
  const selfieRef = useRef();
  const idRef = useRef();
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const speakText = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!voiceEnabled) {
      window.speechSynthesis?.cancel();
      return;
    }

    const stepPrompts = {
      1: 'Personal information step. Please enter your location, account type, full name, email, phone number, and password.',
      2: 'Visit details step. Please choose your visitor type, purpose, host name, department, date, time, and vehicle details.',
      3: 'Identity step. Please select your ID type, enter ID number, and upload your ID document.',
      4: 'Face verification step. Please upload your selfie and run face verification.',
      5: 'Final step. Please read and agree to the NDA and safety rules before submitting your registration.'
    };

    speakText(stepPrompts[step] || 'Please complete the registration form.');

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [step, voiceEnabled]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, [field]: file, [`${field.replace('File', 'Preview')}`]: preview }));
  };

  const simulateOCR = async () => {
    if (!form.idFile) {
      addToast('Please upload an ID document first.', 'warning');
      return;
    }
    addToast('Scanning ID document...', 'info');
    await new Promise(r => setTimeout(r, 1500));
    setForm(prev => ({
      ...prev,
      idNumber: 'ABC-1234-' + Math.floor(Math.random() * 9999),
      name: prev.name || 'Extracted Name',
    }));
    addToast('Details extracted successfully from ID.', 'success');
  };

  // Simulate face verification (replace with face-api.js in production)
  const simulateFaceVerify = async () => {
    if (!form.selfieFile || !form.idFile) {
      addToast('Please upload both selfie and ID photo first.', 'warning');
      return;
    }
    setFaceVerified('pending');
    addToast('Analyzing faces...', 'info');
    await new Promise(r => setTimeout(r, 2500)); // Simulate AI processing
    const score = Math.random();
    if (score > 0.3) {
      setFaceVerified('verified');
      addToast('Face verification passed. (93% match)', 'success');
    } else {
      setFaceVerified('failed');
      addToast('Face match failed. Please try again with a clearer selfie.', 'error');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Check blacklist
      const isBlacklisted = await checkBlacklist(form.email, form.phone);
      if (isBlacklisted) {
        addToast('Registration denied. Your account has been restricted. Contact admin.', 'error');
        setLoading(false);
        return;
      }

      // 2. Create Firebase Auth user + Firestore profile
      await register(form.email, form.password, form.name, form.role || 'visitor', {
        phone: form.phone,
        branch: form.branch,
        company: form.company,
        visitorType: form.visitorType,
        vehicleNo: form.vehicleNo,
        vehicleType: form.vehicleType,
        faceVerified: faceVerified === 'verified',
        idType: form.idType,
        idNumber: form.idNumber,
        ndaAgreed: form.ndaAgreed,
      });

      const registeredRole = form.role || 'visitor';
      const roleRoutes = {
        visitor: '/visitor/dashboard',
        student: '/student/dashboard',
        host: '/host/dashboard',
        guard: '/guard/scan',
        admin: '/admin/dashboard',
        employee: '/employee/dashboard',
      };

      addToast('Registration successful! Your visit request is pending approval.', 'success');
      navigate(roleRoutes[registeredRole] || '/visitor/dashboard');
    } catch (err) {
      addToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ['Personal Info', 'Visit Details', 'ID Verification', 'Face Verify', 'NDA & Safety'];

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)', padding: '32px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
    }}>
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(255,141,161,0.2) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '560px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2>Pre-Register Your Visit</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
            Step {step} of 5 — {stepTitles[step - 1]}
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setVoiceEnabled(prev => !prev);
              if (!voiceEnabled) {
                speakText('Voice guide enabled. Please continue with the registration form.');
              }
            }}
            style={{ marginTop: '12px', justifyContent: 'center' }}
          >
            {voiceEnabled ? 'Voice guide on' : 'Voice guide off'}
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ background: 'var(--border)', borderRadius: 'var(--radius-full)', height: '4px', marginBottom: '32px' }}>
          <div style={{
            height: '100%', borderRadius: 'var(--radius-full)',
            background: 'var(--gradient)', width: `${(step / 5) * 100}%`,
            transition: 'var(--transition-slow)'
          }} />
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>
          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Location / Branch</label>
                <select id="reg-branch" name="branch" className="form-select" value={form.branch} onChange={handleChange}>
                  <option>Chennai HQ</option>
                  <option>Bangalore R&D</option>
                  <option>Mumbai Office</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <select id="reg-role" name="role" className="form-select" value={form.role} onChange={handleChange}>
                  <option value="visitor">Visitor</option>
                  <option value="student">Student</option>
                  <option value="employee">Employee</option>
                  <option value="host">Host</option>
                </select>
              </div>
              {(form.role === 'employee' || form.role === 'host') && (
                <div className="form-group">
                  <label className="form-label">Company / Organization</label>
                  <input
                    id="reg-company"
                    name="company"
                    className="form-input"
                    list="company-options"
                    placeholder="Select or type your company"
                    value={form.company}
                    onChange={handleChange}
                    required
                  />
                  <datalist id="company-options">
                    {['Chella Software', 'Avasoft', 'VVDN Technologies', 'Fresa Technologies', 'SystimaNX', 'Speqto Technologies', 'Tech Mahindra', 'Cognizant', 'Capgemini', 'LTIMindtree', 'Mphasis', 'Hexaware', 'UST', 'Persistent Systems', 'Sonata Software', 'CGI', 'TCS', 'Infosys', 'Wipro', 'HCLTech', 'Accenture', 'IBM', 'Oracle', 'Zoho', 'Freshworks'].map(company => (
                      <option key={company} value={company} />
                    ))}
                  </datalist>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input id="reg-name" name="name" type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input id="reg-email" name="email" type="email" className="form-input" placeholder="john@email.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input id="reg-phone" name="phone" type="tel" className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Create Password</label>
                <input id="reg-password" name="password" type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
              </div>
            </div>
          )}

          {/* ── Step 2: Visit Details ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Visitor Type</label>
                  <select id="reg-visitor-type" name="visitorType" className="form-select" value={form.visitorType} onChange={handleChange}>
                    <option>Guest</option>
                    <option>Interviewee</option>
                    <option>Contractor</option>
                    <option>Vendor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Purpose of Visit</label>
                  <select id="reg-purpose" name="purpose" className="form-select" value={form.purpose} onChange={handleChange}>
                    <option value="">Select purpose...</option>
                    <option>Official Meeting</option>
                    <option>Interview</option>
                    <option>Delivery</option>
                    <option>Personal</option>
                    <option>Maintenance</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Host Name (Person you're meeting)</label>
                <input id="reg-host" name="hostName" type="text" className="form-input" placeholder="Dr. Priya Sharma" value={form.hostName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input id="reg-dept" name="department" type="text" className="form-input" placeholder="HR / Engineering / Admin..." value={form.department} onChange={handleChange} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Visit Date</label>
                  <input id="reg-date" name="visitDate" type="date" className="form-input" value={form.visitDate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Visit Time</label>
                  <input id="reg-time" name="visitTime" type="time" className="form-input" value={form.visitTime} onChange={handleChange} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select id="reg-veh-type" name="vehicleType" className="form-select" value={form.vehicleType} onChange={handleChange}>
                    <option>None</option>
                    <option>Two-Wheeler</option>
                    <option>Four-Wheeler</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Number</label>
                  <input id="reg-veh-no" name="vehicleNo" type="text" className="form-input" placeholder="e.g. TN-01-AB-1234" value={form.vehicleNo} onChange={handleChange} disabled={form.vehicleType === 'None'} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: ID Upload ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">ID Type</label>
                <select id="reg-idtype" name="idType" className="form-select" value={form.idType} onChange={handleChange}>
                  <option value="">Select ID type...</option>
                  <option>Aadhaar Card</option>
                  <option>PAN Card</option>
                  <option>Driving License</option>
                  <option>Passport</option>
                  <option>Voter ID</option>
                  <option>Employee ID</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ID Number</label>
                <input id="reg-idnum" name="idNumber" type="text" className="form-input" placeholder="Enter your ID number" value={form.idNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Upload ID Document</label>
                <div
                  className={`face-verify-box ${form.idPreview ? 'verified' : ''}`}
                  onClick={() => idRef.current.click()}
                  style={{ marginBottom: '12px' }}
                >
                  {form.idPreview
                    ? <img src={form.idPreview} alt="ID" style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                    : <><div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>ID</div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click to upload ID photo</p></>
                  }
                </div>
                <input ref={idRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileChange(e, 'idFile')} />
                {form.idPreview && (
                  <button className="btn btn-secondary btn-sm" onClick={simulateOCR} style={{ justifyContent: 'center' }}>
                    Auto-extract details via OCR
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: Face Verify ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '0.875rem',
                color: 'var(--text-secondary)', lineHeight: 1.6
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>AI Face Verification</strong> — Upload your selfie and we'll match it with your ID to confirm your identity. Runs 100% in-browser.
              </div>
              <div className="form-group">
                <label className="form-label">Upload Selfie</label>
                <div
                  className={`face-verify-box ${faceVerified === 'verified' ? 'verified' : faceVerified === 'failed' ? 'failed' : form.selfiePreview ? 'active' : ''}`}
                  onClick={() => selfieRef.current.click()}
                >
                  {form.selfiePreview
                    ? <img src={form.selfiePreview} alt="Selfie" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-1)' }} />
                    : <><div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Selfie</div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click to upload selfie</p></>
                  }
                </div>
                <input ref={selfieRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileChange(e, 'selfieFile')} />
              </div>

              {/* Face Match Result */}
              {faceVerified === 'verified' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '1.5rem' }}>Pass</span>
                  <div>
                    <p style={{ color: 'var(--success)', fontWeight: 600 }}>Face Verified Successfully</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>93% confidence — ID matches selfie</p>
                  </div>
                </div>
              )}
              {faceVerified === 'failed' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '1.5rem' }}>Fail</span>
                  <div>
                    <p style={{ color: 'var(--danger)', fontWeight: 600 }}>Verification Failed</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Face mismatch — flagged for manual review</p>
                  </div>
                </div>
              )}

              <button
                id="face-verify-btn"
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
                onClick={simulateFaceVerify}
                disabled={faceVerified === 'pending'}
              >
                {faceVerified === 'pending' ? 'Analyzing...' : 'Run Face Verification'}
              </button>
            </div>
          )}

          {/* ── Step 5: NDA & Safety ── */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '16px', height: '200px', overflowY: 'auto',
                fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6
              }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Non-Disclosure & Safety Agreement</h4>
                <p>1. <strong>Confidentiality:</strong> I agree to hold all confidential information disclosed to me by the company in strict confidence and not to disclose such information to any third parties.</p>
                <p>2. <strong>Photography:</strong> Photography and video recording within the premises are strictly prohibited unless explicit permission is granted.</p>
                <p>3. <strong>Safety Regulations:</strong> I agree to abide by all health, safety, and security protocols in place during my visit. In case of an emergency, I will follow the instructions of the designated floor wardens.</p>
                <p>4. <strong>Data Privacy:</strong> I consent to the collection and processing of my personal data (including ID and face scan) strictly for the purpose of visitor management and security.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', background: 'rgba(59,130,246,0.05)', borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  name="ndaAgreed"
                  checked={form.ndaAgreed}
                  onChange={handleChange}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--accent-1)' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>I have read and agree to the NDA & Safety Rules</span>
              </label>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', gap: '12px' }}>
            {step > 1
              ? <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>← Back</button>
              : <Link to="/login" className="btn btn-secondary">← Login</Link>
            }
            {step < 5
              ? <button id={`reg-next-${step}`} className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                  Next →
                </button>
              : <button
                  id="reg-submit"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={loading || !form.ndaAgreed}
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
