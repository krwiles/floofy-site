#!/usr/bin/env node
// Compares two labelled screenshot sets captured by capture.mjs and reports only
// a numeric percent-changed value per route/width. Diff PNGs are written to disk
// for a human to open; this script never prints image content, so its output is
// safe to share with an AI assistant that must not view the site's artwork.
//
// Usage: node scripts/visual-baseline/diff.mjs [--against baseline] [--current current]

import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES, WIDTHS, slugFor } from './routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_ROOT = path.join(REPO_ROOT, '__screenshots__');

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : process.argv[i + 1];
}

const baseLabel = argValue('--against', 'baseline');
const currentLabel = argValue('--current', 'current');

async function loadPng(filePath) {
  const buffer = await readFile(filePath);
  return PNG.sync.read(buffer);
}

async function main() {
  const diffDir = path.join(OUT_ROOT, 'diff');
  await mkdir(diffDir, { recursive: true });

  const rows = [];

  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const fileName = `${slugFor(route)}-${width}.png`;
      const baseFile = path.join(OUT_ROOT, baseLabel, fileName);
      const currentFile = path.join(OUT_ROOT, currentLabel, fileName);

      let baseImg;
      let currentImg;
      try {
        baseImg = await loadPng(baseFile);
        currentImg = await loadPng(currentFile);
      } catch {
        rows.push({ route: route || '/', width, percentChanged: 'missing' });
        continue;
      }

      const { width: w, height: h } = baseImg;
      if (currentImg.width !== w || currentImg.height !== h) {
        rows.push({ route: route || '/', width, percentChanged: 'size-mismatch' });
        continue;
      }

      const diff = new PNG({ width: w, height: h });
      const changedPixels = pixelmatch(baseImg.data, currentImg.data, diff.data, w, h, {
        threshold: 0.1,
      });
      const percentChanged = ((changedPixels / (w * h)) * 100).toFixed(2);

      await writeFile(path.join(diffDir, fileName), PNG.sync.write(diff));
      rows.push({ route: route || '/', width, percentChanged: `${percentChanged}%` });
    }
  }

  console.log(`Diff: ${baseLabel} vs ${currentLabel}`);
  console.table(rows);
  console.log('Diff images written to __screenshots__/diff/ for manual review.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
