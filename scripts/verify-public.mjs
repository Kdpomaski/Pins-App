import fs from 'fs';

const required = [
  'public/body-map/front.jpeg',
  'public/body-map/back-full.jpeg',
  'public/manifest.json',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/favicon.svg',
];

const missing = required.filter((file) => !fs.existsSync(file));

if (missing.length > 0) {
  console.error('Missing required public assets:');
  missing.forEach((file) => console.error(`  - ${file}`));
  process.exit(1);
}

console.log('Public assets verified.');