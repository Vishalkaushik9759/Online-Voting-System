const express = require('express');
const asyncSafe = require('../../utils/asyncSafe');
const { ok } = require('../../utils/apiResponse');
const { requireAuth, allowRoles } = require('../../middleware/auth');
const Zone = require('../../models/Zone');

const router = express.Router();

router.get('/zones', requireAuth, asyncSafe(async (req, res) => {
  res.json(ok('Zones loaded', await Zone.find()));
}));

router.post('/zones', requireAuth, allowRoles('ADMIN'), asyncSafe(async (req, res) => {
  const zone = await Zone.findByIdAndUpdate(req.body.id || req.body._id, {
    name: req.body.name,
    city: req.body.city
  }, { new: true, upsert: true, setDefaultsOnInsert: true });
  res.json(ok('Zone saved', zone));
}));

module.exports = router;
