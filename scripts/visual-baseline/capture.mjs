#!/usr/bin/env node
// Captures a screenshot of every route/width combination for visual-regression
// comparisons. This script prints only file paths and byte sizes to stdout --
// never image content -- so its output is safe to share with an AI assistant
// that must not view the site's artwork.
//
// Usage: node scripts/visual-baseline/capture.mjs [--label baseline]
//   --label   Subfolder under __screenshots__/ to write into (default "baseline").

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES, WIDTHS, BASE_URL, slugFor } from './routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_ROOT = path.join(REPO_ROOT, '__screenshots__');

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : process.argv[i + 1];
}

const label = argValue('--label', 'baseline');

async function isServerUp(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Dev server did not become ready at ${url} within ${timeoutMs}ms`);
}

async function main() {
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

  const outDir = path.join(OUT_ROOT, label);
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const written = [];

  try {
    for (const route of ROUTES) {
      for (const width of WIDTHS) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(`${BASE_URL}/${route}`, { waitUntil: 'networkidle' });
        // Let entrance animations / IntersectionObserver reveals settle.
        await page.waitForTimeout(1000);

        const fileName = `${slugFor(route)}-${width}.png`;
        const filePath = path.join(outDir, fileName);
        await page.screenshot({ path: filePath, fullPage: true });
        await page.close();

        const { size } = await stat(filePath);
        written.push({ path: path.relative(REPO_ROOT, filePath), bytes: size });
      }
    }
  } finally {
    await browser.close();
    if (devServer) devServer.kill();
  }

  console.log(`Captured ${written.length} screenshots to __screenshots__/${label}/:`);
  for (const entry of written) {
    console.log(`  ${entry.path} (${entry.bytes} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
