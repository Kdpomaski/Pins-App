import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const distPath = path.join(cwd, 'dist');

console.log('[build] working directory:', cwd);
console.log('[build] dist path:', distPath);
console.log('[build] dist exists:', fs.existsSync(distPath));

if (!fs.existsSync(distPath)) {
  console.error('[build] ERROR: dist folder was not created');
  process.exit(1);
}

const entries = fs.readdirSync(distPath);
console.log('[build] dist contents:', entries.join(', '));

if (!entries.includes('index.html')) {
  console.error('[build] ERROR: dist/index.html is missing');
  process.exit(1);
}

console.log('[build] dist verification passed');