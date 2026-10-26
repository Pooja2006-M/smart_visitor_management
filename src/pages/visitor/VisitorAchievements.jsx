import { useState, useEffect, useMemo } from 'react';
import {
  FiAward, FiStar, FiTrendingUp, FiTarget, FiUsers,
  FiClock, FiShare2, FiLock, FiZap, FiGlobe,
  FiMessageSquare, FiRefreshCw, FiCheckCircle, FiShield,
  FiActivity, FiMap, FiCamera, FiBookOpen, FiNavigation
} from 'react-icons/fi';

export default function VisitorAchievements({ visits = [] }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedTip, setExpandedTip] = useState(null);

  /* ── Compute real stats from visits data ─────────────────────────────── */
  const stats = useMemo(() => {
    const total = visits.length;
    const approved = visits.filter(v => v.status === 'approved').length;
    const pending = visits.filter(v => v.status === 'pending').length;
    const rejected = visits.filter(v => v.status === 'rejected').length;
    const approvedRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const uniqueDepts = new Set(visits.map(v => v.department).filter(Boolean));
    const uniqueHosts = new Set(visits.map(v => v.hostName).filter(Boolean));
    const uniquePurposes = new Set(visits.map(v => v.purpose).filter(Boolean));

    return {
      total, approved, pending, rejected, approvedRate,
      uniqueDepartments: uniqueDepts.size,
      uniqueHosts: uniqueHosts.size,
      uniquePurposes: uniquePurposes.size,
      deptList: [...uniqueDepts],
      hostList: [...uniqueHosts],
    };
  }, [visits]);

  /* ── Company-Related Achievements ─────────────────────────────────────── */
  const achievements = useMemo(() => [
    {
      id: 'first_step',
      title: 'First Step',
      desc: 'Submitted your very first visit request to the company',
      fiIcon: <FiNavigation />,
      unlocked: stats.total >= 1,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      category: 'Onboarding',
    },
    {
      id: 'approved_visitor',
      title: 'Approved Visitor',
      desc: 'Got your first visit request approved by a host',
      fiIcon: <FiCheckCircle />,
      unlocked: stats.approved >= 1,
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      category: 'Onboarding',
    },
    {
      id: 'dept_explorer',
      title: 'Department Explorer',
      desc: 'Visited 2 or more departments in the company',
      fiIcon: <FiTarget />,
      unlocked: stats.uniqueDepartments >= 2,
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      category: 'Exploration',
    },
    {
      id: 'multi_dept',
      title: 'Cross-Functional',
      desc: 'Explored 4+ different departments — you know the whole company!',
      fiIcon: <FiBookOpen />,
      unlocked: stats.uniqueDepartments >= 4,
      gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      category: 'Exploration',
    },
    {
      id: 'host_connector',
      title: 'Networking Star',
      desc: 'Connected with 3+ different hosts within the company',
      fiIcon: <FiUsers />,
      unlocked: stats.uniqueHosts >= 3,
      gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
      category: 'Networking',
    },
    {
      id: 'host_master',
      title: 'Company Connector',
      desc: 'Met with 5+ different hosts — a true company insider!',
      fiIcon: <FiStar />,
      unlocked: stats.uniqueHosts >= 5,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      category: 'Networking',
    },
    {
      id: 'multi_purpose',
      title: 'Versatile Visitor',
      desc: 'Visited for 3+ different purposes (Interview, Meeting, Client Visit, etc.)',
      fiIcon: <FiRefreshCw />,
      unlocked: stats.uniquePurposes >= 3,
      gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
      category: 'Engagement',
    },
    {
      id: 'consistent',
      title: 'Trusted Visitor',
      desc: 'Achieved 80%+ approval rate — the company trusts you!',
      fiIcon: <FiShield />,
      unlocked: stats.total >= 3 && stats.approvedRate >= 80,
      gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
      category: 'Trust',
    },
    {
      id: 'perfect_record',
      title: 'Perfect Record',
      desc: '100% approval rate with 3+ visits — zero rejections!',
      fiIcon: <FiAward />,
      unlocked: stats.total >= 3 && stats.rejected === 0,
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
      category: 'Trust',
    },
    {
      id: 'frequent_5',
      title: 'Frequent Visitor',
      desc: 'Completed 5+ visits — you\'re becoming a regular!',
      fiIcon: <FiTrendingUp />,
      unlocked: stats.total >= 5,
      gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
      category: 'Loyalty',
    },
    {
      id: 'company_veteran',
      title: 'Company Veteran',
      desc: '10+ visits to the company — practically an honorary employee!',
      fiIcon: <FiAward />,
      unlocked: stats.total >= 10,
      gradient: 'linear-gradient(135deg, #eab308, #ca8a04)',
      category: 'Loyalty',
    },
    {
      id: 'nda_signer',
      title: 'NDA Compliant',
      desc: 'Accepted NDA agreement during registration — security first!',
      fiIcon: <FiShield />,
      unlocked: stats.total >= 1, // simulated — NDA is part of pre-register
      gradient: 'linear-gradient(135deg, #64748b, #475569)',
      category: 'Compliance',
    },
  ], [stats]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalBadges = achievements.length;
  const completionPercent = Math.round((unlockedCount / totalBadges) * 100);

  /* ── Confetti on mount if any badge newly unlockable ────────────────── */
  useEffect(() => {
    if (unlockedCount > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timer);
    }
  }, []); // only on mount

  /* ── Share handler ──────────────────────────────────────────────────── */
  const handleShare = () => {
    const text = `My VisitorIQ Achievements at Software!\n${unlockedCount}/${totalBadges} badges unlocked\n${stats.total} visits | ${stats.uniqueDepartments} departments explored | ${stats.uniqueHosts} hosts connected\n${achievements.filter(a => a.unlocked).map(a => a.title).join(' • ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const recentVisits = [...visits].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate)).slice(0, 5);
  const categories = ['Onboarding', 'Exploration', 'Networking', 'Engagement', 'Trust', 'Loyalty', 'Compliance'];

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>

      {/* ═══ Confetti Animation ═══ */}
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: '-20px',
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                backgroundColor: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'][Math.floor(Math.random() * 7)],
                animation: `confettiFall ${2 + Math.random() * 2}s ease-out forwards`,
                animationDelay: `${Math.random() * 1}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* ═══ Company Achievement Summary — Hero Card ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #14b8a6 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        marginBottom: '24px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(20,184,166,0.15)' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <FiAward size={48} aria-hidden="true" />
            <div>
              <div style={{ fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Company Achievements</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', fontFamily: 'var(--font-display)' }}>
                {unlockedCount} of {totalBadges} Unlocked
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                Your journey at Software
              </p>
            </div>
          </div>

          {/* Progress Ring */}
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100px', height: '100px', transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#14b8a6" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - completionPercent / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{completionPercent}%</span>
              <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Company Stats ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Visits', value: stats.total, icon: <FiActivity />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Departments Explored', value: stats.uniqueDepartments, icon: <FiTarget />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { label: 'Hosts Connected', value: stats.uniqueHosts, icon: <FiUsers />, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
          { label: 'Approval Rate', value: `${stats.approvedRate}%`, icon: <FiTrendingUp />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: '1.2rem', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Achievement Badges — Grouped by Company Category ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

        {/* Left: Badges */}
        <div>
          {categories.map(cat => {
            const catBadges = achievements.filter(a => a.category === cat);
            if (catBadges.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px', paddingLeft: '4px' }}>
                  {cat}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {catBadges.map(badge => (
                    <div
                      key={badge.id}
                      className="glass-card"
                      style={{
                        padding: '18px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        border: badge.unlocked ? '1px solid rgba(20,184,166,0.25)' : '1px solid var(--border)',
                        opacity: badge.unlocked ? 1 : 0.55,
                        filter: badge.unlocked ? 'none' : 'grayscale(0.6)',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        cursor: 'default',
                      }}
                      onMouseEnter={e => { if (badge.unlocked) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                    >
                      {/* Badge Icon */}
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                        background: badge.unlocked ? badge.gradient : '#e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem',
                        boxShadow: badge.unlocked ? `0 6px 16px ${badge.gradient.includes('#10b981') ? 'rgba(16,185,129,0.3)' : 'rgba(0,0,0,0.15)'}` : 'none',
                      }}>
                        {badge.unlocked ? badge.fiIcon : <FiLock style={{ color: '#9ca3af', fontSize: '1.1rem' }} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{badge.title}</span>
                          {badge.unlocked && (
                            <span style={{ fontSize: '0.55rem', padding: '2px 6px', borderRadius: '99px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 800, letterSpacing: '0.5px' }}>
                              UNLOCKED
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                          {badge.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Sidebar — Shareable Card + Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Shareable Visitor Card ── */}
          <div className="glass-card" style={{
            borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #14b8a6 100%)',
              padding: '24px', textAlign: 'center', color: 'white', position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <FiAward size={28} aria-hidden="true" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 0 4px' }}>
                Company Visitor Card
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>Software, Madurai</p>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: '16px' }}>
                {[
                  { val: stats.total, label: 'Visits' },
                  { val: unlockedCount, label: 'Badges' },
                  { val: stats.uniqueDepartments, label: 'Depts' },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{item.val}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Unlocked badges icons row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '16px', padding: '12px', background: 'rgba(20,184,166,0.05)', borderRadius: '12px' }}>
                {achievements.filter(a => a.unlocked).length > 0 ? (
                  achievements.filter(a => a.unlocked).map(a => (
                    <span key={a.id} title={a.title} style={{ fontSize: '1.2rem', cursor: 'default' }}>{a.fiIcon}</span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start visiting to earn badges!</span>
                )}
              </div>

              <button
                onClick={handleShare}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: '8px', borderRadius: '12px', fontSize: '0.82rem' }}
              >
                {copied ? <><FiCheckCircle /> Copied!</> : <><FiShare2 /> Share Achievements</>}
              </button>
            </div>
          </div>

          {/* ── Recent Company Visits ── */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiClock style={{ color: 'var(--accent-1)' }} /> Recent Company Visits
            </h3>

            {recentVisits.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentVisits.map((visit, i) => (
                  <div key={visit.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '12px',
                    background: 'var(--bg-card-hover)',
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: visit.status === 'approved' ? 'rgba(16,185,129,0.12)' : visit.status === 'pending' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: visit.status === 'approved' ? '#10b981' : visit.status === 'pending' ? '#f59e0b' : '#ef4444',
                      fontSize: '0.9rem', flexShrink: 0,
                    }}>
                      <FiCheckCircle />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {visit.hostName} — {visit.department}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {visit.purpose} • {visit.visitDate}
                      </div>
                    </div>
                    <span className={`host-status ${visit.status}`} style={{ fontSize: '0.6rem' }}>
                      {visit.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No visits recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Keyframe Styles ═══ */}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(${360 + Math.random() * 360}deg); opacity: 0; }
        }
        @media (max-width: 900px) {
          .visitor-achievements-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
