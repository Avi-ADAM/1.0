// One flow, several languages, one set of rows in the database.
//
// A bilingual shoot runs a *lane* per language: the same scene, step by step,
// in a browser of the same user whose interface is set to that language. The
// first lane (Hebrew, unless the flow says otherwise) is live — its clicks
// really create the rikma, approve the candidate, record the sale. Every other
// lane is a *mirror*: its reads go to the server as usual, but each write it
// sends is held and answered with the response the live lane got for the same
// write in the same step. So the English video shows the English interface
// creating "the same" rikma, and nothing is created twice.
//
// What members typed (the rikma's name, a mission title) is stored once, in
// the live lane's language. A mirror lane rewrites it on the way in: every
// bilingual var { he, en } is swapped from the live text to its own text in
// every page, __data.json and /api response, so the English video reads
// English all the way through.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './lib.mjs';

export const LANGS = ['he', 'en', 'ar', 'ru', 'es'];
const TRANSLATIONS = join(ROOT, '..', 'src', 'lib', 'translations');

// ───────────────────────────────────────────── localizing a flow for a lane

const nsCache = new Map();
function namespace(lang, ns) {
  const k = `${lang}/${ns}`;
  if (!nsCache.has(k)) {
    const f = join(TRANSLATIONS, lang, `${ns}.json`);
    nsCache.set(k, existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
  }
  return nsCache.get(k);
}

// $t('ns.a.b') as the site would render it in this language
export function tr(lang, key) {
  const [ns, ...path] = key.split('.');
  let v = namespace(lang, ns);
  for (const p of path) v = v?.[p];
  if (typeof v !== 'string') throw new Error(`no translation "${key}" in ${lang}`);
  return v;
}

const escapeRx = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

// a translation as a "/regex/" target name: substring match, {{x}} = anything,
// so "שמירה ({{count}})" still finds "שמירה (3)" and an emoji prefix is fine
function keyToRx(lang, key) {
  const parts = tr(lang, key).trim().split(/\{\{\s*\w+\s*\}\}/).map(escapeRx);
  return `/${parts.join('.*?')}/i`; // i: some locales capitalise a label, some don't
}

const KEYED = { nameKey: 'name', textKey: 'text', labelKey: 'label', placeholderKey: 'placeholder', hasTextKey: 'hasText' };

const isLangMap = v => v && typeof v === 'object' && !Array.isArray(v) &&
  Object.keys(v).length > 0 && Object.keys(v).every(k => LANGS.includes(k));

// { he, en } → this lane's value; nameKey: "ns.key" → name: "/…/" in this
// lane's language. Applied to scenes, steps and vars before ${…} interpolation.
export function localize(value, lang, fallback = 'he') {
  if (Array.isArray(value)) return value.map(v => localize(v, lang, fallback));
  if (isLangMap(value)) return localize(value[lang] ?? value[fallback], lang, fallback);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      // exact: the whole accessible name is the translation ("אישור", not "אישור סיום")
      // (anchored rather than Playwright's exact, which is case-sensitive: "approve" vs "Approve")
      if (KEYED[k] && typeof v === 'string') out[KEYED[k]] = value.exact ? `/^\\s*${escapeRx(tr(lang, v).trim())}\\s*$/i` : keyToRx(lang, v);
      else out[k] = localize(v, lang, fallback);
    }
    return out;
  }
  return value;
}

// live text → mirror text, longest first so a title is swapped before a word in it
export function swapPairs(vars, live, lang, interpolate) {
  const liveVars = interpolate(localize(vars, live), localize(vars, live));
  const laneVars = interpolate(localize(vars, lang), localize(vars, lang));
  const pairs = [];
  for (const [k, v] of Object.entries(vars)) {
    if (!isLangMap(v)) continue;
    const from = liveVars[k], to = laneVars[k];
    if (typeof from === 'string' && typeof to === 'string' && from && from !== to) pairs.push([from, to]);
  }
  return pairs.sort((a, b) => b[0].length - a[0].length);
}

// ───────────────────────────────────────────── which requests write

let mutationQids = null;
async function loadMutationQids() {
  if (mutationQids) return mutationQids;
  const mod = await import(pathToFileURL(join(ROOT, '..', 'src', 'routes', 'api', 'send', 'qids.js')).href);
  const all = { ...(mod.qids ?? {}), ...(mod.moachQids ?? {}) };
  mutationQids = new Set(Object.keys(all).filter(k => typeof all[k] === 'string' && /^\s*mutation\b/.test(all[k])));
  return mutationQids;
}

// POSTs that only read or ask an AI to draft: a mirror lane sends these
// itself, so its AI drafts come back in its own language
const READ_PATHS = [
  /^\/api\/permissions/, /^\/api\/whoami/, /^\/api\/translations/, /^\/api\/translate/,
  /^\/api\/vocab\/(list|resolve|check-duplicate)/, /^\/api\/vision-preview/, /^\/api\/mission\/(describe|suggest)/,
  /^\/api\/stat/, /^\/api\/shifts\/status/, /^\/api\/map-data/, /^\/api\/log-error/, /^\/api\/fx/,
  /^\/api\/v1\/(presence|p2p)\//, /^\/api\/v1\/places\//, /^\/api\/chezin/, /^\/api\/tikun/
];

// null = a read (send it); otherwise the key a mirror lane matches the live
// lane's answer by: the same endpoint, the same qid / action
export function writeKey(req, mq) {
  const method = req.method();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null;
  const url = new URL(req.url());
  if (READ_PATHS.some(r => r.test(url.pathname))) return null;
  let body = null;
  try { body = req.postDataJSON(); } catch {}
  if (url.pathname === '/api/send') {
    const qid = body?.data?.queId;
    if (qid) return mq.has(qid) ? `send:${qid}` : null;
    const raw = body?.data?.query;
    return typeof raw === 'string' && /^\s*mutation\b/.test(raw) ? `send:raw` : null;
  }
  if (url.pathname === '/api/action' || url.pathname.startsWith('/api/v1/actions')) {
    return `action:${body?.actionKey ?? body?.action ?? url.pathname}`;
  }
  return `${method}:${url.pathname}${url.search.startsWith('?/') ? url.search : ''}`;
}

// ───────────────────────────────────────────── the bus between lanes

// The live lane posts every write's response here, tagged with the step it
// happened in; a mirror lane takes the first unused one with the same key.
export class MirrorBus {
  constructor() { this.entries = []; this.waiters = []; this.step = -1; }
  setStep(i) {
    this.step = i;
    // whatever the live lane wrote in an earlier step and no mirror asked for
    // (a heartbeat, a read-receipt) must not answer a later step's write
    this.entries = this.entries.filter(e => e.step >= i);
  }
  post(key, res) {
    const e = { key, res, step: this.step, used: false };
    this.entries.push(e);
    for (const w of [...this.waiters]) if (w.key === key) { this.waiters.splice(this.waiters.indexOf(w), 1); e.used = true; w.resolve(res); return; }
  }
  take(key, timeoutMs) {
    const e = this.entries.find(x => x.key === key && !x.used);
    if (e) { e.used = true; return Promise.resolve(e.res); }
    return new Promise(resolve => {
      const w = { key, resolve };
      this.waiters.push(w);
      setTimeout(() => {
        const i = this.waiters.indexOf(w);
        if (i >= 0) { this.waiters.splice(i, 1); resolve(null); }
      }, timeoutMs);
    });
  }
}

const SKIP_HEADERS = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'set-cookie']);
const cleanHeaders = h => Object.fromEntries(Object.entries(h).filter(([k]) => !SKIP_HEADERS.has(k.toLowerCase())));

// pages, SvelteKit data and API answers — not Vite's modules, styles, images
function isContent(url, origin) {
  const u = new URL(url);
  if (u.origin !== origin) return false;
  const p = u.pathname;
  if (/^\/(@|node_modules|src\/|\.svelte-kit|_app\/immutable)/.test(p)) return false;
  if (/\.(js|mjs|ts|css|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|map|mp4|webm|json)$/i.test(p) && !p.endsWith('__data.json')) return false;
  return true;
}

// Node cannot resolve *.localhost (Chromium can): fetch through loopback and
// keep the session's host in the Host header, which is what the dev server reads
function fetchVia(route) {
  const req = route.request();
  const u = new URL(req.url());
  if (!u.hostname.endsWith('localhost')) return route.fetch({ maxRedirects: 0, timeout: 180000 });
  const host = u.host;
  u.hostname = '127.0.0.1';
  return route.fetch({ url: u.href, headers: { ...req.headers(), host }, maxRedirects: 0, timeout: 180000 }); // Strapi can take 30s+ on a write
}

// A page that navigates away disposes the requests it had in flight; the
// handler then throws on a dead route, and an unhandled rejection there takes
// the whole recorder down. Nothing about a dead request is worth that.
const safe = handler => async route => {
  try { await handler(route); }
  catch { await route.abort().catch(() => {}); }
};

function swapText(text, pairs) {
  for (const [a, b] of pairs) if (text.includes(a)) text = text.split(a).join(b);
  return text;
}

// Live lane: send every write, and post its answer to the bus.
export async function wireLive(ctx, origin, bus, log) {
  const mq = await loadMutationQids();
  await ctx.route(url => isContent(url.href, origin), safe(async route => {
    const req = route.request();
    const key = writeKey(req, mq);
    if (!key) return route.fallback();
    let res;
    try { res = await fetchVia(route); }
    catch (e) { log?.(`   · live ${key} failed: ${e.message.split(/\r?\n/)[0]}`); return route.abort(); }
    const body = await res.body();
    bus.post(key, { status: res.status(), headers: res.headers(), body });
    return route.fulfill({ response: res, body }); // keeps set-cookie: a refreshed jwt
  }));
}

// Mirror lane: writes are answered from the bus, content is language-swapped.
export async function wireMirror(ctx, origin, bus, pairs, { timeoutMs = 25000, log, onMiss } = {}) {
  const mq = await loadMutationQids();
  await ctx.route(url => isContent(url.href, origin), safe(async route => {
    const req = route.request();
    const key = writeKey(req, mq);
    if (key) {
      const got = await bus.take(key, timeoutMs);
      if (!got) {
        // the live lane never sent this write — sending it here would write
        // twice, so the mirror's page sees a failed request instead
        log?.(`   ⚠ mirror: no live answer for ${key} — aborted`);
        onMiss?.(key);
        return route.abort('failed');
      }
      const ct = got.headers['content-type'] ?? '';
      const body = pairs.length && /json|text|html/.test(ct) ? swapText(got.body.toString('utf8'), pairs) : got.body;
      return route.fulfill({ status: got.status, headers: cleanHeaders(got.headers), body });
    }
    if (!pairs.length) return route.fallback();
    let res;
    try { res = await fetchVia(route); }
    catch { return route.fallback(); }
    const ct = res.headers()['content-type'] ?? '';
    if (!/json|text\/html|text\/plain/.test(ct)) return route.fulfill({ response: res });
    const text = swapText(await res.text(), pairs);
    return route.fulfill({ status: res.status(), headers: cleanHeaders(res.headers()), body: text });
  }));
}
