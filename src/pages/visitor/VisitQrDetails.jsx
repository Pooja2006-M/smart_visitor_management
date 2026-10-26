import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { FiCalendar, FiClock, FiUser, FiBriefcase, FiMapPin } from 'react-icons/fi';
import { db } from '../../firebase/config';

export default function VisitQrDetails() {
  const { visitId } = useParams();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!visitId || visitId === 'null' || visitId === 'undefined') {
      setError('This QR code does not contain a valid visit ID. Please generate a new pass QR code.');
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    getDoc(doc(db, 'registrations', visitId))
      .then((snapshot) => {
        if (cancelled) return;
        if (!snapshot.exists()) {
          setError('This visit pass could not be found.');
          return;
        }
        setVisit({ id: snapshot.id, ...snapshot.data() });
      })
      .catch((loadError) => {
        console.error('Unable to load visit pass from QR link:', loadError);
        if (cancelled) return;
        if (loadError.code === 'permission-denied') {
          setError('Firebase access is blocking this pass. Please sign in on this phone or ask the administrator to check Firestore access rules.');
        } else if (['unavailable', 'deadline-exceeded', 'network-request-failed'].includes(loadError.code)) {
          setError('Could not connect to Firebase. Check that this phone has internet access, then reload the pass.');
        } else {
          setError('Visit details could not be loaded. Please try again or contact reception.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visitId]);

  const isApproved = visit?.status === 'approved';

  return (
    <main style={{ minHeight: '100vh', padding: '32px 16px', display: 'grid', placeItems: 'center' }}>
      <section className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '32px' }}>
        <h1 style={{ fontSize: '1.7rem', marginBottom: '8px' }}>Visitor Pass</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {visitId && visitId !== 'null' && visitId !== 'undefined' ? `Visit reference: ${visitId}` : 'Invalid visit reference'}
        </p>

        {loading && <p role="status">Loading visit details...</p>}
        {!loading && error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
        {!loading && visit && (
          <>
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              borderRadius: '999px',
              marginBottom: '20px',
              color: isApproved ? '#047857' : '#92400e',
              background: isApproved ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.14)',
              fontWeight: 700,
              textTransform: 'capitalize',
            }}>
              {visit.status || 'pending'}
            </div>
            {[
              { icon: <FiUser />, label: 'Visitor', value: visit.fullName || 'Visitor' },
              { icon: <FiUser />, label: 'Host', value: visit.hostName || 'Host not assigned' },
              { icon: <FiBriefcase />, label: 'Department', value: visit.department || 'General' },
              { icon: <FiMapPin />, label: 'Purpose', value: visit.purpose || 'General Visit' },
              { icon: <FiCalendar />, label: 'Date', value: visit.visitDate || 'To be confirmed' },
              { icon: <FiClock />, label: 'Time', value: visit.visitTime || 'To be confirmed' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ color: 'var(--accent-1)' }} aria-hidden="true">{item.icon}</span>
                <span style={{ color: 'var(--text-muted)', minWidth: '100px' }}>{item.label}</span>
                <strong style={{ color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{item.value}</strong>
              </div>
            ))}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '20px' }}>
              Show this pass to reception for visit verification.
            </p>
          </>
        )}

        <Link to="/" className="btn btn-secondary" style={{ marginTop: '20px' }}>
          Return to Home
        </Link>
      </section>
    </main>
  );
}
