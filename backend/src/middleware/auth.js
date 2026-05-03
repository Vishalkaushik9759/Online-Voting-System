const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { fail } = require('../utils/apiResponse');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json(fail('Authentication required'));
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findOne({ email: payload.email }).select('-password');
    if (!user || !user.isActive) return res.status(401).json(fail('Invalid or inactive account'));
    req.user = user;
    next();
  } catch (err) {
    console.warn('[AUTH] JWT validation failed safely:', err.message);
    return res.status(401).json(fail('Invalid token'));
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json(fail('Forbidden'));
    }
    next();
  };
}

module.exports = { requireAuth, allowRoles };
