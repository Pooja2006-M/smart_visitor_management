import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FiActivity, FiArrowDownRight, FiArrowUpRight, FiBell, FiCalendar, FiCamera, FiCheckCircle, FiChevronRight, FiClock, FiDownload, FiEye, FiFilter, FiGrid, FiMap, FiMapPin, FiMessageSquare, FiMoreHorizontal, FiPlus, FiSearch, FiShield, FiSmartphone, FiTruck, FiUsers, FiXCircle, FiZap, FiSend, FiAlertCircle, FiLock, FiCheck, FiRefreshCw, FiVolume2, FiGlobe, FiStar } from 'react-icons/fi';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../firebase/config';
import { collection, doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { createVisitQrUrl } from '../../utils/visitQr';

const localizer = momentLocalizer(moment);

// Multi-language Translations
const translations = {
  en: {
    title: "Good morning",
    workspace: "HOST WORKSPACE",
    live: "Live",
    tabs: { overview: "Overview", requests: "Visit Requests", calendar: "Calendar" },
    smartOps: "SMART VISITOR OPERATIONS",
    smartOpsSub: "Everything you need for a secure, effortless visit",
    stats: { total: "Total visits", approved: "Approved", pending: "Pending review", active: "Active inside", today: "Today's visitors", week: "This week", completed: "Completed", rejected: "Rejected" }
  },
  ta: {
    title: "காலை வணக்கம்",
    workspace: "விருந்தினர் மேலாண்மை",
    live: "நேரலை",
    tabs: { overview: "கண்ணோட்டம்", requests: "வருகை கோரிக்கைகள்", calendar: "நாட்காட்டி" },
    smartOps: "ஸ்மார்ட் பார்வையாளர் செயல்பாடுகள்",
    smartOpsSub: "பாதுகாப்பான மற்றும் எளிமையான வருகைக்கு தேவையான அனைத்தும்",
    stats: { total: "மொத்த வருகைகள்", approved: "அனுமதிக்கப்பட்டவை", pending: "விசாரணையில் உள்ளவை", active: "உள்ளே இருப்பவர்கள்", today: "இன்றைய வருகையாளர்கள்", week: "இந்த வாரம்", completed: "முடிவடைந்தவை", rejected: "நிராகரிக்கப்பட்டவை" }
  },
  hi: {
    title: "शुभ प्रभात",
    workspace: "मेजबान कार्यक्षेत्र",
    live: "लाइव",
    tabs: { overview: "अवलोकन", requests: "आगमन अनुरोध", calendar: "कैलेंडर" },
    smartOps: "स्मार्ट विज़िटर ऑपरेशन्स",
    smartOpsSub: "एक सुरक्षित, सहज यात्रा के लिए आपकी ज़रूरत की हर चीज़",
    stats: { total: "कुल आगंतुक", approved: "स्वीकृत", pending: "लंबित समीक्षा", active: "सक्रिय अंदर", today: "आज के आगंतुक", week: "इस सप्ताह", completed: "पूरा किया गया", rejected: "अस्वीकृत" }
  }
};

const demoVisits = [
  { id: 'VST-24081', visitorName: 'Aarav Sharma', email: 'aarav@vertex.co', phone: '+91 98765 43210', purpose: 'Product roadmap review', visitDate: '2026-07-28', visitTime: '10:30', status: 'approved', room: 'Orion 4A', department: 'Engineering', checkIn: '10:24' },
  { id: 'VST-24082', visitorName: 'Maya Chen', email: 'maya@northstar.io', phone: '+91 98765 43211', purpose: 'Partnership discussion', visitDate: '2026-07-28', visitTime: '11:45', status: 'pending', department: 'Sales' },
  { id: 'VST-24083', visitorName: 'Rahul Mehta', email: 'rahul@finlabs.com', phone: '+91 98765 43212', purpose: 'Financial audit', visitDate: '2026-07-29', visitTime: '09:30', status: 'approved', room: 'Summit 2B', department: 'Finance' },
  { id: 'VST-24084', visitorName: 'Sofia Williams', email: 'sofia@orbit.com', phone: '+91 98765 43213', purpose: 'Design systems workshop', visitDate: '2026-07-30', visitTime: '14:00', status: 'pending', department: 'IT' },
  { id: 'VST-24085', visitorName: 'Rohan Patel', email: 'rohan@bluewave.com', phone: '+91 98765 43214', purpose: 'Delivery pickup', visitDate: '2026-07-26', visitTime: '15:00', status: 'completed', department: 'IT' },
];

const DEFAULT_HOST_AVAILABILITY = {
  Monday: { enabled: true, start: '09:00', end: '17:00' },
  Tuesday: { enabled: true, start: '09:00', end: '17:00' },
  Wednesday: { enabled: true, start: '09:00', end: '17:00' },
  Thursday: { enabled: true, start: '09:00', end: '17:00' },
  Friday: { enabled: true, start: '09:00', end: '13:00' },
  Saturday: { enabled: false, start: '10:00', end: '12:00' },
  Sunday: { enabled: false, start: '10:00', end: '12:00' },
};

const parseTimeToMinutes = (timeValue = '09:00') => {
  if (!timeValue) return 9 * 60;
  const raw = String(timeValue).trim();
  if (/AM|PM/i.test(raw)) {
    const [clock, modifier] = raw.split(/\s+/);
    let [hours, minutes] = clock.split(':').map(Number);
    if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
  }
  const [hours, minutes] = raw.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const getDateTimeFromMinutes = (dateString, totalMinutes) => {
  const base = new Date(`${dateString}T00:00:00`);
  base.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  return base;
};

const formatMinutes = (totalMinutes) => {
  const safe = Math.max(0, totalMinutes);
  const hours = Math.floor(safe / 60) % 24;
  const minutes = safe % 60;
  const normalized = hours % 12 === 0 ? 12 : hours % 12;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${normalized}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

const generateSlotsForDate = (dateString, config = DEFAULT_HOST_AVAILABILITY, slotDuration = 30, maxVisitorsPerSlot = 2, blockedDates = []) => {
  if (!dateString) return [];
  if (blockedDates.includes(dateString)) return [];
  const date = new Date(`${dateString}T12:00:00`);
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  const dayConfig = config[dayName] || { enabled: false, start: '09:00', end: '17:00' };

  if (!dayConfig.enabled) return [];

  const startMinutes = parseTimeToMinutes(dayConfig.start);
  const endMinutes = parseTimeToMinutes(dayConfig.end);
  const slots = [];

  for (let current = startMinutes; current + slotDuration <= endMinutes; current += slotDuration) {
    const start = current;
    const end = current + slotDuration;
    slots.push({
      id: `${dateString}-${start}`,
      date: dateString,
      start: formatMinutes(start),
      end: formatMinutes(end),
      startMinutes: start,
      endMinutes: end,
      status: 'available',
      occupancy: 0,
      maxVisitorsPerSlot,
    });
  }

  return slots;
};

const findAvailableSlotsForDate = (dateString, visits = [], config = DEFAULT_HOST_AVAILABILITY, slotDuration = 30, maxVisitors = 2, blockedDates = []) => {
  const slots = generateSlotsForDate(dateString, config, slotDuration, maxVisitors, blockedDates);
  return slots.map((slot) => {
    const slotStart = slot.startMinutes;
    const slotEnd = slot.endMinutes;
    const overlappingApproved = visits.filter((visit) => {
      if (visit.visitDate !== dateString || visit.status !== 'approved') return false;
      const visitStart = parseTimeToMinutes(visit.visitTime || '09:00');
      const visitEnd = visitStart + 30;
      return visitStart < slotEnd && visitEnd > slotStart;
    });

    const occupancy = overlappingApproved.length;
    return {
      ...slot,
      occupancy,
      status: occupancy >= maxVisitors ? 'full' : 'available',
    };
  });
};

const getEarliestAvailableSlot = (dateString, visits = [], config = DEFAULT_HOST_AVAILABILITY, slotDuration = 30, maxVisitors = 2) => {
  const candidates = findAvailableSlotsForDate(dateString, visits, config, slotDuration, maxVisitors);
  return candidates.find((slot) => slot.status === 'available') || null;
};

const initials = (name = '') => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
const niceDate = new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

export default function HostDashboard() {
  const { userProfile } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selected, setSelected] = useState(null);
  const [bookingRoomFor, setBookingRoomFor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('Orion 4A');
  const [selectedApprovalSlot, setSelectedApprovalSlot] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [now, setNow] = useState(new Date());
  const [activeUrgentVisit, setActiveUrgentVisit] = useState(null);
  const [dismissedUrgentVisitId, setDismissedUrgentVisitId] = useState(null);
  const today = now.toISOString().slice(0, 10);
  const [hostAvailability, setHostAvailability] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_HOST_AVAILABILITY;
    try {
      const stored = window.localStorage.getItem('host-availability-config');
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed?.availability || parsed || DEFAULT_HOST_AVAILABILITY;
    } catch {
      return DEFAULT_HOST_AVAILABILITY;
    }
  });
  const [slotSettings] = useState(() => {
    if (typeof window === 'undefined') return { slotDuration: 30, maxVisitorsPerSlot: 2 };
    try {
      const parsed = JSON.parse(window.localStorage.getItem('host-availability-config') || 'null');
      return {
        slotDuration: Number(parsed?.slotDuration) || 30,
        maxVisitorsPerSlot: Number(parsed?.maxVisitorsPerSlot) || 2,
      };
    } catch {
      return { slotDuration: 30, maxVisitorsPerSlot: 2 };
    }
  });
  const [blockedDates] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = JSON.parse(window.localStorage.getItem('host-availability-config') || 'null');
      return Array.isArray(saved?.blockedDates) ? saved.blockedDates : [];
    } catch {
      return [];
    }
  });

  // Localization State
  const [lang, setLang] = useState('en');
  const t = translations[lang] || translations.en;

  // Smart Tool Modal States
  const [activeSmartTool, setActiveSmartTool] = useState(null);

  // Live Chat Simulator state
  const [activeChatTarget, setActiveChatTarget] = useState('Reception Desk');
  const [chatMessages, setChatMessages] = useState({
    'Reception Desk': [
      { sender: 'Receptionist', text: 'Hi, Aarav Sharma has just arrived. Should I send him up?', time: '10:22 AM' }
    ],
    'Visitor (Aarav)': [
      { sender: 'Aarav', text: 'Hello! I am in the lobby. Can you guide me to Orion 4A?', time: '10:25 AM' }
    ]
  });
  const [chatInput, setChatInput] = useState('');

  // Parking Allocation State
  const [reservedParking, setReservedParking] = useState({
    'VST-24081': 'Slot P-14',
    'VST-24083': 'Slot P-08'
  });
  const [selectedParkingSlot, setSelectedParkingSlot] = useState('P-15');

  // Secure QR Expiry Pass State
  const [qrVisitor, setQrVisitor] = useState('VST-24081');
  const [qrExpiryHours, setQrExpiryHours] = useState('2');
  const [qrGeneratedToken, setQrGeneratedToken] = useState('');

  // Face Recognition State
  const [faceCheckStatus, setFaceCheckStatus] = useState('idle'); // idle, scanning, success, failed
  const [faceMatchScore, setFaceMatchScore] = useState(null);

  // Feedback dashboard analytics data
  const feedBacks = [
    { visitor: 'Aarav Sharma', rating: 5, comment: 'Excellent onboarding process and very intuitive navigation.', date: 'Today' },
    { visitor: 'Rohan Patel', rating: 4, comment: 'Clean meeting room. Host was extremely helpful.', date: 'Yesterday' }
  ];

  // Auto Reminders config state
  const [remindersConfig, setRemindersConfig] = useState({
    before15: true,
    before30: true,
    smsAlert: true,
    emailAlert: true,
    autoEscalate: false
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!userProfile?.uid) return undefined;

    const hostEmail = userProfile.email?.trim().toLowerCase();
    const unsubscribe = onSnapshot(collection(db, 'registrations'), (snapshot) => {
      setVisits(snapshot.docs
        // hostEmail is used for newly created requests; hostId keeps existing
        // requests visible for hosts created before this routing change.
        .filter((item) => {
          const data = item.data();
          return data.hostId === userProfile.uid
            || data.hostId === hostEmail
            || data.hostEmail?.trim?.().toLowerCase() === hostEmail;
        })
        .map((item) => {
        const data = item.data();
        return {
          id: item.id,
          visitorName: data.fullName || 'Visitor',
          email: data.email || '',
          phone: data.phone || '',
          purpose: data.purpose || 'General Visit',
          visitDate: data.visitDate || '',
          visitTime: data.visitTime || '',
          status: data.status || 'pending',
          department: data.department || 'General',
          company: data.company || '',
          room: data.room || '',
          checkIn: data.checkIn || null,
          checkOut: data.checkOut || null,
          createdAt: data.createdAt?.toDate?.() || null,
          isUrgent: data.isUrgent || false,
        };
      }));
    }, () => {
      addToast('Unable to load your visitor requests.', 'warning');
    });

    return () => unsubscribe();
  }, [userProfile?.uid, addToast]);

  useEffect(() => {
    const urgentPending = visits.find(v => v.status === 'pending' && v.isUrgent);
    if (urgentPending && urgentPending.id !== dismissedUrgentVisitId && !activeUrgentVisit) {
      setActiveUrgentVisit(urgentPending);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
        console.warn('Audio play failed', e);
      }
    } else if (!urgentPending && activeUrgentVisit) {
      setActiveUrgentVisit(null);
      setDismissedUrgentVisitId(null);
    }
  }, [visits, activeUrgentVisit, dismissedUrgentVisitId]);

  useEffect(() => {
    if (!location.hash) return;
    const sectionId = location.hash.replace('#', '');
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const handleAction = async (id, action, room = null, selectedTime = null) => {
    const targetVisit = visits.find(v => v.id === id);
    if (action === 'approved' && targetVisit) {
      const slotTime = selectedTime || targetVisit.visitTime || '09:00';
      const slotTaken = visits.some(v =>
        v.id !== id &&
        v.status === 'approved' &&
        v.visitDate === targetVisit.visitDate &&
        v.visitTime === slotTime
      );
      if (slotTaken) {
        addToast('This slot is already assigned to another approved visit.', 'warning');
        return;
      }
    }
    const updated = visits.map(v => v.id === id ? { ...v, status: action, room: room || v.room, visitTime: selectedTime || v.visitTime } : v);
    setVisits(updated);
    try {
      const data = { status: action };
      if (action === 'approved') { 
        data.room = room; 
        data.visitTime = selectedTime || targetVisit?.visitTime || '09:00';
        data.approvedAt = serverTimestamp();
        data.approvedByName = userProfile?.name || userProfile?.displayName || 'Host';
        
        if (targetVisit?.isUrgent) {
          data.entryOTP = Math.floor(1000 + Math.random() * 9000).toString();
        }
      }
      await updateDoc(doc(db, 'registrations', id), data);
      addToast(`Visit ${action === 'approved' ? 'approved and room assigned.' : action === 'completed' ? 'marked complete.' : 'rejected.'}`, action === 'approved' ? 'success' : action === 'completed' ? 'info' : 'error');
    } catch { addToast('The visit was updated locally. Sync will retry when connected.', 'info'); }
    setBookingRoomFor(null); setSelected(null); setSelectedApprovalSlot('');
  };

  useEffect(() => {
    if (!bookingRoomFor) {
      setSelectedApprovalSlot('');
      return;
    }

    const current = visits.find((v) => v.id === bookingRoomFor);
    if (!current) return;

    const earliest = getEarliestAvailableSlot(current.visitDate || today, visits, hostAvailability, slotSettings.slotDuration, slotSettings.maxVisitorsPerSlot);
    if (earliest && !selectedApprovalSlot) {
      setSelectedApprovalSlot(earliest.start);
    }
  }, [bookingRoomFor, visits, today, hostAvailability, selectedApprovalSlot]);

  const handleViewQR = (visit) => {
    setQrVisitor(visit.id);
    setQrGeneratedToken(createVisitQrUrl(visit.id));
    setActiveSmartTool('qr-checkin');
  };

  // PDF Generator for Digital Pass
  const generatePDFPass = (visit) => {
    if (!visit) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150]
    });

    // Outer Border
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.rect(2, 2, 96, 146);

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(2, 2, 96, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('VISITOR IQ PASS', 50, 12, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Secure Workspace Digital Entry Pass', 50, 18, { align: 'center' });

    // Visitor Info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(visit.visitorName, 10, 40);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: #${visit.id}`, 10, 46);
    doc.text(`Purpose: ${visit.purpose}`, 10, 52);
    doc.text(`Department: ${visit.department}`, 10, 58);
    doc.text(`Date & Time: ${visit.visitDate} @ ${visit.visitTime || '10:00 AM'}`, 10, 64);
    doc.text(`Assigned Space: ${visit.room || 'Lobby Waiting Area'}`, 10, 70);

    // Secure Token QR label
    doc.setFillColor(240, 244, 248);
    doc.rect(10, 78, 80, 50, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('SCAN THIS QR AT THE SECURITY KIOSK', 50, 84, { align: 'center' });
    
    // Simulating a QR outline/placeholder inside PDF
    doc.setDrawColor(100, 100, 100);
    doc.rect(35, 90, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('[SECURE ENTRY MATRIX QR CODE]', 50, 106, { align: 'center' });
    doc.text(`Valid for host: ${userProfile?.name || 'Alex'}`, 50, 124, { align: 'center' });

    // Save
    doc.save(`Visitor_Pass_${visit.id}.pdf`);
    addToast('Digital Pass PDF downloaded successfully.', 'success');
  };

  const handleLeaveFeedback = (visit) => {
    addToast(`Redirecting to feedback for ${visit.visitorName}.`, 'info');
  };

  const pending = visits.filter(v => v.status === 'pending');
  const approved = visits.filter(v => v.status === 'approved');
  const todayVisits = visits.filter(v => v.visitDate === today);
  const filteredVisits = visits.filter(v => (filter === 'all' || v.status === filter) && `${v.visitorName} ${v.email} ${v.id} ${v.department}`.toLowerCase().includes(search.toLowerCase()));

  const generatedSlotEvents = useMemo(() => {
    const dates = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() + index);
      return date.toISOString().slice(0, 10);
    });

    const events = [];
    dates.forEach((dateString) => {
      const candidates = findAvailableSlotsForDate(dateString, visits, hostAvailability, slotSettings.slotDuration, slotSettings.maxVisitorsPerSlot, blockedDates);
      candidates.forEach((slot) => {
        if (slot.status !== 'available') return;
        events.push({
          id: `slot-${slot.id}`,
          title: `Open slot • ${slot.start} - ${slot.end}`,
          start: getDateTimeFromMinutes(dateString, slot.startMinutes),
          end: getDateTimeFromMinutes(dateString, slot.endMinutes),
          resource: { type: 'generated-slot', slot },
          allDay: false,
        });
      });
    });
    return events;
  }, [now, visits, hostAvailability, blockedDates]);

  const calendarEvents = [
    ...approved.filter(v => v.visitDate).map(v => ({
      title: `${v.visitorName} — ${v.purpose}`,
      start: new Date(`${v.visitDate}T${v.visitTime || '09:00'}`),
      end: new Date(`${v.visitDate}T${v.visitTime || '09:00'}`),
      resource: v,
    })),
    ...generatedSlotEvents,
  ];

  const handleCalendarSlotSelect = ({ start, end }) => {
    const date = start.toLocaleDateString('en-CA');
    const time = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addToast(`Selected slot: ${date}, ${time} - ${endTime}.`, 'info');
  };

  const dailyAutoSlots = useMemo(() => {
    const nextDate = today;
    return findAvailableSlotsForDate(nextDate, visits, hostAvailability, slotSettings.slotDuration, slotSettings.maxVisitorsPerSlot, blockedDates).slice(0, 6);
  }, [today, visits, hostAvailability, blockedDates]);

  const pendingSuggestions = useMemo(() => {
    return pending.reduce((acc, visit) => {
      const slot = getEarliestAvailableSlot(visit.visitDate || today, visits, hostAvailability, slotSettings.slotDuration, slotSettings.maxVisitorsPerSlot);
      acc[visit.id] = slot ? slot.start : 'No slot available';
      return acc;
    }, {});
  }, [pending, visits, hostAvailability, today]);

  const weeklyTraffic = useMemo(() => {
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
    const previousWeekStart = new Date(startOfWeek);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const nextWeekStart = new Date(startOfWeek);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const data = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ day, visitors: 0 }));
    let previousWeekTotal = 0;

    visits.forEach((visit) => {
      const registeredAt = visit.createdAt || new Date();
      if (registeredAt >= startOfWeek && registeredAt < nextWeekStart) {
        data[(registeredAt.getDay() + 6) % 7].visitors += 1;
      } else if (registeredAt >= previousWeekStart && registeredAt < startOfWeek) {
        previousWeekTotal += 1;
      }
    });

    const total = data.reduce((sum, day) => sum + day.visitors, 0);
    const change = previousWeekTotal === 0
      ? (total > 0 ? 'New' : '—')
      : `${total >= previousWeekTotal ? '+' : ''}${Math.round(((total - previousWeekTotal) / previousWeekTotal) * 100)}%`;
    return { data, total, change };
  }, [visits, now]);

  const stats = [
    { label: t.stats.total, value: visits.length, icon: FiUsers, tone: 'blue' },
    { label: t.stats.approved, value: approved.length, icon: FiCheckCircle, tone: 'green' },
    { label: t.stats.pending, value: pending.length, icon: FiClock, tone: 'amber' },
    { label: t.stats.active, value: visits.filter(v => v.checkIn).length, icon: FiActivity, tone: 'violet' },
    { label: t.stats.today, value: todayVisits.length, icon: FiCalendar, tone: 'cyan' },
    { label: t.stats.week, value: visits.filter(v => v.visitDate >= new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)).length, icon: FiCalendar, tone: 'blue' },
    { label: t.stats.completed, value: visits.filter(v => v.status === 'completed').length, icon: FiCheckCircle, tone: 'green' },
    { label: t.stats.rejected, value: visits.filter(v => v.status === 'rejected').length, icon: FiXCircle, tone: 'rose' },
  ];

  const statusBadge = value => <span className={`host-status ${value}`}>{value === 'approved' ? 'Approved' : value === 'pending' ? 'Pending' : value === 'completed' ? 'Completed' : 'Rejected'}</span>;

  // Live Chat Send Message Simulator
  const handleSendLiveChatMessage = () => {
    if (!chatInput.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = { sender: 'You (Host)', text: chatInput, time: timestamp };
    setChatMessages(prev => ({
      ...prev,
      [activeChatTarget]: [...(prev[activeChatTarget] || []), msg]
    }));
    setChatInput('');

    // Simulate Reply
    setTimeout(() => {
      const replyTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let replyMsg = { sender: activeChatTarget, text: "Acknowledged. Thanks for the quick update!", time: replyTimestamp };
      if (activeChatTarget === 'Reception Desk') {
        replyMsg.text = "Understood. I will guide them to Orion 4A right away.";
      }
      setChatMessages(prev => ({
        ...prev,
        [activeChatTarget]: [...(prev[activeChatTarget] || []), replyMsg]
      }));
    }, 1200);
  };

  // Face Recognition simulation
  const handleStartFaceMatch = () => {
    setFaceCheckStatus('scanning');
    setFaceMatchScore(null);
    setTimeout(() => {
      const success = Math.random() > 0.15;
      if (success) {
        setFaceCheckStatus('success');
        setFaceMatchScore(98.4);
        addToast('Face ID Verified (98.4% Match).', 'success');
      } else {
        setFaceCheckStatus('failed');
        setFaceMatchScore(21.2);
        addToast('Face ID match verification failed.', 'error');
      }
    }, 2000);
  };

  const smartTools = [
    { id: 'vr-reception', icon: FiCamera, label: 'VR Reception Training', text: 'Reception staff training simulation for visitor handling' },
    { id: 'live-tracking', icon: FiMapPin, label: 'Live Visitor Tracking', text: 'Reception → Meeting Room → Exit' },
    { id: 'calendar-integration', icon: FiCalendar, label: 'Smart Calendar Integration', text: 'Google, Outlook and internal calendar sync' },
    { id: 'auto-reminders', icon: FiBell, label: 'Smart Notifications & Auto Reminders', text: '30 and 15-minute meeting notifications' },
    { id: 'digital-pass', icon: FiDownload, label: 'Digital Visitor Pass (PDF Download)', text: 'Generate, download and share PDF passes' },
    { id: 'qr-checkin', icon: FiSmartphone, label: 'QR-Based Entry & Secure Pass', text: 'Secure one-time QR pass with expiry timer' },
    { id: 'ai-analytics', icon: FiActivity, label: 'AI Analytics & Trends', text: 'Peak hours and busiest department insights' },
    { id: 'feedback', icon: FiMessageSquare, label: 'Visitor Feedback & Satisfaction', text: 'Visitor ratings, comments and satisfaction' },
    { id: 'parking', icon: FiTruck, label: 'Smart Parking Allocation', text: 'Reserve and manage visitor parking slots' },
    { id: 'live-chat', icon: FiMessageSquare, label: 'Live Chat', text: 'Chat with Receptionists or visiting guests' },
    { id: 'indoor-nav', icon: FiMap, label: 'Indoor Company Navigation', text: 'Walkway path to assigned meeting rooms' },
  ];

  return <div className="dashboard-layout host-dashboard">
    <Sidebar />
    <main className="main-content host-main">
      <header className="host-topbar">
        <div>
          <p className="host-eyebrow">{t.workspace} <span className="host-live"><i /> {t.live}</span></p>
          <h1>{t.title}, {userProfile?.name?.split(' ')[0] || 'Alex'}</h1>
          <p className="host-date">{niceDate.format(now)} · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="host-top-actions">
          <button className="host-icon-button" aria-label="Notifications" onClick={() => addToast(`You have ${pending.length} pending requests.`, 'info')}>
            <FiBell />
            <b>{pending.length || 1}</b>
          </button>
          <button className="host-new-button" onClick={() => setActiveTab('requests')}><FiPlus /> New visit request</button>
        </div>
      </header>

      <nav className="host-tabs" aria-label="Host dashboard sections">
        {[['overview', FiGrid, t.tabs.overview], ['requests', FiUsers, `${t.tabs.requests}${pending.length ? ` (${pending.length})` : ''}`], ['calendar', FiCalendar, t.tabs.calendar]].map(([key, Icon, label]) => <button key={key} className={activeTab === key ? 'active' : ''} onClick={() => setActiveTab(key)}><Icon />{label}</button>)}
      </nav>

      {activeTab === 'overview' && <>
        <section className="host-stats-grid">{stats.map(({ label, value, icon: Icon, tone }) => <article className={`host-stat-card ${tone}`} key={label}><div className="host-stat-icon"><Icon /></div><p>{label}</p><div><strong>{value}</strong></div></article>)}</section>
        <section className="host-overview-grid">
          <article className="host-panel host-schedule">
            <div className="panel-heading"><div><p className="host-eyebrow">TODAY'S SCHEDULE</p><h2>Today's Visits</h2></div><button onClick={() => setActiveTab('calendar')}>View Calendar <FiChevronRight /></button></div>
            <div className="timeline">
              {visits.filter(v => v.status === 'approved').slice(0, 3).map((v) => <button className="timeline-item" key={v.id} onClick={() => setSelected(v)}><time>{v.visitTime || '10:00 AM'}</time><span className="timeline-dot" /><div><strong>{v.visitorName}</strong><p>{v.purpose}</p></div><FiChevronRight className="timeline-arrow" /></button>)}
            </div>
            <div style={{ marginTop: '18px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <p className="host-eyebrow" style={{ marginBottom: '10px' }}>AUTO-GENERATED DAILY TIMETABLE</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dailyAutoSlots.length ? dailyAutoSlots.map((slot) => (
                  <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: slot.status === 'available' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 600 }}>{slot.start} - {slot.end}</span>
                    <span style={{ color: slot.status === 'available' ? 'var(--success)' : 'var(--warning)', fontSize: '0.75rem', fontWeight: 700 }}>{slot.status === 'available' ? 'Open' : 'Full'}</span>
                  </div>
                )) : <p style={{ color: 'var(--text-muted)', margin: 0 }}>No open slots for today.</p>}
              </div>
            </div>
          </article>
          <article className="host-panel host-analytics"><div className="panel-heading"><div><p className="host-eyebrow">VISITOR ANALYTICS</p><h2>Weekly traffic</h2></div><span className="analytics-chip">This week <FiChevronRight /></span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyTraffic.data}><defs><linearGradient id="visitArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".28"/><stop offset="100%" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3"/><XAxis dataKey="day" axisLine={false} tickLine={false}/><YAxis hide/><Tooltip/><Area type="monotone" dataKey="visitors" stroke="#2563eb" strokeWidth={3} fill="url(#visitArea)"/></AreaChart></ResponsiveContainer></div><div className="chart-summary"><div><strong>{weeklyTraffic.total}</strong><span>Total registrations</span></div><div><strong className={weeklyTraffic.change.startsWith('+') ? 'positive' : ''}>{weeklyTraffic.change}</strong><span>vs last week</span></div><div><strong>{todayVisits.length}</strong><span>Registered today</span></div></div></article>
        </section>
      </>}

      {activeTab === 'requests' && <section className="host-panel host-requests"><div className="panel-heading"><div><p className="host-eyebrow">MY VISIT REQUESTS</p><h2>Manage visitor access</h2></div><button className="host-new-button" onClick={() => addToast('A new visitor request form is ready.', 'info')}><FiPlus /> New request</button></div><div className="requests-toolbar"><label><FiSearch /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search visitor, ID, department..." /></label><div className="filter-group"><FiFilter />{['all', 'pending', 'approved', 'rejected'].map(s => <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>{s}</button>)}</div></div><div className="table-wrapper"><table className="host-table"><thead><tr><th>Visitor</th><th>Visit ID</th><th>Department</th><th>Date & time</th><th>Room</th><th>Status</th><th /></tr></thead><tbody>{filteredVisits.map(v => <tr key={v.id}><td><div className="visitor-cell"><span className="avatar">{initials(v.visitorName)}</span><div><strong>{v.visitorName}</strong><small>{v.email}</small></div></div></td><td>{`#${v.id.slice(4, 7)}`}</td><td>{v.department}</td><td>{v.visitDate || 'To be confirmed'}<small>{v.visitTime}</small></td><td>{v.room || '—'}</td><td>{statusBadge(v.status)}</td><td><div className="row-actions"><button aria-label="View details" onClick={() => setSelected(v)}><FiEye /></button>{v.status === 'approved' && <><button className="primary" onClick={() => handleViewQR(v)}>View QR</button><button className="secondary" onClick={() => generatePDFPass(v)}>Pass PDF</button></>}{v.status === 'pending' && <button className="secondary" onClick={() => setBookingRoomFor(v.id)}>Approve</button>}{v.status === 'completed' && <button className="secondary" onClick={() => handleLeaveFeedback(v)}>Feedback</button>}</div></td></tr>)}</tbody></table></div></section>}
      {activeTab === 'calendar' && <section className="host-panel host-calendar"><div className="panel-heading"><div><p className="host-eyebrow">SCHEDULE</p><h2>Visitor calendar</h2></div><button className="host-new-button" onClick={() => setActiveTab('requests')}><FiPlus /> New visit</button></div><Calendar localizer={localizer} events={calendarEvents} startAccessor="start" endAccessor="end" views={['month', 'week', 'day']} defaultView="week" step={slotSettings.slotDuration} timeslots={1} selectable onSelectSlot={handleCalendarSlotSelect} onSelectEvent={event => setSelected(event.resource)} /></section>}
    </main>

    {/* Details Modal */}
    {selected && <div className="modal-overlay" onClick={() => setSelected(null)}><div className="modal host-modal" onClick={e => e.stopPropagation()}><div className="modal-header"><div><p className="host-eyebrow">VISIT DETAILS</p><h3>{selected.visitorName}</h3></div><button className="host-icon-button" onClick={() => setSelected(null)}><FiXCircle /></button></div><div className="detail-hero"><span className="avatar blue">{initials(selected.visitorName)}</span><div><strong>{selected.purpose}</strong><p>{selected.id} · {statusBadge(selected.status)}</p></div></div><div className="details-grid">{[['Email', selected.email], ['Phone', selected.phone], ['Date', selected.visitDate || 'To be confirmed'], ['Time', selected.visitTime || '—'], ['Department', selected.department || 'General'], ['Meeting room', selected.room || 'Not assigned']].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>{selected.status === 'pending' && <div className="modal-actions"><button className="host-outline-button" onClick={() => handleAction(selected.id, 'rejected')}>Reject</button><button className="host-new-button" onClick={() => setBookingRoomFor(selected.id)}>Approve request</button></div>}</div></div>}

    {/* Room Selection Modal */}
    {bookingRoomFor && (() => {
      const selectedVisit = visits.find((v) => v.id === bookingRoomFor) || null;
      const suggestions = selectedVisit
        ? findAvailableSlotsForDate(selectedVisit.visitDate || today, visits, hostAvailability, slotSettings.slotDuration, slotSettings.maxVisitorsPerSlot).slice(0, 5)
        : [];
      const earliest = getEarliestAvailableSlot(selectedVisit?.visitDate || today, visits, hostAvailability, slotSettings.slotDuration, slotSettings.maxVisitorsPerSlot);

      return (
        <div className="modal-overlay" onClick={() => setBookingRoomFor(null)}>
          <div className="modal host-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div><p className="host-eyebrow">APPROVE VISIT</p><h3>Assign a meeting room</h3></div>
              <button className="host-icon-button" onClick={() => setBookingRoomFor(null)}><FiXCircle /></button>
            </div>
            <p className="modal-copy">Auto-suggested earliest available slot: <strong>{earliest ? `${earliest.start} - ${earliest.end}` : 'No slot available'}</strong></p>
            <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Suggested slot</span>
                <select className="host-select" value={selectedApprovalSlot} onChange={(e) => setSelectedApprovalSlot(e.target.value)}>
                  {suggestions.length ? suggestions.map((slot) => (
                    <option key={slot.id} value={slot.start}>{slot.start} - {slot.end}</option>
                  )) : <option value="">No available slots</option>}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Meeting room</span>
                <select className="host-select" value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
                  <option>Orion 4A</option>
                  <option>Atlas 3C</option>
                  <option>Summit 2B</option>
                  <option>Innovation Hub</option>
                  <option>Lobby waiting area</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button className="host-outline-button" onClick={() => setBookingRoomFor(null)}>Cancel</button>
              <button className="host-new-button" onClick={() => handleAction(bookingRoomFor, 'approved', selectedRoom, selectedApprovalSlot || selectedVisit?.visitTime || '09:00')}>Confirm approval</button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ---------------- SMART TOOLS MODALS ---------------- */}
    {activeSmartTool && <div className="modal-overlay" onClick={() => setActiveSmartTool(null)}>
      <div className="modal smart-tool-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', width: '95%' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="smart-tool-icon" style={{ marginBottom: 0, width: 36, height: 36 }}><FiGrid /></div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>{smartTools.find(st => st.id === activeSmartTool)?.label}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interactive Host Console Tool</p>
            </div>
          </div>
          <button className="host-icon-button" onClick={() => setActiveSmartTool(null)}><FiXCircle /></button>
        </div>

        {/* VR Reception Training */}
        {activeSmartTool === 'vr-reception' && <div className="face-recognition-panel" style={{ textAlign: 'center' }}>
          <p className="modal-copy">Run a virtual reception training simulation to practice guest handling, check-in, and service etiquette.</p>
          
          <div className="camera-viewport" style={{
            position: 'relative', width: '100%', height: '260px', borderRadius: '16px',
            background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', border: '2px solid var(--border)', margin: '16px 0'
          }}>
            {faceCheckStatus === 'idle' && <div style={{ color: 'white', textAlign: 'center' }}>
              <FiCamera size={44} style={{ opacity: 0.5, marginBottom: '12px' }} />
              <p style={{ fontSize: '0.85rem' }}>Ready for reception training</p>
            </div>}
            
            {faceCheckStatus === 'scanning' && <div className="scanning-overlay" style={{ color: '#60A5FA', textAlign: 'center', zIndex: 2 }}>
              <FiRefreshCw className="animate-spin" size={44} style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Loading VR reception scenario...</p>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: 'linear-gradient(to right, transparent, #3b82f6, transparent)',
                animation: 'pulse 1s infinite', transform: 'translateY(130px)'
              }} />
            </div>}

            {faceCheckStatus === 'success' && <div style={{ color: '#10B981', textAlign: 'center' }}>
              <FiCheckCircle size={48} style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '1rem', fontWeight: 'bold' }}>Reception training complete</p>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Scenario completed successfully.</p>
            </div>}

            {faceCheckStatus === 'failed' && <div style={{ color: '#EF4444', textAlign: 'center' }}>
              <FiAlertCircle size={48} style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '1rem', fontWeight: 'bold' }}>Training failed</p>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Please retry the VR simulation.</p>
            </div>}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="host-outline-button" onClick={() => setFaceCheckStatus('idle')}>Reset</button>
            <button className="host-new-button" onClick={handleStartFaceMatch} disabled={faceCheckStatus === 'scanning'}>Start VR Reception Training</button>
          </div>
        </div>}

        {/* 3. Live Visitor Tracking */}
        {activeSmartTool === 'live-tracking' && <div className="live-tracking-panel">
          <p className="modal-copy">Real-time occupancy and checkpoint flow of active visitors in the company premises.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {visits.filter(v => v.status === 'approved').map((v, i) => (
              <div key={v.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', background: 'var(--bg-card-hover)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>{v.visitorName} (ID: #{v.id.slice(4, 7)})</strong>
                  <span className="host-live" style={{ fontSize: '0.65rem' }}>Active inside</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', padding: '10px 0' }}>
                  {/* Connectors */}
                  <div style={{ position: 'absolute', top: '19px', left: '10%', right: '10%', height: '2px', background: 'var(--border)', zIndex: 1 }} />
                  
                  {/* Step 1: Reception */}
                  <div style={{ textAlign: 'center', zIndex: 2 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#10B981', color: 'white', display: 'grid', placeItems: 'center', margin: '0 auto', fontSize: '0.7rem' }}><FiCheck /></div>
                    <span style={{ fontSize: '0.7rem', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>Reception</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>10:24 AM</span>
                  </div>

                  {/* Step 2: Meeting Room */}
                  <div style={{ textAlign: 'center', zIndex: 2 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: i % 2 === 0 ? '#3b82f6' : '#9ca3af', color: 'white', display: 'grid', placeItems: 'center', margin: '0 auto', fontSize: '0.7rem' }}>
                      {i % 2 === 0 ? <FiCheck /> : '2'}
                    </div>
                    <span style={{ fontSize: '0.7rem', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>{v.room || 'Meeting Room'}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{i % 2 === 0 ? '10:32 AM' : 'En route'}</span>
                  </div>

                  {/* Step 3: Exit */}
                  <div style={{ textAlign: 'center', zIndex: 2 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#9ca3af', color: 'white', display: 'grid', placeItems: 'center', margin: '0 auto', fontSize: '0.7rem' }}>3</div>
                    <span style={{ fontSize: '0.7rem', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>Exit Point</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Pending</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* 4. Smart Calendar Integration */}
        {activeSmartTool === 'calendar-integration' && <div className="calendar-integration-panel">
          <p className="modal-copy">Synchronize slots directly with Outlook or Google Calendar. Current sync status is active.</p>
          <div style={{ display: 'flex', gap: '12px', border: '1px dashed var(--border)', borderRadius: '12px', padding: '16px', background: 'var(--bg-card-hover)' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '4px' }}>Google Calendar Sync</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Synced: 3 minutes ago</p>
              <button className="host-outline-button" style={{ marginTop: '8px', minHeight: '32px' }} onClick={() => addToast('Google Calendar re-synced.', 'success')}>Force Sync</button>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '4px' }}>Microsoft Outlook Sync</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Synced: 1 hour ago</p>
              <button className="host-outline-button" style={{ marginTop: '8px', minHeight: '32px' }} onClick={() => addToast('Outlook Calendar re-synced.', 'success')}>Force Sync</button>
            </div>
          </div>
        </div>}

        {/* 5. Smart Notifications & Auto Reminders */}
        {activeSmartTool === 'auto-reminders' && <div className="auto-reminders-panel">
          <p className="modal-copy">Configure auto reminder pushes for upcoming visits.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={remindersConfig.before30} onChange={(e) => setRemindersConfig({ ...remindersConfig, before30: e.target.checked })} />
              Notify Host 30 minutes before visit
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={remindersConfig.before15} onChange={(e) => setRemindersConfig({ ...remindersConfig, before15: e.target.checked })} />
              Notify Host 15 minutes before visit
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={remindersConfig.smsAlert} onChange={(e) => setRemindersConfig({ ...remindersConfig, smsAlert: e.target.checked })} />
              Send automated SMS to visitor with parking and room details
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={remindersConfig.emailAlert} onChange={(e) => setRemindersConfig({ ...remindersConfig, emailAlert: e.target.checked })} />
              Send email with digital pass attachment
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={remindersConfig.autoEscalate} onChange={(e) => setRemindersConfig({ ...remindersConfig, autoEscalate: e.target.checked })} />
              Auto-escalate to alternative host if unresponsive for 10 minutes
            </label>
            <button className="host-new-button" style={{ marginTop: '10px' }} onClick={() => { addToast('Reminder configurations saved.', 'success'); setActiveSmartTool(null); }}>Save Configurations</button>
          </div>
        </div>}

        {/* 6. Digital Visitor Pass (PDF Download) */}
        {activeSmartTool === 'digital-pass' && <div className="digital-pass-panel">
          <p className="modal-copy">Generate and print high-quality PDF badges for visitors.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {visits.map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-card)' }}>
                <div>
                  <strong>{v.visitorName}</strong>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v.email}</p>
                </div>
                <button className="host-outline-button" style={{ minHeight: '34px' }} onClick={() => generatePDFPass(v)}>
                  <FiDownload /> Download Pass
                </button>
              </div>
            ))}
          </div>
        </div>}

        {/* 7. QR-Based Entry & Secure Pass */}
        {activeSmartTool === 'qr-checkin' && <div className="qr-checkin-panel" style={{ textAlign: 'center' }}>
          <p className="modal-copy">Generate a secure, single-use entry/exit QR token with a selected expiry time.</p>
          
          <div style={{ display: 'flex', gap: '10px', margin: '14px 0', justifyContent: 'center' }}>
            <select className="host-select" style={{ maxWidth: '240px' }} value={qrVisitor} onChange={e => {
              setQrVisitor(e.target.value);
              setQrGeneratedToken(createVisitQrUrl(e.target.value));
            }}>
              {visits.map(v => <option key={v.id} value={v.id}>{v.visitorName}</option>)}
            </select>

            <select className="host-select" style={{ maxWidth: '140px' }} value={qrExpiryHours} onChange={e => setQrExpiryHours(e.target.value)}>
              <option value="1">1 Hour Expiry</option>
              <option value="2">2 Hours Expiry</option>
              <option value="4">4 Hours Expiry</option>
              <option value="12">12 Hours Expiry</option>
            </select>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', display: 'inline-block', margin: '16px auto', border: '1px solid var(--border)' }}>
            <QRCodeSVG value={qrGeneratedToken} size={220} level="H" includeMargin />
            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#4B5563', fontWeight: 'bold' }}>
              <FiLock style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Token: {qrGeneratedToken.slice(0, 15)}...
            </div>
            <div style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>Expires in {qrExpiryHours} hour(s)</div>
          </div>

          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>This QR code will invalidate automatically once scanned at checkout or upon expiration.</p>
        </div>}

        {/* 8. AI Analytics & Trends */}
        {activeSmartTool === 'ai-analytics' && <div className="ai-analytics-panel">
          <p className="modal-copy">Review visiting patterns and busy slots generated by AI.</p>
          <div className="chart-wrap" style={{ height: '200px', margin: '16px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visitors" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
              <strong style={{ fontSize: '0.8rem', display: 'block' }}>Busiest Hours</strong>
              <p style={{ fontSize: '1rem', color: 'var(--accent-1)', fontWeight: 'bold' }}>10:00 AM - 12:30 PM</p>
            </div>
            <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
              <strong style={{ fontSize: '0.8rem', display: 'block' }}>Peak Department</strong>
              <p style={{ fontSize: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>Engineering (36%)</p>
            </div>
          </div>
        </div>}

        {/* ⭐ 9. Visitor Feedback & Satisfaction */}
        {activeSmartTool === 'feedback' && <div className="feedback-panel">
          <p className="modal-copy">Aggregate ratings left by visitors checked out by you.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {feedBacks.map((fb, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong>{fb.visitor}</strong>
                  <span style={{ color: 'var(--warning)', fontWeight: 'bold', display: 'inline-flex' }}>
                    {Array.from({ length: fb.rating }, (_, index) => <FiStar key={index} fill="currentColor" />)}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>"{fb.comment}"</p>
                <small style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Submitted: {fb.date}</small>
              </div>
            ))}
          </div>
        </div>}

        {/* 10. Smart Parking Allocation */}
        {activeSmartTool === 'parking' && <div className="parking-panel">
          <p className="modal-copy">Assign a dedicated parking space for the guest's vehicle.</p>
          
          <div style={{ display: 'flex', gap: '10px', margin: '12px 0' }}>
            <select className="host-select" value={qrVisitor} onChange={e => setQrVisitor(e.target.value)}>
              {visits.map(v => <option key={v.id} value={v.id}>{v.visitorName}</option>)}
            </select>
            <select className="host-select" value={selectedParkingSlot} onChange={e => setSelectedParkingSlot(e.target.value)}>
              <option value="P-15">Slot P-15 (Available)</option>
              <option value="P-16">Slot P-16 (Available)</option>
              <option value="P-17">Slot P-17 (Available)</option>
              <option value="P-18">Slot P-18 (Occupied)</option>
            </select>
            <button className="host-new-button" style={{ minHeight: 'unset' }} onClick={() => {
              setReservedParking({ ...reservedParking, [qrVisitor]: selectedParkingSlot });
              addToast(`Parking slot ${selectedParkingSlot} reserved.`, 'success');
            }}>Allocate</button>
          </div>

          <h4 style={{ fontSize: '0.85rem', marginBottom: '6px' }}>Current Reservations</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {visits.map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span>{v.visitorName}</span>
                <strong>{reservedParking[v.id] || 'No Parking Reserved'}</strong>
              </div>
            ))}
          </div>
        </div>}

        {/* 11. Live Chat */}
        {activeSmartTool === 'live-chat' && <div className="live-chat-panel">
          <p className="modal-copy">Instant messaging with active guests or the reception desk.</p>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {['Reception Desk', 'Visitor (Aarav)'].map(t => (
                <button key={t} onClick={() => setActiveChatTarget(t)} style={{
                  padding: '8px', borderRadius: '8px', border: '1px solid var(--border)',
                  background: activeChatTarget === t ? 'var(--accent-1)' : 'transparent',
                  color: activeChatTarget === t ? 'white' : 'var(--text-primary)',
                  fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left'
                }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                background: 'var(--bg-card-hover)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '12px', height: '180px', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                {(chatMessages[activeChatTarget] || []).map((m, idx) => (
                  <div key={idx} style={{ alignSelf: m.sender.startsWith('You') ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      background: m.sender.startsWith('You') ? 'var(--accent-1)' : 'var(--bg-card)',
                      color: m.sender.startsWith('You') ? '#fff' : 'var(--text-primary)',
                      padding: '6px 10px', borderRadius: '10px', fontSize: '0.75rem', border: '1px solid var(--border)'
                    }}>
                      <strong>{m.sender}: </strong>{m.text}
                      <span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.7, textAlign: 'right', marginTop: '2px' }}>{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="host-select" placeholder="Type a message..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendLiveChatMessage()} />
                <button className="host-new-button" onClick={handleSendLiveChatMessage} style={{ minHeight: 'unset', width: '45px', padding: 0 }}><FiSend /></button>
              </div>
            </div>
          </div>
        </div>}

        {/* 12. Indoor Company Navigation */}
        {activeSmartTool === 'indoor-nav' && <div className="indoor-nav-panel">
          <p className="modal-copy">Interactive path directions for visitor guidance.</p>
          
          <div className="floor-map-simulation" style={{
            width: '100%', height: '240px', background: 'var(--bg-card-hover)',
            borderRadius: '14px', border: '1px solid var(--border)', position: 'relative',
            marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {/* Draw a simulated floor layout */}
            <div style={{ width: '80%', height: '80%', border: '2px solid var(--border)', position: 'relative', borderRadius: '8px', background: 'var(--bg-card)' }}>
              {/* Reception point */}
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', padding: '4px 8px', background: '#10B981', color: 'white', fontSize: '0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
                Reception Entrance
              </div>
              
              {/* Route line */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <path d="M 40 130 L 120 130 L 120 40 L 220 40" fill="none" stroke="var(--accent-1)" strokeWidth="3" strokeDasharray="5" />
              </svg>

              {/* Destination Point */}
              <div style={{ position: 'absolute', top: '15px', right: '15px', padding: '4px 8px', background: 'var(--accent-1)', color: 'white', fontSize: '0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
                Meeting Space (Orion 4A)
              </div>
              
              {/* Helper checkpoints */}
              <div style={{ position: 'absolute', top: '60px', left: '80px', fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                Elevators Lobby
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
            <FiMapPin style={{ marginRight: '4px', verticalAlign: 'middle', color: 'var(--accent-1)' }} />
            Route: Elevator to Floor 4, turn left, Orion 4A is the second door on the right.
          </p>
        </div>}
      </div>
    </div>}

    {/* Urgent Alert Modal */}
    {activeUrgentVisit && (
      <>
        <style>{`
          @keyframes urgentPulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          @keyframes urgentBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
        <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(239, 68, 68, 0.2)' }} onClick={() => { setDismissedUrgentVisitId(activeUrgentVisit.id); setActiveUrgentVisit(null); }}>
          <div className="modal host-modal" style={{ border: '2px solid #ef4444', animation: 'urgentPulse 2s infinite' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div><p className="host-eyebrow" style={{ color: '#ef4444' }}>URGENT VISIT ALERT</p><h3 style={{ color: '#ef4444' }}>Action Required</h3></div>
              <button className="host-icon-button" onClick={() => { setDismissedUrgentVisitId(activeUrgentVisit.id); setActiveUrgentVisit(null); }}><FiXCircle /></button>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <FiAlertCircle size={56} color="#ef4444" style={{ marginBottom: '16px', animation: 'urgentBlink 1s infinite' }} />
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{activeUrgentVisit.visitorName} is requesting urgent entry</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{activeUrgentVisit.purpose}</p>
              <p style={{ fontSize: '0.9rem' }}><strong>Department:</strong> {activeUrgentVisit.department}</p>
            </div>
            <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '16px' }}>
              <button className="host-new-button" style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white', width: '100%' }} onClick={() => { setDismissedUrgentVisitId(activeUrgentVisit.id); setActiveUrgentVisit(null); setBookingRoomFor(activeUrgentVisit.id); }}>Review & Approve</button>
            </div>
          </div>
        </div>
      </>
    )}
  </div>;
}
