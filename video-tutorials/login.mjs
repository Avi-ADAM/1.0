// npm run login -- <session> [--path /login]
//
// Opens a real browser window on the session's own host. A person signs in by
// hand — the script never sees or stores a password — and as soon as the `jwt`
// cookie appears the whole storage state is saved to .auth/<session>.json.
// Re-run it when a recording says the session is signed out.
import { launch, sessionInfo, parseArgs, ensureDir, AUTH_DIR } from './lib.mjs';

const { pos, opt } = parseArgs(process.argv.slice(2));
const names = pos.length ? pos : [];
if (!names.length) {
  console.error('usage: npm run login -- <session> [<session> …]');
  process.exit(1);
}

ensureDir(AUTH_DIR);
const browser = await launch({ headed: true });

await Promise.all(
  names.map(async name => {
    const s = sessionInfo(name);
    if (s.anonymous) {
      console.log(`· ${name}: anonymous session, nothing to sign in`);
      return;
    }
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 }, locale: 'he-IL' });
    const page = await ctx.newPage();
    // vite compiles /login on first visit — 3 windows at once can take well over 30s;
    // and a slow load must not close the window, the person can still sign in
    await page.goto(`${s.base}${opt.path ?? '/login'}`, { waitUntil: 'domcontentloaded', timeout: 180000 })
      .catch(e => console.log(`· ${name}: page still loading (${e.message.split('\n')[0]}) — sign in when it appears`));
    console.log(`· ${name}: sign in as ${s.label} (${s.envUser}) in the window on ${s.host} …`);
    const deadline = Date.now() + 15 * 60_000;
    while (Date.now() < deadline) {
      const cookies = await ctx.cookies();
      if (cookies.some(c => c.name === 'jwt' && c.value)) break;
      await page.waitForTimeout(1000).catch(() => {});
    }
    // let the post-login redirect settle so localStorage the app writes is kept too
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500).catch(() => {});
    await ctx.storageState({ path: s.statePath });
    console.log(`✓ ${name}: saved ${s.statePath}`);
    await ctx.close();
  })
);

await browser.close();
