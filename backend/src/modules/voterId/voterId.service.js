const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const env = require('../../config/env');

async function generate(user) {
  try {
    const dir = path.resolve(process.cwd(), env.idOutputDir);
    fs.mkdirSync(dir, { recursive: true });
    const width = 720;
    const height = 420;
    const png = new PNG({ width, height });
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (width * y + x) << 2;
        const inner = x > 30 && x < 690 && y > 30 && y < 390;
        png.data[idx] = inner ? 28 : 246;
        png.data[idx + 1] = inner ? 45 : 248;
        png.data[idx + 2] = inner ? 70 : 252;
        png.data[idx + 3] = 255;
      }
    }
    const metaPath = path.join(dir, `voter-id-${user.id}.json`);
    const filePath = path.join(dir, `voter-id-${user.id}.png`);
    fs.writeFileSync(filePath, PNG.sync.write(png));
    fs.writeFileSync(metaPath, JSON.stringify({
      title: 'SecureVote Voter ID',
      name: user.fullName,
      email: user.email,
      zone: user.zoneId || 'Unassigned',
      userId: user.id
    }, null, 2));
    return filePath;
  } catch (err) {
    console.error('[VOTER_ID] Generation failed but approval continues:', err.message);
    return null;
  }
}

module.exports = { generate };
