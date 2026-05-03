function ok(message, data = null) {
  return { success: true, message, data };
}

function fail(message, data = null) {
  return { success: false, message, data };
}

module.exports = { ok, fail };
