/**
 * Regenerates js/industries-data.js from the committed data file (pretty-print).
 * Edit js/industries-data.js directly — standalone industries pages were removed.
 */
import fs from 'fs';
import path from 'path';

const dataPath = path.join('js', 'industries-data.js');
const src = fs.readFileSync(dataPath, 'utf8');
const match = src.match(/window\.INDUSTRIES_DATA\s*=\s*(\[[\s\S]*\])\s*;/);
if (!match) {
  console.error('Could not parse', dataPath);
  process.exit(1);
}

const data = JSON.parse(match[1]);
const js = 'window.INDUSTRIES_DATA=' + JSON.stringify(data, null, 2) + ';\n';
fs.writeFileSync(dataPath, js, 'utf8');
console.log('Formatted js/industries-data.js (' + data.length + ' industries)');
