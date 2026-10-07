#!/usr/bin/env node
/**
 * Screenshots every route at every width, for visual-regression diffs. Prints only file paths and byte sizes, never
 * image content, so its output is safe to share with an AI assistant that must not see the site's artwork.
 *
 * Usage: node scripts/visual-baseline/capture.mjs [--label baseline]
 *   --label   Subfolder under __screenshots__/ to write into (default "baseline").
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES, WIDTHS, BASE_URL, slugFor } from './routes.mjs';

// Paths: screenshots go in __screenshots__/<label>/ at the repo root.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_ROOT = path.join(REPO_ROOT, '__screenshots__');

function argValue(flag, fallback) {
  // The value after `flag` on the command line, or `fallback` if the flag isn't given.
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : process.argv[i + 1];
}

// Which subfolder this run writes to.
const label = argValue('--label', 'baseline');

async function isServerUp(url) {
  // Any non-5xx answer means a server is listening.
  try {
    const res = await fetch(url, { method: 'GET' });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 90_000) {
  // Poll once a second until the server answers, or give up after the timeout.
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Dev server did not become ready at ${url} within ${timeoutMs}ms`);
}

async function main() {
  // Reuse a dev server already on the port (e.g. one started from VS Code); otherwise start one and wait for it.
  let devServer = null;
  const alreadyRunning = await isServerUp(BASE_URL);

  if (!alreadyRunning) {
    console.log(`No server responding at ${BASE_URL} -- starting "ng serve"...`);
    devServer = spawn('npx', ['ng', 'serve', '--hmr=false'], {
      cwd: REPO_ROOT,
      stdio: 'ignore',
      shell: true,
    });
    await waitForServer(BASE_URL);
    console.log('Dev server is up.');
  }

  // Make sure the output folder exists.
  const outDir = path.join(OUT_ROOT, label);
  await mkdir(outDir, { recursive: true });

  // One browser for the whole run.
  const browser = await chromium.launch();
  const written = [];

  try {
    for (const route of ROUTES) {
      for (const width of WIDTHS) {
        // reducedMotion makes appReveal show everything immediately; a full-page capture never scrolls, so animated
        // content would otherwise stay invisible.
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        await page.goto(`${BASE_URL}/${route}`, { waitUntil: 'networkidle' });
        // Let entrance animations / IntersectionObserver reveals settle.
        await page.waitForTimeout(1000);

        // Save a full-page screenshot named <route>-<width>.png.
        const fileName = `${slugFor(route)}-${width}.png`;
        const filePath = path.join(outDir, fileName);
        await page.screenshot({ path: filePath, fullPage: true });
        await page.close();

        // Record only the path and size, never the image.
        const { size } = await stat(filePath);
        written.push({ path: path.relative(REPO_ROOT, filePath), bytes: size });
      }
    }
  } finally {
    // Always close the browser, and stop the dev server if this script started it.
    await browser.close();
    if (devServer) devServer.kill();
  }

  // Print what was written: paths and byte counts only.
  console.log(`Captured ${written.length} screenshots to __screenshots__/${label}/:`);
  for (const entry of written) {
    console.log(`  ${entry.path} (${entry.bytes} bytes)`);
  }
}

main().catch((err) => {
  // Any failure: print it and exit non-zero.
  console.error(err);
  process.exit(1);
});
