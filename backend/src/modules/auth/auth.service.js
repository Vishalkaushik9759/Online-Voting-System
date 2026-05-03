const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const env = require('../../config/env');
const User = require('../../models/User');
const audit = require('../audit/audit.service');

function publicUser(user) {
  const plain = user.toJSON ? user.toJSON() : user;
  delete plain.password;
  return plain;
}

function tokenFor(user) {
  return jwt.sign({ email: user.email, role: user.role, id: user.id || user._id.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

function authResponse(user) {
  return {
    token: tokenFor(user),
    role: user.role,
    email: user.email,
    verified: user.isVerified,
    active: user.isActive,
    hasVoted: user.hasVoted
  };
}

async function register(input) {
  try {
    const exists = await User.findOne({ email: input.email.toLowerCase() });
    if (exists) return null;
    const user = await User.create({
      email: input.email,
      password: await bcrypt.hash(input.password, 12),
      fullName: input.fullName,
      role: input.role || 'VOTER',
      zoneId: input.zoneId || 'zone-north',
      demographics: input.demographics || {}
    });
    await audit.log(user.id, 'REGISTER', 'User registered');
    return authResponse(user);
  } catch (err) {
    console.error('[AUTH] Register failed safely:', err.message);
    return null;
  }
}

async function login({ email, password }) {
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) return null;
    const matches = await bcrypt.compare(password, user.password);
    if (!matches) return null;
    await audit.log(user.id, 'LOGIN', 'Password login');
    return authResponse(user);
  } catch (err) {
    console.error('[AUTH] Login failed safely:', err.message);
    return null;
  }
}

async function requestOtp(email) {
  try {
    const response = await fetch(`${env.otpServiceUrl}/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json().catch(() => ({ success: false }));
    await audit.log(null, 'OTP_REQUEST', `OTP requested for ${email}`);
    return data.success === true;
  } catch (err) {
    console.error('[AUTH] OTP request failed safely:', err.message);
    return false;
  }
}

async function verifyOtp(email, otp) {
  try {
    const response = await fetch(`${env.otpServiceUrl}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await response.json().catch(() => ({ success: false }));
    await audit.log(null, data.success ? 'OTP_VERIFY' : 'OTP_VERIFY_FAIL', `OTP verify for ${email}`);
    return data.success === true;
  } catch (err) {
    console.error('[AUTH] OTP verify failed safely:', err.message);
    return false;
  }
}

const registerRules = [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('fullName').trim().notEmpty(),
  body('role').optional().isIn(['VOTER', 'ADMIN', 'SUPERVISOR'])
];

const loginRules = [body('email').isEmail(), body('password').notEmpty()];
const otpRules = [body('email').isEmail()];
const otpVerifyRules = [body('email').isEmail(), body('otp').isLength({ min: 4 })];

module.exports = { register, login, requestOtp, verifyOtp, publicUser, registerRules, loginRules, otpRules, otpVerifyRules };
