const { fail } = require('../utils/apiResponse');

function notFound(req, res) {
  res.status(404).json(fail('Route not found'));
}

function errorHandler(err, req, res, next) {
  console.error('[API] Unhandled middleware error:', err);
  res.status(200).json(fail('Service error. Please retry.'));
}

module.exports = { notFound, errorHandler };
