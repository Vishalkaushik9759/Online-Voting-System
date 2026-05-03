const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: String, default: null },
  action: { type: String, required: true },
  details: { type: String, default: '' }
}, { timestamps: true, collection: 'audit_logs' });

auditLogSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
