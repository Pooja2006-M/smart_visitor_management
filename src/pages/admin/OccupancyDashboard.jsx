import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useToast } from '../../context/ToastContext';
import { listenToOccupancy } from '../../firebase/firestore';

const defaultOccupancyState = {
  total: 145,
  capacity: 200,
  floors: [
    { name: 'Ground Floor (Reception & Lobby)', count: 45, max: 60 },
    { name: '1st Floor (Engineering)', count: 60, max: 80 },
    { name: '2nd Floor (HR & Admin)', count: 30, max: 40 },
    { name: '3rd Floor (Executive)', count: 10, max: 20 },
  ],
  activeContractors: [
    { id: 'C1', name: 'Ramesh K.', company: 'Acme Maintenance', entryTime: '08:30 AM', timeInside: '4h 15m', floor: '1st Floor' },
    { id: 'C2', name: 'Suresh V.', company: 'Acme Maintenance', entryTime: '08:35 AM', timeInside: '4h 10m', floor: '1st Floor' },
    { id: 'C3', name: 'Vinod S.', company: 'TechFix IT', entryTime: '11:00 AM', timeInside: '1h 45m', floor: '3rd Floor' },
  ],
};

export default function OccupancyDashboard() {
  const { addToast } = useToast();
  const [occupancyState, setOccupancyState] = useState(defaultOccupancyState);

  useEffect(() => {
    const unsubscribe = listenToOccupancy((snapshot) => {
      if (!snapshot || snapshot.empty) {
        setOccupancyState(defaultOccupancyState);
        return;
      }

      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const totalDoc = docs.find((item) => item.total !== undefined || item.occupancy !== undefined) || docs[0] || {};
      const capacityDoc = docs.find((item) => item.capacity !== undefined) || totalDoc;

      const mergedFloors = (docs.flatMap((item) => Array.isArray(item.floors) ? item.floors : []) || defaultOccupancyState.floors).map((floor) => ({
        name: floor.name || floor.floor || 'Unknown Floor',
        count: Number(floor.count ?? floor.current ?? 0),
        max: Number(floor.max ?? floor.capacity ?? 0),
      }));

      const activeContractors = docs.flatMap((item) => Array.isArray(item.activeContractors) ? item.activeContractors : []);

      setOccupancyState({
        total: Number(totalDoc.total ?? totalDoc.occupancy ?? defaultOccupancyState.total),
        capacity: Number(capacityDoc.capacity ?? defaultOccupancyState.capacity),
        floors: mergedFloors.length ? mergedFloors : defaultOccupancyState.floors,
        activeContractors: activeContractors.length ? activeContractors.map((contractor, index) => ({
          id: contractor.id || `C${index + 1}`,
          name: contractor.name || 'Unknown',
          company: contractor.company || contractor.vendor || 'N/A',
          entryTime: contractor.entryTime || contractor.checkInTime || 'N/A',
          timeInside: contractor.timeInside || contractor.duration || '0m',
          floor: contractor.floor || contractor.location || 'N/A',
        })) : defaultOccupancyState.activeContractors,
      });
    });

    return () => unsubscribe();
  }, []);

  const { total: occupancy, capacity, floors, activeContractors } = occupancyState;
  const pct = capacity ? Math.round((occupancy / capacity) * 100) : 0;
  const isDanger = pct >= 90;
  const isWarning = pct >= 75 && pct < 90;

  const handleEvacuate = () => {
    addToast('EMERGENCY EVACUATION TRIGGERED! Notifications sent to all visitors and guards.', 'error');
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2>Live Occupancy</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Real-time monitoring of building capacity for safety compliance.
            </p>
          </div>
          <button className="btn btn-danger" onClick={handleEvacuate}>Trigger Evacuation</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Main Gauge */}
          <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ marginBottom: '32px' }}>Total Building Occupancy</h3>
            <div className="occupancy-gauge">
               <div style={{
                 width: '100%', height: '100%', borderRadius: '50%',
                 background: `conic-gradient(${isDanger ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)'} ${pct}%, var(--bg-secondary) 0)`
               }}>
                 <div style={{
                   position: 'absolute', inset: '10px', background: 'var(--bg-card)',
                   borderRadius: '50%', display: 'flex', flexDirection: 'column',
                   alignItems: 'center', justifyContent: 'center'
                 }}>
                   <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{occupancy}</span>
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {capacity}</span>
                 </div>
               </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <span className={`badge ${isDanger ? 'badge-rejected' : isWarning ? 'badge-pending' : 'badge-approved'}`} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                {pct}% CAPACITY
              </span>
            </div>
          </div>

          {/* Floor Heatmap */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px' }}>Floor-wise Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {floors.map((floor) => {
                const floorMax = floor.max || 1;
                const floorPct = Math.round((floor.count / floorMax) * 100);
                const color = floorPct >= 90 ? 'var(--danger)' : floorPct >= 75 ? 'var(--warning)' : 'var(--success)';
                return (
                  <div key={floor.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 500 }}>{floor.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{floor.count} / {floorMax} <span style={{ color, fontWeight: 600, marginLeft: '8px' }}>({floorPct}%)</span></span>
                    </div>
                    <div style={{ background: 'var(--border)', height: '8px', borderRadius: '4px' }}>
                      <div style={{ width: `${floorPct}%`, height: '100%', background: color, borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contractor Time Tracking */}
        <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Active Contractors & Vendors</h3>
            <span className="badge badge-pending">{activeContractors.length} Active</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company / Vendor</th>
                  <th>Location</th>
                  <th>Entry Time</th>
                  <th>Time Inside</th>
                </tr>
              </thead>
              <tbody>
                {activeContractors.map((contractor) => (
                  <tr key={contractor.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{contractor.name}</td>
                    <td>{contractor.company}</td>
                    <td>{contractor.floor}</td>
                    <td>{contractor.entryTime}</td>
                    <td>
                      <span style={{ 
                        color: 'var(--warning)', fontWeight: 'bold', 
                        background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '4px' 
                      }}>
                        {contractor.timeInside}
                      </span>
                    </td>
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
