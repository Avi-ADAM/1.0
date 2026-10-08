// npm run inspect -- <session> <path> [--full] [--wait ms] [--width 1280 --height 720]
//
// Opens one page as one session and writes what a flow author needs:
// a screenshot and the ARIA snapshot (roles + accessible names = the
// selectors a flow should use). The snapshot is also printed to stdout.
import { launch, newContext, sessionInfo, parseArgs, ensureDir, ROOT } from './lib.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { pos, opt } = parseArgs(process.argv.slice(2));
const [name, path = '/'] = pos;
if (!name) {
  console.error('usage: npm run inspect -- <session> <path> [--full]');
  process.exit(1);
}
const s = sessionInfo(name);
const outDir = ensureDir(join(ROOT, 'out', 'inspect'));
const slug = `${name}${path.replace(/[^\w֐-׿]+/g, '_')}`.slice(0, 80);

const browser = await launch();
const ctx = await newContext(browser, s, {
  viewport: { width: +(opt.width ?? 1280), height: +(opt.height ?? 720) }
});
const page = await ctx.newPage();
await page.goto(`${s.base}${path}`, { waitUntil: 'domcontentloaded', timeout: +(opt.timeout ?? 180000) });
await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
if (opt.wait) await page.waitForTimeout(+opt.wait);

const png = join(outDir, `${slug}.png`);
await page.screenshot({ path: png, fullPage: !!opt.full });
const aria = await page.locator('body').ariaSnapshot();
const yml = join(outDir, `${slug}.aria.yml`);
writeFileSync(yml, `# ${s.base}${path}  (final url: ${page.url()})\n${aria}\n`, 'utf8');

console.log(`url: ${page.url()}\nscreenshot: ${png}\naria: ${yml}\n`);
console.log(aria);
await browser.close();
