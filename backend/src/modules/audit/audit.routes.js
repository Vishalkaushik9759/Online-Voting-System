const express = require('express');
const asyncSafe = require('../../utils/asyncSafe');
const { ok } = require('../../utils/apiResponse');
const { requireAuth, allowRoles } = require('../../middleware/auth');
const auditService = require('./audit.service');

const router = express.Router();

router.get('/admin/audit-logs', requireAuth, allowRoles('ADMIN'), asyncSafe(async (req, res) => {
  res.json(ok('Audit logs loaded', await auditService.list()));
}));

module.exports = router;
