import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import demoVideoSvg from '../assets/vms_demo.svg';
import visitorRegImg from '../assets/visitor_registration.png';
import receptionImg from '../assets/reception_dashboard.png';
import eventPassImg from '../assets/Even pass .png';
import { FiActivity, FiBell, FiCalendar, FiCamera, FiChevronRight, FiMap, FiMapPin, FiMessageSquare, FiSmartphone, FiTruck, FiZap, FiShield, FiBarChart2, FiMail, FiPhone, FiCpu, FiCloud, FiArrowRight, FiPlay, FiCheck } from 'react-icons/fi';

const PROJECT_PHONE = '+91 93100 52855';
const PROJECT_EMAIL = 'support@svms.com';
const COMPANY_NAME = 'Smart Visitor Management System';
const COMPANY_SHORT = 'SVMS';

const serviceCards = [
  {
    title: 'Visitor Management System',
    text:
      'Smart Visitor Management System (SMS) is a system used by organizations to record, monitor, and manage visitors who enter a building or facility. It helps improve security, tracking, and organization of visitor information.',
    image: visitorRegImg,
  },
  {
    title: 'Event Pass Management System',
    text:
      'An Event Pass Management System is a digital system used to create, manage, distribute, and verify passes for events such as conferences, concerts, seminars, exhibitions, or corporate meetings.',
    image: eventPassImg,
  },
  {
    title: 'Meeting Room Management',
    text:
      'A Meeting Room Management System is a software solution used to schedule, manage, and monitor meeting rooms or conference rooms in offices, companies, or organizations to avoid conflicts and improve resource usage.',
    image: receptionImg,
  },
];

const facilityTypes = [
  { name: 'Corporate Offices', mark: 'CO', color: '#123b3a', bg: '#edf8f7' },
  { name: 'Campuses', mark: 'CA', color: '#159d98', bg: '#e5e7eb' },
  { name: 'Hospitals', mark: 'HO', color: '#123b3a', bg: '#edf8f7' },
  { name: 'Co-working Spaces', mark: 'CW', color: '#123b3a', bg: '#edf8f7' },
];

export default function LandingPage() {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <div className="landing-page" id="home">
      <div className="contact-strip">
        <div className="contact-strip-inner">
          <a href={`tel:${PROJECT_PHONE.replace(/\s/g, '')}`}>
            <FiPhone aria-hidden="true" /> {PROJECT_PHONE}
          </a>
          <a href={`mailto:${PROJECT_EMAIL}`}>
            <FiMail aria-hidden="true" /> {PROJECT_EMAIL}
          </a>
        </div>
      </div>
      <header className="top-nav">
        <div className="brand-block">
          <span className="brand-word">{COMPANY_SHORT}</span>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#home">HOME</a>
          <a href="#about">ABOUT</a>
          <a href="#services">SERVICES</a>
          <a href="#features">FEATURES</a>
          <a href="#pricing">PRICING</a>
          <a href="#clientele">CLIENTELE</a>
          <a href="#blog">BLOG</a>
          <a href="#contact">CONTACT</a>
        </nav>

        <Link to="/login" className="trial-btn">
          LET'S START <FiArrowRight aria-hidden="true" />
        </Link>
      </header>

      <div className="landing-hero">
        <div className="hero-copy">
          <div className="mini-label">VISITOR MANAGEMENT SYSTEM</div>

          <h1>
            Easier, safer &
            <span>more human visitor check-ins</span>
          </h1>

          <p>
            {COMPANY_NAME} brings visitor requests, host approvals, secure gate entry, and visit
            records together in one simple workspace made for real people and busy offices.
          </p>

          <div className="hero-actions">
            <button type="button" className="know-more-btn" onClick={() => setShowVideoModal(true)}>
              LEARN MORE <FiArrowRight aria-hidden="true" />
            </button>

            <button
              type="button"
              className="play-demo-btn"
              aria-label="Watch product demo"
              onClick={() => setShowVideoModal(true)}
            >
              <span className="play-icon"><FiPlay aria-hidden="true" /></span>
              <span className="demo-text">
                <strong>See the demo</strong>
                <small>Watch how {COMPANY_SHORT} works</small>
              </span>
            </button>
          </div>
        </div>

        <div className="hero-visual" aria-label="Visitor management collage">
          <div className="collage-grid">
            <div className="collage-card bg-lobby" />
            <div className="collage-card bg-scan" />
            <div className="collage-card bg-badge" />
            <div className="collage-card stats-badge">
              <strong>99.9%</strong>
              <small>Uptime & Accuracy</small>
            </div>
          </div>

          <div className="floating-pass-card">
            <div className="pass-header">
              <span className="pass-label">VISITOR PASS</span>
              <span className="pass-company">SMART <br /> VISITOR <br /> SYSTEM</span>
            </div>

            <div className="pass-body">
              <div className="pass-details">
                <div className="pass-row">
                  <span>Visitor</span>
                  <strong>Raj Aryan</strong>
                </div>
                <div className="pass-row">
                  <span>From</span>
                  <strong>FPASS Services</strong>
                </div>
                <div className="pass-row">
                  <span>To</span>
                  <strong>Testing Member</strong>
                </div>
                <div className="pass-row">
                  <span>Dept</span>
                  <strong>Accounts</strong>
                </div>
                <div className="pass-row">
                  <span>Time</span>
                  <strong>10 Minutes</strong>
                </div>
                <div className="pass-row">
                  <span>Entry</span>
                  <strong>1 Jan 1970, 12:00 AM</strong>
                </div>
              </div>
              <div className="qr-box">QR</div>
            </div>
          </div>
          <div className="quick-fab phone-fab"><FiPhone aria-hidden="true" /></div>
          <div className="quick-fab chat-fab">◌</div>
          <div className="quick-fab up-fab">↑</div>
        </div>
      </div>

      {/* ABOUT Section */}
      <section id="about" style={{ padding: '80px 40px', background: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ color: '#123b3a', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ABOUT THE SYSTEM</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px', color: '#123b3a' }}>A clearer way to manage every visit</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#64748b', marginBottom: '32px' }}>
            {COMPANY_NAME} brings visitor requests, host approvals, secure gate entry, and visit records together in one focused workspace for offices and facilities.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '48px' }}>
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#123b3a' }}>01</div>
              <p style={{ color: '#64748b', marginTop: '8px' }}>Visitor workflow</p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#159d98' }}>05</div>
              <p style={{ color: '#64748b', marginTop: '8px' }}>Access roles</p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#123b3a' }}>24/7</div>
              <p style={{ color: '#64748b', marginTop: '8px' }}>Visit visibility</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES Section */}
      <section id="features" style={{ padding: '80px 40px', background: '#f7fbfb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#123b3a', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>KEY FEATURES</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '48px', color: '#123b3a' }}>Powerful Features for Modern Security</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            {[
              { icon: FiSmartphone, title: 'Mobile Check-in', desc: 'QR code & RFID scanning' },
              { icon: FiShield, title: 'Advanced Security', desc: 'Real-time threat detection' },
              { icon: FiBarChart2, title: 'Analytics Dashboard', desc: 'Real-time visitor insights' },
              { icon: FiMail, title: 'Auto Notifications', desc: 'Email & SMS alerts' },
              { icon: FiCpu, title: 'Identity Checks', desc: 'ID and face verification flow' },
              { icon: FiCloud, title: 'Cloud Based', desc: '100% secure & scalable' },
            ].map((feature, idx) => (
              <div key={idx} style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px', color: '#159d98' }}><feature.icon size={48} /></div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#123b3a' }}>{feature.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING Section */}
      <section id="pricing" style={{ padding: '80px 40px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#123b3a', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>PRICING PLANS</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '48px', color: '#123b3a' }}>Transparent Pricing for All Sizes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'stretch' }}>
            {[
              { name: 'Startup', price: '$99', features: ['Up to 500 visitors/month', 'Basic reporting', 'Email support', 'Single location'] },
              { name: 'Professional', price: '$299', features: ['Up to 5000 visitors/month', 'Advanced analytics', 'Phone support', 'Multi-location', 'Custom branding'], highlight: true },
              { name: 'Enterprise', price: 'Custom', features: ['Unlimited visitors', 'AI features', '24/7 support', 'API access', 'Custom integration'] },
            ].map((plan, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  padding: '40px 32px 28px',
                  borderRadius: '18px',
                  border: plan.highlight ? '2px solid #159d98' : '1px solid #e5e7eb',
                  color: '#123b3a',
                  boxShadow: plan.highlight ? '0 20px 40px rgba(21, 157, 152, 0.16)' : '0 10px 25px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '540px',
                  position: 'relative'
                }}
              >
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#159d98', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '18px', textAlign: 'center', lineHeight: 1.2 }}>{plan.name}</h3>
                  <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '28px', textAlign: 'center', lineHeight: 1, letterSpacing: '-0.04em', color: '#123b3a' }}>{plan.price}</div>
                </div>

                <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: '0 0 24px', width: '100%' }}>
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 0',
                        color: '#64748b',
                        fontSize: '1.02rem',
                        lineHeight: 1.5
                      }}
                    >
                      <FiCheck aria-hidden="true" style={{ color: '#159d98', flexShrink: 0 }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    background: plan.highlight ? '#159d98' : '#edf8f7',
                    color: plan.highlight ? '#ffffff' : '#123b3a',
                    cursor: 'pointer',
                    marginTop: 'auto'
                  }}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENTELE Section */}
      <section id="clientele" style={{ padding: '80px 40px', background: '#f7fbfb', textAlign: 'center' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <p style={{ color: '#123b3a', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>OUR CLIENTS</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '48px', color: '#123b3a' }}>Built for busy facilities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', alignItems: 'center' }}>
            {facilityTypes.map((company, idx) => (
              <div
                key={idx}
                style={{
                  padding: '24px 18px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  minHeight: '92px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: company.name === 'Microsoft' ? '1.2rem' : '1.5rem',
                    fontWeight: 800,
                    background: company.bg,
                    color: company.color,
                    lineHeight: 1,
                    boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.18)'
                  }}
                >
                  {company.mark}
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#123b3a' }}>{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG Section */}
      <section id="blog" style={{ padding: '80px 40px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ color: '#123b3a', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>LATEST UPDATES</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '48px', color: '#123b3a', textAlign: 'center' }}>Blog & Resources</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {[
              { title: 'How to Improve Workplace Security', date: 'Dec 20, 2025', category: 'Security' },
              { title: 'AI-Powered Visitor Management Trends', date: 'Dec 18, 2025', category: 'Technology' },
              { title: 'Case Study: Enterprise VMS Implementation', date: 'Dec 15, 2025', category: 'Case Study' },
            ].map((blog, idx) => (
              <div key={idx} style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                <span style={{ display: 'inline-block', background: '#e5e7eb', color: '#123b3a', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>{blog.category}</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#123b3a' }}>{blog.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{blog.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="services-header">
          <div className="services-badge-group" aria-hidden="true">
            <span>All Services</span>
            <span>Visitor Management System</span>
            <span>Event Pass Management</span>
            <span>Meeting Room Management</span>
          </div>
          <p className="services-kicker">OUR SERVICES</p>
          <h2>We Provide Exclusive Services</h2>
        </div>

        <div className="services-grid">
          {serviceCards.map((service) => (
            <article key={service.title} className="service-card">
              <div
                className={`service-visual ${service.title === 'Event Pass Management System' ? 'event-pass-visual' : ''}`}
                aria-hidden="true"
              >
                <img className="service-image" src={service.image} alt={service.title} />
              </div>

              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Hidden sections for navigation anchors */}
      <div id="about" style={{ scroll: 'smooth' }}></div>
      <div id="features" style={{ scroll: 'smooth' }}></div>
      <div id="pricing" style={{ scroll: 'smooth' }}></div>
      <div id="clientele" style={{ scroll: 'smooth' }}></div>
      <div id="blog" style={{ scroll: 'smooth' }}></div>



      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-block footer-brand-block">
              <span className="brand-word">{COMPANY_SHORT}</span>
            </div>
            <p>
              Secure, smart, and seamless visitor management for offices, campuses, and facilities.
            </p>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Services</a>
            <a href="#">Pricing</a>
          </div>

          <div className="footer-links">
            <h4>Legal</h4>
            <a href="#">Terms & Conditions</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Security Policy</a>
          </div>

          <div className="footer-links">
            <h4>Contact Us</h4>
            <a href={`mailto:${PROJECT_EMAIL}`}>{PROJECT_EMAIL}</a>
            <a href={`tel:${PROJECT_PHONE.replace(/\s/g, '')}`}>{PROJECT_PHONE}</a>
            <span>Chennai, India</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 {COMPANY_NAME}. All rights reserved.</span>
        </div>
      </footer>

      {/* Video Demo Modal */}
      {showVideoModal && (
        <div className="modal-overlay" onClick={() => setShowVideoModal(false)} style={{ zIndex: 1000 }}>
          <div
            className="modal"
            style={{ maxWidth: '800px', width: '90%', padding: '0', background: '#000', borderRadius: '16px', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
              <button
                onClick={() => setShowVideoModal(false)}
                style={{
                  position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                  background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                  width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                  fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
              <object
                data={demoVideoSvg}
                type="image/svg+xml"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '0 0 16px 16px' }}
                aria-label="Smart Visitor Management System Demo"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
