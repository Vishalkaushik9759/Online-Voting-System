const { spawn } = require('child_process');
const path = require('path');

const coreOnly = process.argv.includes('--core');
const root = path.resolve(__dirname, '..');

const services = [
  { name: 'backend', cwd: path.join(root, 'backend'), color: '\x1b[36m' },
  ...(!coreOnly ? [{ name: 'otp', cwd: path.join(root, 'otp-service'), color: '\x1b[35m' }] : []),
  { name: 'frontend', cwd: path.join(root, 'frontend'), color: '\x1b[32m' }
];

const reset = '\x1b[0m';
const children = [];

function startService(service) {
  const child = spawn('npm start', {
    cwd: service.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    windowsHide: true
  });

  children.push(child);

  const prefix = `${service.color}[${service.name}]${reset}`;
  child.stdout.on('data', data => process.stdout.write(`${prefix} ${data}`));
  child.stderr.on('data', data => process.stderr.write(`${prefix} ${data}`));
  child.on('exit', code => {
    if (code !== 0 && code !== null) {
      console.error(`${prefix} exited with code ${code}`);
    }
  });
}

function shutdown() {
  console.log('\nStopping services...');
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`Starting ${services.map(service => service.name).join(', ')}...`);
services.forEach(startService);
