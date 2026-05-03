const express = require('express');
const asyncSafe = require('../../utils/asyncSafe');
const { ok, fail } = require('../../utils/apiResponse');
const { requireAuth, allowRoles } = require('../../middleware/auth');
const User = require('../../models/User');
const audit = require('../audit/audit.service');
const voterId = require('../voterId/voterId.service');

const router = express.Router();
router.use('/admin', requireAuth, allowRoles('ADMIN'));

router.get('/admin/users', asyncSafe(async (req, res) => {
  res.json(ok('Users loaded', await User.find().select('-password')));
}));

router.post('/admin/users/:id/approve', asyncSafe(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.json(fail('Approval failed'));
  user.isVerified = true;
  user.isActive = true;
  user.voterIdPath = await voterId.generate(user);
  await user.save();
  await audit.log(user.id, 'USER_APPROVED', `USER_APPROVED for ${user.email}`);
  res.json(ok('User approved', user));
}));

router.post('/admin/users/:id/reject', asyncSafe(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isVerified: false, isActive: false }, { new: true }).select('-password');
  if (user) await audit.log(user.id, 'USER_REJECTED', `USER_REJECTED for ${user.email}`);
  res.json(user ? ok('User rejected', user) : fail('Reject failed'));
}));

router.patch('/admin/users/:id/status', asyncSafe(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.active === true }, { new: true }).select('-password');
  if (user) await audit.log(user.id, user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', `Status changed for ${user.email}`);
  res.json(user ? ok('Status updated', user) : fail('Status update failed'));
}));

router.patch('/admin/users/:id/zone', asyncSafe(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { zoneId: req.body.zoneId }, { new: true }).select('-password');
  if (user) await audit.log(user.id, 'ZONE_ASSIGNED', `Zone assigned for ${user.email}`);
  res.json(user ? ok('Zone assigned', user) : fail('Zone assignment failed'));
}));

router.post('/admin/users/:id/profile/approve', asyncSafe(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.json(fail('Profile approval failed'));
  if (user.pendingDemographics) {
    user.demographics = user.pendingDemographics;
    user.pendingDemographics = null;
  }
  await user.save();
  await audit.log(user.id, 'PROFILE_CHANGE_APPROVED', `Profile change approved for ${user.email}`);
  res.json(ok('Profile change approved', user));
}));

module.exports = router;
