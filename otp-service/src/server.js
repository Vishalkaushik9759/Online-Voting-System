require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 5001;
const ttlMs = Number(process.env.OTP_TTL_MINUTES || 5) * 60 * 1000;
const store = new Map();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

function safeResponse(res, ok, message, data = {}) {
  return res.status(200).json({ success: ok, message, ...data });
}

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

app.get('/health', (req, res) => safeResponse(res, true, 'OTP service healthy'));

app.post('/otp/send', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return safeResponse(res, false, 'Valid email is required');
    const otp = makeOtp();
    store.set(email, { otp, expiresAt: Date.now() + ttlMs, attempts: 0 });
    if (process.env.DEV_MODE === 'true') {
      console.log(`[OTP DEV] ${email}: ${otp}`);
      return safeResponse(res, true, 'OTP generated in dev mode', { devOtp: otp });
    }
    try {
      await transporter().sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Your SecureVote OTP',
        text: `Your OTP is ${otp}. It expires in ${process.env.OTP_TTL_MINUTES || 5} minutes.`
      });
      console.log(`[OTP] Email sent to ${email}`);
      return safeResponse(res, true, 'OTP sent');
    } catch (mailErr) {
      console.error(`[OTP] Email failed for ${email}:`, mailErr.message);
      return safeResponse(res, false, 'Email delivery failed. Please retry.', { retry: true });
    }
  } catch (err) {
    console.error('[OTP] Safe send failure:', err);
    return safeResponse(res, false, 'OTP service could not process request', { retry: true });
  }
});

app.post('/otp/verify', (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const item = store.get(email);
    if (!item) return safeResponse(res, false, 'No OTP found. Request a new one.');
    if (Date.now() > item.expiresAt) {
      store.delete(email);
      return safeResponse(res, false, 'OTP expired.');
    }
    item.attempts += 1;
    if (item.attempts > 5) {
      store.delete(email);
      return safeResponse(res, false, 'Too many attempts. Request a new OTP.');
    }
    if (item.otp !== otp) return safeResponse(res, false, 'Invalid OTP.');
    store.delete(email);
    console.log(`[OTP] Verified ${email}`);
    return safeResponse(res, true, 'OTP verified');
  } catch (err) {
    console.error('[OTP] Safe verify failure:', err);
    return safeResponse(res, false, 'OTP verification failed safely');
  }
});

app.use((err, req, res, next) => {
  console.error('[OTP] Unhandled safe middleware error:', err);
  safeResponse(res, false, 'Service error. Please retry.');
});

app.listen(port, () => console.log(`OTP service running on http://localhost:${port}`));
