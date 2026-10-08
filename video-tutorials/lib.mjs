// Shared plumbing for login / inspect / record.
// Everything a flow JSON can say is resolved here, so the three entry points
// stay thin and a flow behaves the same whichever one runs it.
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';

export const ROOT = dirname(fileURLToPath(import.meta.url));
export const AUTH_DIR = join(ROOT, '.auth');

export function loadSessions() {
  return JSON.parse(readFileSync(join(ROOT, 'sessions.json'), 'utf8'));
}

export function sessionInfo(name) {
  const cfg = loadSessions();
  const s = cfg.sessions[name];
  if (!s) throw new Error(`unknown session "${name}" — known: ${Object.keys(cfg.sessions).join(', ')}`);
  return { name, ...s, base: `http://${s.host}:${cfg.port}`, statePath: join(AUTH_DIR, `${name}.json`) };
}

export function parseArgs(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) opt[k] = true;
      else { opt[k] = next; i++; }
    } else pos.push(a);
  }
  return { pos, opt };
}

// The headless *shell* is a separate download; channel 'chromium' runs the full
// browser in new-headless mode, which also renders closer to what people see.
export async function launch({ headed = false } = {}) {
  return chromium.launch({
    channel: 'chromium',
    headless: !headed,
    args: ['--lang=he-IL', '--force-color-profile=srgb', '--hide-scrollbars']
  });
}

// Capture is 1920×1080 with the layout of a 1280×720 laptop: the page gets a
// device-size viewport and CSS zoom = scale. (deviceScaleFactor would be the
// obvious tool, but CDP screencast frames come out at CSS pixels, so a DSF of
// 1.5 still records 1280 wide.) Mouse events, bounding boxes and the timeline
// are all in output pixels this way, which is what the editor wants.
export async function newContext(browser, session, { viewport, scale, recordVideoDir, css } = {}) {
  const vp = viewport ?? { width: 1280, height: 720 };
  const z = scale ?? 1.5;
  const device = { width: Math.round(vp.width * z), height: Math.round(vp.height * z) };
  const opts = {
    viewport: device,
    deviceScaleFactor: 1,
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    colorScheme: 'light',
    reducedMotion: 'no-preference'
  };
  if (!session.anonymous) {
    if (!existsSync(session.statePath)) {
      throw new Error(`session "${session.name}" is not signed in — run: npm run login -- ${session.name}`);
    }
    opts.storageState = session.statePath;
  }
  if (recordVideoDir) opts.recordVideo = { dir: recordVideoDir, size: device };
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(CURSOR_SCRIPT, { zoom: z, css: css ?? '' });
  return ctx;
}

// A visible cursor + click ripple. Headless capture has no OS cursor, and a
// tutorial without one reads as "things happen by themselves". pointer-events
// none, so it can never intercept the click it illustrates. The last position
// survives navigations through sessionStorage, so the cursor doesn't jump to
// the corner on every page load.
// Runs as an init script with { zoom, css }: the overlays undo the page zoom
// (zoom: 1/z) so their pixel positions are output pixels, like the events.
const CURSOR_SCRIPT = ({ zoom, css }) => {
  if (window.__vtCursor) return; window.__vtCursor = true;
  // a stylesheet, not html.style — the app rewrites the root's style attribute
  // (theme variables) and would wipe an inline zoom mid-recording
  // (an init script can run before <html> exists — then catch its creation)
  const addZoom = () => {
    if (zoom === 1 || document.getElementById('__vt_zoom')) return true;
    const root = document.head || document.documentElement;
    if (!root) return false;
    const zs = document.createElement('style');
    zs.id = '__vt_zoom';
    zs.textContent = 'html{zoom:' + zoom + ' !important}';
    root.appendChild(zs);
    return true;
  };
  if (!addZoom()) {
    const mo = new MutationObserver(() => { if (addZoom()) mo.disconnect(); });
    mo.observe(document, { childList: true, subtree: true });
  }
  document.addEventListener('DOMContentLoaded', addZoom);
  const unzoom = 'zoom:' + (1 / zoom) + ';';
  const install = () => {
    if (document.getElementById('__vt_cursor')) return;
    const st = document.createElement('style');
    st.textContent = [
      '#__vt_cursor{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:42px;height:42px;margin:-4px 0 0 -6px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));will-change:transform}',
      '#__vt_cursor svg{width:42px;height:42px}',
      '.__vt_ripple{position:fixed;z-index:2147483646;pointer-events:none;width:66px;height:66px;margin:-33px 0 0 -33px;border-radius:50%;border:4px solid rgba(255,153,0,.9);background:rgba(255,183,77,.25);animation:__vtr .55s ease-out forwards}',
      '@keyframes __vtr{from{transform:scale(.3);opacity:1}to{transform:scale(1.5);opacity:0}}',
      '.__vt_hl{position:fixed;z-index:2147483645;pointer-events:none;border-radius:16px;box-shadow:0 0 0 5px rgba(255,153,0,.95),0 0 0 9999px rgba(15,23,42,.35);transition:opacity .35s;opacity:0}',
      '#__vt_cursor,.__vt_ripple,.__vt_hl{' + unzoom + '}',
      css
    ].join('\n');
    document.documentElement.appendChild(st);
    const c = document.createElement('div');
    c.id = '__vt_cursor';
    c.innerHTML = '<svg viewBox="0 0 28 28" width="28" height="28"><path d="M5 3 L5 22 L10 17.5 L13.5 25 L17 23.5 L13.6 16.2 L20 16 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    let xy = null;
    try { xy = JSON.parse(sessionStorage.getItem('__vt_xy') || 'null'); } catch {}
    const put = (x, y) => { c.style.transform = 'translate(' + x + 'px,' + y + 'px)'; };
    put(xy ? xy[0] : -60, xy ? xy[1] : -60);
    addEventListener('mousemove', e => { put(e.clientX, e.clientY); try { sessionStorage.setItem('__vt_xy', JSON.stringify([e.clientX, e.clientY])); } catch {} }, true);
    addEventListener('mousedown', e => {
      const r = document.createElement('div'); r.className = '__vt_ripple';
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      document.documentElement.appendChild(r); setTimeout(() => r.remove(), 700);
    }, true);
    window.__vtHighlight = (x, y, w, h, ms) => {
      const d = document.createElement('div'); d.className = '__vt_hl';
      Object.assign(d.style, { left: (x - 6) + 'px', top: (y - 6) + 'px', width: (w + 12) + 'px', height: (h + 12) + 'px' });
      document.documentElement.appendChild(d);
      requestAnimationFrame(() => { d.style.opacity = '1'; });
      setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 400); }, ms);
    };
  };
  if (document.documentElement && document.body) install();
  else document.addEventListener('DOMContentLoaded', install);
};

// "/text/i" in JSON → RegExp; anything else stays a string.
function rx(v) {
  if (typeof v !== 'string') return v;
  const m = v.match(/^\/(.+)\/([a-z]*)$/s);
  return m ? new RegExp(m[1], m[2]) : v;
}

// A target is how a flow names an element, in the order of preference the
// README gives: role+name survives most redesigns, css survives the fewest.
export function locate(page, t) {
  if (typeof t === 'string') return page.locator(t).first();
  const base = t.within ? locate(page, t.within) : page;
  let loc;
  if (t.role) loc = base.getByRole(t.role, { name: rx(t.name), exact: t.exact, ...(t.level ? { level: t.level } : {}) });
  else if (t.text) loc = base.getByText(rx(t.text), { exact: t.exact });
  else if (t.label) loc = base.getByLabel(rx(t.label), { exact: t.exact });
  else if (t.placeholder) loc = base.getByPlaceholder(rx(t.placeholder), { exact: t.exact });
  else if (t.testid) loc = base.getByTestId(t.testid);
  else if (t.css) loc = base.locator(t.css);
  else throw new Error(`target has no selector: ${JSON.stringify(t)}`);
  if (t.hasText) loc = loc.filter({ hasText: rx(t.hasText) });
  return t.nth != null ? loc.nth(t.nth) : t.last ? loc.last() : loc.first();
}

// { any: [a, b] } — the first alternative that becomes visible. For a UI that
// is mid-rename, so a flow keeps working across both versions.
export async function resolve(page, t, timeout = 30000) {
  if (!t?.any) {
    const loc = locate(page, t);
    await loc.waitFor({ state: 'visible', timeout });
    return loc;
  }
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const alt of t.any) {
      const loc = locate(page, alt);
      if (await loc.isVisible().catch(() => false)) return loc;
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`none of the alternatives became visible: ${JSON.stringify(t.any)}`);
}

export function interpolate(value, vars) {
  if (typeof value === 'string') {
    return value.replace(/\$\{([\w.]+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  }
  if (Array.isArray(value)) return value.map(v => interpolate(v, vars));
  if (value && typeof value === 'object') {
    // keys too: a scene's localStorage item can be named after a saved id (moachGuide_${rikmaId})
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [interpolate(k, vars), interpolate(v, vars)]));
  }
  return value;
}

export function ensureDir(p) {
  mkdirSync(p, { recursive: true });
  return p;
}

export function stamp(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// winget puts ffmpeg on PATH only for shells opened after the install, so look
// in its links folder too before giving up.
export function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (spawnSync('ffmpeg', ['-version']).status === 0) return 'ffmpeg';
  const links = join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe');
  if (existsSync(links)) return links;
  // OpenMontage's Remotion ships a full ffmpeg (libx264/aac) — good enough to encode
  const remotion = join(ROOT, '..', '..', 'OpenMontage', 'remotion-composer', 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe');
  if (existsSync(remotion)) return remotion;
  const pk = join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages');
  if (existsSync(pk)) {
    for (const d of readdirSync(pk).filter(n => n.toLowerCase().includes('ffmpeg'))) {
      for (const sub of readdirSync(join(pk, d))) {
        const exe = join(pk, d, sub, 'bin', 'ffmpeg.exe');
        if (existsSync(exe)) return exe;
      }
    }
  }
  return null;
}

export function writeJson(path, data) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
