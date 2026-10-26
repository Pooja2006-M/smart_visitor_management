import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FiAlertCircle, FiPhone, FiActivity, FiShield, FiMapPin, FiCheckCircle, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa'; 

export default function EmergencySOS() {
  const { userProfile } = useAuth();
  const { addToast } = useToast();
  const [selectedType, setSelectedType] = useState('medical');
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSent, setIsSent] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  const [expandedTip, setExpandedTip] = useState(null);

  const pressTimer = useRef(null);
  const progressInterval = useRef(null);
  const HOLD_DURATION = 3000;
  const UPDATE_INTERVAL = 50;

  const emergencyTypes = [
    { id: 'medical', label: 'Medical Emergency', icon: FiActivity, color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/30' },
    { id: 'fire', label: 'Fire Alert', icon: FaFire, color: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/30' },
    { id: 'security', label: 'Security Threat', icon: FiShield, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
    { id: 'lost', label: 'Lost / Need Help', icon: FiMapPin, color: 'from-purple-500 to-fuchsia-600', shadow: 'shadow-purple-500/30' }
  ];

  const emergencyContacts = [
    { name: 'Hospital', number: '108', icon: FiActivity, color: 'text-red-500' },
    { name: 'Fire', number: '101', icon: FaFire, color: 'text-orange-500' },
    { name: 'Police', number: '100', icon: FiShield, color: 'text-blue-500' },
    { name: 'Security', number: '+919876543210', icon: FiPhone, color: 'text-purple-500', display: '+91 98765 43210' }
  ];

  const safetyTips = [
    { id: 1, title: 'Fire Evacuation Route', content: 'Use the nearest stairs. Do NOT use elevators. Follow the green exit signs to the assembly point.' },
    { id: 2, title: 'Medical Emergency Steps', content: 'Do not move the injured person unless they are in immediate danger. Call the emergency response team and wait for medical professionals.' },
    { id: 3, title: 'What to do if lost', content: 'Stay where you are. Contact your host or company security using the numbers provided above. Provide your closest landmark.' },
    { id: 4, title: 'Security Threat Protocol', content: 'Run, Hide, Tell. Evacuate if safe, otherwise hide in a secure area and lock the door. Silence your phone.' }
  ];

  useEffect(() => {
    if (!userProfile?.email) return;

    const q = query(
      collection(db, 'emergencyAlerts'),
      where('visitorEmail', '==', userProfile.email),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlertHistory(alerts);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handlePressStart = () => {
    if (isSent) return;
    setIsPressing(true);
    setProgress(0);
    
    if (navigator.vibrate) navigator.vibrate(50);

    let currentProgress = 0;
    progressInterval.current = setInterval(() => {
      currentProgress += (UPDATE_INTERVAL / HOLD_DURATION) * 100;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressInterval.current);
      }
      setProgress(currentProgress);
    }, UPDATE_INTERVAL);

    pressTimer.current = setTimeout(() => {
      triggerAlert();
    }, HOLD_DURATION);
  };

  const handlePressEnd = () => {
    if (!isSent) {
      setIsPressing(false);
      setProgress(0);
      clearTimeout(pressTimer.current);
      clearInterval(progressInterval.current);
    }
  };

  const triggerAlert = async () => {
    setIsPressing(false);
    setProgress(100);
    
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    try {
      await addDoc(collection(db, 'emergencyAlerts'), {
        visitorEmail: userProfile?.email || 'Unknown',
        visitorName: userProfile?.name || userProfile?.fullName || 'Unknown Visitor',
        emergencyType: selectedType,
        status: 'sent',
        timestamp: serverTimestamp(),
        location: 'Main Building'
      });
      
      setIsSent(true);
      addToast('Emergency alert sent successfully!', 'success');
      
      setTimeout(() => {
        setIsSent(false);
        setProgress(0);
      }, 5000);
    } catch (error) {
      console.error('Error sending alert:', error);
      addToast('Failed to send alert. Please call emergency numbers directly.', 'error');
      setProgress(0);
    }
  };

  const toggleTip = (id) => {
    setExpandedTip(expandedTip === id ? null : id);
  };

  const getTypeLabel = (typeId) => {
    return emergencyTypes.find(t => t.id === typeId)?.label || typeId;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'acknowledged': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'resolved': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in pb-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-space-grotesk font-bold text-red-500 flex items-center justify-center gap-3">
          <FiAlertCircle className="w-8 h-8 animate-pulse" />
          Emergency SOS
        </h2>
        <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
          In case of emergency, hold the SOS button or contact emergency services directly.
        </p>
      </div>

      {/* Emergency Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {emergencyTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`relative p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                isSelected
                  ? `border-transparent shadow-lg ${type.shadow} scale-105`
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent-1)] opacity-70 hover:opacity-100'
              }`}
            >
              {isSelected && (
                <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-10 rounded-xl`} />
              )}
              {isSelected && (
                <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-20 blur-md rounded-xl -z-10`} />
              )}
              <div className={`p-3 rounded-full ${isSelected ? `bg-gradient-to-br ${type.color} text-white` : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)]'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-sm font-semibold text-center ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                {type.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Giant SOS Button */}
      <div className="flex flex-col items-center justify-center py-8">
        <div 
          className="relative flex items-center justify-center cursor-pointer select-none touch-none"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          {/* Progress Ring */}
          <svg className="absolute w-[240px] h-[240px] -rotate-90 pointer-events-none">
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-[var(--border)]"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${isSent ? 'text-green-500' : 'text-red-500'} transition-all duration-100`}
              strokeLinecap="round"
            />
          </svg>

          {/* Glowing background */}
          <div className={`absolute inset-0 bg-red-500 rounded-full blur-2xl transition-opacity duration-300 -z-10 ${isPressing ? 'opacity-50 animate-pulse' : 'opacity-20'}`} />
          
          {/* The Button */}
          <div className={`w-[200px] h-[200px] rounded-full flex flex-col items-center justify-center transition-transform duration-300 border-4 shadow-xl ${
            isSent 
              ? 'bg-green-500 border-green-400 scale-100' 
              : isPressing 
                ? 'bg-red-600 border-red-500 scale-95' 
                : 'bg-red-500 border-red-400 hover:scale-105'
          }`}>
            {isSent ? (
              <div className="flex flex-col items-center text-white animate-fade-in">
                <FiCheckCircle className="w-16 h-16 mb-2" />
                <span className="font-bold text-xl tracking-wider">SENT!</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-white">
                <span className="text-5xl font-black tracking-widest mb-2 font-space-grotesk drop-shadow-md">SOS</span>
                <span className="text-sm font-semibold opacity-90 uppercase tracking-widest">
                  {isPressing ? 'Holding...' : 'Hold 3 Sec'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {!isSent && progress > 0 && (
          <div className="mt-6 text-red-500 font-semibold animate-pulse text-lg">
            Keep holding...
          </div>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="glass-card p-6 rounded-2xl border border-[var(--border)]">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <FiPhone className="w-5 h-5 text-blue-500" />
          Emergency Contacts
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {emergencyContacts.map((contact, i) => (
            <a
              key={i}
              href={`tel:${contact.number}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent-1)] transition-colors group"
            >
              <div className={`p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] ${contact.color}`}>
                <contact.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">{contact.name}</div>
                <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-1)] transition-colors">
                  {contact.display || contact.number}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Safety Tips Panel */}
        <div className="glass-card p-6 rounded-2xl border border-[var(--border)] h-fit">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <FiShield className="w-5 h-5 text-green-500" />
            Safety Tips
          </h3>
          <div className="space-y-3">
            {safetyTips.map((tip) => (
              <div key={tip.id} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-card)]">
                <button
                  onClick={() => toggleTip(tip.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--bg-card)]/50 transition-colors"
                >
                  <span className="font-semibold text-[var(--text-primary)]">{tip.title}</span>
                  {expandedTip === tip.id ? (
                    <FiChevronUp className="text-[var(--text-secondary)]" />
                  ) : (
                    <FiChevronDown className="text-[var(--text-secondary)]" />
                  )}
                </button>
                <div className={`px-4 pb-4 text-sm text-[var(--text-secondary)] transition-all duration-300 ${expandedTip === tip.id ? 'block' : 'hidden'}`}>
                  {tip.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Alert History */}
        <div className="glass-card p-6 rounded-2xl border border-[var(--border)]">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <FiClock className="w-5 h-5 text-purple-500" />
            Recent Alerts
          </h3>
          <div className="space-y-4">
            {alertHistory.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-xl">
                No alerts history found.
              </div>
            ) : (
              alertHistory.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {getTypeLabel(alert.emergencyType)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {alert.timestamp?.toDate().toLocaleString() || 'Just now'}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      {alert.location}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
