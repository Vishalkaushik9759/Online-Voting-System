const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const services = ['backend', 'otp-service', 'frontend'];
for (const service of services) {
  const cwd = path.join(root, service);
  const pnpmLock = path.join(cwd, 'pnpm-lock.yaml');
  if (fs.existsSync(pnpmLock)) {
    console.log(`[install] Removing stale ${service}/pnpm-lock.yaml so npm can install cleanly`);
    fs.rmSync(pnpmLock, { force: true });
  }

  console.log(`[install] Installing ${service}`);
  const result = spawnSync('npm install', {
    cwd,
    stdio: 'inherit',
    shell: true,
    windowsHide: true
  });

  if (result.error) {
    console.error(`[install] Failed to start npm for ${service}:`, result.error.message);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
