import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { FiStar } from 'react-icons/fi';

export default function FeedbackForm() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      addToast('Please select a rating.', 'warning');
      return;
    }
    // In real app, save to Firebase
    setSubmitted(true);
    addToast('Thank you for your feedback!', 'success');
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px' }}>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>Thank you</div>
          <h3>Feedback Received!</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '24px' }}>Thank you for sharing your experience. Have a great day!</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Return to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px' }}>
      <div className="glass-card" style={{ padding: '40px', maxWidth: '500px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
           <h2>Rate Your Visit</h2>
           <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Visit ID: #{visitId}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '16px', fontWeight: 600 }}>How was your experience?</p>
            <div className="stars" style={{ justifyContent: 'center', fontSize: '2.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= (hover || rating) ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(rating)}
                >
                  <FiStar fill="currentColor" aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Any comments? (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
}
