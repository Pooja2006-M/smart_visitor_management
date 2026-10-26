import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { FiStar } from 'react-icons/fi';

const DEMO_FEEDBACK = [
  { id: '1', visitor: 'Arun Selvam', host: 'Dr. Priya Sharma', rating: 5, comment: 'Very smooth check-in process. The QR code worked instantly.', date: '2025-12-15' },
  { id: '2', visitor: 'Kavitha Rajan', host: 'Mr. Rajan Kumar', rating: 4, comment: 'Good experience, but finding the parking was a bit confusing.', date: '2025-12-16' },
  { id: '3', visitor: 'Muthu Krishnan', host: 'Ms. Anita Nair', rating: 2, comment: 'Host was unavailable for 30 minutes after my scheduled time.', date: '2025-12-17' },
  { id: '4', visitor: 'Preethi S', host: 'Dr. Priya Sharma', rating: 5, comment: 'Excellent facility and polite security staff.', date: '2025-12-18' },
];

export default function AdminFeedback() {
  const [feedbacks] = useState(DEMO_FEEDBACK);

  const avgRating = (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1);

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} style={{ color: i < rating ? 'var(--warning)' : 'var(--text-muted)' }}>
        <FiStar fill={i < rating ? 'currentColor' : 'none'} />
      </span>
    ));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '32px' }}>
          <h2>Visitor Feedback</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Review visitor ratings and comments post-visit.
          </p>
        </div>

        <div className="stats-grid">
           <div className="glass-card stat-card" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
             <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--warning)' }}>{avgRating}</div>
             <div>
               <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{renderStars(Math.round(avgRating))}</div>
               <div className="stat-label">Average Rating across {feedbacks.length} reviews</div>
             </div>
           </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Host Visited</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{f.visitor}</td>
                    <td>{f.host}</td>
                    <td style={{ fontSize: '1.1rem' }}>{renderStars(f.rating)}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'normal', color: 'var(--text-secondary)' }}>"{f.comment}"</td>
                    <td>{f.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
