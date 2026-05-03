const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  _id: { type: String },
  title: { type: String, required: true },
  zoneId: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true, collection: 'elections' });

electionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Election', electionSchema);
