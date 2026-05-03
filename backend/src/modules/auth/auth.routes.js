const express = require('express');
const asyncSafe = require('../../utils/asyncSafe');
const { ok, fail } = require('../../utils/apiResponse');
const validate = require('../../middleware/validate');
const auth = require('./auth.service');

const router = express.Router();

router.post('/auth/register', auth.registerRules, validate, asyncSafe(async (req, res) => {
  const data = await auth.register(req.body);
  res.json(data ? ok('Registered. Await admin approval.', data) : fail('Registration failed or email exists'));
}));

router.post('/auth/login', auth.loginRules, validate, asyncSafe(async (req, res) => {
  const data = await auth.login(req.body);
  res.json(data ? ok('Login successful', data) : fail('Invalid credentials or inactive account'));
}));

router.post('/auth/otp/send', auth.otpRules, validate, asyncSafe(async (req, res) => {
  const sent = await auth.requestOtp(req.body.email);
  res.json(sent ? ok('OTP sent') : fail('OTP service unavailable. Please retry.'));
}));

router.post('/auth/otp/verify', auth.otpVerifyRules, validate, asyncSafe(async (req, res) => {
  const verified = await auth.verifyOtp(req.body.email, req.body.otp);
  res.json(verified ? ok('OTP verified') : fail('OTP verification failed'));
}));

router.get('/auth/oauth2/success', asyncSafe(async (req, res) => {
  res.json(ok('OAuth login reached. Configure Google credentials for full sign-in.', null));
}));

module.exports = router;
