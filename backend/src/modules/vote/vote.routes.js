const express = require('express');
const { body } = require('express-validator');
const asyncSafe = require('../../utils/asyncSafe');
const validate = require('../../middleware/validate');
const { ok, fail } = require('../../utils/apiResponse');
const { requireAuth, allowRoles } = require('../../middleware/auth');
const Election = require('../../models/Election');
const Candidate = require('../../models/Candidate');
const Vote = require('../../models/Vote');
const User = require('../../models/User');
const audit = require('../audit/audit.service');

const router = express.Router();

router.get('/vote/dashboard', requireAuth, asyncSafe(async (req, res) => {
  const zoneId = req.user.zoneId;
  if (!zoneId) return res.json(ok('Voting dashboard loaded', { elections: [], candidates: [] }));
  const [elections, candidates] = await Promise.all([
    Election.find({ zoneId }),
    Candidate.find({ zoneId })
  ]);
  res.json(ok('Voting dashboard loaded', { elections, candidates }));
}));

router.post('/vote/cast',
  requireAuth,
  allowRoles('VOTER'),
  [body('electionId').notEmpty(), body('candidateId').notEmpty()],
  validate,
  asyncSafe(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user || !user.isActive || !user.isVerified) return res.json(fail('User is not approved for voting'));

    const election = await Election.findById(req.body.electionId);
    if (!election) return res.json(fail('Election is not open'));
    const now = new Date();
    if (!election.active || now < election.startAt || now > election.endAt) return res.json(fail('Election is not open'));
    if (election.zoneId !== user.zoneId) return res.json(fail('Election does not belong to your zone'));

    const duplicate = await Vote.findOne({ userId: user.id, electionId: election.id });
    if (duplicate) return res.json(fail('Duplicate vote prevented'));

    const candidate = await Candidate.findById(req.body.candidateId);
    if (!candidate || candidate.electionId !== election.id || candidate.zoneId !== user.zoneId) {
      return res.json(fail('Invalid candidate for this election'));
    }

    try {
      await Vote.create({ userId: user.id, electionId: election.id, candidateId: candidate.id, zoneId: user.zoneId });
      user.hasVoted = true;
      await user.save();
      await audit.log(user.id, 'VOTE_CAST', `Vote cast for election ${election.id}`);
      res.json(ok('Vote recorded', 'Vote recorded'));
    } catch (err) {
      if (err.code === 11000) return res.json(fail('Duplicate vote prevented'));
      console.error('[VOTE] Cast failed safely:', err.message);
      res.json(fail('Vote could not be recorded. Please retry.'));
    }
  })
);

router.get('/vote/results/:electionId', requireAuth, allowRoles('ADMIN', 'SUPERVISOR'), asyncSafe(async (req, res) => {
  const rows = await Vote.aggregate([
    { $match: { electionId: req.params.electionId } },
    { $group: { _id: '$candidateId', count: { $sum: 1 } } }
  ]);
  const results = {};
  rows.forEach(row => { results[row._id] = row.count; });
  res.json(ok('Results loaded', results));
}));

module.exports = router;
