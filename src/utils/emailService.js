// We have replaced EmailJS with a local Express server using Nodemailer.
// The server runs on http://localhost:5000

const sendEmail = async (toEmail, templateParams) => {
  if (!toEmail) return false;

  try {
    const response = await fetch('http://localhost:5000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: toEmail,
        subject: templateParams.subject || 'Visitor Management System Notification',
        text: templateParams.message || JSON.stringify(templateParams, null, 2),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Email server returned ${response.status}.`);
    }
    return true;
  } catch (error) {
    console.error('Error sending email via local server:', error);
    return false;
  }
};

export const sendApprovalEmail = async (visit, hostName) => {
  const adminEmail = 'pp1656432@gmail.com';
  const visitorEmail = visit.email || visit.visitorEmail;
  if (!visitorEmail) {
    throw new Error('Visitor email address is missing.');
  }

  const visitorName = visit.visitorName || visit.name || 'Guest Visitor';
  const purpose = visit.purpose || 'Official Visit';
  const visitDate = visit.date || visit.visitDate || new Date().toLocaleDateString();
  const visitTime = visit.time || visit.visitTime || '10:00 AM';
  const room = visit.room || 'Main Lobby / Assigned Room';
  const passId = visit.passId || `PASS-${visit.id || Date.now()}`;
  const approvedBy = hostName || visit.hostName || 'Your Host';

  const templateParams = {
    subject: `Visit Request Accepted – ${purpose}`,
    message: `Dear ${visitorName},\n\nYour visit request for "${purpose}" has been ACCEPTED by ${approvedBy}.\n\nEntry pass ${passId} is ready for ${visitDate} at ${visitTime}.\nRoom/Location: ${room}.\n\nPlease carry a valid ID proof for verification at entry.`
  };

  await sendEmail(adminEmail, templateParams);
  const success = await sendEmail(visitorEmail, templateParams);

  if (!success) {
    throw new Error('Failed to send email. Make sure the local server (npm run email-server) is running!');
  }

  return { success, sentTo: [adminEmail, visitorEmail] };
};

export const sendHostRescheduleEmail = async (visit, newDate, newTime, hostName) => {
  const visitorEmail = visit.email || visit.visitorEmail;
  if (!visitorEmail) return { success: false, sentTo: [] };

  const visitorName = visit.visitorName || visit.name || 'Visitor';
  const purpose = visit.purpose || 'Official Visit';
  const room = visit.room || 'Main Lobby / Assigned Room';

  const templateParams = {
    subject: `Your visit has been rescheduled – ${purpose}`,
    message: `Dear ${visitorName},\n\nYour visit for "${purpose}" has been rescheduled by ${hostName || 'your host'}.\n\nNew schedule: ${newDate} at ${newTime}.\nRoom/Location: ${room}.\n\nIf this time is not suitable, please send a reschedule request from your dashboard.\n\nPlease carry a valid ID proof for verification at entry.`
  };

  const success = await sendEmail(visitorEmail, templateParams);
  return { success, sentTo: [visitorEmail] };
};

export const sendVisitRequestEmail = async (visit) => {
  const adminEmail = 'pp1656432@gmail.com';

  const visitorName = visit.fullName || visit.visitorName || 'Guest Visitor';
  const visitDate = visit.visitDate || new Date().toLocaleDateString();
  const visitTime = visit.visitTime || 'Time not set';
  
  const templateParams = {
    subject: `New Visit Request from ${visitorName}`,
    message: `New visit request from ${visitorName} is waiting for approval on ${visitDate} at ${visitTime}.`
  };

  await sendEmail(adminEmail, templateParams);
  return { success: true, sentTo: [adminEmail] };
};

export const sendHostRequestEmail = async (visit, hostEmail) => {
  if (!hostEmail) return { success: false, sentTo: [] };
  
  const visitorName = visit.fullName || visit.visitorName || 'Guest Visitor';
  const templateParams = {
    subject: `New Visit Request from ${visitorName}`,
    message: `${visitorName} requested a visit with you on ${visit.visitDate || 'the requested date'} at ${visit.visitTime || 'the requested time'}.\n\nPlease log in to the Host Dashboard to approve or reject.`
  };
  
  await sendEmail(hostEmail, templateParams);
  return { success: true, sentTo: [hostEmail] };
};

export const sendScheduleEmail = async (schedule, recipientEmail) => {
  if (!recipientEmail) return { success: false, sentTo: [] };

  const templateParams = {
    subject: `New schedule: ${schedule.title || 'Meeting'}`,
    message: `Schedule created: ${schedule.title || 'New schedule'} on ${schedule.date || 'the scheduled date'} at ${schedule.time || 'the scheduled time'} in ${schedule.location || 'the selected location'}.`
  };
  
  await sendEmail(recipientEmail, templateParams);
  return { success: true, sentTo: [recipientEmail] };
};

export const sendGuardTomorrowSlotsEmail = async (guardEmail, visits) => {
  if (!guardEmail) return { success: false, sentTo: [] };
  const slotSummary = visits.length
    ? visits.map((visit) => `${visit.visitTime || 'Time not set'} - ${visit.visitorName || 'Visitor'} (${visit.hostName || 'Host'})`).join('\n')
    : 'No approved visitor slots scheduled.';
  
  const templateParams = {
    subject: `Tomorrow's Visitor Slots`,
    message: `Tomorrow's approved visitor slots:\n\n${slotSummary}`
  };
  
  await sendEmail(guardEmail, templateParams);
  return { success: true, sentTo: [guardEmail] };
};

export const sendGuardOtpEmail = async (visit, otp) => {
  const visitorEmail = visit.email || visit.visitorEmail;
  if (!visitorEmail) return { success: false, sentTo: [] };

  const visitorName = visit.fullName || visit.visitorName || 'Visitor';
  const purpose = visit.purpose || 'Walk-in Visit';
  const visitDate = visit.visitDate || visit.date || new Date().toLocaleDateString();
  const visitTime = visit.visitTime || visit.time || 'Time not set';
  const hostName = visit.hostName || visit.host || 'Your host';

  const templateParams = {
    subject: `Your entry OTP for ${purpose}`,
    message: `Dear ${visitorName},\n\nYour walk-in visit for "${purpose}" with ${hostName} on ${visitDate} at ${visitTime} has been registered at the gate.\n\nYour entry OTP is: ${otp}\n\nShow this OTP to the security guard to complete your entry verification.\n\nPlease carry a valid ID proof for verification at entry.`
  };

  const success = await sendEmail(visitorEmail, templateParams);
  return { success, sentTo: [visitorEmail] };
};

export const sendGuardHostNotifyEmail = async (visit, otp, hostEmail) => {
  if (!hostEmail) return { success: false, sentTo: [] };

  const visitorName = visit.fullName || visit.visitorName || 'Guest Visitor';
  const purpose = visit.purpose || 'Walk-in Visit';
  const visitDate = visit.visitDate || visit.date || new Date().toLocaleDateString();
  const visitTime = visit.visitTime || visit.time || 'Time not set';

  const templateParams = {
    subject: `Walk-in visit from ${visitorName}`,
    message: `${visitorName} registered a walk-in visit with you for "${purpose}" on ${visitDate} at ${visitTime}.\n\nEntry OTP: ${otp}\n\nThe visitor is expected at the gate. Please be available when they arrive.`
  };

  const success = await sendEmail(hostEmail, templateParams);
  return { success, sentTo: [hostEmail] };
};

export const sendOTP = async (email) => {
  if (!email) throw new Error('Email is required to send OTP.');

  try {
    const response = await fetch('http://localhost:5000/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Failed to send OTP.');
    return { success: true, message: data.message };
  } catch (error) {
    console.error('OTP send error:', error);
    throw new Error(error.message || 'Failed to send OTP. Make sure the server is running!');
  }
};

export const verifyOTP = async (email, otp) => {
  if (!email || !otp) throw new Error('Email and OTP are required.');

  try {
    const response = await fetch('http://localhost:5000/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'OTP verification failed.');
    return { success: true, message: data.message };
  } catch (error) {
    console.error('OTP verify error:', error);
    throw new Error(error.message || 'OTP verification failed.');
  }
};
