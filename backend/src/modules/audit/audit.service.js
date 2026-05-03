const AuditLog = require('../../models/AuditLog');

async function log(userId, action, details) {
  try {
    await AuditLog.create({ userId, action, details });
  } catch (err) {
    console.error('[AUDIT] Write failed but request continues:', err.message);
  }
}

async function list() {
  try {
    return await AuditLog.find().sort({ createdAt: -1 }).limit(200);
  } catch (err) {
    console.error('[AUDIT] Read failed safely:', err.message);
    return [];
  }
}

module.exports = { log, list };
