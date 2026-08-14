/**
 * Read-only smoke sweep of the live site as a logged-in member.
 *
 *   node scripts/smoke/smoke.mjs                 # every page below
 *   node scripts/smoke/smoke.mjs /lev /moach/82  # only these
 *   node scripts/smoke/smoke.mjs --verbose       # + page text and controls
 *
 * Navigates each page, waits for the client to settle, and reports console
 * errors, uncaught exceptions and failed same-origin requests. Exits non-zero
 * when anything was found, so it can gate a deploy.
 *
 * It only reads. See flows/ for the paths that write.
 */

import { session, visit, text, controls, shot, firstProjectId, BASE } from './lib.mjs';

const argv = process.argv.slice(2);
const verbose = argv.includes('--verbose');
const shotOnIssue = !argv.includes('--no-shots');
const explicit = argv.filter((a) => a.startsWith('/'));

/** Pages every member sees. `{id}` is filled with the account's first rikma. */
const DEFAULT_PATHS = [
  '/lev',
  '/me',
  '/hub',
  '/deals/sales-center',
  '/moach',
  '/moach/{id}/main',
  '/moach/{id}/create',
  '/moach/{id}/progress',
  '/moach/{id}/acts',
  '/moach/{id}/kanban',
  '/moach/{id}/gantt',
  '/moach/{id}/timers',
  '/moach/{id}/processes',
  '/moach/{id}/chains',
  '/moach/{id}/sales',
  '/moach/{id}/split',
  '/moach/{id}/wishes',
  '/moach/{id}/open',
  '/moach/{id}/votes',
  '/moach/{id}/edit',
  '/project/{id}',
  '/project/{id}/support',
  '/project/{id}/join'
];

/**
 * Noise that is real but already known and tracked elsewhere — kept out of the
 * exit code so a genuinely new failure is not lost in it. Prune as things get
 * fixed; an empty list is the goal.
 */
const KNOWN = [
  // Third-party embeds and analytics we do not control.
  /googletagmanager|gstatic|doubleclick|facebook\.net/i,
  // Cloudinary occasionally 404s a derived image size.
  /res\.cloudinary\.com/i
];

const isKnown = (line) => KNOWN.some((re) => re.test(line));

const run = async () => {
  const { page, issues, close } = await session();
  let paths = explicit.length ? explicit : DEFAULT_PATHS;

  if (paths.some((p) => p.includes('{id}'))) {
    const id = await firstProjectId(page);
    if (!id) {
      console.log('! no rikma on this account — skipping the per-rikma pages');
      paths = paths.filter((p) => !p.includes('{id}'));
    } else {
      console.log(`rikma under test: ${id}`);
      paths = paths.map((p) => p.replace('{id}', id));
    }
  }

  let failed = 0;
  /** signature → { line, paths[] } — one site-wide bug should read as one bug. */
  const grouped = new Map();

  for (const p of paths) {
    issues.length = 0;
    let navError = null;
    try {
      await visit(page, p);
    } catch (e) {
      navError = e.message.split('\n')[0];
    }

    const found = [...new Set(issues)].filter((l) => !isKnown(l));
    const landed = navError ? '—' : page.url().replace(BASE, '');
    // Bounced to the login page: the session died mid-run. Reporting that page
    // as "clean" would be worse than useless — it hides every later result too.
    if (!navError && /\/login/.test(landed) && !/\/login/.test(p)) {
      found.unshift('[session] redirected to login — not signed in any more');
    }
    if (navError) found.push(`[nav] ${navError}`);

    const status = navError ? 'NAV FAIL' : found.length ? `${found.length} issue(s)` : 'ok';
    console.log(`${found.length ? '✗' : '✓'} ${p} → ${landed}  [${status}]`);

    if (found.length) {
      failed++;
      let shotTaken = false;
      for (const line of found) {
        const key = signature(line);
        const seen = grouped.get(key);
        if (seen) {
          seen.paths.push(p);
          continue;
        }
        // First page to hit this one: print it in full and grab the evidence.
        console.log(`    ${line}`);
        grouped.set(key, { line, paths: [p] });
        if (shotOnIssue && !navError && !shotTaken) {
          console.log(`    shot: ${await shot(page, p)}`);
          shotTaken = true;
        }
      }
      const repeats = found.length - found.filter((l) => grouped.get(signature(l))?.paths.length === 1).length;
      if (repeats) console.log(`    (+${repeats} already reported above)`);
    }

    if (verbose && !navError) {
      console.log('  ── text ──\n' + (await text(page)).slice(0, 2500));
      console.log('  ── controls ──\n' + (await controls(page)).join('\n'));
    }
  }

  await close();

  console.log(`\n${paths.length - failed}/${paths.length} pages clean.`);
  if (grouped.size) {
    console.log(`\n${grouped.size} distinct issue(s):\n`);
    for (const { line, paths: hit } of grouped.values()) {
      const where =
        hit.length === paths.length
          ? 'every page'
          : hit.length > 4
            ? `${hit.length} pages, e.g. ${hit.slice(0, 3).join(', ')}`
            : hit.join(', ');
      console.log(`  ${line}\n    → ${where}\n`);
    }
    process.exit(1);
  }
};

/**
 * Collapse a finding to what makes it distinct. One broken query firing on
 * every page is one bug, not twenty-two — but two different 403s must not
 * collapse into each other, so the payload's opening characters stay in.
 */
function signature(line) {
  return line
    .replace(/\bid:\s*\d+/g, 'id:N')
    .replace(/\/\d+(?=\/|\b)/g, '/N')
    .replace(/\s+/g, ' ')
    .slice(0, 150);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
