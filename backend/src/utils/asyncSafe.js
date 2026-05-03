const { fail } = require('./apiResponse');

function asyncSafe(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('[API] Safe route failure:', err);
      res.status(200).json(fail('Something went wrong. Please retry.'));
    }
  };
}

module.exports = asyncSafe;
