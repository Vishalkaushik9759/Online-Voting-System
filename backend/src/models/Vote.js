const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  candidateId: { type: String, required: true },
  electionId: { type: String, required: true },
  zoneId: { type: String, required: true }
}, { timestamps: true, collection: 'votes' });

voteSchema.index({ userId: 1, electionId: 1 }, { unique: true, name: 'one_vote_per_election' });

voteSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.createdAt = ret.createdAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Vote', voteSchema);
