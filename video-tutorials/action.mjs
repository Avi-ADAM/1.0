// npm run action -- <session> <actionKey> ['{"json":"params"}']
//
// Runs one Unified Action as a session (from inside its browser context, so the
// cookie and the *.localhost host resolve exactly as on the site). Used for
// backstage upkeep between takes, e.g. `refreshMySuggestions` after editing a
// mission's skills in the admin, so the supplier's lev card is there to film.
import { launch, newContext, sessionInfo, parseArgs } from './lib.mjs';

const { pos } = parseArgs(process.argv.slice(2));
const [name, actionKey, raw = '{}'] = pos;
if (!name || !actionKey) {
  console.error('usage: npm run action -- <session> <actionKey> [json-params]');
  process.exit(1);
}
const s = sessionInfo(name);
const browser = await launch();
const ctx = await newContext(browser, s, { viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
// any light page of the site will do: the request only needs its origin
await page.goto(`${s.base}/robots.txt`, { waitUntil: 'domcontentloaded', timeout: 180000 }).catch(() => {});
const result = await page.evaluate(
  async ({ actionKey, params }) => {
    const r = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionKey, params })
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  },
  { actionKey, params: JSON.parse(raw) }
);
console.log(JSON.stringify(result, null, 2));
await browser.close();
