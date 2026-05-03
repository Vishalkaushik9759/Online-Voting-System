const { validationResult } = require('express-validator');
const { fail } = require('../utils/apiResponse');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(fail('Validation failed', errors.mapped()));
  }
  next();
}

module.exports = validate;
