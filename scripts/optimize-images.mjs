/**
 * Resizes industry JPEGs in images/ for web (max 1920×1080).
 * Run: node scripts/optimize-images.mjs
 * Requires: npm install --save-dev sharp
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const imagesDir = path.join(root, 'images');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Install sharp first: npm install --save-dev sharp');
  process.exit(1);
}

const industryNames = [
  'winery',
  'biomanufacturing',
  'agriculture',
  'chemicals',
  'oilandgas',
  'research',
  'defense',
  'municipal',
  'education',
  'universityeducation',
  'beverages',
  'cpg',
  'supplementsnutrition',
  'beautyfragrances',
  'home',
];

const heroDir = path.join(imagesDir, 'hero');
fs.mkdirSync(heroDir, { recursive: true });

async function optimizeJpegInPlace(inputPath, maxWidth = 1920, maxHeight = 1080, quality = 82) {
  if (!fs.existsSync(inputPath)) {
    console.warn('skip (missing):', inputPath);
    return;
  }
  const tmp = inputPath + '.tmp.jpg';
  await sharp(inputPath)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toFile(tmp);
  fs.renameSync(tmp, inputPath);
  const kb = (fs.statSync(inputPath).size / 1024).toFixed(1);
  console.log('optimized', path.relative(root, inputPath), `${kb} KB`);
}

for (const name of industryNames) {
  await optimizeJpegInPlace(path.join(imagesDir, `${name}.jpg`));
}

const gifPath = path.join(imagesDir, 'tinylab-device.gif');
if (fs.existsSync(gifPath)) {
  await sharp(gifPath, { animated: false })
    .resize({ width: 912, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(path.join(heroDir, 'tinylab-device-poster.jpg'));
  console.log('wrote hero poster');
}

console.log('Done.');
