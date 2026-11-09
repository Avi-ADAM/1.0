// Look at a generated clip without a full ffmpeg: a contact sheet of frames + a loudness curve.
//   node promo/probe-clip.mjs promo/god-partner/assets/s1.mp4 [outDir]
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const file = resolve(process.argv[2]);
const outDir = resolve(process.argv[3] || 'out/promo');
mkdirSync(outDir, { recursive: true });
const pw = join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const exe = process.env.CHROMIUM || readdirSync(pw).filter(d => /^chromium-\d+$/.test(d)).sort().reverse()
  .map(d => join(pw, d, 'chrome-win64', 'chrome.exe')).find(existsSync);
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.setContent('<body style="margin:0;background:#000"></body>');
const b64 = readFileSync(file).toString('base64');
const res = await page.evaluate(async ([b64, name]) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes]));
  // loudness, 0.1s windows
  const ctx = new OfflineAudioContext(1, 48000, 48000);
  const audioOnly = /.(mp3|wav|m4a|ogg)$/i.test(name);
  const buf = await ctx.decodeAudioData(bytes.buffer.slice(0));
  const ch = buf.getChannelData(0), win = buf.sampleRate / 10, rms = [];
  for (let i = 0; i < ch.length; i += win) { let s = 0; for (let j = i; j < Math.min(i + win, ch.length); j++) s += ch[j] * ch[j]; rms.push(Math.sqrt(s / win)); }
  if (audioOnly) return { duration: buf.duration, w: 0, h: 0, rms: rms.map(x => +x.toFixed(3)), sheet: null };
  // contact sheet: one frame per second
  const v = document.createElement('video'); v.src = url; v.muted = true; await v.play().catch(() => {}); v.pause();
  await new Promise(r => v.readyState >= 1 ? r() : v.onloadedmetadata = r);
  const n = Math.ceil(v.duration), cols = 5, w = 220, h = Math.round(w * v.videoHeight / v.videoWidth);
  const c = document.createElement('canvas'); c.width = cols * w; c.height = Math.ceil(n / cols) * h;
  const g = c.getContext('2d'); g.font = 'bold 22px sans-serif'; g.fillStyle = '#ff0';
  for (let i = 0; i < n; i++) {
    v.currentTime = Math.min(i + .5, v.duration - .05); await new Promise(r => v.onseeked = r);
    g.drawImage(v, (i % cols) * w, Math.floor(i / cols) * h, w, h); g.fillText(`${i + .5}s`, (i % cols) * w + 6, Math.floor(i / cols) * h + 26);
  }
  return { duration: v.duration, w: v.videoWidth, h: v.videoHeight, rms: rms.map(x => +x.toFixed(3)), sheet: c.toDataURL('image/png').split(',')[1] };
}, [b64, file]);
if (res.sheet) writeFileSync(join(outDir, 'clip-sheet.png'), Buffer.from(res.sheet, 'base64'));
console.log(res.duration, res.w, res.h);
const max = Math.max(...res.rms);
const step = +(process.env.STEP || 1); res.rms.forEach((x, i) => i % step === 0 && console.log((i / 10).toFixed(1).padStart(4), '#'.repeat(Math.round(x / max * 50))));
await browser.close();
