import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Mock search results based on query
  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(val.length > 0);
  };

  const results = [
    { type: 'Visitor', name: 'Arun Selvam', detail: 'ID: V001 • HR Dept', url: '/admin/dashboard' },
    { type: 'Host', name: 'Dr. Priya Sharma', detail: 'HR Department', url: '/host/dashboard' },
  ].filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.detail.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ position: 'relative', width: '300px' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
          Search
        </span>
        <input
          type="text"
          placeholder="Search visitors, hosts, etc..."
          value={query}
          onChange={handleSearch}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          style={{
            width: '100%', padding: '10px 10px 10px 36px',
            borderRadius: '8px', border: '1px solid var(--border)',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg-primary)', border: '1px solid var(--border)',
          borderRadius: '8px', marginTop: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100, overflow: 'hidden'
        }}>
          {results.length > 0 ? (
            results.map((res, idx) => (
              <div 
                key={idx} 
                onClick={() => { setIsOpen(false); setQuery(''); navigate(res.url); }}
                style={{ 
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{res.name}</span>
                  <span style={{ fontSize: '0.7rem', background: 'var(--border)', padding: '2px 6px', borderRadius: '4px' }}>
                    {res.type}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {res.detail}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
