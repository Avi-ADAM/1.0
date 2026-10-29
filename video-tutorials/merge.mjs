// node merge.mjs out/<flow>/final out/<flow>/take2 out/<flow>/take2b [...]
//
// A shoot that stopped half-way and was resumed with --from lives in two run
// folders. This joins them, per language, into one: every scene comes from the
// LAST run that has a clip of it, so a resumed take replaces the lost one.
// The timeline keeps the flow's scene order.
import { readFileSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ensureDir, writeJson } from './lib.mjs';

const [outArg, ...runs] = process.argv.slice(2);
if (!outArg || !runs.length) {
  console.error('usage: node merge.mjs <out dir> <run dir> [<run dir> …]');
  process.exit(1);
}
const out = resolve(outArg);
const langs = new Set(runs.flatMap(r => readdirSync(r).filter(d => existsSync(join(r, d, 'timeline.json')))));

for (const lang of langs) {
  const dir = ensureDir(join(out, lang));
  const timelines = runs.map(r => join(r, lang, 'timeline.json')).filter(existsSync).map(f => ({ f, t: JSON.parse(readFileSync(f, 'utf8')) }));
  const order = [];
  const pick = new Map();
  for (const { f, t } of timelines) {
    for (const s of t.scenes) {
      if (!order.includes(s.id)) order.push(s.id);
      if (s.file || !pick.has(s.id)) pick.set(s.id, { s, from: join(f, '..') });
    }
  }
  const merged = { ...timelines.at(-1).t, mergedFrom: runs, scenes: [] };
  for (const id of order) {
    const { s, from } = pick.get(id);
    if (s.file) copyFileSync(join(from, s.file), join(dir, s.file));
    merged.scenes.push({ ...s, run: from });
    console.log(`${lang} ${id.padEnd(34)} ${s.file ? s.duration.toFixed(1) + 's' : s.backstage ? '(backstage)' : '✗ ' + (s.broken ?? 'no clip')}  ← ${from}`);
  }
  writeJson(join(dir, 'timeline.json'), merged);
}
