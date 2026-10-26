import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FiMap, FiZoomIn, FiZoomOut, FiInfo, 
  FiNavigation, FiClock, FiUsers, FiMapPin, 
  FiLayers, FiChevronRight 
} from 'react-icons/fi';

// Floor definitions
const FLOORS = [
  { id: 0, name: 'Ground Floor' },
  { id: 1, name: 'First Floor' }
];

// Room Data
const ROOMS = [
  // Ground Floor
  { id: 'entrance', name: 'Main Entrance', floor: 0, x: 350, y: 500, w: 100, h: 50, type: 'public', capacity: '-', status: 'Available' },
  { id: 'reception', name: 'Reception Desk', floor: 0, x: 320, y: 400, w: 160, h: 60, type: 'public', capacity: '5', status: 'Available' },
  { id: 'meeting_a', name: 'Meeting Room A', floor: 0, x: 100, y: 250, w: 150, h: 100, type: 'meeting', capacity: '10', status: 'Occupied' },
  { id: 'meeting_b', name: 'Meeting Room B', floor: 0, x: 100, y: 100, w: 150, h: 100, type: 'meeting', capacity: '8', status: 'Available' },
  { id: 'open_office', name: 'Open Office Area', floor: 0, x: 300, y: 50, w: 350, h: 200, type: 'office', capacity: '50', status: 'Available' },
  { id: 'cafeteria', name: 'Cafeteria', floor: 0, x: 550, y: 300, w: 150, h: 120, type: 'amenity', capacity: '40', status: 'Available' },
  { id: 'washrooms_g', name: 'Washrooms', floor: 0, x: 100, y: 400, w: 150, h: 60, type: 'amenity', capacity: '-', status: 'Available' },
  { id: 'elevator_g', name: 'Elevator/Stairs', floor: 0, x: 670, y: 50, w: 100, h: 100, type: 'public', capacity: '12', status: 'Available' },
  
  // First Floor
  { id: 'elevator_1', name: 'Elevator/Stairs', floor: 1, x: 670, y: 50, w: 100, h: 100, type: 'public', capacity: '12', status: 'Available' },
  { id: 'exec_suite', name: 'Executive Suite', floor: 1, x: 300, y: 50, w: 300, h: 150, type: 'office', capacity: '15', status: 'Occupied' },
  { id: 'server_room', name: 'Server Room', floor: 1, x: 100, y: 50, w: 150, h: 120, type: 'restricted', capacity: '2', status: 'Available' },
  { id: 'conf_hall', name: 'Conference Hall', floor: 1, x: 450, y: 300, w: 250, h: 150, type: 'meeting', capacity: '100', status: 'Available' },
  { id: 'meeting_c', name: 'Meeting Room C', floor: 1, x: 100, y: 220, w: 150, h: 100, type: 'meeting', capacity: '12', status: 'Available' },
  { id: 'washrooms_1', name: 'Washrooms', floor: 1, x: 100, y: 400, w: 150, h: 60, type: 'amenity', capacity: '-', status: 'Available' },
];

// Room Colors based on type
const TYPE_COLORS = {
  public: 'var(--accent-1)',
  meeting: 'var(--info)',
  office: 'var(--success)',
  amenity: 'var(--warning)',
  restricted: 'var(--danger)'
};

// Paths to destinations
const PATHS = {
  // Ground Floor Paths
  reception: { d: "M 400 500 L 400 460", floor: 0, steps: ["Start at Main Entrance", "Walk straight for 10m", "Reception is right ahead"] },
  meeting_a: { d: "M 400 500 L 400 300 L 250 300", floor: 0, steps: ["Start at Main Entrance", "Walk past Reception", "Turn left and walk 15m", "Meeting Room A is on your left"] },
  meeting_b: { d: "M 400 500 L 400 150 L 250 150", floor: 0, steps: ["Start at Main Entrance", "Walk past Reception", "Continue straight to the end of the hall", "Turn left, Meeting Room B is on your left"] },
  open_office: { d: "M 400 500 L 400 150 L 400 250", floor: 0, steps: ["Start at Main Entrance", "Walk past Reception", "Walk straight for 30m", "Enter the Open Office Area"] },
  cafeteria: { d: "M 400 500 L 400 360 L 550 360", floor: 0, steps: ["Start at Main Entrance", "Walk past Reception", "Turn right and walk 15m", "Cafeteria is on your right"] },
  washrooms_g: { d: "M 400 500 L 400 430 L 250 430", floor: 0, steps: ["Start at Main Entrance", "Walk towards Reception", "Turn left before Reception", "Washrooms are on your right"] },
  elevator_g: { d: "M 400 500 L 400 100 L 670 100", floor: 0, steps: ["Start at Main Entrance", "Walk straight past Reception", "Turn right at the end of the hall", "Elevator is at the end of the corridor"] },

  // First Floor Paths (from Elevator)
  exec_suite: { d: "M 670 100 L 600 100", floor: 1, steps: ["Take Elevator to First Floor", "Exit Elevator and walk straight", "Executive Suite is ahead"] },
  server_room: { d: "M 670 100 L 250 100", floor: 1, steps: ["Take Elevator to First Floor", "Turn left from Elevator", "Walk straight to the end of the hall", "Server Room is on your right (Restricted Access)"] },
  conf_hall: { d: "M 670 100 L 670 375 L 700 375", floor: 1, steps: ["Take Elevator to First Floor", "Turn right and walk down the hall", "Conference Hall is on your left"] },
  meeting_c: { d: "M 670 100 L 350 100 L 350 270 L 250 270", floor: 1, steps: ["Take Elevator to First Floor", "Turn left and walk 20m", "Turn right down the corridor", "Meeting Room C is on your right"] },
  washrooms_1: { d: "M 670 100 L 350 100 L 350 430 L 250 430", floor: 1, steps: ["Take Elevator to First Floor", "Turn left and walk 20m", "Turn right and go down the corridor", "Washrooms are on your right"] },
};

export default function IndoorNavigation() {
  const { currentUser } = useAuth();
  const [activeFloor, setActiveFloor] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Update floor when destination changes
  useEffect(() => {
    if (selectedDestination && PATHS[selectedDestination]) {
      setActiveFloor(PATHS[selectedDestination].floor);
    }
  }, [selectedDestination]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  const handleRoomClick = (room, e) => {
    // Only select if it has a path
    if (PATHS[room.id]) {
      setSelectedDestination(room.id);
    } else if (room.id === 'entrance' || room.id.startsWith('elevator')) {
      // Just select room info but no destination path
    }
    setActiveRoom(room);
    
    // Get relative click position for tooltip
    const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top
    });
  };

  const getFloorRooms = (floor) => ROOMS.filter(r => r.floor === floor);

  const activePath = selectedDestination && PATHS[selectedDestination]?.floor === activeFloor 
    ? PATHS[selectedDestination] 
    : null;

  return (
    <div className="indoor-navigation" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
              <FiNavigation style={{ color: 'var(--accent-1)' }} />
              Indoor Navigation
            </h2>
            <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>Find your way around the building</p>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleZoomOut}
                title="Zoom Out"
                style={{ padding: '8px' }}
              >
                <FiZoomOut size={18} />
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleZoomIn}
                title="Zoom In"
                style={{ padding: '8px' }}
              >
                <FiZoomIn size={18} />
              </button>
            </div>
            
            <div className="floor-tabs" style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
              {FLOORS.map(floor => (
                <button
                  key={floor.id}
                  onClick={() => setActiveFloor(floor.id)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: activeFloor === floor.id ? 'var(--accent-1)' : 'transparent',
                    color: activeFloor === floor.id ? 'white' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: activeFloor === floor.id ? '600' : '400',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FiLayers />
                  {floor.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Map Container */}
          <div style={{ 
            flex: '1 1 600px', 
            position: 'relative', 
            background: 'var(--bg-secondary)', 
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            minHeight: '500px'
          }}>
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 800 600" 
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease',
                cursor: 'grab'
              }}
            >
              {/* Grid Background */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
                </pattern>
                
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                {/* Animated Dash */}
                <style>
                  {`
                    @keyframes drawPath {
                      0% { stroke-dashoffset: 1000; }
                      100% { stroke-dashoffset: 0; }
                    }
                    .animated-path {
                      stroke-dasharray: 10 5;
                      animation: drawPath 3s linear forwards, dash 1s linear infinite;
                    }
                    @keyframes dash {
                      to { stroke-dashoffset: -15; }
                    }
                    .room-hover:hover {
                      filter: brightness(1.2);
                      stroke: white;
                      stroke-width: 2;
                    }
                  `}
                </style>
              </defs>
              <rect width="800" height="600" fill="url(#grid)" />

              {/* Draw Corridors Context */}
              {activeFloor === 0 ? (
                <>
                  <rect x="380" y="50" width="40" height="450" fill="var(--bg-card)" opacity="0.6" />
                  <rect x="250" y="280" width="130" height="40" fill="var(--bg-card)" opacity="0.6" />
                  <rect x="250" y="130" width="130" height="40" fill="var(--bg-card)" opacity="0.6" />
                  <rect x="420" y="340" width="130" height="40" fill="var(--bg-card)" opacity="0.6" />
                </>
              ) : (
                <>
                  <rect x="330" y="80" width="340" height="40" fill="var(--bg-card)" opacity="0.6" />
                  <rect x="330" y="120" width="40" height="350" fill="var(--bg-card)" opacity="0.6" />
                  <rect x="250" y="250" width="80" height="40" fill="var(--bg-card)" opacity="0.6" />
                  <rect x="250" y="410" width="80" height="40" fill="var(--bg-card)" opacity="0.6" />
                </>
              )}

              {/* Rooms */}
              {getFloorRooms(activeFloor).map(room => (
                <g 
                  key={room.id} 
                  onClick={(e) => handleRoomClick(room, e)}
                  style={{ cursor: PATHS[room.id] ? 'pointer' : 'default' }}
                  className="room-hover"
                >
                  <rect 
                    x={room.x} 
                    y={room.y} 
                    width={room.w} 
                    height={room.h} 
                    rx="8" 
                    fill={TYPE_COLORS[room.type]} 
                    opacity={selectedDestination === room.id ? "1" : "0.7"}
                    stroke={selectedDestination === room.id ? "white" : "transparent"}
                    strokeWidth={selectedDestination === room.id ? "3" : "0"}
                  />
                  <text 
                    x={room.x + room.w/2} 
                    y={room.y + room.h/2} 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="600"
                    style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                  >
                    {room.name}
                  </text>
                  
                  {room.id === 'entrance' && (
                    <circle cx={room.x + room.w/2} cy={room.y - 10} r="6" fill="var(--success)" className="pulse" />
                  )}
                </g>
              ))}

              {/* Animated Path */}
              {activePath && (
                <g>
                  {/* Background line for contrast */}
                  <path 
                    d={activePath.d} 
                    fill="none" 
                    stroke="rgba(0,0,0,0.3)" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  {/* Main animated path */}
                  <path 
                    d={activePath.d} 
                    fill="none" 
                    stroke="var(--accent-1)" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="animated-path"
                    filter="url(#glow)"
                  />
                  {/* Start Dot */}
                  <circle 
                    cx={activePath.d.split(' ')[1]} 
                    cy={activePath.d.split(' ')[2]} 
                    r="5" 
                    fill="white" 
                    stroke="var(--accent-1)" 
                    strokeWidth="2" 
                  />
                  {/* End Dot */}
                  <circle 
                    cx={activePath.d.split(' ').slice(-2)[0]} 
                    cy={activePath.d.split(' ').slice(-1)[0]} 
                    r="8" 
                    fill="var(--accent-1)" 
                    stroke="white" 
                    strokeWidth="2" 
                  />
                  <circle 
                    cx={activePath.d.split(' ').slice(-2)[0]} 
                    cy={activePath.d.split(' ').slice(-1)[0]} 
                    r="4" 
                    fill="white" 
                  />
                </g>
              )}
            </svg>

            {/* Room Tooltip */}
            {activeRoom && (
              <div 
                className="glass-card" 
                style={{
                  position: 'absolute',
                  left: tooltipPos.x > 400 ? tooltipPos.x - 220 : tooltipPos.x + 20,
                  top: tooltipPos.y > 300 ? tooltipPos.y - 150 : tooltipPos.y + 20,
                  padding: '15px',
                  width: '200px',
                  zIndex: 10,
                  pointerEvents: 'none',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <h4 style={{ margin: '0 0 10px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  {activeRoom.name}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiLayers /> Floor
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      {activeRoom.floor === 0 ? 'Ground' : 'First'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiUsers /> Capacity
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      {activeRoom.capacity}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FiInfo /> Status
                    </span>
                    <span style={{ 
                      color: activeRoom.status === 'Available' ? 'var(--success)' : 'var(--danger)', 
                      fontWeight: '600' 
                    }}>
                      {activeRoom.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Controls */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Destination Selector */}
            <div className="glass-card" style={{ padding: '20px', background: 'var(--bg-secondary)' }}>
              <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <FiMapPin style={{ color: 'var(--accent-1)' }} />
                Select Destination
              </h3>
              <select 
                className="form-input" 
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)' }}
              >
                <option value="">-- Choose a destination --</option>
                <optgroup label="Ground Floor">
                  {ROOMS.filter(r => r.floor === 0 && PATHS[r.id]).map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </optgroup>
                <optgroup label="First Floor">
                  {ROOMS.filter(r => r.floor === 1 && PATHS[r.id]).map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Directions */}
            <div className="glass-card" style={{ padding: '20px', flex: '1', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <FiNavigation style={{ color: 'var(--success)' }} />
                Directions
              </h3>
              
              <div style={{ flex: '1', overflowY: 'auto' }}>
                {activePath ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {activePath.steps.map((step, index) => (
                      <div key={index} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: index === activePath.steps.length - 1 ? 'var(--success)' : 'var(--accent-1)', 
                          color: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                          {step}
                        </div>
                      </div>
                    ))}
                    
                    <div style={{ 
                      marginTop: '15px', 
                      padding: '12px', 
                      background: 'rgba(40, 167, 69, 0.1)', 
                      borderLeft: '4px solid var(--success)',
                      borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}>
                      <strong>Arrived:</strong> You have reached {ROOMS.find(r => r.id === selectedDestination)?.name}.
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%', 
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    <FiMap size={48} style={{ opacity: 0.5, marginBottom: '15px' }} />
                    <p>Select a destination to get turn-by-turn directions.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="glass-card" style={{ padding: '15px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Legend</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color }}></div>
                    <span style={{ textTransform: 'capitalize' }}>{type}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
