// Money-display audit (docs/inprogress/PLAN_MULTI_CURRENCY.md §6, C8).
//
// Lists .svelte files whose MARKUP renders a money field as a bare number —
// `{perhour}`, `{price}`, `{total}` … — instead of through <Money> / a money
// formatter, plus a count of hard-coded ₪ in the file. A heuristic, not a
// gate: it has false positives (a `total` that counts items, a `value` that is
// a percentage). Read every hit before changing it.
//
//   node scripts/audit-money-display.mjs            # all of src/
//   node scripts/audit-money-display.mjs src/lib/components/lev
//
// Columns: hits · ₪ count · M = file already imports money helpers · path · lines
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const start = resolve(ROOT, process.argv[2] ?? 'src');

const FIELD = /\b(perhour|perhoure|perHour|hourlyRate|price|agprice|totalbounti|totalBounti|myp|shekelsPerHoure|comition|unitPrice|salePrice|fullPrice|subtotal|grandTotal|budget|bounty|donation|amount|\.in|total|cost|value)\b/;
const SAFE = /<Money|fmtMoney|moneyFmt|fmt\(|formatMoney|money\.view|money\.format|moneyText|<CurrencySymbol|\$t\(/;

const out = [];
function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) {
      if (n !== 'node_modules' && n !== 'components' + '/money') walk(p);
      continue;
    }
    if (!n.endsWith('.svelte') || p.includes(join('components', 'money'))) continue;
    const src = readFileSync(p, 'utf8');
    // markup only: blank out <script> and <style>, keeping line numbers
    const markup = src
      .replace(/<script[\s\S]*?<\/script>/g, (m) => m.replace(/[^\n]/g, ''))
      .replace(/<style[\s\S]*?<\/style>/g, (m) => m.replace(/[^\n]/g, ''));
    const hits = [];
    markup.split('\n').forEach((l, i) => {
      // `{expr}` that is rendered text — not `prop={expr}`, not {#if}/{@const}, not a handler
      const exprs = [...l.matchAll(/(=?)\{([^{}]+)\}/g)]
        .filter((m) => !m[1])
        .map((m) => m[2])
        .filter((e) => !/^\s*[#/:@]/.test(e) && !/=>/.test(e));
      if (!exprs.some((e) => FIELD.test(e))) return;
      if (SAFE.test(l)) return;
      hits.push(i + 1);
    });
    const usesMoney = /<Money|useMoney|formatMoney|useFormatMoney|fmtMoney/.test(src);
    const shekel = (src.match(/₪/g) || []).length;
    if (hits.length || shekel) out.push({ f: relative(ROOT, p).replace(/\\/g, '/'), hits, usesMoney, shekel });
  }
}
walk(start);
out.sort((a, b) => b.hits.length + b.shekel - (a.hits.length + a.shekel));
for (const o of out) {
  console.log(`${o.hits.length}\t₪${o.shekel}\t${o.usesMoney ? 'M' : '-'}\t${o.f}\t${o.hits.join(',')}`);
}
console.error(`files: ${out.length}, bare-number lines: ${out.reduce((s, o) => s + o.hits.length, 0)}`);
