const bcrypt = require('bcryptjs');
const { connectDb } = require('./config/db');
const User = require('./models/User');
const Zone = require('./models/Zone');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');

async function seedUser(email, fullName, role, zoneId, isVerified) {
  const exists = await User.findOne({ email });
  if (exists) return exists;
  return User.create({
    email,
    fullName,
    role,
    zoneId,
    isVerified,
    isActive: true,
    password: await bcrypt.hash('Password123!', 12),
    demographics: { ageRange: '26-40', district: zoneId }
  });
}

async function seedDemoData() {
  try {
    await Zone.findByIdAndUpdate('zone-north', { name: 'North Zone', city: 'Demo City' }, { upsert: true });
    await Zone.findByIdAndUpdate('zone-south', { name: 'South Zone', city: 'Demo City' }, { upsert: true });
    await seedUser('admin@vote.local', 'Admin User', 'ADMIN', 'zone-north', true);
    await seedUser('supervisor@vote.local', 'Supervisor User', 'SUPERVISOR', 'zone-north', true);
    await seedUser('voter@vote.local', 'Verified Voter', 'VOTER', 'zone-north', true);
    await seedUser('pending@vote.local', 'Pending Voter', 'VOTER', 'zone-north', false);
    await Election.findByIdAndUpdate('election-2026', {
      title: 'Demo Municipal Election',
      zoneId: 'zone-north',
      startAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      active: true
    }, { upsert: true });
    if ((await Candidate.countDocuments({ electionId: 'election-2026' })) === 0) {
      await Candidate.create([
        { name: 'Ava Patel', party: 'Civic Forward', zoneId: 'zone-north', electionId: 'election-2026' },
        { name: 'Noah Kim', party: 'People First', zoneId: 'zone-north', electionId: 'election-2026' }
      ]);
    }
    console.log('[SEED] Demo data ready. Password for all demo accounts: Password123!');
  } catch (err) {
    console.error('[SEED] Demo seed failed safely; app continues:', err.message);
  }
}

if (require.main === module) {
  connectDb().then(seedDemoData).finally(() => process.exit(0));
}

module.exports = { seedDemoData };
