const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  fullName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['VOTER', 'ADMIN', 'SUPERVISOR'], default: 'VOTER' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  hasVoted: { type: Boolean, default: false },
  zoneId: { type: String, default: null },
  voterIdPath: { type: String, default: null },
  demographics: { type: Map, of: String, default: {} },
  pendingDemographics: { type: Map, of: String, default: null }
}, { timestamps: true, collection: 'users' });

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
