import React from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import {
  FiBriefcase, FiUsers, FiShield, FiGlobe,
  FiAward, FiTarget, FiPhone, FiMail, FiMapPin,
  FiCheckCircle,
} from 'react-icons/fi';

const companyDirectory = {
  'chella software': {
    name: 'Chella Software',
    city: 'Madurai, Tamil Nadu',
    description: 'Chella Software is a premier technology solutions company focused on software engineering, digital transformation, and enterprise innovation.',
    phone: '+91 98765 43210',
    email: 'info@chellasoftware.com',
    website: 'www.chellasoftware.com',
    highlights: [
      { value: '200+', label: 'Employees' },
      { value: '50+', label: 'Projects Delivered' },
      { value: '10+', label: 'Years Experience' },
      { value: '5+', label: 'Countries Served' },
    ],
    locationQuery: 'Chella Software Madurai',
  },
  'avasoft': {
    name: 'Avasoft',
    city: 'Chennai, Tamil Nadu',
    description: 'Avasoft helps businesses modernize through digital product engineering, cloud services, and customer-focused application experiences.',
    phone: '+91 94444 11223',
    email: 'hello@avasoft.com',
    website: 'www.avasoft.com',
    highlights: [
      { value: '150+', label: 'Employees' },
      { value: '35+', label: 'Projects Delivered' },
      { value: '8+', label: 'Years Experience' },
      { value: '4+', label: 'Global Teams' },
    ],
    locationQuery: 'Avasoft Chennai',
  },
  'vvdn technologies': {
    name: 'VVDN Technologies',
    city: 'Gurugram, Haryana',
    description: 'VVDN Technologies is a product engineering company delivering electronics, embedded, cloud, and digital transformation capabilities for global customers.',
    phone: '+91 98110 22334',
    email: 'connect@vvdntech.com',
    website: 'www.vvdntech.com',
    highlights: [
      { value: '6000+', label: 'Employees' },
      { value: '100+', label: 'Global Clients' },
      { value: '12+', label: 'Years Experience' },
      { value: '20+', label: 'Countries Served' },
    ],
    locationQuery: 'VVDN Technologies Gurugram',
  },
  'fresa technologies': {
    name: 'Fresa Technologies',
    city: 'Bengaluru, Karnataka',
    description: 'Fresa Technologies specializes in enterprise software, product engineering, and cloud-enabled digital solutions for modern businesses.',
    phone: '+91 97300 66552',
    email: 'contact@fresatechnologies.com',
    website: 'www.fresatechnologies.com',
    highlights: [
      { value: '300+', label: 'Employees' },
      { value: '60+', label: 'Clients' },
      { value: '9+', label: 'Years Experience' },
      { value: '7+', label: 'Industry Verticals' },
    ],
    locationQuery: 'Fresa Technologies Bengaluru',
  },
  'systimax': {
    name: 'SystimaNX',
    city: 'Hyderabad, Telangana',
    description: 'SystimaNX delivers secure technology platforms, infrastructure services, and digital operations consulting for high-growth organizations.',
    phone: '+91 95555 31313',
    email: 'support@systimanx.com',
    website: 'www.systimanx.com',
    highlights: [
      { value: '400+', label: 'Professionals' },
      { value: '90+', label: 'Projects' },
      { value: '7+', label: 'Years Experience' },
      { value: '10+', label: 'Regions' },
    ],
    locationQuery: 'SystimaNX Hyderabad',
  },
  'speqto technologies': {
    name: 'Speqto Technologies',
    city: 'Coimbatore, Tamil Nadu',
    description: 'Speqto Technologies works with enterprises on custom software, product design, and technology modernization strategies.',
    phone: '+91 96200 77222',
    email: 'sales@speqto.com',
    website: 'www.speqto.com',
    highlights: [
      { value: '220+', label: 'Employees' },
      { value: '40+', label: 'Launches' },
      { value: '6+', label: 'Years Experience' },
      { value: '5+', label: 'Delivery Centers' },
    ],
    locationQuery: 'Speqto Technologies Coimbatore',
  },
};

const normalizeCompanyName = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');

export default function AboutCompany() {
  const { userProfile } = useAuth();
  const selectedCompany = userProfile?.company || 'Software';
  const companyKey = normalizeCompanyName(selectedCompany);
  const company = companyDirectory[companyKey] || {
    name: selectedCompany,
    city: 'India',
    description: `${selectedCompany} is a growing organization focused on innovation, business operations, and digital excellence.`,
    phone: '+91 90000 00000',
    email: `contact@${selectedCompany.toLowerCase().replace(/\s+/g, '')}.com`,
    website: `www.${selectedCompany.toLowerCase().replace(/\s+/g, '')}.com`,
    highlights: [
      { value: '100+', label: 'People' },
      { value: '25+', label: 'Projects' },
      { value: '5+', label: 'Years Experience' },
      { value: '4+', label: 'Locations' },
    ],
    locationQuery: selectedCompany,
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">

        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBriefcase style={{ color: 'white', fontSize: '1.4rem' }} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>About {company.name}</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Company Overview, Services & Contact</p>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1e3a5f', marginBottom: '14px' }}>Who We Are</h3>
          <p style={{ color: '#374151', lineHeight: 1.8, fontSize: '0.94rem', marginBottom: '16px' }}>
            <strong style={{ color: '#1e3a5f' }}>{company.name}</strong> is a technology-focused organization based in {company.city}. {company.description}
          </p>
          <p style={{ color: '#374151', lineHeight: 1.8, fontSize: '0.94rem', margin: 0 }}>
            We work across software development, enterprise operations, customer experience, and digital transformation to help teams deliver sustainable value in competitive markets.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1e3a5f', marginBottom: '18px' }}>Our Services</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {[
              { icon: <FiGlobe />, title: 'Web Development', desc: 'Modern web apps, portals & digital platforms built for business performance.' },
              { icon: <FiBriefcase />, title: 'Enterprise Solutions', desc: 'Workflow solutions and digital operation systems tailored to business needs.' },
              { icon: <FiShield />, title: 'Cybersecurity', desc: 'Security-first delivery models that protect infrastructure, users and data.' },
              { icon: <FiTarget />, title: 'Digital Transformation', desc: 'Cloud adoption, automation, and modernization programs for growth-focused organizations.' },
              { icon: <FiUsers />, title: 'IT Consulting', desc: 'Technology strategy and advisory services for future-ready teams.' },
              { icon: <FiCheckCircle />, title: 'Quality Assurance', desc: 'Robust testing and delivery assurance for reliable software and systems.' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', border: '1px solid #e0e7ff', borderRadius: '14px', padding: '20px', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #1e3a5f)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <span style={{ color: 'white', fontSize: '1.1rem' }}>{s.icon}</span>
                </div>
                <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.95rem', marginBottom: '6px' }}>{s.title}</div>
                <div style={{ color: '#6B7280', fontSize: '0.84rem', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1e3a5f', marginBottom: '18px' }}>Company Highlights</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            {company.highlights.map((h, i) => (
              <div key={i} style={{ textAlign: 'center', background: '#f9fafb', borderRadius: '14px', padding: '22px 14px', border: '1px solid #f3f4f6' }}>
                <div style={{ color: '#2563eb', fontSize: '1.5rem', marginBottom: '8px' }}>{i === 0 ? <FiUsers /> : i === 1 ? <FiAward /> : i === 2 ? <FiCheckCircle /> : <FiGlobe />}</div>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#111827' }}>{h.value}</div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '4px' }}>{h.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1e3a5f', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiMapPin /> Our Location
          </h3>
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', height: '350px', marginBottom: '20px' }}>
            <iframe
              title={`${company.name} Location`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(company.locationQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', borderRadius: '18px', padding: '28px 32px', color: 'white', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Visit Us / Contact</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px 16px' }}>
              <FiMapPin style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              <span>{company.name}, {company.city}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px 16px' }}>
              <FiPhone style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              <span>{company.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px 16px' }}>
              <FiMail style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              <span>{company.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px 16px' }}>
              <FiGlobe style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              <span>{company.website}</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
