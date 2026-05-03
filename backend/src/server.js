const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');
const { seedDemoData } = require('./seed');

async function start() {
  try {
    await connectDb();
    if (env.seedDemoData) await seedDemoData();
    app.listen(env.port, () => console.log(`[API] MERN backend running on http://localhost:${env.port}`));
  } catch (err) {
    console.error('[API] Startup failed safely:', err.message);
    app.listen(env.port, () => console.log(`[API] Degraded backend running on http://localhost:${env.port}`));
  }
}

start();
