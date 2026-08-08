#!/usr/bin/env node
// Visual regression harness for the Astro migration.
//
// --capture-baseline: screenshots the site served over http://localhost:8940
// at every {page} x {theme} x {viewport} combination and stores them under
// tests/baseline/. Later phases will add a diff mode that re-captures and
// compares against these baselines — that logic is not implemented yet.
//
// This originally captured the legacy plain-HTML site at the repo root as the
// reference to port against. Those files are gone, so point it at
// `npm run preview` instead; it now compares Astro against Astro.

import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASELINE_DIR = path.join(ROOT, 'tests', 'baseline');
const BASE_URL = 'http://localhost:8940';

const PAGES = [
  'index.html',
  'about.html',
  'articles.html',
  'courses.html',
  'courseone.html',
  'flashcard.html',
  'practice.html',
  'profile.html',
  'bot.html',
];

const THEMES = ['dark', 'light'];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

async function scrollFullPage(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight;
    let last = -1;
    for (let i = 0; i < 50; i++) {
      window.scrollBy(0, step);
      await new Promise((r) => setTimeout(r, 120));
      const pos = window.scrollY;
      if (pos === last) break;
      last = pos;
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

async function captureBaseline() {
  await mkdir(BASELINE_DIR, { recursive: true });

  const consoleErrors = {};
  const browser = await chromium.launch();

  for (const pageFile of PAGES) {
    const pageName = pageFile.replace(/\.html$/, '');

    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        const key = `${pageName}-${theme}-${viewport.width}`;
        const errors = [];

        const context = await browser.newContext({ viewport });
        await context.addInitScript((themeValue) => {
          localStorage.setItem('fynoptic-theme', themeValue);
        }, theme);

        const page = await context.newPage();
        await page.emulateMedia({ reducedMotion: 'reduce' });

        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text());
        });
        page.on('pageerror', (err) => {
          errors.push(String(err));
        });

        await page.goto(`${BASE_URL}/${pageFile}`, { waitUntil: 'networkidle' });
        await scrollFullPage(page);

        const screenshotPath = path.join(BASELINE_DIR, `${key}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        consoleErrors[key] = errors;

        console.log(`captured ${key}.png (${errors.length} console error(s))`);

        await context.close();
      }
    }
  }

  await browser.close();

  await writeFile(
    path.join(BASELINE_DIR, 'console-errors.json'),
    JSON.stringify(consoleErrors, null, 2),
  );

  await writeFile(
    path.join(BASELINE_DIR, 'url-surface.json'),
    JSON.stringify(PAGES, null, 2),
  );

  console.log(`\nBaseline capture complete: ${PAGES.length * THEMES.length * VIEWPORTS.length} screenshots written to ${path.relative(ROOT, BASELINE_DIR)}/`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--capture-baseline')) {
    await captureBaseline();
    return;
  }

  console.error('Usage: node scripts/visual-diff.mjs --capture-baseline');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
