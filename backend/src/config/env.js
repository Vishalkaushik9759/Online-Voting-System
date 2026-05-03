require('dotenv').config();

module.exports = {
  port: process.env.PORT || 8080,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/secure_vote',
  jwtSecret: process.env.JWT_SECRET || 'change-this-demo-secret-change-this-demo-secret-123456',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  otpServiceUrl: process.env.OTP_SERVICE_URL || 'http://localhost:5001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  idOutputDir: process.env.ID_OUTPUT_DIR || 'generated-ids',
  seedDemoData: String(process.env.SEED_DEMO_DATA || 'true') === 'true'
};
