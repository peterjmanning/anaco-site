/**
 * Resizes industry JPEGs in images/ for web (max 1920×1080, in place).
 * Run: node scripts/optimize-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'images');
const names = ['agriculture', 'beautyfragrances', 'chemicals', 'cpg'];

async function optimizeJpegInPlace(inputPath) {
  if (!fs.existsSync(inputPath)) {
    console.warn('skip (missing):', inputPath);
    return;
  }
  const tmp = inputPath + '.tmp.jpg';
  await sharp(inputPath)
    .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(tmp);
  fs.renameSync(tmp, inputPath);
  const kb = Math.round(fs.statSync(inputPath).size / 1024);
  console.log('wrote', path.basename(inputPath), `${kb} KB`);
}

for (const name of names) {
  await optimizeJpegInPlace(path.join(imagesDir, `${name}.jpg`));
}

console.log('Done.');
