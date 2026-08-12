/**
 * Browser harness for driving the live site as a real logged-in user.
 *
 * This exists because a lot of what breaks in this app cannot be seen from
 * unit tests: a qid that 403s only in production, a GraphQL mutation that
 * fails only when a description contains a quote, a button that swallows its
 * own error. Those need a browser, a session, and the real backend.
 *
 * Everything here is read-only. Anything that writes to the live database
 * lives under `flows/` and has to be asked for by name.
 *
 * See scripts/smoke/README.md.
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);

export const BASE = process.env.SMOKE_BASE_URL || 'https://www.1lev1.com';

/** Where the logged-in session is cached between runs (never inside the repo). */
const STATE_FILE =
  process.env.SMOKE_STATE || path.join(os.tmpdir(), '1lev1-smoke-state.json');

/** Screenshots land here; handy when a run fails and you want to see why. */
export const SHOTS_DIR = process.env.SMOKE_SHOTS || path.join(os.tmpdir(), '1lev1-smoke-shots');

// ── credentials ──────────────────────────────────────────────────────────────

/**
 * Read the test account from the environment. Never hard-code an account here:
 * this drives a real session against a real site.
 */
export function credentials() {
  const email = process.env.claude_user_1 || process.env.CLAUDE_USER_1 || process.env.SMOKE_EMAIL;
  const password =
    process.env.claude_us_1_ps || process.env.CLAUDE_US_1_PS || process.env.SMOKE_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Missing test-account credentials. Set claude_user_1 and claude_us_1_ps ' +
        '(or SMOKE_EMAIL / SMOKE_PASSWORD) in the environment.'
    );
  }
  return { email, password };
}

// ── playwright / chromium resolution ─────────────────────────────────────────

/**
 * Playwright is not a dependency of this project — it is expected to be
 * installed globally in the agent image. Resolve it from the usual places and
 * say something useful when it is missing.
 */
async function loadChromium() {
  const candidates = [
    'playwright',
    'playwright-core',
    '/opt/node22/lib/node_modules/playwright',
    '/usr/lib/node_modules/playwright',
    '/usr/local/lib/node_modules/playwright'
  ];
  for (const id of candidates) {
    try {
      return require(id).chromium;
    } catch {
      /* try the next one */
    }
  }
  throw new Error(
    'Could not load playwright. Install it (npm i -g playwright) or run with ' +
      'NODE_PATH pointing at the global node_modules.'
  );
}

/**
 * Playwright looks for the browser revision it was built against. The agent
 * image ships a chromium under PLAYWRIGHT_BROWSERS_PATH that may carry a
 * different revision number, so fall back to whatever chromium is actually
 * there rather than failing with "executable doesn't exist".
 */
function findChromiumBinary() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !fs.existsSync(root)) return undefined;
  const dirs = fs
    .readdirSync(root)
    .filter((d) => d.startsWith('chromium') && !d.includes('headless_shell'))
    .sort()
    .reverse();
  for (const d of dirs) {
    for (const rel of ['chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      const p = path.join(root, d, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

/**
 * The agent sandbox routes HTTPS through a MITM proxy that resets Chromium's
 * TLS 1.3 ClientHello — every navigation dies with ERR_CONNECTION_RESET until
 * the handshake is capped at 1.2. Harmless elsewhere, but it IS a downgrade,
 * so it only switches on behind that proxy. Force with SMOKE_TLS12=1/0.
 */
function tls12Needed() {
  if (process.env.SMOKE_TLS12 === '1') return true;
  if (process.env.SMOKE_TLS12 === '0') return false;
  return Boolean(process.env.CCR_AGENT_PROXY_ENABLED || process.env.HTTPS_PROXY);
}

export async function launch({ headed = false } = {}) {
  const chromium = await loadChromium();
  const args = ['--no-sandbox', '--disable-dev-shm-usage'];
  if (tls12Needed()) args.push('--ssl-version-max=tls1.2');

  return chromium.launch({
    headless: !headed,
    executablePath: findChromiumBinary(),
    ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
    args
  });
}

// ── session ──────────────────────────────────────────────────────────────────

/**
 * A logged-in page, reusing the cached session when it is still good.
 *
 * Returns `{ browser, ctx, page, issues, close }`. `issues` accumulates
 * console errors, uncaught exceptions and failed same-origin requests — read
 * it after each navigation and reset it between pages.
 */
export async function session({ fresh = false, headed = false } = {}) {
  const browser = await launch({ headed });
  const haveState = !fresh && fs.existsSync(STATE_FILE);
  const ctx = await browser.newContext({
    storageState: haveState ? STATE_FILE : undefined,
    viewport: { width: 1400, height: 1000 },
    locale: process.env.SMOKE_LOCALE || 'he-IL'
  });

  const issues = [];
  const page = await ctx.newPage();
  watch(page, issues);

  // `/lev` is members-only. Without a valid session the app bounces us — to
  // `/login` sometimes, to the marketing homepage other times — so "did we land
  // on /lev" is the only reliable signal, not the presence of a login form.
  await page.goto(BASE + '/lev', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  if (!/\/lev\b/.test(new URL(page.url()).pathname)) {
    await login(page);
    await ctx.storageState({ path: STATE_FILE });
  }

  const close = async () => {
    await ctx.storageState({ path: STATE_FILE }).catch(() => {});
    await browser.close();
  };
  return { browser, ctx, page, issues, close };
}

async function login(page) {
  const { email, password } = credentials();
  if (!/\/login/.test(page.url())) {
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  }
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(6000);
  if (await page.locator('input[name="password"]').count()) {
    // The page prints the reason (wrong password, unconfirmed email, …).
    const reason = await page
      .locator('.auth-alert')
      .first()
      .innerText()
      .catch(() => '');
    throw new Error(
      `Login failed for ${email} — still on ${page.url()}${reason ? `: ${reason.trim()}` : ''}`
    );
  }
}

/** Attach console / pageerror / HTTP-failure listeners to a page. */
export function watch(page, issues) {
  page.on('console', (m) => {
    if (m.type() === 'error') issues.push(`[console] ${m.text().slice(0, 300)}`);
  });
  page.on('pageerror', (e) => issues.push(`[pageerror] ${String(e).slice(0, 300)}`));
  page.on('response', (r) => {
    if (r.status() < 400) return;
    if (!r.url().includes('1lev1.com')) return;
    let body = '';
    try {
      body = (r.request().postData() || '').slice(0, 160);
    } catch {
      /* not all requests expose a body */
    }
    issues.push(`[http ${r.status()}] ${r.url().replace(BASE, '')} ${body}`.trim());
  });
}

// ── page inspection ──────────────────────────────────────────────────────────

/** Visible text of the page, with the nav chrome and blank runs stripped. */
export async function text(page) {
  const raw = await page.evaluate(() => document.body.innerText);
  const chrome = new Set([
    'מזעור', 'מרכז', 'רקמות', 'צ׳אט', 'עסקאות', 'קונסיירז׳',
    'גילוי', 'הלב', 'פרופיל', 'עוד', 'תפריט פרופיל'
  ]);
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !chrome.has(l))
    .join('\n');
}

/** Every control a user could actually click, as `tag[name] href :: label`. */
export async function controls(page, limit = 120) {
  return page.evaluate((max) => {
    const sel = 'button, a[href], input, select, textarea, [role="button"], [contenteditable="true"]';
    return [...document.querySelectorAll(sel)]
      .map((e) => {
        const r = e.getBoundingClientRect();
        if (!r.width && !r.height) return null;
        const label = (
          e.innerText ||
          e.value ||
          e.placeholder ||
          e.getAttribute('aria-label') ||
          e.getAttribute('title') ||
          ''
        )
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 60);
        const name = e.getAttribute('name');
        const href = e.getAttribute('href');
        return `${e.tagName.toLowerCase()}${name ? `[${name}]` : ''}${href ? ` ${href}` : ''} :: ${label}`;
      })
      .filter(Boolean)
      .slice(0, max);
  }, limit);
}

export async function shot(page, name) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  const file = path.join(SHOTS_DIR, `${name.replace(/[^\w.-]+/g, '_')}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  return file;
}

/**
 * Log every /api/* POST with its body and response. This is how the escaping
 * and validation bugs were found — the UI said nothing, the payload said
 * everything.
 */
export function logApi(page, { filter } = {}) {
  page.on('response', async (r) => {
    if (!r.url().includes('/api/') || r.request().method() !== 'POST') return;
    let body = '';
    try {
      body = (r.request().postData() || '').slice(0, 400);
    } catch {
      /* ignore */
    }
    if (filter && !filter(body, r)) return;
    let res = '';
    try {
      res = (await r.text()).slice(0, 400);
    } catch {
      /* ignore */
    }
    console.log(`  → ${r.status()} ${r.url().replace(BASE, '')}\n    req: ${body}\n    res: ${res}`);
  });
}

// ── navigation ───────────────────────────────────────────────────────────────

/**
 * Go to a path, wait for the client to settle, and dismiss the first-visit
 * guide dialogs that otherwise sit on top of everything.
 */
export async function visit(page, pathname, { wait = 8000 } = {}) {
  await page.goto(BASE + pathname, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(wait);
  await dismissGuides(page);
}

/**
 * Close the first-visit guide dialogs ("מדריך למוח הריקמה", the profile tour).
 *
 * They matter more than they look: while one is open it covers the page, so a
 * click on anything underneath is swallowed — including a forced one, which
 * then looks like the control is broken rather than blocked. Keep trying until
 * no dialog is left, because dismissing one can reveal the next.
 */
export async function dismissGuides(page, rounds = 3) {
  for (let i = 0; i < rounds; i++) {
    const dialog = page.locator('[role="dialog"], [aria-modal="true"]').first();
    if (!(await dialog.count())) return;

    const declined = await page.evaluate(() => {
      const box = document.querySelector('[role="dialog"], [aria-modal="true"]');
      if (!box) return false;
      const no = [...box.querySelectorAll('button')].find((b) =>
        /^(לא תודה|לא|later|skip|not now|dismiss|close)$/i.test(b.innerText.trim())
      );
      if (!no) return false;
      no.click();
      return true;
    });
    if (!declined) return; // a dialog we do not know how to close — leave it
    await page.waitForTimeout(1200);
  }
}

/**
 * The id of the signed-in user's first rikma, by doing what a user does:
 * open the rikma picker and click the first one. Returns null when the
 * account has no rikma yet.
 */
export async function firstProjectId(page) {
  if (process.env.SMOKE_PROJECT_ID) return process.env.SMOKE_PROJECT_ID;
  await visit(page, '/moach', { wait: 7000 });
  const buttons = page.locator('button');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const label = (await buttons.nth(i).innerText().catch(() => '')).trim();
    if (!label || /יצירת ריקמה/.test(label)) continue;
    await buttons.nth(i).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(6000);
    const m = page.url().match(/\/moach\/(\d+)/);
    if (m) return m[1];
    await visit(page, '/moach', { wait: 5000 });
  }
  return null;
}
