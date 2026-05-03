const express = require('express');
const asyncSafe = require('../../utils/asyncSafe');
const { ok } = require('../../utils/apiResponse');
const { requireAuth, allowRoles } = require('../../middleware/auth');
const User = require('../../models/User');

const router = express.Router();

router.get('/supervisor/zone-users', requireAuth, allowRoles('SUPERVISOR'), asyncSafe(async (req, res) => {
  const users = req.user.zoneId ? await User.find({ zoneId: req.user.zoneId }).select('-password') : [];
  res.json(ok('Zone users loaded', users));
}));

module.exports = router;
