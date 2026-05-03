const express = require('express');
const asyncSafe = require('../../utils/asyncSafe');
const { ok, fail } = require('../../utils/apiResponse');
const { requireAuth } = require('../../middleware/auth');
const User = require('../../models/User');
const audit = require('../audit/audit.service');

const router = express.Router();

router.get('/users/me', requireAuth, asyncSafe(async (req, res) => {
  res.json(ok('Profile loaded', req.user));
}));

router.put('/users/me/profile', requireAuth, asyncSafe(async (req, res) => {
  const demographics = req.body && typeof req.body === 'object' ? req.body : {};
  const user = await User.findByIdAndUpdate(req.user._id, { pendingDemographics: demographics }, { new: true }).select('-password');
  await audit.log(req.user.id, 'PROFILE_CHANGE_REQUEST', 'Profile change awaiting admin approval');
  res.json(user ? ok('Profile change submitted for approval', user) : fail('Profile update failed'));
}));

module.exports = router;
