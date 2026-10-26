import React, { useState, useEffect } from 'react';
import { 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiUser, 
  FiBriefcase, 
  FiCalendar,
  FiMapPin,
  FiMessageSquare,
  FiChevronRight,
  FiAlertCircle
} from 'react-icons/fi';
// Removed VisitTimeline.css import

export default function VisitTimeline({ visits = [] }) {
  const [selectedVisitId, setSelectedVisitId] = useState(null);

  useEffect(() => {
    if (visits.length > 0 && !selectedVisitId) {
      setSelectedVisitId(visits[0].id);
    }
  }, [visits, selectedVisitId]);

  if (!visits || visits.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <FiClock style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Visits Found</h3>
        <p style={{ color: 'var(--text-secondary)' }}>You don't have any visits to track yet.</p>
      </div>
    );
  }

  const selectedVisit = visits.find(v => v.id === selectedVisitId) || visits[0];
  const { status, hostName, department, visitDate, visitTime, purpose, approvedByName, vehicle, isUrgent, entryOTP } = selectedVisit;

  // Determine steps and progress
  let progress = 10;
  let currentStepIndex = 1;

  if (status === 'rejected') {
    progress = 30;
    currentStepIndex = 1; // Rejected step
  } else if (status === 'pending') {
    progress = 20;
    currentStepIndex = 1; // Approved by host (waiting)
  } else if (status === 'approved') {
    progress = 40;
    currentStepIndex = 2; // Checked in (waiting)
  } else if (status === 'checked-in') {
    progress = 65;
    currentStepIndex = 3; // Meeting in progress
  } else if (status === 'checked-out') {
    progress = 90;
    currentStepIndex = 5; // Feedback
  }

  const steps = [
    {
      title: 'Visit Requested',
      description: `Scheduled for ${visitDate} at ${visitTime}`,
      completed: true,
      active: false,
      rejected: false,
      icon: <FiCalendar />
    },
    {
      title: status === 'rejected' ? 'Visit Rejected' : 'Approved by Host',
      description: status === 'rejected' ? 'Your visit request was declined.' : (status === 'pending' ? 'Waiting for host approval' : `Approved by ${approvedByName || hostName}`),
      completed: ['approved', 'checked-in', 'checked-out'].includes(status),
      active: status === 'pending',
      rejected: status === 'rejected',
      icon: status === 'rejected' ? <FiXCircle /> : <FiCheckCircle />
    },
    {
      title: 'Checked In',
      description: ['checked-in', 'checked-out'].includes(status) ? 'You have checked in at the reception' : 'Please check in at the reception upon arrival',
      completed: ['checked-in', 'checked-out'].includes(status),
      active: status === 'approved',
      rejected: status === 'rejected',
      icon: <FiMapPin />
    },
    {
      title: 'Meeting In Progress',
      description: status === 'checked-in' ? 'Meeting is currently ongoing' : (status === 'checked-out' ? 'Meeting completed' : 'Meet with your host'),
      completed: status === 'checked-out',
      active: status === 'checked-in',
      rejected: status === 'rejected',
      icon: <FiUser />
    },
    {
      title: 'Checked Out',
      description: status === 'checked-out' ? 'You have successfully checked out' : 'Check out when leaving',
      completed: status === 'checked-out',
      active: false,
      rejected: status === 'rejected',
      icon: <FiChevronRight />
    },
    {
      title: 'Feedback Submitted',
      description: 'Pending feedback',
      completed: false,
      active: status === 'checked-out',
      rejected: status === 'rejected',
      icon: <FiMessageSquare />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Visit Selector */}
      {visits.length > 1 && (
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {visits.map(visit => (
            <div 
              key={visit.id}
              onClick={() => setSelectedVisitId(visit.id)}
              className="glass-card"
              style={{
                padding: '1rem',
                minWidth: '200px',
                cursor: 'pointer',
                border: selectedVisitId === visit.id ? '2px solid var(--accent-1)' : '1px solid var(--border)',
                boxShadow: selectedVisitId === visit.id ? '0 0 15px rgba(var(--accent-1-rgb), 0.3)' : 'var(--shadow-md)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{visit.hostName}</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  background: visit.status === 'approved' ? 'rgba(var(--success-rgb), 0.2)' : 
                              visit.status === 'rejected' ? 'rgba(var(--danger-rgb), 0.2)' : 'rgba(var(--warning-rgb), 0.2)',
                  color: visit.status === 'approved' ? 'var(--success)' : 
                         visit.status === 'rejected' ? 'var(--danger)' : 'var(--warning)'
                }}>
                  {visit.status}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{visit.visitDate}</span>
            </div>
          ))}
        </div>
      )}

      {/* Urgent Access Pass */}
      {selectedVisit.isUrgent && selectedVisit.entryOTP && ['approved', 'pending'].includes(status) && (
        <div className="glass-card" style={{ padding: '2rem', border: '2px solid #ef4444', background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(0,0,0,0))', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#ef4444', animation: 'pulse 2s infinite' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              <FiAlertCircle />
            </div>
            <div>
              <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.2rem' }}>Urgent Access Pass</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Show this OTP to the security guard for instant entry.</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
            <div style={{ background: 'var(--bg-card)', padding: '1rem 2rem', borderRadius: '16px', border: '1px dashed #ef4444', boxShadow: '0 8px 32px rgba(239,68,68,0.15)' }}>
              <span style={{ fontSize: '3.5rem', fontWeight: '900', letterSpacing: '0.5em', color: '#ef4444', fontFamily: 'monospace', marginLeft: '0.5em' }}>
                {selectedVisit.entryOTP}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Access Pass */}
      {isUrgent && entryOTP && (
        <div className="glass-card" style={{ 
          padding: '2rem', 
          background: 'linear-gradient(135deg, rgba(239,68,68, 0.1) 0%, rgba(239,68,68, 0.05) 100%)',
          border: '2px solid rgba(239,68,68, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'pulseDangerTimeline 2s infinite',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(239,68,68, 0.2) 0%, transparent 70%)',
            borderRadius: '50%'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '-20px',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(239,68,68, 0.2) 0%, transparent 70%)',
            borderRadius: '50%'
          }}></div>
          <h2 style={{ color: '#ef4444', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            <FiAlertCircle aria-hidden="true" /> URGENT ACCESS PASS
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px' }}>
            Tell this OTP to the security guard at the gate for immediate, priority entry.
          </p>
          <div style={{
            background: 'rgba(239,68,68, 0.15)',
            border: '2px dashed #ef4444',
            padding: '1.5rem 3rem',
            borderRadius: '16px',
            fontSize: '3rem',
            fontWeight: '900',
            letterSpacing: '0.5rem',
            color: '#ef4444',
            boxShadow: '0 8px 32px rgba(239,68,68, 0.2)',
            textShadow: '0 2px 10px rgba(239,68,68, 0.3)'
          }}>
            {entryOTP}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1.5rem', fontWeight: '500' }}>
            This pass is valid for instant priority access.
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Visit Progress</span>
          <span style={{ color: 'var(--accent-1)', fontWeight: 'bold' }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${progress}%`, 
            background: 'var(--gradient)',
            transition: 'width 1s ease-in-out'
          }}></div>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Timeline</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const itemColor = step.rejected ? 'var(--danger)' : 
                              step.completed ? 'var(--success)' : 
                              step.active ? 'var(--accent-1)' : 'var(--text-muted)';
            const bgColor = step.rejected ? 'rgba(var(--danger-rgb), 0.1)' : 
                            step.completed ? 'rgba(var(--success-rgb), 0.1)' : 
                            step.active ? 'rgba(var(--accent-1-rgb), 0.1)' : 'rgba(var(--text-muted-rgb), 0.1)';

            return (
              <div key={index} style={{ display: 'flex', position: 'relative', opacity: step.rejected && index > 1 ? 0.5 : 1 }}>
                {/* Left side: Icon and Line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', marginRight: '1.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: step.completed || step.rejected ? itemColor : bgColor,
                    color: step.completed || step.rejected ? '#fff' : itemColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    boxShadow: step.active ? `0 0 0 4px ${bgColor}` : 'none',
                    animation: step.active ? 'pulse 2s infinite' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {step.icon}
                  </div>
                  {!isLast && (
                    <div style={{
                      width: '2px',
                      flexGrow: 1,
                      minHeight: '40px',
                      background: step.completed ? 'var(--success)' : 'var(--border)',
                      margin: '4px 0',
                      transition: 'background 0.3s ease'
                    }}></div>
                  )}
                </div>

                {/* Right side: Content */}
                <div style={{ paddingBottom: '2rem', flex: 1, animation: `fadeIn 0.5s ease forwards ${index * 0.1}s`, opacity: 0 }}>
                  <h4 style={{ 
                    color: step.active ? 'var(--accent-1)' : (step.rejected ? 'var(--danger)' : 'var(--text-primary)'), 
                    margin: '0 0 0.25rem 0',
                    fontSize: '1.1rem',
                    fontWeight: step.active || step.completed ? '600' : '500'
                  }}>
                    {step.title}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Card */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Visit Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(var(--accent-1-rgb), 0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent-1)' }}>
              <FiUser />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.2rem 0' }}>Host</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: '500', margin: 0 }}>{hostName}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(var(--info-rgb), 0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--info)' }}>
              <FiBriefcase />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.2rem 0' }}>Department</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: '500', margin: 0 }}>{department || 'N/A'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(var(--warning-rgb), 0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--warning)' }}>
              <FiCalendar />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.2rem 0' }}>Schedule</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: '500', margin: 0 }}>{visitDate} at {visitTime}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(var(--success-rgb), 0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--success)' }}>
              <FiCalendar />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.2rem 0' }}>Purpose</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: '500', margin: 0 }}>{purpose}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(var(--accent-1-rgb), 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(var(--accent-1-rgb), 0); }
          100% { box-shadow: 0 0 0 0 rgba(var(--accent-1-rgb), 0); }
        }
        @keyframes pulseDangerTimeline {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
