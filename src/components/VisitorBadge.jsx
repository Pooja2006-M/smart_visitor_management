import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { createVisitQrUrl } from '../utils/visitQr';

export default function VisitorBadge({ visit, onBack }) {
  const badgeRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  // Status mapping for badge colors
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10b981'; // Green
      case 'pending': return '#f59e0b'; // Yellow
      case 'rejected': return '#ef4444'; // Red
      case 'checked-in': return '#3b82f6'; // Blue
      case 'checked-out': return '#6b7280'; // Gray
      default: return '#10b981';
    }
  };

  const statusColor = getStatusColor(visit.status);

  // Add print-specific styles dynamically when this component renders
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-secondary)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px',
      overflowY: 'auto'
    }}>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #badge-to-print, #badge-to-print * { visibility: visible; }
            #badge-to-print { position: absolute; left: 0; top: 0; margin: 0; box-shadow: none !important; border: 1px solid #ccc !important; }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <div className="no-print" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={handlePrint}>Print Pass</button>
      </div>

      <div
        id="badge-to-print"
        style={{
          width: '320px', height: '480px',
          background: 'white', border: `2px solid ${statusColor}`,
          borderRadius: '12px', padding: '20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          fontFamily: 'Cambria, Georgia, serif', position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Accent Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: statusColor }} />

        {/* Header with Logo */}
        <div style={{
          width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
          borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px',
          marginTop: '8px'
        }}>
          {/* Placeholder for Company Logo */}
          <div style={{ 
            width: '40px', height: '40px', background: 'var(--gradient)', 
            borderRadius: '8px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', fontSize: '1.2rem', marginBottom: '8px',
            color: 'white', fontWeight: 'bold'
          }}>
            Company
          </div>
          <h2 style={{ fontSize: '1.2rem', color: '#111', margin: 0, fontWeight: 800, textTransform: 'uppercase' }}>VISITOR PASS</h2>
          <p style={{ fontSize: '0.75rem', color: '#666', margin: '4px 0 0 0' }}>VisitorIQ Smart Systems</p>
        </div>

        {/* Profile Pic Placeholder */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#f0f4f8', border: `2px solid ${statusColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', marginBottom: '12px'
        }}>
          Visitor
        </div>

        <h3 style={{ fontSize: '1.4rem', margin: '0 0 4px 0', color: '#333', fontWeight: 700 }}>{visit.visitorName}</h3>
        <div style={{ 
          background: statusColor, color: 'white', padding: '2px 8px', 
          borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
          textTransform: 'uppercase', marginBottom: '16px'
        }}>
          {visit.status || 'APPROVED'}
        </div>

        {/* Visit Details Box */}
        <div style={{
          background: '#f8fafc', width: '100%', padding: '12px',
          borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem',
          textAlign: 'left', border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <strong style={{ color: '#64748b' }}>Host:</strong> 
            <span style={{ fontWeight: 600, color: '#334155' }}>{visit.host}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <strong style={{ color: '#64748b' }}>Dept:</strong> 
            <span style={{ fontWeight: 600, color: '#334155' }}>{visit.dept}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <strong style={{ color: '#64748b' }}>Date:</strong> 
            <span style={{ fontWeight: 600, color: '#334155' }}>{visit.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ color: '#64748b' }}>Time:</strong> 
            <span style={{ fontWeight: 600, color: '#334155' }}>{visit.time || '09:00 AM'}</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: 'white', borderRadius: '8px', border: '1px dashed #ccc' }}>
          <QRCodeCanvas value={visit.qrData || createVisitQrUrl(visit.id)} size={180} level="H" includeMargin />
        </div>
        <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '12px 0 0 0', fontWeight: 500 }}>
          Valid for single entry only • Please wear at all times
        </p>
      </div>
    </div>
  );
}
