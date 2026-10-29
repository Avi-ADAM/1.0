// node findkey.mjs "שם הרקמה" ["טקסט נוסף" …] [--lang he]
//
// Writing a bilingual flow: which $t() key renders this text? A target with
// nameKey/textKey/labelKey picks each language's own wording from that key
// (see lanes.mjs), so the flow never hard-codes Hebrew or English names.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, parseArgs } from './lib.mjs';

const { pos, opt } = parseArgs(process.argv.slice(2));
const lang = opt.lang ?? 'he';
const dir = join(ROOT, '..', 'src', 'lib', 'translations', lang);
const flat = [];
const walk = (o, p) => {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') flat.push([`${p}.${k}`, v]);
    else if (v && typeof v === 'object') walk(v, `${p}.${k}`);
  }
};
for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) walk(JSON.parse(readFileSync(join(dir, f), 'utf8')), f.slice(0, -5));
for (const q of pos) {
  const exact = flat.filter(([, v]) => v.trim() === q.trim());
  const hits = exact.length ? exact : flat.filter(([, v]) => v.includes(q)).slice(0, 8);
  console.log(`\n"${q}"${exact.length ? '' : ' (partial)'}`);
  for (const [k, v] of hits) console.log(`  ${k}  =  ${v.length > 90 ? v.slice(0, 90) + '…' : v}`);
}
