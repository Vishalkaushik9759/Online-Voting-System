const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  city: { type: String, required: true }
}, { timestamps: true, collection: 'zones' });

zoneSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Zone', zoneSchema);
