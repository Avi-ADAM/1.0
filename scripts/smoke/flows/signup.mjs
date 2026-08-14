/**
 * The whole front door: /hascama → /signup → email confirmation → /login →
 * onboarding → a profile that produces match suggestions.
 *
 * This is the path every member walks exactly once, which is precisely why it
 * rots unnoticed — nobody on the team signs up again. docs/QA_NEW_USER_WALKTHROUGH_2026-08.md
 * found nine defects along it, three of them severe, and this flow is the
 * regression net for all nine.
 *
 *   node scripts/smoke/flows/signup.mjs --yes
 *   node scripts/smoke/flows/signup.mjs --confirm '<link from the email>'
 *
 * ⚠ THIS WRITES TO THE LIVE DATABASE — it registers a real user. Nothing is
 * cleaned up; the app has no delete for accounts.
 *
 * It runs in two phases because confirming the email needs a mailbox this
 * harness cannot read:
 *
 *   phase 1 (--yes)      registers, stops at "check your mail", saves the
 *                        account to a state file
 *   phase 2 (--confirm)  opens the link from that mail and carries the same
 *                        account through onboarding to the lev screen
 *
 * What each step asserts, and which finding it guards (F<n> = section in the
 * QA report):
 *
 *   1  consent checkbox   F8: reachable by Tab and toggled by Space. It was
 *                         `display:none`, which drops an input out of the tab
 *                         order entirely and locked keyboard users out of
 *                         registration altogether.
 *   3  jwt cookie         F4: Strapi returns no token while email confirmation
 *                         is on, and the literal string "undefined" used to be
 *                         written into the cookie and read back as a session.
 *   4  no socket auth     F4: the check-email screen must not try to open an
 *                         authenticated socket — there is no session yet.
 *   6  no raw GraphQL     F1: every logged-in page fired a raw-GraphQL query
 *                         that /api/send answers with 403 outside dev, so the
 *                         entire chat/forum subsystem never loaded.
 *   9  suggestion chips   F7/F6: a suggestion is saved under the existing entry
 *                         it matched, which can be a different word ("בסיסי
 *                         נתונים" → "ממשל נתונים"), so the chip has to show it;
 *                         and an unpicked chip must not read as deleted.
 *   10 no-draft screen    F5: with no analysis to review the screen explains
 *                         itself instead of silently bouncing a step back.
 *   12 lev suggestions    F3: onboarding writes through /api/onboard/save,
 *                         which used to skip the matching trigger that
 *                         updateUserRelation runs — so a finished profile still
 *                         got "no suggestions, go add skills".
 *   13 Lev CTA            F9: the hub's assistant card pointed at /lev, which
 *                         has no chat; Lev lives at /chat.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launch, watch, visit, text, shot, credentials, BASE } from '../lib.mjs';

const argv = process.argv.slice(2);
const confirmUrl = argv.includes('--confirm') ? argv[argv.indexOf('--confirm') + 1] : null;

if (!confirmUrl && !argv.includes('--yes')) {
  console.error(
    'This flow writes to the live database: it registers a real user account\n' +
      'that cannot be deleted afterwards.\n\n' +
      '  node scripts/smoke/flows/signup.mjs --yes            # register, then wait for the mail\n' +
      "  node scripts/smoke/flows/signup.mjs --confirm '<link>'  # finish with the link from it\n"
  );
  process.exit(2);
}

/** Carries the account between the two phases. Never inside the repo. */
const ACCOUNT_FILE =
  process.env.SMOKE_SIGNUP_STATE || path.join(os.tmpdir(), '1lev1-smoke-signup.json');

/**
 * Throwaway runs stay anonymous; a persistent test account wants a name you can
 * recognise in a members list, so `SMOKE_SIGNUP_NAME` overrides it. Pair it
 * with `SMOKE_SIGNUP_EMAIL` — multi-member flows (consensus, negotiation, a
 * two-person split) need a second standing account, not a fresh one each run.
 */
const DISPLAY_NAME = process.env.SMOKE_SIGNUP_NAME || 'בדיקה אוטומטית';
const COUNTRY = process.env.SMOKE_SIGNUP_COUNTRY || 'ישראל';

/** Five lines of a plausible member, in Hebrew, for the AI to extract from. */
const STORY = `אני מפתח תוכנה עם ניסיון של שבע שנים בבניית אתרים ואפליקציות ווב.
עובד בעיקר עם JavaScript, TypeScript, Svelte ו-Node.js, וגם בונה ממשקי API ובסיסי נתונים.
בשנתיים האחרונות התמקדתי בליווי צוותים קטנים — עיצוב ארכיטקטורה, בדיקות אוטומטיות וסקירת קוד.
אני אוהב לעבוד בשיתוף פעולה, מחפש פרויקטים עם משמעות חברתית, ומעדיף עבודה מרחוק בקצב גמיש.
בנוסף אני מנחה סדנאות קטנות בנושא כתיבת קוד נקי ומדריך מתחילים.`;

const steps = [];
const record = (name, ok, detail = '') => {
  steps.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

/**
 * A throwaway address on the test account's own mailbox, so the confirmation
 * mail lands somewhere the operator can actually read. Gmail delivers
 * `you+anything@gmail.com` to `you@gmail.com`; override for other providers.
 */
function newAccount() {
  if (process.env.SMOKE_SIGNUP_EMAIL) {
    return {
      email: process.env.SMOKE_SIGNUP_EMAIL,
      password: process.env.SMOKE_SIGNUP_PASSWORD || credentials().password
    };
  }
  const { email, password } = credentials();
  const [user, domain] = email.split('@');
  const tag = `smoke${Date.now().toString(36)}`;
  return { email: `${user.split('+')[0]}+${tag}@${domain}`, password };
}

/** Signup enforces 8+ characters with an uppercase letter. Say so early. */
function checkPassword(password) {
  if (password.length >= 8 && /[A-Z]/.test(password)) return;
  throw new Error(
    'The signup form requires a password of 8+ characters with an uppercase ' +
      'letter, and the configured one does not qualify. Set SMOKE_SIGNUP_PASSWORD.'
  );
}

/** An anonymous context — signup is the one flow that must start logged out. */
async function anonymous() {
  const browser = await launch();
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 1000 },
    locale: process.env.SMOKE_LOCALE || 'he-IL'
  });
  const issues = [];
  const page = await ctx.newPage();
  watch(page, issues);
  return { browser, ctx, page, issues, close: () => browser.close() };
}

/**
 * Click by visible text through the DOM rather than Playwright's clicker.
 * Several of these buttons carry an emoji and a nested span, and a real click
 * lands on a child that swallows it; the onboarding "המשך" is the usual victim.
 */
const clickText = (page, label) =>
  page.evaluate((t) => {
    const el = [...document.querySelectorAll('button, a')].find((x) => x.innerText.includes(t));
    if (!el) throw new Error(`no clickable element containing "${t}"`);
    el.click();
  }, label);

/** Raw-GraphQL rejections seen on /api/send — the F1 signature. */
const rawGraphqlHits = (issues) =>
  issues.filter((i) => i.includes('/api/send') && i.startsWith('[http 403]'));

// ── phase 1: register ────────────────────────────────────────────────────────

async function register() {
  const account = newAccount();
  checkPassword(account.password);
  const { page, issues, close } = await anonymous();

  await visit(page, '/hascama', { wait: 6000 });
  await page.fill('#name', DISPLAY_NAME);

  const country = page.locator('input[placeholder="המקום שלי"]');
  await country.click();
  await country.type(COUNTRY, { delay: 100 });
  await page.waitForTimeout(1500);
  await page.locator('li.custom-multiselect-option', { hasText: COUNTRY }).first().click();
  await page.waitForTimeout(500);
  await page.fill('#email', account.email);

  // F8. Tab from the name field and take the consent checkbox the way a
  // keyboard user does. `display:none` used to keep it out of the tab order
  // for good, so this never terminated — hence the bounded walk.
  await page.evaluate(() => document.querySelector('#name')?.focus());
  let reachable = false;
  for (let i = 0; i < 30 && !reachable; i++) {
    await page.keyboard.press('Tab');
    reachable = await page.evaluate(() =>
      Boolean(document.activeElement?.classList?.contains('checkbox-input'))
    );
  }
  if (reachable) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
  }
  const ticked = await page.evaluate(
    () => document.querySelector('input.checkbox-input')?.checked === true
  );
  record('1. consent checkbox reachable by keyboard (F8)', reachable && ticked,
    reachable ? '' : 'never received focus in 30 tab stops');

  // A mouse user was always fine; fall back so the rest of the flow can run
  // and report the real state of everything after it.
  if (!ticked) {
    await page.locator('.checkbox-text').first().click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
  }

  await clickText(page, 'להרשמה');
  await page.waitForTimeout(8000);
  const onSignup = /\/signup/.test(page.url());
  record('2. consent signed, landed on /signup', onSignup, onSignup ? page.url() : `still ${page.url()}`);
  if (!onSignup) return finish(page, close, account);

  await page.fill('#password', account.password);
  await clickText(page, 'פתיחת');
  await page.waitForTimeout(12000);

  const onCheckMail = /\/signup\/check-email/.test(page.url());
  record('3. account created, sent to check-email', onCheckMail,
    onCheckMail ? account.email : `landed on ${page.url()}`);

  // F4. The cookie must be absent, not the string "undefined": anything truthy
  // there reads as a session to everything downstream.
  const jwtCookie = (await page.context().cookies()).find((c) => c.name === 'jwt');
  record('4. no bogus jwt cookie before confirmation (F4)',
    !jwtCookie || (jwtCookie.value && jwtCookie.value !== 'undefined'),
    jwtCookie ? `jwt=${String(jwtCookie.value).slice(0, 12)}` : 'no jwt cookie');

  // F4, the visible half: no session, so no authenticated socket either.
  const socketAuth = issues.filter((i) => /Invalid or expired JWT|Authentication failed/i.test(i));
  record('5. no socket auth error on check-email (F4)', socketAuth.length === 0,
    socketAuth[0] ?? '');

  await shot(page, 'signup-check-email');
  fs.writeFileSync(ACCOUNT_FILE, JSON.stringify({ ...account, at: Date.now() }, null, 2));

  console.log(
    `\nAccount registered: ${account.email}` +
      `\nSaved to ${ACCOUNT_FILE}` +
      '\n\nOpen the confirmation mail and finish with:' +
      `\n  node scripts/smoke/flows/signup.mjs --confirm '<link from the mail>'\n`
  );
  return finish(page, close, account);
}

// ── phase 2: confirm, onboard, and check the payoff ──────────────────────────

async function confirmAndOnboard(link) {
  if (!fs.existsSync(ACCOUNT_FILE)) {
    throw new Error(
      `No registered account to confirm (${ACCOUNT_FILE} is missing). ` +
        'Run with --yes first, in the same environment.'
    );
  }
  const account = JSON.parse(fs.readFileSync(ACCOUNT_FILE, 'utf8'));
  const { page, issues, close } = await anonymous();

  await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(8000);
  const atLogin = /\/login/.test(page.url());
  record('6. confirmation link accepted', atLogin, page.url());

  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(12000);
  const loggedIn = !/\/login/.test(page.url());
  record('7. logged in with the confirmed account', loggedIn, page.url());
  if (!loggedIn) return finish(page, close, account);

  // F1. The raw-GraphQL query fired on every page of a logged-in member, so
  // one navigation is enough to catch it coming back.
  issues.length = 0;
  await visit(page, '/lev', { wait: 9000 });
  const raw = rawGraphqlHits(issues);
  record('8. no raw-GraphQL 403 on a logged-in page (F1)', raw.length === 0, raw[0] ?? '');

  // F5. The review screen with nothing to review must say so, not bounce.
  await visit(page, '/onboard/provider/review', { wait: 6000 });
  const stayed = /\/onboard\/provider\/review/.test(page.url());
  const explains = (await text(page)).includes('לא מצאנו את הניתוח');
  record('9. empty review screen explains itself (F5)', stayed && explains,
    stayed ? (explains ? '' : 'stayed but printed no explanation') : `bounced to ${page.url()}`);

  // ── onboarding proper ──────────────────────────────────────────────────────
  await visit(page, '/onboard', { wait: 7000 });
  await clickText(page, 'רוצה להציע כישורים');
  await page.waitForTimeout(1000);
  await clickText(page, 'המשך');
  await page.waitForTimeout(7000);
  await clickText(page, 'תיאור במילים שלך');
  await page.waitForTimeout(800);
  await clickText(page, 'המשך');
  await page.waitForTimeout(6000);

  await page.locator('textarea').first().fill(STORY);
  await clickText(page, 'ניתוח');
  // The AI round trip is the slowest thing in the app; poll rather than guess.
  let analysed = false;
  for (let i = 0; i < 18 && !analysed; i++) {
    await page.waitForTimeout(5000);
    analysed = /\/onboard\/provider\/review/.test(page.url());
  }
  record('10. free-text story analysed', analysed, analysed ? '' : `stuck on ${page.url()}`);
  if (!analysed) return finish(page, close, account);

  // F7 + F6. A suggestion chip has to name the entry it will be saved under,
  // and an unpicked chip must not be dressed as a deleted one.
  const chips = await page.evaluate(() =>
    [...document.querySelectorAll('button.chip.suggested')].map((c) => ({
      label: c.innerText.replace(/\s+/g, ' ').trim(),
      strike: getComputedStyle(c).textDecorationLine.includes('line-through')
    }))
  );
  const mapped = chips.filter((c) => c.label.includes('←'));
  record('11. suggestion chips name what they save as (F7)',
    chips.length === 0 || mapped.length > 0,
    chips.length ? `${mapped.length}/${chips.length} mapped, e.g. ${mapped[0]?.label ?? chips[0].label}` : 'no suggestions this run');
  record('12. unpicked chips are not struck through (F6)',
    chips.every((c) => !c.strike),
    chips.filter((c) => c.strike).length ? `${chips.filter((c) => c.strike).length} still struck` : '');

  // Take everything the AI found, so the profile is rich enough to match on.
  await page.evaluate(() => {
    for (const b of document.querySelectorAll('button.chip')) if (b.classList.contains('off')) b.click();
  });
  await page.waitForTimeout(1500);
  await shot(page, 'signup-review');

  const saved = page.waitForResponse((r) => r.url().includes('/api/onboard/save'), { timeout: 90000 });
  await clickText(page, 'המשך לעריכה');
  const saveRes = await saved.catch(() => null);
  const saveBody = saveRes ? await saveRes.json().catch(() => null) : null;
  record('13. profile saved', saveRes?.status() === 200 && saveBody?.ok === true,
    saveBody ? JSON.stringify(saveBody.counts ?? {}) : 'no /api/onboard/save call');
  await page.waitForTimeout(10000);

  // F3. The payoff: a finished profile has to produce something on the lev
  // screen. The old behaviour sent the user back to add the skills they had
  // just added.
  await visit(page, '/lev', { wait: 12000 });
  const levText = await text(page);
  const empty = levText.includes('לא נמצאו הצעות או פעולות עבורך');
  record('14. lev has suggestions after onboarding (F3)', !empty,
    empty ? 'still "לא נמצאו הצעות או פעולות עבורך"' : '');
  await shot(page, 'signup-lev');

  // F9. One of the three first steps we hand every new member.
  await visit(page, '/hub', { wait: 9000 });
  const levCta = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a')].find((x) => /Lev/i.test(x.innerText));
    return a ? a.getAttribute('href') : null;
  });
  record('15. hub assistant card points at the chat (F9)',
    levCta === null || levCta === '/chat',
    levCta === null ? 'first-steps card not shown on this account' : `href=${levCta}`);

  return finish(page, close, account);
}

async function finish(page, close, account) {
  await close();
  const failed = steps.filter((s) => !s.ok);
  console.log(`\n${steps.length - failed.length}/${steps.length} steps passed.`);
  if (account) console.log(`account: ${account.email}`);
  if (failed.length) {
    console.log('failed:');
    failed.forEach((s) => console.log(`  ${s.name}${s.detail ? ` — ${s.detail}` : ''}`));
    process.exit(1);
  }
}

(confirmUrl ? confirmAndOnboard(confirmUrl) : register()).catch((e) => {
  console.error(e);
  process.exit(1);
});
