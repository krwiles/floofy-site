#!/usr/bin/env node
/**
 * Compares two screenshot sets from capture.mjs and prints only a percent-changed value per route and width. Diff
 * images are written to disk for a person to open; nothing here prints image content.
 *
 * Usage: node scripts/visual-baseline/diff.mjs [--against baseline] [--current current]
 */

import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES, WIDTHS, slugFor } from './routes.mjs';

// Paths: both screenshot sets and the diff output live under __screenshots__/ at the repo root.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_ROOT = path.join(REPO_ROOT, '__screenshots__');

function argValue(flag, fallback) {
  // The value after `flag` on the command line, or `fallback` if the flag isn't given.
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : process.argv[i + 1];
}

// Which two screenshot sets to compare.
const baseLabel = argValue('--against', 'baseline');
const currentLabel = argValue('--current', 'current');

async function loadPng(filePath) {
  // Read and decode one PNG file.
  const buffer = await readFile(filePath);
  return PNG.sync.read(buffer);
}

async function main() {
  // Make sure the diff folder exists.
  const diffDir = path.join(OUT_ROOT, 'diff');
  await mkdir(diffDir, { recursive: true });

  const rows = [];

  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      // The matching file in each set.
      const fileName = `${slugFor(route)}-${width}.png`;
      const baseFile = path.join(OUT_ROOT, baseLabel, fileName);
      const currentFile = path.join(OUT_ROOT, currentLabel, fileName);

      // Load both; a missing file is reported rather than failing the run.
      let baseImg;
      let currentImg;
      try {
        baseImg = await loadPng(baseFile);
        currentImg = await loadPng(currentFile);
      } catch {
        rows.push({ route: route || '/', width, percentChanged: 'missing' });
        continue;
      }

      // Pixel comparison needs identical dimensions, so a height change is reported as its own result.
      const { width: w, height: h } = baseImg;
      if (currentImg.width !== w || currentImg.height !== h) {
        rows.push({ route: route || '/', width, percentChanged: 'size-mismatch' });
        continue;
      }

      // Count differing pixels (ignoring tiny color shifts), as a percentage of the whole image.
      const diff = new PNG({ width: w, height: h });
      const changedPixels = pixelmatch(baseImg.data, currentImg.data, diff.data, w, h, {
        threshold: 0.1,
      });
      const percentChanged = ((changedPixels / (w * h)) * 100).toFixed(2);

      // Save the diff image for a human to look at, and record only the percentage.
      await writeFile(path.join(diffDir, fileName), PNG.sync.write(diff));
      rows.push({ route: route || '/', width, percentChanged: `${percentChanged}%` });
    }
  }

  // Print the percentage table; images are never printed.
  console.log(`Diff: ${baseLabel} vs ${currentLabel}`);
  console.table(rows);
  console.log('Diff images written to __screenshots__/diff/ for manual review.');
}

main().catch((err) => {
  // Any failure: print it and exit non-zero.
  console.error(err);
  process.exit(1);
});
