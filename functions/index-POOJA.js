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

const gmailUser = (process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
const gmailPass = (process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass
  }
});

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

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Visit request email sent successfully.');
  } catch (error) {
    logger.error('Error sending visit request email:', error);
  }
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

    try {
      await transporter.sendMail(mailOptions);
      logger.info('Approval email sent successfully.');
    } catch (error) {
      logger.error('Error sending approval email:', error);
    }
  }
});