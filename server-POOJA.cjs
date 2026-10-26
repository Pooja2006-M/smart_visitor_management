const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const emailUser = (process.env.EMAIL_USER || process.env.GMAIL_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || process.env.GMAIL_PASS || '').replace(/\s+/g, '');

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = {};

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    emailConfigured: Boolean(emailUser && emailPass)
  });
});

app.get('/', (req, res) => {
  res.send('Smart Visitor email server is running. Use /api/health to check configuration.');
});

// Helper: Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Endpoint: Send OTP to email ───
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!emailUser || !emailPass) {
    return res.status(503).json({ error: 'Email server is not configured. Check EMAIL_USER and EMAIL_PASS in .env.' });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
  otpStore[email.toLowerCase()] = { otp, expiresAt };

  const mailOptions = {
    from: emailUser,
    to: email,
    subject: 'Your OTP for Smart Visitor Management System',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); border-radius: 16px; overflow: hidden;">
        <div style="padding: 32px 28px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0 0 8px;">Smart Visitor Management</h1>
          <p style="color: #a5b4fc; font-size: 14px; margin: 0;">Email Verification</p>
        </div>
        <div style="background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); margin: 0 20px; border-radius: 12px; padding: 28px; text-align: center;">
          <p style="color: #e0e7ff; font-size: 15px; margin: 0 0 20px;">Your One-Time Password (OTP) is:</p>
          <div style="background: rgba(99,102,241,0.2); border: 2px dashed #818cf8; border-radius: 12px; padding: 18px; margin: 0 auto; display: inline-block;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #c7d2fe; font-family: 'Courier New', monospace;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin: 20px 0 0;">This OTP expires in <strong style="color: #fbbf24;">5 minutes</strong>.</p>
        </div>
        <div style="padding: 20px 28px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">If you did not request this, please ignore this email.</p>
          <p style="color: #475569; font-size: 11px; margin: 8px 0 0;">Never share your OTP with anyone.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}: ${otp} (msgId: ${info.messageId})`);
    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ error: 'Failed to send OTP. ' + error.message });
  }
});

// ─── Endpoint: Verify OTP ───
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const key = email.toLowerCase();
  const stored = otpStore[key];

  if (!stored) {
    return res.status(400).json({ error: 'No OTP was generated for this email. Please request a new OTP.' });
  }

  if (Date.now() > stored.expiresAt) {
    delete otpStore[key];
    return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
  }

  if (stored.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
  }

  // OTP verified — clean up
  delete otpStore[key];
  res.status(200).json({ success: true, message: 'OTP verified successfully!' });
});

// ─── Endpoint: Send general emails ───
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

// Clean up expired OTPs every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in otpStore) {
    if (otpStore[key].expiresAt < now) {
      delete otpStore[key];
    }
  }
}, 10 * 60 * 1000);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Email + OTP server running on http://localhost:${PORT}`);
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
});
