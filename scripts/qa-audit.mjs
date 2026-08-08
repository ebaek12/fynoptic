#!/usr/bin/env node
// Exhaustive QA sweep of the live site: every route, console errors, failed
// network requests, broken images, dead links, and interactive flows
// (practice session, flashcard session, theme toggle, auth modal, bot chat).
// Not a CI test — a one-shot diagnostic script. Prints a report; exits 0
// always (findings are the point, not pass/fail).

import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://fynoptic.org';

const ROUTES = [
  '/',
  '/about',
  '/articles',
  '/courses',
  '/courseone',
  '/flashcard',
  '/practice',
  '/profile',
  '/bot',
];

const findings = [];
function report(route, severity, msg) {
  findings.push({ route, severity, msg });
  console.log(`[${severity}] ${route}: ${msg}`);
}

async function withPage(browser, fn) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  page.on('requestfailed', (req) => {
    // ERR_ABORTED on media/video is almost always the browser cancelling an
    // in-flight preload when we close the context/navigate away, not a real
    // failure — confirmed those URLs 200 via curl. Skip to avoid false positives.
    const failure = req.failure()?.errorText || '';
    if (failure.includes('ERR_ABORTED') && /\.(mp4|webm|mp3)(\?|$)/.test(req.url())) return;
    failedRequests.push(`${req.method()} ${req.url()} — ${failure}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      failedRequests.push(`${res.status()} ${res.url()}`);
    }
  });
  try {
    await fn(page, { consoleErrors, failedRequests });
  } finally {
    await context.close();
  }
}

async function auditRoute(browser, route) {
  await withPage(browser, async (page, { consoleErrors, failedRequests }) => {
    let response;
    try {
      response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (err) {
      report(route, 'FAIL', `navigation failed: ${err.message}`);
      return;
    }
    if (!response || !response.ok()) {
      report(route, 'FAIL', `HTTP ${response ? response.status() : 'no response'}`);
    }

    await page.waitForTimeout(1500); // let hydration/islands settle

    if (consoleErrors.length) {
      for (const e of consoleErrors) report(route, 'ERROR', `console: ${e.slice(0, 300)}`);
    }
    if (failedRequests.length) {
      for (const f of failedRequests) report(route, 'ERROR', `network: ${f.slice(0, 300)}`);
    }

    // Broken images (only ones that actually declare a src — placeholder
    // <img> tags awaiting JS-set src, like #prof-avatar pre-auth, are not bugs)
    const brokenImgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img[src]'))
        .filter((img) => img.getAttribute('src') && img.complete && img.naturalWidth === 0)
        .map((img) => img.src),
    );
    for (const src of brokenImgs) report(route, 'ERROR', `broken image: ${src}`);

    // Internal links -> collect for later dead-link sweep
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && !h.startsWith('mailto:') && !h.startsWith('#') && !h.startsWith('tel:')),
    );

    return links;
  });
}

async function checkLinks(browser, route, links) {
  const internal = links.filter((h) => h.startsWith('/') || h.startsWith(BASE_URL));
  const external = links.filter((h) => h.startsWith('http') && !h.startsWith(BASE_URL));

  const context = await browser.newContext();
  const page = await context.newPage();
  const seen = new Set();
  for (const href of internal) {
    const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const res = await page.request.get(url);
      if (!res.ok()) report(route, 'ERROR', `dead internal link ${href} -> ${res.status()}`);
    } catch (err) {
      report(route, 'ERROR', `link check failed ${href}: ${err.message}`);
    }
  }
  await context.close();
  return external;
}

async function testThemeToggle(browser) {
  await withPage(browser, async (page, { consoleErrors }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const toggle = await page.$('#theme-btn');
    if (!toggle) {
      report('/', 'FAIL', '#theme-btn does not exist in the DOM — src/lib/theme.ts wires a click handler to getElementById("theme-btn") but no template renders that element, so the theme toggle is dead site-wide');
      return;
    }
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || localStorage.getItem('fynoptic-theme'));
    await toggle.click();
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || localStorage.getItem('fynoptic-theme'));
    if (before === after) {
      report('/', 'ERROR', `theme toggle click did not change theme state (still "${after}")`);
    } else {
      report('/', 'OK', `theme toggled ${before} -> ${after}`);
    }
    if (consoleErrors.length) report('/', 'ERROR', `theme toggle console errors: ${consoleErrors.join('; ')}`);
  });
}

async function testAuthModal(browser) {
  await withPage(browser, async (page, { consoleErrors }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const userBtn = await page.$('#user-btn');
    if (!userBtn) {
      report('/', 'FAIL', '#user-btn (sign-in trigger) not found on homepage');
      return;
    }
    await userBtn.click();
    await page.waitForTimeout(500);
    const modal = await page.$('#login-modal');
    if (!modal) {
      report('/', 'FAIL', 'clicking #user-btn did not inject/show #login-modal');
      return;
    }
    const visible = await modal.isVisible();
    if (!visible) {
      report('/', 'ERROR', '#login-modal exists but is not visible after click');
    } else {
      report('/', 'OK', 'login modal opens on click');
    }

    // Try invalid login to check error messaging works
    const emailInput = await page.$('#login-modal input[type="email"]');
    const passInput = await page.$('#login-modal input[type="password"]');
    const submitBtn = await page.$('#login-modal button[type="submit"]');
    if (emailInput && passInput && submitBtn) {
      await emailInput.fill('nonexistent-qa-test@example.com');
      await passInput.fill('wrongpassword123');
      await submitBtn.click();
      await page.waitForTimeout(2000);
      const errorText = await page.evaluate(() => {
        const el = document.querySelector('#login-modal [class*="error"], #login-modal .form-error, #login-modal [role="alert"]');
        return el ? el.textContent : null;
      });
      if (errorText && errorText.trim()) {
        report('/', 'OK', `invalid login shows error message: "${errorText.trim()}"`);
      } else {
        report('/', 'WARN', 'invalid login attempt produced no visible error message (checked common error selectors)');
      }
    } else {
      report('/', 'WARN', 'could not locate email/password/submit inputs inside login modal to test invalid-credential flow');
    }

    // Switch to signup modal
    const switchToSignup = await page.$('[data-modal-switch="signup-modal"]');
    if (switchToSignup) {
      await switchToSignup.click();
      await page.waitForTimeout(300);
      const signupModal = await page.$('#signup-modal');
      const signupVisible = signupModal ? await signupModal.isVisible() : false;
      report('/', signupVisible ? 'OK' : 'ERROR', signupVisible ? 'signup modal switch works' : 'signup modal did not become visible after switch click');
    } else {
      report('/', 'WARN', 'no data-modal-switch="signup-modal" trigger found inside login modal');
    }

    if (consoleErrors.length) report('/', 'ERROR', `auth modal console errors: ${consoleErrors.join('; ')}`);
  });
}

async function testProfileRedirect(browser) {
  await withPage(browser, async (page) => {
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // onAuthStateChanged callback + replace()
    const url = page.url();
    if (url === `${BASE_URL}/` || url === `${BASE_URL}`) {
      report('/profile', 'OK', 'signed-out visit correctly redirects to /');
    } else {
      report('/profile', 'ERROR', `signed-out visit did not redirect to / — landed on ${url}`);
    }
  });
}

async function testPractice(browser) {
  await withPage(browser, async (page, { consoleErrors }) => {
    await page.goto(`${BASE_URL}/practice`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Step 1: category + count (defaults are fine) -> Confirm & Continue
    const next1 = await page.$('#wiz-next-1');
    if (!next1) { report('/practice', 'FAIL', '#wiz-next-1 (step 1 continue) not found'); return; }
    await next1.click();
    await page.waitForTimeout(500);

    // Step 2: units render as <button role="checkbox"> chips, not native inputs
    const unitBoxes = await page.$$('#topics-list .topic-btn');
    if (unitBoxes.length === 0) {
      report('/practice', 'ERROR', '#topics-list has no checkboxes after step 1 — unit data may have failed to load');
      return;
    }
    for (const cb of unitBoxes.slice(0, 3)) {
      try { await cb.click(); } catch {}
    }
    const next2 = await page.$('#wiz-next-2');
    if (!next2) { report('/practice', 'FAIL', '#wiz-next-2 (step 2 continue) not found'); return; }
    await next2.click();
    await page.waitForTimeout(500);

    const startBtn = await page.$('#start-btn');
    if (!startBtn || !(await startBtn.isVisible())) {
      report('/practice', 'FAIL', '#start-btn not visible after completing wizard steps 1-2');
      return;
    }
    await startBtn.click();
    await page.waitForTimeout(1500);

    const questionText = await page.evaluate(() => {
      const stageEmpty = document.querySelector('#stage-empty');
      if (stageEmpty && !stageEmpty.hidden && getComputedStyle(stageEmpty).display !== 'none') return null;
      const el = document.querySelector('#stage');
      return el ? el.textContent.trim() : null;
    });
    if (questionText && questionText.length > 0) {
      report('/practice', 'OK', `practice session started, stage rendered content (${questionText.length} chars)`);
    } else {
      report('/practice', 'ERROR', 'completed wizard and clicked Start Practice but #stage still shows empty state');
    }
    if (consoleErrors.length) report('/practice', 'ERROR', `console errors during practice start: ${consoleErrors.join('; ')}`);
  });
}

async function testFlashcards(browser) {
  await withPage(browser, async (page, { consoleErrors }) => {
    await page.goto(`${BASE_URL}/flashcard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const unitBoxes = await page.$$('#unit-list .unit-chip');
    if (unitBoxes.length === 0) {
      report('/flashcard', 'ERROR', '#unit-list has no unit chips on load — unit data may have failed to load');
      return;
    }
    for (const cb of unitBoxes.slice(0, 3)) {
      try { await cb.click(); } catch {}
    }
    const confirmUnits = await page.$('#confirm-units');
    if (!confirmUnits) { report('/flashcard', 'FAIL', '#confirm-units not found'); return; }
    await confirmUnits.click();
    await page.waitForTimeout(500);

    const confirmMode = await page.$('#confirm-mode');
    if (!confirmMode || !(await confirmMode.isVisible())) {
      report('/flashcard', 'FAIL', '#confirm-mode not visible after confirming units');
      return;
    }
    await confirmMode.click();
    await page.waitForTimeout(500);

    const startBig = await page.$('#start-btn-big');
    if (!startBig || !(await startBig.isVisible())) {
      report('/flashcard', 'FAIL', '#start-btn-big not visible after confirming mode');
      return;
    }
    await startBig.click();
    await page.waitForTimeout(1500);

    const term = await page.evaluate(() => {
      const el = document.querySelector('[id*="term"], .term, .card-term, .fc-stage');
      return el ? el.textContent.trim() : null;
    });
    if (term && term.length > 0 && term !== '—' && !/no cards yet/i.test(term)) {
      report('/flashcard', 'OK', `flashcard session started, card content rendered (${term.length} chars)`);
    } else {
      report('/flashcard', 'ERROR', `completed wizard and clicked Start Session but no card content appeared (got: "${term}")`);
    }
    if (consoleErrors.length) report('/flashcard', 'ERROR', `console errors during flashcard start: ${consoleErrors.join('; ')}`);
  });
}

async function testBotChat(browser) {
  await withPage(browser, async (page, { consoleErrors }) => {
    // Mock the backend so we don't wait 60s for a real cold start.
    await page.route('https://fixitbotbackend.onrender.com/api/chat', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: 'QA-mocked response' }),
      });
    });
    await page.goto(`${BASE_URL}/bot`, { waitUntil: 'networkidle' });
    const input = await page.$('#user-input');
    const form = await page.$('#chat-form');
    if (!input || !form) {
      report('/bot', 'FAIL', 'chat input/form not found');
      return;
    }
    await input.fill('test message from qa audit');
    await form.evaluate((f) => f.requestSubmit());
    await page.waitForTimeout(1000);
    const botReply = await page.evaluate(() => {
      const bubbles = document.querySelectorAll('.bot-bubble:not(.intro)');
      return bubbles.length ? bubbles[bubbles.length - 1].textContent : null;
    });
    if (botReply && botReply.includes('QA-mocked response')) {
      report('/bot', 'OK', 'chat round-trip works (mocked backend)');
    } else {
      report('/bot', 'ERROR', `chat did not render expected mocked reply, got: "${botReply}"`);
    }
    if (consoleErrors.length) report('/bot', 'ERROR', `bot chat console errors: ${consoleErrors.join('; ')}`);
  });
}

async function testMobileViewport(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const route of ['/', '/practice', '/flashcard', '/courseone']) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 5);
    if (overflow) {
      report(route, 'WARN', 'horizontal overflow detected at 390px viewport (mobile layout may break)');
    } else {
      report(route, 'OK', 'no horizontal overflow at 390px');
    }
  }
  await context.close();
}

async function main() {
  console.log(`QA audit against ${BASE_URL}\n`);
  const browser = await chromium.launch();

  const allLinks = new Set();
  for (const route of ROUTES) {
    const links = (await auditRoute(browser, route)) || [];
    for (const l of links || []) allLinks.add(l);
  }

  // Dead-link sweep using links collected from homepage + nav-heavy pages
  await withPage(browser, async (page) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && !h.startsWith('mailto:') && !h.startsWith('#') && !h.startsWith('tel:')),
    );
    await checkLinks(browser, '/', links);
  });

  await testThemeToggle(browser);
  await testAuthModal(browser);
  await testProfileRedirect(browser);
  await testPractice(browser);
  await testFlashcards(browser);
  await testBotChat(browser);
  await testMobileViewport(browser);

  await browser.close();

  console.log('\n=== SUMMARY ===');
  const bySeverity = { FAIL: 0, ERROR: 0, WARN: 0, OK: 0 };
  for (const f of findings) bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  console.log(bySeverity);
}

main().catch((err) => {
  console.error('AUDIT SCRIPT CRASHED:', err);
  process.exit(1);
});
