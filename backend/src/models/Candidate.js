const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  zoneId: { type: String, required: true },
  electionId: { type: String, required: true }
}, { timestamps: true, collection: 'candidates' });

candidateSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Candidate', candidateSchema);
