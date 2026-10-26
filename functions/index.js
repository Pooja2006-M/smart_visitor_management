const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');

initializeApp();

const db = getFirestore();
const VISITS_COLLECTION = 'registrations';
const RETENTION_HOURS = 24;

const SENSITIVE_FIELDS = [
  'fullName', 'visitorName', 'name', 'email', 'phone', 'phoneNumber',
  'avatarUrl', 'avatar_url', 'photoURL', 'govtId', 'govt_id', 'governmentId',
  'idNumber', 'visitorLocation', 'emergencyContact', 'vehicleNumber', 'vehicle',
  'faceImage', 'facePhoto', 'capturedPhoto', 'qrData', 'qrToken', 'hostId',
  'hostName', 'hostEmail', 'company', 'purpose', 'customPurpose', 'room',
];

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const getCheckoutDate = (data) => (
  toDate(data.checkout_time)
  || toDate(data.checkoutTime)
  || toDate(data.checkOutAt)
  || toDate(data.checkOut)
);

// Normalize a stored visit time into 24-hour "HH:MM" form.
// Handles both <input type="time"> values ("09:00") and display values ("9:00 AM").
const normalizeTime = (timeValue = '') => {
  const raw = String(timeValue || '').trim();
  if (!raw) return '';
  const ampmMatch = raw.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = Number(ampmMatch[1]) % 12;
    if (ampmMatch[3].toUpperCase() === 'PM') hours += 12;
    const minutes = ampmMatch[2] ? Number(ampmMatch[2]) : 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  const hhmmMatch = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!hhmmMatch) return '';
  return `${String(Number(hhmmMatch[1])).padStart(2, '0')}:${hhmmMatch[2]}`;
};

// Build the visit Date using India Standard Time (UTC+05:30).
const parseVisitDateTime = (dateValue, timeValue) => {
  if (!dateValue) return null;
  const normalizedTime = normalizeTime(timeValue);
  if (!normalizedTime) return null;
  const date = String(dateValue).trim().slice(0, 10);
  const parsed = new Date(`${date}T${normalizedTime}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const slotKeyFor = (data) => {
  const normalizedTime = normalizeTime(data.visitTime);
  if (!data.visitDate || !normalizedTime) return '';
  return `${data.visitDate}|${normalizedTime}`;
};

exports.scrubExpiredVisitData = onSchedule(
  {
    schedule: 'every 60 minutes',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
    timeoutSeconds: 540,
    memory: '256MiB',
  },
  async () => {
    const cutoff = Date.now() - RETENTION_HOURS * 60 * 60 * 1000;
    const snapshot = await db.collection(VISITS_COLLECTION).get();
    const expiredRefs = snapshot.docs
      .filter((visit) => {
        const checkoutDate = getCheckoutDate(visit.data());
        return checkoutDate && checkoutDate.getTime() <= cutoff;
      })
      .map((visit) => visit.ref);

    if (expiredRefs.length === 0) {
      logger.info('Ephemeral visit cleanup found no expired records.');
      return;
    }

    let batch = db.batch();
    let writesInBatch = 0;
    let scrubbed = 0;

    for (const ref of expiredRefs) {
      const update = Object.fromEntries(
        SENSITIVE_FIELDS.map((field) => [field, FieldValue.delete()])
      );
      batch.update(ref, update);
      writesInBatch += 1;
      scrubbed += 1;

      if (writesInBatch === 450) {
        await batch.commit();
        batch = db.batch();
        writesInBatch = 0;
      }
    }

    if (writesInBatch > 0) await batch.commit();
    logger.info('Ephemeral visit cleanup completed.', {
      scrubbed,
      cutoff: new Date(cutoff).toISOString(),
    });
  }
);

// Email notification for new visit request
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const nodemailer = require('nodemailer');
require('dotenv').config();

const gmailUser = (process.env.GMAIL_USER || '').trim();
const gmailPass = (process.env.GMAIL_PASS || '').replace(/\s+/g, '');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass,
  }
});

const sendNotificationEmail = async (mailOptions, notificationType) => {
  if (!gmailUser || !gmailPass || /your-|placeholder/i.test(`${gmailUser} ${gmailPass}`)) {
    throw new Error('Configure valid GMAIL_USER and GMAIL_PASS values in functions/.env.');
  }

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`${notificationType} email sent successfully.`);
  } catch (error) {
    logger.error(`Failed to send ${notificationType} email.`, error);
    throw error;
  }
};

exports.sendVisitRequestNotification = onDocumentCreated('registrations/{docId}', async (event) => {
  const data = event.data.data();
  if (!data) return;

  const visitorName = data.fullName || data.visitorName || 'Guest Visitor';
  const visitDate = data.visitDate || 'Not specified';
  const visitTime = data.visitTime || 'Not specified';
  const hostEmail = data.hostEmail;
  const adminEmail = process.env.ADMIN_EMAIL || 'pp1656432@gmail.com';

  const mailOptions = {
    from: gmailUser,
    to: hostEmail ? `${hostEmail}, ${adminEmail}` : adminEmail,
    subject: `New Visit Request from ${visitorName}`,
    text: `A new visit request requires your approval.\n\nVisitor: ${visitorName}\nDate: ${visitDate}\nTime: ${visitTime}\nPurpose: ${data.purpose || 'Official Visit'}\n\nPlease check your Host Dashboard to approve or reject the request.`
  };

  await sendNotificationEmail(mailOptions, 'Visit request');
});

exports.sendVisitApprovalNotification = onDocumentUpdated('registrations/{docId}', async (event) => {
  const oldData = event.data.before.data();
  const newData = event.data.after.data();
  if (!newData) return;

  if (oldData.status === 'pending' && newData.status === 'approved') {
    const visitorEmail = newData.email || newData.visitorEmail;
    if (!visitorEmail) return;

    const visitorName = newData.fullName || newData.visitorName || 'Guest Visitor';
    const purpose = newData.purpose || 'Official Visit';
    const visitDate = newData.visitDate || 'Not specified';
    const visitTime = newData.visitTime || 'Not specified';
    const room = newData.room || 'Lobby';
    const approvedBy = newData.approvedByName || newData.hostName || 'Your Host';
    const passId = newData.passId || `PASS-${event.params.docId}`;

    const mailOptions = {
      from: gmailUser,
      to: visitorEmail,
      subject: `Visit Approved – ${purpose}`,
      text: `Your visit request for "${purpose}" has been APPROVED by ${approvedBy}.\n\nEntry pass ${passId} is ready for ${visitDate} at ${visitTime}.\nRoom/Location: ${room}\n\nPlease carry a valid ID proof for verification at entry.`
    };

    await sendNotificationEmail(mailOptions, 'Visit approval');
  }
});

exports.sendRescheduleNotification = onDocumentUpdated('registrations/{docId}', async (event) => {
  const oldData = event.data.before.data();
  const newData = event.data.after.data();
  if (!newData) return;

  const oldRequest = oldData.rescheduleRequest || {};
  const request = newData.rescheduleRequest || {};
  const visitorName = newData.fullName || newData.visitorName || 'Guest Visitor';
  const purpose = newData.purpose || 'Official Visit';

  if (oldRequest.status !== 'pending' && request.status === 'pending') {
    const hostEmail = newData.hostEmail
      || (typeof newData.hostId === 'string' && newData.hostId.includes('@') ? newData.hostId : '');
    if (!hostEmail) {
      logger.warn('Reschedule request email was not sent because the host email is missing.', {
        visitId: event.params.docId,
      });
      return;
    }

    await sendNotificationEmail({
      from: gmailUser,
      to: hostEmail,
      subject: `Reschedule Request from ${visitorName}`,
      text: `${visitorName} requested a new date and time for their visit.\n\nPurpose: ${purpose}\nCurrent schedule: ${newData.visitDate || 'Not specified'} at ${newData.visitTime || 'Not specified'}\nRequested schedule: ${request.date || 'Not specified'} at ${request.time || 'Not specified'}\n\nPlease open the Host Dashboard and review the request.`
    }, 'Reschedule request');
    return;
  }

  if (oldRequest.status === 'pending' && ['approved', 'rejected'].includes(request.status)) {
    const visitorEmail = newData.email || newData.visitorEmail;
    if (!visitorEmail) {
      logger.warn('Reschedule decision email was not sent because the visitor email is missing.', {
        visitId: event.params.docId,
        decision: request.status,
      });
      return;
    }

    const approved = request.status === 'approved';
    const schedule = approved
      ? `Your updated visit is scheduled for ${newData.visitDate || request.date || 'the approved date'} at ${newData.visitTime || request.time || 'the approved time'}.`
      : `The requested time was ${request.date || 'not specified'} at ${request.time || 'not specified'}. Your existing visit schedule remains ${newData.visitDate || 'not specified'} at ${newData.visitTime || 'not specified'}.`;

    await sendNotificationEmail({
      from: gmailUser,
      to: visitorEmail,
      subject: `Visit Reschedule ${approved ? 'Approved' : 'Declined'} – ${purpose}`,
      text: `Dear ${visitorName},\n\nYour request to reschedule your visit has been ${approved ? 'APPROVED' : 'DECLINED'} by ${request.reviewedByName || newData.hostName || 'the host'}.\n\n${schedule}\n\nPlease contact the host if you have questions.`
    }, `Reschedule ${request.status}`);
  }
});

// 1-hour reminder for approved visits. Runs every 5 minutes so the
// "about 1 hour before" window is never missed, even when the app/browser
// is closed. Sends the reminder to the visitor and the host. If another
// approved visit is booked in the same date/time slot, a reschedule-needed
// email is sent instead of a plain reminder.
const REMINDER_WINDOW_MINUTES = 60;

exports.sendVisitReminders = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async () => {
    const now = Date.now();
    const snapshot = await db.collection(VISITS_COLLECTION)
      .where('status', '==', 'approved')
      .get();
    const visits = snapshot.docs.map((visit) => ({ id: visit.id, ref: visit.ref, data: visit.data() }));

    // Count approved visits per date/time slot to detect double-bookings.
    const approvedBySlot = new Map();
    visits.forEach(({ data }) => {
      const key = slotKeyFor(data);
      if (key) approvedBySlot.set(key, (approvedBySlot.get(key) || 0) + 1);
    });

    let sent = 0;
    for (const visit of visits) {
      const { data } = visit;

      // Already reminded, or the visit is no longer upcoming.
      if (data.reminderSentAt || data.checkIn || data.checkOut) continue;

      const start = parseVisitDateTime(data.visitDate, data.visitTime);
      if (!start) continue;

      const minutesUntil = (start.getTime() - now) / 60000;
      if (minutesUntil <= 0 || minutesUntil > REMINDER_WINDOW_MINUTES) continue;

      const visitorEmail = data.email || data.visitorEmail;
      const hostEmail = data.hostEmail
        || (typeof data.hostId === 'string' && data.hostId.includes('@') ? data.hostId : '');
      const recipients = [visitorEmail, hostEmail].filter(Boolean);
      if (recipients.length === 0) {
        logger.warn('Visit reminder skipped because no recipient email is available.', {
          visitId: visit.id,
        });
        continue;
      }

      const visitorName = data.fullName || data.visitorName || 'Guest Visitor';
      const hostName = data.hostName || 'your host';
      const purpose = data.purpose || 'Official Visit';
      const room = data.room || 'Lobby';
      const date = data.visitDate || 'the scheduled date';
      const time = normalizeTime(data.visitTime) || data.visitTime || 'the scheduled time';
      const isBusy = (approvedBySlot.get(slotKeyFor(data)) || 0) > 1;

      const mailOptions = isBusy
        ? {
          from: gmailUser,
          to: recipients.join(', '),
          subject: `Reschedule needed – visit on ${date}`,
          text: `Hello,\n\nThe visit for ${visitorName} scheduled for ${date} at ${time} now has a scheduling conflict (another visit is already booked in that slot).\n\nPurpose: ${purpose}\nHost: ${hostName}\nRoom: ${room}\n\nPlease open the Host Dashboard to review the schedule and arrange a new time.`
        }
        : {
          from: gmailUser,
          to: recipients.join(', '),
          subject: `Reminder: visit on ${date} at ${time}`,
          text: `Hello,\n\nThis is a reminder that the visit for ${visitorName} is in about 1 hour.\n\nDate: ${date}\nTime: ${time}\nPurpose: ${purpose}\nHost: ${hostName}\nRoom: ${room}\n\nPlease carry a valid ID proof for verification at entry.`
        };

      try {
        await sendNotificationEmail(mailOptions, isBusy ? 'Visit reschedule-needed' : 'Visit reminder');
        await visit.ref.update({
          reminderSentAt: FieldValue.serverTimestamp(),
          reminderStatus: isBusy ? 'reschedule-needed' : 'sent',
        });
        sent += 1;
      } catch (error) {
        logger.error('Failed to send visit reminder.', {
          visitId: visit.id,
          error: error.message,
        });
      }
    }

    logger.info('Visit reminder run completed.', { checked: visits.length, sent });
  }
);