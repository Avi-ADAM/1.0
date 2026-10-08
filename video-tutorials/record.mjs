// npm run record -- flows/<flow>.json [options]
//
//   --scene a,b       record only these scenes (vars from earlier scenes: --vars)
//   --from id         record this scene and everything after it
//   --vars file.json  start from saved variables (e.g. the wishId of a past run)
//   --out dir         write here instead of out/<flow>/<stamp>/
//   --headed          show the browser while recording
//   --capture video   use Playwright's built-in recorder instead of the
//                     CDP screencast (lower quality, no ffmpeg needed)
//   --dry             run the steps without capturing (fast selector check)
//
// Each scene runs in a fresh browser context of its session and becomes one
// clip, scene-<id>.mp4. timeline.json records when every step started and
// ended inside that clip and where its element was on screen — narration,
// captions, zooms and callouts are timed from it downstream, so a re-shoot
// after a UI change re-times the whole video by itself.
import {
  launch, newContext, sessionInfo, parseArgs, resolve, interpolate,
  ensureDir, stamp, findFfmpeg, writeJson, ROOT
} from './lib.mjs';
import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, resolve as resolvePath, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

const { pos, opt } = parseArgs(process.argv.slice(2));
if (!pos[0]) {
  console.error('usage: npm run record -- flows/<flow>.json [--scene id] [--from id] [--headed] [--dry]');
  process.exit(1);
}
const flowPath = resolvePath(pos[0]);
const flow = JSON.parse(readFileSync(flowPath, 'utf8'));
const runStamp = stamp();
const outDir = ensureDir(resolvePath(opt.out ?? join(ROOT, 'out', flow.id, runStamp)));
const capture = opt.dry ? 'none' : (opt.capture ?? flow.capture ?? 'screencast');
const ffmpeg = capture === 'screencast' ? findFfmpeg() : null;
if (capture === 'screencast' && !ffmpeg) {
  console.error('ffmpeg not found (set FFMPEG=…\\ffmpeg.exe) — or pass --capture video');
  process.exit(1);
}

const vars = {
  RUN: runStamp.slice(4, 13).replace('-', ' '), // "1006 1530" — tells this run's rows apart
  ...(flow.vars ?? {}),
  ...(opt.vars ? JSON.parse(readFileSync(resolvePath(opt.vars), 'utf8')) : {})
};

// vars may use each other ("… (הדגמה ${RUN})") — resolve them before any scene does
for (const k of Object.keys(vars)) vars[k] = interpolate(vars[k], vars);

// a scene still marked todo has no steps worth filming yet; --dry runs it anyway
let scenes = flow.scenes.filter(s => {
  if (s.todo && !(s.steps ?? []).length && !opt.dry) {
    console.log(`· skipping ${s.id} (todo: ${s.todo})`);
    return false;
  }
  return true;
});
if (opt.scene) {
  const want = String(opt.scene).split(',');
  scenes = scenes.filter(s => want.includes(s.id));
} else if (opt.from) {
  const i = scenes.findIndex(s => s.id === opt.from);
  if (i < 0) throw new Error(`no scene "${opt.from}"`);
  scenes = scenes.slice(i);
}

const defaults = { viewport: { width: 1280, height: 720 }, scale: 1.5, pace: 1, ...(flow.defaults ?? {}) };
// how long the viewer gets to read the result of each kind of step
const SETTLE = { goto: 1200, click: 900, type: 700, fill: 500, select: 700, press: 600, hover: 700, scroll: 500, highlight: 0, check: 600, upload: 900 };

const browser = await launch({ headed: !!opt.headed });
await warmup();
const timeline = { flow: flow.id, title: flow.title, recordedAt: new Date().toISOString(), capture, flowFile: basename(flowPath), scenes: [] };
let failed = null;

// A dev server that reloads the page mid-scene (someone saved a file, Vite
// re-optimized a dependency) wipes what was typed and films a white flash.
// Such a take is thrown away and shot again — unless a step marked
// "commits": true (publish, approve…) already ran: repeating it would write
// twice, so the run stops and says so instead.
const RETRIES = +(opt.retries ?? 3);

for (const rawScene of scenes) {
  let result;
  for (let attempt = 1; attempt <= RETRIES + 1; attempt++) {
    result = await shootScene(rawScene, attempt);
    // A failure before anything was written is retaken too: on this backend a
    // step usually fails because Strapi answered 503 / timed out for a moment,
    // and until a commits step has run a retake only reads.
    const flaky = !!failed && !result.committed;
    if ((!result.reloaded && !flaky) || result.committed || attempt > RETRIES) break;
    console.log(result.reloaded
      ? `   ↻ the page reloaded mid-take (dev server) — shooting ${rawScene.id} again (${attempt}/${RETRIES})`
      : `   ↻ ${failed.message} — nothing written yet, retaking ${rawScene.id} in 20s (${attempt}/${RETRIES})`);
    failed = null;
    await new Promise(r => setTimeout(r, 20000));
  }
  if (result.reloaded && !failed) {
    failed = {
      scene: rawScene.id, step: '-', png: '-', aria: '-',
      message: result.committed
        ? 'the page reloaded after a committing step — not repeating it; re-record from this scene with --from and --vars'
        : `the page kept reloading (${RETRIES + 1} takes) — is someone editing the code?`
    };
  }
  timeline.scenes.push(result.entry);
  console.log(`   ✓ ${result.entry.file ?? '(dry)'} ${result.entry.duration ? result.entry.duration.toFixed(1) + 's' : ''}`);
  if (failed) break;
}

async function shootScene(rawScene, attempt) {
  const scene = interpolate(rawScene, vars);
  const session = sessionInfo(scene.session);
  const viewport = scene.viewport ?? defaults.viewport;
  const scale = scene.scale ?? defaults.scale;
  const pace = scene.pace ?? defaults.pace;
  if (attempt === 1) console.log(`\n▶ ${scene.id} — ${scene.title ?? ''} [${session.name}]`);

  const ctxOpened = Date.now() / 1000;
  const videoTmp = capture === 'video' ? ensureDir(join(outDir, `.video-${scene.id}`)) : null;
  const ctx = await newContext(browser, session, { viewport, scale, recordVideoDir: videoTmp, css: [defaults.css, scene.css].filter(Boolean).join('\n') });
  ctx.setDefaultTimeout(scene.timeout ?? flow.timeout ?? 20000);
  // per-browser UI memory a real member would already have (a dismissed guide,
  // the heart view they picked), set before the site's own scripts read it
  const storage = { ...(defaults.localStorage ?? {}), ...(scene.localStorage ?? {}) };
  if (Object.keys(storage).length) {
    await ctx.addInitScript(items => {
      for (const [k, v] of Object.entries(items)) try { localStorage.setItem(k, v); } catch {}
    }, storage);
  }
  const page = await ctx.newPage();
  // everything from here on is in output pixels (viewport × scale), see newContext
  const out = { width: Math.round(viewport.width * scale), height: Math.round(viewport.height * scale) };
  const cursor = { x: out.width * 0.62, y: out.height * 0.55 };
  await page.mouse.move(cursor.x, cursor.y);

  // setup runs before the camera rolls: open the page, wait for it to load, so
  // the clip starts on a finished screen instead of a white flash
  const runCtx = { page, session, vars, cursor, pace, outDir, sceneId: scene.id };
  const entry = { id: scene.id, title: scene.title, session: session.name, narration: scene.narration ?? null, size: out, layoutViewport: viewport, steps: [] };
  try {
    for (const step of scene.setup ?? []) await runStep(runCtx, interpolate(step, vars), null);
  } catch (e) {
    failed = await fail(runCtx, 'setup', e);
    await ctx.close();
    return { entry, committed: false };
  }

  // the Vite client logs "connecting..." on every full page load; after setup
  // there should be none unless a step navigates on purpose
  let reloaded = false;
  let expectNav = false;
  page.on('console', m => { if (!expectNav && m.text().includes('[vite] connecting')) reloaded = true; });

  // record:false — a backstage scene: it moves the story forward (the second
  // supplier also applies) but the video doesn't need to watch it happen
  const filming = scene.record !== false;
  const cam = filming && capture === 'screencast' ? await startScreencast(page, join(outDir, `.frames-${scene.id}-${attempt}`), viewport, scale) : null;
  const t0 = capture === 'video' ? null : Date.now() / 1000;
  const videoStart = Date.now() / 1000; // for capture=video t is relative to the setup end; see trimStart
  if (filming) await page.waitForTimeout((scene.lead ?? 600) * pace);

  let committed = false;
  // --steps 9-17: resume a scene part-way, when its first half already ran
  // (and wrote) in a take that was lost
  const [stepFrom, stepTo] = opt.steps ? String(opt.steps).split('-').map(Number) : [0, Infinity];
  for (let i = 0; i < (scene.steps ?? []).length; i++) {
    if (i < stepFrom || i > (stepTo ?? stepFrom)) continue;
    const step = interpolate(scene.steps[i], vars);
    const started = Date.now() / 1000;
    let info = null;
    // a goto/reload, or a click that is meant to leave the page, loads Vite again
    expectNav = step.do === 'goto' || step.do === 'reload' || !!step.navigates;
    try {
      info = await runStep(runCtx, step, i);
    } catch (e) {
      if (reloaded && !committed) break; // the reload is the real cause — retake
      if (step.optional) {
        console.log(`   · step ${i} (${step.do}) skipped: ${e.message.split('\n')[0]}`);
        continue;
      }
      failed = await fail(runCtx, i, e, step);
      break;
    } finally {
      // the next page's own "connecting" can arrive a moment after the step returns
      if (expectNav) { await page.waitForTimeout(300); expectNav = false; }
    }
    if (step.commits) committed = true;
    const ended = Date.now() / 1000;
    entry.steps.push({
      i, do: step.do, mark: step.mark ?? null, note: step.note ?? null,
      t: +(started - (t0 ?? videoStart)).toFixed(3),
      tEnd: +(ended - (t0 ?? videoStart)).toFixed(3),
      ...(info ?? {})
    });
    if (reloaded) break;
  }
  if (!failed && !reloaded) await page.waitForTimeout((scene.tail ?? 900) * pace);
  const tStop = Date.now() / 1000;

  if (cam) {
    const frames = await cam.stop();
    if (!reloaded) {
      const file = `scene-${scene.id}.mp4`;
      entry.duration = encodeFrames(frames, cam.dir, join(outDir, file), t0, tStop, scene.fps ?? defaults.fps ?? 30);
      entry.file = file;
    }
    rmSync(cam.dir, { recursive: true, force: true });
  }
  await ctx.close();
  if (videoTmp) {
    const webm = readdirSync(videoTmp).find(f => f.endsWith('.webm'));
    if (webm && !reloaded) {
      entry.file = `scene-${scene.id}.webm`;
      renameSync(join(videoTmp, webm), join(outDir, entry.file));
      entry.trimStart = +(videoStart - ctxOpened).toFixed(3); // step t is relative to this point in the webm
    }
    rmSync(videoTmp, { recursive: true, force: true });
  }
  if (capture === 'none' || !filming) { entry.duration = +(tStop - (t0 ?? videoStart)).toFixed(3); entry.backstage = !filming; }
  if (attempt > 1) entry.takes = attempt;
  return { entry, reloaded, committed };
}

await browser.close();
writeJson(join(outDir, 'timeline.json'), timeline);
writeJson(join(outDir, 'vars.json'), vars);
console.log(`\n${failed ? '✗ stopped' : '✓ done'} → ${outDir}`);
if (failed) {
  console.log(`  failed at scene ${failed.scene}, step ${failed.step}: ${failed.message}`);
  console.log(`  screenshot: ${failed.png}\n  aria: ${failed.aria}`);
  process.exit(1);
}

// Vite dev compiles each route on its first request; a 15s white wait inside a
// clip is dead footage. Fetch every literal goto once before the camera rolls.
// A plain HTTP GET only warms the SSR half, so each page is opened once in a
// throwaway browser of its own session (the client modules compile too).
// flow.warmup adds pages reached by clicking rather than by goto.
async function warmup() {
  if (opt['no-warmup'] || capture === 'none') return;
  const jobs = new Map();
  const add = (session, url) => { if (url && !url.includes('${')) jobs.set(`${session}|${url}`, { session, url }); };
  for (const s of scenes) {
    for (const st of [...(s.setup ?? []), ...(s.steps ?? [])]) if (st.do === 'goto') add(s.session, st.url);
  }
  for (const w of flow.warmup ?? []) add(w.session ?? scenes[0]?.session, w.url ?? w);
  if (!jobs.size) return;
  console.log(`warming ${jobs.size} page(s)…`);
  const bySession = Map.groupBy([...jobs.values()], j => j.session);
  await Promise.all([...bySession].map(async ([name, list]) => {
    const s = sessionInfo(name);
    const ctx = await newContext(browser, s, { viewport: defaults.viewport, scale: 1 }).catch(() => null);
    if (!ctx) return;
    const page = await ctx.newPage();
    for (const j of list) {
      await page.goto(/^https?:/.test(j.url) ? j.url : s.base + j.url, { timeout: 90000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }
    await ctx.close();
  }));
}

// ───────────────────────────────────────────────────────────── steps

async function runStep(c, step, i) {
  const { page, pace } = c;
  const settle = (step.pause ?? SETTLE[step.do] ?? 400) * pace;
  const timeout = step.timeout;
  let info = null;
  switch (step.do) {
    case 'goto': {
      const url = /^https?:/.test(step.url) ? step.url : c.session.base + step.url;
      // vite dev compiles a route on its first visit — that alone can take 20s+
      await page.goto(url, { waitUntil: step.waitUntil ?? 'domcontentloaded', timeout: timeout ?? 180000 });
      await page.waitForLoadState('networkidle', { timeout: step.idleTimeout ?? 8000 }).catch(() => {});
      break;
    }
    case 'reload':
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      break;
    case 'click':
    case 'hover':
    case 'check': {
      const loc = await resolve(page, step.target, timeout);
      info = await glideTo(c, loc, step);
      if (step.do === 'click') {
        // a native confirm() is invisible to the camera and auto-dismissed by
        // Playwright; acceptDialog says "yes" to it instead
        if (step.acceptDialog) page.once('dialog', d => d.accept().catch(() => {}));
        // navigates: the click reloads/leaves the page (often seconds later,
        // after a save) — wait for that load so the Vite reconnect it causes is
        // not mistaken for a stray dev-server reload
        const loaded = step.navigates ? page.waitForEvent('load', { timeout: timeout ?? 180000 }) : null;
        await loc.click({ force: step.force, timeout });
        if (loaded) {
          await loaded;
          await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        }
      }
      else if (step.do === 'check') await loc.check({ force: step.force, timeout });
      else await loc.hover({ timeout });
      break;
    }
    case 'type': {
      const loc = await resolve(page, step.target, timeout);
      info = await glideTo(c, loc, step);
      await loc.click({ timeout });
      if (step.clear !== false) await loc.fill('');
      await loc.pressSequentially(String(step.text), { delay: (step.delay ?? 38) * pace });
      break;
    }
    case 'fill': {
      const loc = await resolve(page, step.target, timeout);
      info = await bbox(loc);
      await loc.fill(String(step.text));
      break;
    }
    case 'select': {
      const loc = await resolve(page, step.target, timeout);
      info = await glideTo(c, loc, step);
      await loc.selectOption(step.label ? { label: step.label } : step.value);
      break;
    }
    case 'upload': {
      const loc = locateRaw(page, step.target);
      await loc.setInputFiles([].concat(step.files).map(f => resolvePath(ROOT, f)));
      break;
    }
    case 'press':
      await page.keyboard.press(step.key);
      break;
    case 'scroll': {
      if (step.target) {
        const loc = await resolve(page, step.target, timeout);
        await loc.evaluate((el, block) => el.scrollIntoView({ behavior: 'smooth', block }), step.block ?? 'center');
        await page.waitForTimeout(700);
        info = await bbox(loc);
      } else {
        await page.evaluate(y => window.scrollBy({ top: y, behavior: 'smooth' }), step.y ?? 400);
        await page.waitForTimeout(700);
      }
      break;
    }
    case 'wait':
      await page.waitForTimeout((step.ms ?? 1000) * pace);
      break;
    case 'waitFor': {
      const loc = await resolve(page, step.target, timeout ?? 30000);
      info = await bbox(loc);
      break;
    }
    case 'waitForUrl':
      await page.waitForURL(new RegExp(step.match), { timeout: timeout ?? 30000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      break;
    case 'highlight': {
      const loc = await resolve(page, step.target, timeout);
      await loc.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await page.waitForTimeout(500);
      info = await bbox(loc);
      if (info?.box) {
        const { x, y, w, h } = info.box;
        await page.evaluate(([x, y, w, h, ms]) => window.__vtHighlight?.(x, y, w, h, ms), [x, y, w, h, step.ms ?? 1800]);
      }
      await page.waitForTimeout((step.ms ?? 1800) * pace);
      break;
    }
    case 'save': {
      // keep a value for later scenes: a supplier opens the wish the customer just wrote
      let value;
      if (step.fromUrl) {
        const m = page.url().match(new RegExp(step.fromUrl));
        if (!m) throw new Error(`url ${page.url()} does not match ${step.fromUrl}`);
        value = m[1] ?? m[0];
      } else if (step.fromText) {
        const loc = await resolve(page, step.fromText, timeout);
        const text = (await loc.innerText()).trim();
        value = step.regex ? (text.match(new RegExp(step.regex)) ?? [])[1] : text;
      } else if (step.fromAttr) {
        const loc = await resolve(page, step.fromAttr.target, timeout);
        value = await loc.getAttribute(step.fromAttr.name);
        if (step.regex) value = (String(value).match(new RegExp(step.regex)) ?? [])[1];
      }
      if (value == null || value === '') throw new Error(`save "${step.as}": nothing captured`);
      c.vars[step.as] = value;
      writeJson(join(c.outDir, 'vars.json'), c.vars);
      console.log(`   · ${step.as} = ${value}`);
      break;
    }
    case 'assert': {
      const loc = await resolve(page, step.target, timeout);
      info = await bbox(loc);
      break;
    }
    case 'screenshot':
      await page.screenshot({ path: join(c.outDir, `${c.sceneId}-${step.name ?? i}.png`) });
      break;
    case 'mark':
      break;
    default:
      throw new Error(`unknown step "${step.do}"`);
  }
  if (settle > 0 && !['wait', 'highlight', 'mark', 'save'].includes(step.do)) await page.waitForTimeout(settle);
  return info;
}

function locateRaw(page, t) {
  return typeof t === 'string' ? page.locator(t).first() : page.locator(t.css).first();
}

async function bbox(loc) {
  const b = await loc.boundingBox().catch(() => null);
  return b ? { box: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } } : null;
}

// Bring the element into view smoothly, then glide the cursor to it — the
// viewer's eye should arrive a beat before the click does.
async function glideTo(c, loc, step) {
  const { page, cursor, pace } = c;
  await loc.evaluate(el => {
    const r = el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > window.innerHeight - 70) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(450);
  const info = await bbox(loc);
  if (!info) return null;
  const { x, y, w, h } = info.box;
  const tx = x + w / 2, ty = y + h / 2;
  const dist = Math.hypot(tx - cursor.x, ty - cursor.y);
  const steps = Math.max(12, Math.min(45, Math.round(dist / 18)));
  for (let k = 1; k <= steps; k++) {
    const e = 1 - Math.pow(1 - k / steps, 3); // ease-out cubic
    await page.mouse.move(cursor.x + (tx - cursor.x) * e, cursor.y + (ty - cursor.y) * e);
    await page.waitForTimeout(12 * pace);
  }
  cursor.x = tx; cursor.y = ty;
  await page.waitForTimeout((step.dwell ?? 250) * pace);
  return { ...info, cursor: { x: Math.round(tx), y: Math.round(ty) } };
}

async function fail(c, stepIndex, e, step) {
  const tag = `error-${c.sceneId}-${stepIndex}`;
  const png = join(c.outDir, `${tag}.png`);
  const aria = join(c.outDir, `${tag}.aria.yml`);
  await c.page.screenshot({ path: png }).catch(() => {});
  const snap = await c.page.locator('body').ariaSnapshot().catch(() => '(no snapshot)');
  writeFileSync(aria, `# ${c.page.url()}\n# step: ${JSON.stringify(step ?? null)}\n${snap}\n`, 'utf8');
  return { scene: c.sceneId, step: stepIndex, message: e.message.split('\n')[0], png, aria };
}

// ───────────────────────────────────────────────────────────── capture

// CDP screencast: JPEG frames at output pixels (viewport × scale), each with a
// timestamp. Sharper than Playwright's built-in VP8 recorder, and the frames
// share a clock with the step log.
async function startScreencast(page, dir, viewport, scale) {
  ensureDir(dir);
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  let n = 0;
  let lastTs = 0;
  let diskError = null;
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const ts = metadata.timestamp ?? Date.now() / 1000;
    // the output is 30fps; frames arriving faster only cost disk (a 3-minute
    // scene at 60/s once filled the drive) — keep at most one per 1/30 s
    if (!diskError && ts - lastTs >= 1 / 30 - 0.002) {
      const file = `f${String(++n).padStart(6, '0')}.jpg`;
      try {
        writeFileSync(join(dir, file), Buffer.from(data, 'base64'));
        frames.push({ file, ts });
        lastTs = ts;
      } catch (e) {
        // ENOSPC must not crash the run and strand gigabytes of frames —
        // stop collecting; the caller sees diskError and cleans up
        diskError = e;
        console.error(`   ✗ capture stopped: ${e.code ?? e.message}`);
      }
    }
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 85,
    maxWidth: Math.round(viewport.width * scale),
    maxHeight: Math.round(viewport.height * scale),
    everyNthFrame: 1
  });
  return {
    dir,
    async stop() {
      await cdp.send('Page.stopScreencast').catch(() => {});
      await new Promise(r => setTimeout(r, 200));
      await cdp.detach().catch(() => {});
      if (diskError) {
        rmSync(dir, { recursive: true, force: true });
        throw new Error(`disk full while capturing (${diskError.code ?? diskError.message}) — frames deleted; free some space and re-record this scene`);
      }
      return frames;
    }
  };
}

// Frames only arrive when the screen changes, so each one is held until the
// next: ffconcat durations turn the sparse stream into a constant-rate clip
// whose t=0 is t0, the same zero the step log uses.
function encodeFrames(frames, dir, outFile, t0, tStop, fps) {
  if (!frames.length) throw new Error('no frames captured');
  frames.sort((a, b) => a.ts - b.ts);
  const lines = ['ffconcat version 1.0'];
  // the screen before the first frame looked like the first frame
  const first = { ...frames[0], ts: Math.min(frames[0].ts, t0) };
  const seq = [first, ...frames.slice(1)];
  for (let k = 0; k < seq.length; k++) {
    const until = k + 1 < seq.length ? seq[k + 1].ts : tStop;
    const from = Math.max(seq[k].ts, t0);
    const d = until - from;
    if (d <= 0 && k + 1 < seq.length) continue;
    // exact durations — frames arrive up to 60/s, and rounding each up to 1/fps
    // stretched a 26s scene to 51s. cfr output drops the surplus.
    lines.push(`file '${seq[k].file}'`, `duration ${Math.max(d, 0.001).toFixed(4)}`);
  }
  lines.push(`file '${seq[seq.length - 1].file}'`); // concat demuxer drops the last duration otherwise
  const list = join(dir, 'list.ffconcat');
  writeFileSync(list, lines.join('\n') + '\n', 'utf8');
  const r = spawnSync(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', list,
    // no fps filter: Remotion's minimal ffmpeg build lacks it; -r + cfr does the same
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p', '-r', String(fps), '-fps_mode', 'cfr',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'stillimage',
    '-movflags', '+faststart', outFile
  ], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr}`);
  return +(tStop - t0).toFixed(3);
}
