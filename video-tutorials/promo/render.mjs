// Renders a promo animation (promo/<name>/index.html) frame by frame into an mp4.
//   node promo/render.mjs god-partner            -> out/promo/god-partner.mp4
//   node promo/render.mjs god-partner --stills   -> a few PNG stills only (quick check)
// The page exposes window.seek(t) and window.DURATION; every frame is a seek + screenshot,
// so the timing is exact no matter how slow the machine is.
import { chromium } from 'playwright';
import { launch } from '../lib.mjs';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const name = process.argv[2];
if (!name) { console.error('usage: node promo/render.mjs <name> [--stills] [--fps 30]'); process.exit(1); }
const stills = process.argv.includes('--stills');
const fpsArg = process.argv.indexOf('--fps');
const FPS = fpsArg > 0 ? +process.argv[fpsArg + 1] : 30;

const FFMPEG = process.env.FFMPEG
  || [resolve(ROOT, '../../OpenMontage/remotion-composer/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe')]
    .find(existsSync) || 'ffmpeg';

const outDir = join(ROOT, 'out', 'promo');
mkdirSync(outDir, { recursive: true });

// If `npx playwright install` lags behind the playwright package, fall back to any
// Chromium build already on disk (CHROMIUM=<path to chrome.exe> overrides).
let browser;
try { browser = await launch(); } catch (e) {
  const pw = join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  const exe = process.env.CHROMIUM || (existsSync(pw) && readdirSync(pw).filter(d => /^chromium-\d+$/.test(d)).sort().reverse()
    .map(d => join(pw, d, 'chrome-win64', 'chrome.exe')).find(existsSync));
  if (!exe) throw e;
  browser = await chromium.launch({ executablePath: exe, args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
}
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(HERE, name, 'index.html')).href + '?render=1', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate(() => window.DURATION);

if (stills) {
  const times = (process.argv.find(a => a.startsWith('--at=')) || '--at=2,4.4,5,9.8,14.8,20,24').slice(5).split(',').map(Number);
  for (const t of times) {
    await page.evaluate(t => window.seek(t), t);
    await page.screenshot({ path: join(outDir, `${name}-t${t}.png`) });
  }
  console.log('stills ->', outDir);
} else {
  const out = join(outDir, `${name}.mp4`);
  // optional soundtrack the page declares:
  //   window.AUDIO = [{ src, in, dur, at = 0, vol = 1, fadeIn = 0, fadeOut = 0 }, …]  (src relative to the page)
  // each slice is cut from its source, faded, placed at `at` and mixed.
  let tracks = await page.evaluate(() => window.AUDIO || []);
  if (!Array.isArray(tracks)) tracks = [tracks];
  const aIn = tracks.flatMap(a => ['-ss', String(a.in), '-t', String(a.dur), '-i', join(HERE, name, a.src)]);
  const chains = tracks.map((a, k) => {
    const v = a.vol ?? 1, fi = a.fadeIn || 0, fo = a.fadeOut || 0, ms = Math.round((a.at || 0) * 1000);
    const gain = `${v}${fi ? `*min(1,t/${fi})` : ''}${fo ? `*max(0,min(1,(${a.dur}-t)/${fo}))` : ''}`;
    return `[${k + 1}:a]aresample=48000,aformat=channel_layouts=stereo,volume='${gain}':eval=frame,adelay=${ms}|${ms}[a${k}]`;
  });
  const aOut = tracks.length ? [
    '-filter_complex', `${chains.join(';')};${tracks.map((_, k) => `[a${k}]`).join('')}amix=inputs=${tracks.length}:duration=longest:normalize=0[aout]`,
    '-map', '0:v', '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k', '-t', String(duration)] : [];
  const ff = spawn(FFMPEG, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...aIn,
    ...aOut, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'ignore', 'inherit'] });
  const frames = Math.round(duration * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.seek(t), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`\r${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`\n-> ${out}`);
}
await browser.close();
