const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { randomInt } = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const emailUser = (process.env.EMAIL_USER || process.env.GMAIL_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || process.env.GMAIL_PASS || '').replace(/\s+/g, '');
const otpStore = new Map();

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    emailConfigured: Boolean(emailUser && emailPass)
  });
});

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

app.post('/api/send-otp', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!emailUser || !emailPass) {
    return res.status(503).json({ error: 'Email server is not configured. Check EMAIL_USER and EMAIL_PASS in .env.' });
  }

  const otp = String(randomInt(100000, 1000000));
  try {
    await transporter.sendMail({
      from: emailUser,
      to: email,
      subject: 'Your OTP for Smart Visitor Management System',
      text: `Your email verification OTP is ${otp}. It expires in 5 minutes. Do not share this code.`,
    });
    otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';
  if (!email || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'A valid email address and 6-digit OTP are required.' });
  }

  const storedOtp = otpStore.get(email);
  if (!storedOtp) {
    return res.status(400).json({ error: 'No OTP was generated for this email. Please request a new OTP.' });
  }
  if (Date.now() > storedOtp.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
  }
  if (storedOtp.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
  }

  otpStore.delete(email);
  res.status(200).json({ success: true, message: 'OTP verified successfully.' });
});

// Endpoint to send emails
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, or text/html' });
  }

  if (!emailUser || !emailPass) {
    return res.status(503).json({ error: 'Email server is not configured. Check EMAIL_USER and EMAIL_PASS in .env.' });
  }

  const mailOptions = {
    from: emailUser,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Automatic 1-hour visit reminders (runs free inside this local server) ───
// Checks the Firestore `registrations` collection every 5 minutes. For every
// approved visit starting within the next 60 minutes it emails the visitor and
// the host. If two approved visits share the same date/time slot it sends a
// "reschedule needed" email instead of a plain reminder.
const REMINDER_INTERVAL_MS = 5 * 60 * 1000;
const REMINDER_WINDOW_MINUTES = 60;
const remindedVisitIds = new Set();

const projectId = (process.env.VITE_FIREBASE_PROJECT_ID || '').trim();
const firebaseApiKey = (process.env.VITE_FIREBASE_API_KEY || '').trim();

const normalizeTime = (timeValue = '') => {
  const raw = String(timeValue || '').trim();
  if (!raw) return '';
  const ampm = raw.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)$/i);
  if (ampm) {
    let hours = Number(ampm[1]) % 12;
    if (ampm[3].toUpperCase() === 'PM') hours += 12;
    const minutes = ampm[2] ? Number(ampm[2]) : 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  const hhmm = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!hhmm) return '';
  return `${String(Number(hhmm[1])).padStart(2, '0')}:${hhmm[2]}`;
};

const parseVisitDateTime = (dateValue, timeValue) => {
  if (!dateValue) return null;
  const time = normalizeTime(timeValue);
  if (!time) return null;
  const date = String(dateValue).trim().slice(0, 10);
  const parsed = new Date(`${date}T${time}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const slotKeyFor = (data) => {
  const time = normalizeTime(data.visitTime);
  if (!data.visitDate || !time) return '';
  return `${data.visitDate}|${time}`;
};

const firestoreValue = (value = {}) => {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('mapValue' in value) return firestoreFields(value.mapValue.fields);
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(firestoreValue);
  return null;
};

const firestoreFields = (fields = {}) =>
  Object.fromEntries(Object.entries(fields).map(([key, val]) => [key, firestoreValue(val)]));

const fetchApprovedVisits = async () => {
  if (!projectId || !firebaseApiKey) return [];
  const visits = [];
  let pageToken = '';
  do {
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/registrations`);
    url.searchParams.set('key', firebaseApiKey);
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Firestore read failed (${response.status})`);
    const body = await response.json();

    (body.documents || []).forEach((doc) => {
      const data = firestoreFields(doc.fields);
      if (data.status === 'approved') visits.push({ id: doc.name.split('/').pop(), data });
    });
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return visits;
};

const runVisitReminders = async () => {
  if (!emailUser || !emailPass || !projectId || !firebaseApiKey) return;

  try {
    const visits = await fetchApprovedVisits();
    if (!visits.length) return;

    const slotCounts = new Map();
    visits.forEach(({ data }) => {
      const key = slotKeyFor(data);
      if (key) slotCounts.set(key, (slotCounts.get(key) || 0) + 1);
    });

    const now = Date.now();
    for (const { id, data } of visits) {
      if (remindedVisitIds.has(id) || data.checkIn || data.checkOut) continue;

      const start = parseVisitDateTime(data.visitDate, data.visitTime);
      if (!start) continue;

      const minutesUntil = (start.getTime() - now) / 60000;
      if (minutesUntil <= 0 || minutesUntil > REMINDER_WINDOW_MINUTES) continue;

      const visitorEmail = data.email || data.visitorEmail;
      const hostEmail = data.hostEmail
        || (typeof data.hostId === 'string' && data.hostId.includes('@') ? data.hostId : '');
      const recipients = [visitorEmail, hostEmail].filter(Boolean);
      if (!recipients.length) continue;

      const visitorName = data.fullName || data.visitorName || 'Guest Visitor';
      const hostName = data.hostName || 'your host';
      const purpose = data.purpose || 'Official Visit';
      const room = data.room || 'Lobby';
      const date = data.visitDate;
      const time = normalizeTime(data.visitTime) || data.visitTime;
      const isBusy = (slotCounts.get(slotKeyFor(data)) || 0) > 1;

      const subject = isBusy
        ? `Reschedule needed – visit on ${date}`
        : `Reminder: visit on ${date} at ${time}`;
      const text = isBusy
        ? `Hello,\n\nThe visit for ${visitorName} scheduled for ${date} at ${time} now has a scheduling conflict (another visit is already booked in that slot).\n\nPurpose: ${purpose}\nHost: ${hostName}\nRoom: ${room}\n\nPlease review the schedule and arrange a new time.`
        : `Hello,\n\nThis is a reminder that the visit for ${visitorName} is in about 1 hour.\n\nDate: ${date}\nTime: ${time}\nPurpose: ${purpose}\nHost: ${hostName}\nRoom: ${room}\n\nPlease carry a valid ID proof for verification at entry.`;

      try {
        await transporter.sendMail({ from: emailUser, to: recipients.join(', '), subject, text });
        remindedVisitIds.add(id);
        console.log(`Reminder sent for visit ${id} to ${recipients.join(', ')}`);
      } catch (error) {
        console.error(`Failed to send reminder for visit ${id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Visit reminder check failed:', error.message);
  }
};

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Email server running on http://localhost:${PORT}`);
  if (!emailUser || !emailPass) {
    console.warn('Email credentials are missing. Set EMAIL_USER/EMAIL_PASS or GMAIL_USER/GMAIL_PASS in .env.');
    return;
  }

  transporter.verify((error) => {
    if (error) {
      console.error('Gmail SMTP verification failed:', error.message);
      return;
    }
    console.log(`Gmail SMTP ready for ${emailUser}`);
  });

  if (projectId && firebaseApiKey) {
    console.log('Automatic visit reminders enabled (checking every 5 minutes).');
    setTimeout(runVisitReminders, 10 * 1000);
    setInterval(runVisitReminders, REMINDER_INTERVAL_MS);
  } else {
    console.warn('Visit reminders disabled: set VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY in .env.');
  }
});
