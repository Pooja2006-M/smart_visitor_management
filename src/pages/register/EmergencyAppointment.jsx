import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useToast } from '../../context/ToastContext';

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

export default function EmergencyAppointment() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [visitTime, setVisitTime] = useState(() => formatLocalTime(new Date()));
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      addToast('Enter a valid email address.', 'warning');
      return;
    }

    setSubmitting(true);
    const now = new Date();
    const entryOTP = createEntryOTP();
    const visitDate = formatLocalDate(now);
    const selectedTime = visitTime.trim();

    try {
      const registration = await addDoc(collection(db, 'registrations'), {
        fullName: normalizedEmail,
        visitorName: normalizedEmail,
        email: normalizedEmail,
        phone: '',
        purpose: 'Emergency',
        department: 'Emergency',
        hostId: '2312122@nec.edu.in',
        hostName: 'Emergency Desk',
        hostEmail: '2312122@nec.edu.in',
        visitDate,
        visitTime: selectedTime,
        isUrgent: true,
        entryOTP,
        status: 'approved',
        createdAt: serverTimestamp(),
      });

      setBooking({ email: normalizedEmail, visitDate, visitTime, entryOTP, id: registration.id });
      addToast('Emergency appointment booked for today.', 'success');
    } catch (error) {
      console.error('Failed to book emergency appointment:', error);
      addToast(`Could not book the emergency appointment: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (booking) {
    return (
      <main style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', padding: '24px',
      }}>
        <section className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✓</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Emergency Appointment Booked</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Appointment confirmed for today, {booking.visitDate} at {booking.visitTime}.
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Show this entry OTP to the guard:</p>
          <div aria-label={`Entry OTP ${booking.entryOTP}`} style={{
            display: 'inline-block', padding: '12px 24px', borderRadius: '12px',
            background: 'rgba(59,130,246,0.1)', color: 'var(--accent-1)',
            fontSize: '2rem', fontWeight: 700, letterSpacing: '0.35em',
          }}>
            {booking.entryOTP}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '16px' }}>{booking.email}</p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '24px' }}
            onClick={() => {
              setBooking(null);
              setEmail('');
            }}
          >
            Book Another Emergency Visit
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '24px',
    }}>
      <section className="glass-card" style={{ maxWidth: '560px', width: '100%', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ color: 'var(--text-primary)' }}>Emergency Appointment</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Book an urgent visit for today. An entry OTP will be generated after booking.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="emergency-email">Email Address *</label>
            <input
              id="emergency-email"
              className="form-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="emergency-time">Arrival Time *</label>
            <input
              id="emergency-time"
              type="time"
              className="form-input"
              required
              value={visitTime}
              onChange={event => setVisitTime(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="emergency-purpose">Purpose *</label>
            <select id="emergency-purpose" className="form-select" value="Emergency" disabled>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Visit date is set to today. Choose the time the visitor will arrive.
          </p>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Booking appointment...' : 'Book Emergency Appointment'}
          </button>
        </form>
      </section>
    </main>
  );
}
