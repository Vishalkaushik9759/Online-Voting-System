const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('[DB] MongoDB connected');
  } catch (err) {
    console.error('[DB] MongoDB connection failed safely:', err.message);
  }
}

module.exports = { connectDb };
