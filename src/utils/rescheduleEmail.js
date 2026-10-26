import emailjs from '@emailjs/browser';

const sendRescheduleEmail = async ({ toEmail, toName, subject, message }) => {
  const { VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY } = import.meta.env;
  if (!VITE_EMAILJS_SERVICE_ID || !VITE_EMAILJS_TEMPLATE_ID || !VITE_EMAILJS_PUBLIC_KEY) {
    throw new Error('EmailJS is not configured. Set its service ID, template ID, and public key in the project .env file.');
  }
  if (!toEmail) {
    throw new Error('The email recipient address is missing.');
  }

  await emailjs.send(
    VITE_EMAILJS_SERVICE_ID,
    VITE_EMAILJS_TEMPLATE_ID,
    {
      to_email: toEmail,
      to_name: toName,
      notification_title: subject,
      notification_message: message,
    },
    { publicKey: VITE_EMAILJS_PUBLIC_KEY }
  );
};

export const sendRescheduleRequestEmail = async (visit, request) => {
  const visitorName = visit.visitorName || 'Visitor';
  await sendRescheduleEmail({
    toEmail: visit.hostEmail,
    toName: visit.hostName || 'Host',
    subject: `Reschedule request from ${visitorName}`,
    message: `${visitorName} requested a new visit time.\n\nPurpose: ${visit.purpose || 'General Visit'}\nCurrent schedule: ${visit.visitDate || 'Not set'} at ${visit.visitTime || 'Not set'}\nRequested schedule: ${request.date} at ${request.time}\n\nPlease sign in to the Host Dashboard to review the request.`,
  });
};

export const sendRescheduleDecisionEmail = async (visit, request, decision, hostName) => {
  const approved = decision === 'approved';
  const schedule = approved
    ? `Your updated visit is scheduled for ${request.date} at ${request.time}.`
    : `Your requested time was ${request.date} at ${request.time}. Your existing schedule remains ${visit.visitDate || 'unchanged'} at ${visit.visitTime || 'unchanged'}.`;

  await sendRescheduleEmail({
    toEmail: visit.email,
    toName: visit.visitorName || 'Visitor',
    subject: `Visit reschedule ${approved ? 'approved' : 'declined'}`,
    message: `Dear ${visit.visitorName || 'Visitor'},\n\nYour reschedule request has been ${approved ? 'approved' : 'declined'} by ${hostName || 'the host'}.\n\n${schedule}\n\nPurpose: ${visit.purpose || 'General Visit'}`,
  });
};
