import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const svg = fs.readFileSync(path.join(root, 'store/icon-1024.svg'));

function writePng(size, dest) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, png);
  console.log(dest, png.length);
}

writePng(1024, path.join(root, 'store/icon-1024.png'));
writePng(512, path.join(root, 'store/icon-512.png'));
writePng(512, path.join(root, 'public/icon-512.png'));
writePng(192, path.join(root, 'public/icon-192.png'));
writePng(180, path.join(root, 'public/apple-touch-icon.png'));
