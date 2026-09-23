#!/usr/bin/env node
/**
 * Turn the P2P pilot's telemetry into the numbers docs/PLAN_P2P_PILOT.md §3
 * decides on.
 *
 *   node scripts/p2p-pilot-report.mjs <file> [--json]
 *
 * <file> is the P2P_TELEMETRY_FILE JSONL, or a raw server log — lines tagged
 * `[p2p-pilot-telemetry]` are picked out of anything else.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TAG = '[p2p-pilot-telemetry]';

/** @param {string} text */
export function parseLines(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const at = line.indexOf(TAG);
    const json = at >= 0 ? line.slice(at + TAG.length).trim() : line.trim();
    if (!json.startsWith('{')) continue;
    try {
      const row = JSON.parse(json);
      if (row?.v === 1 && row.outcome) out.push(row);
    } catch {
      /* not a telemetry line */
    }
  }
  return out;
}

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const bucket = (b) => (b < 256 * 1024 ? '<256K' : b < 2 * 1024 * 1024 ? '<2M' : b < 20 * 1024 * 1024 ? '<20M' : '20M+');

/** The §3 table, from parsed rows. */
export function summarize(rows) {
  const notCache = rows.filter((r) => r.outcome !== 'cache');
  // Availability is only a fair question when the device was connected to ask.
  const asked = notCache.filter((r) => !['offline', 'skipped'].includes(r.peerFailure));
  const answered = asked.filter((r) => r.peersAnswered > 0);
  const direct = answered.filter((r) => r.outcome === 'peer' && r.candidate !== 'relay');
  const iceFailed = answered.filter((r) => r.peerFailure === 'ice' || r.candidate === 'relay');
  const peerRows = rows.filter((r) => r.outcome === 'peer');
  const hashFail = rows.filter((r) => r.peerFailure === 'hash');

  const perf = {};
  for (const r of rows.filter((x) => x.outcome === 'peer' || x.outcome === 'origin')) {
    const key = `${bucket(r.bytes)} ${r.outcome}`;
    (perf[key] ??= []).push(r.ms);
  }

  return {
    attempts: rows.length,
    byOutcome: Object.fromEntries(['cache', 'peer', 'origin', 'failed'].map((o) => [o, rows.filter((r) => r.outcome === o).length])),
    rikmas: new Set(rows.map((r) => r.pid)).size,
    availabilityPct: pct(answered.length, asked.length), // H2 — yes ≥30, no <10
    connectivityPct: pct(direct.length, answered.length), // H1 — yes ≥80, no <60
    turnNeededPct: pct(iceFailed.length, answered.length), // yes ≤20, no >40
    integrityPct: pct(peerRows.length, peerRows.length + hashFail.length), // must be 100
    hashFailures: hashFail.length,
    candidates: Object.fromEntries(
      ['host', 'srflx', 'prflx', 'relay', 'unknown'].map((c) => [c, peerRows.filter((r) => r.candidate === c).length])
    ),
    peerFailures: Object.fromEntries(
      [...new Set(notCache.map((r) => r.peerFailure))].map((f) => [f, notCache.filter((r) => r.peerFailure === f).length])
    ),
    medianMs: Object.fromEntries(Object.entries(perf).map(([k, v]) => [k, median(v)])),
    enoughData: asked.length >= 200 && new Set(rows.map((r) => r.pid)).size >= 5
  };
}

function verdict(s) {
  const lines = [];
  const judge = (label, v, yes, no, higherIsBetter = true) => {
    if (v == null) return lines.push(`${label}: —`);
    const good = higherIsBetter ? v >= yes : v <= yes;
    const bad = higherIsBetter ? v < no : v > no;
    lines.push(`${label}: ${v}%  ${good ? '✅ above the bar' : bad ? '❌ below the floor' : '⚠ in between'}`);
  };
  judge('H2 availability', s.availabilityPct, 30, 10);
  judge('H1 connectivity', s.connectivityPct, 80, 60);
  judge('TURN needed', s.turnNeededPct, 20, 40, false);
  lines.push(`H3 integrity: ${s.integrityPct ?? '—'}%${s.hashFailures ? `  ❗ ${s.hashFailures} hash failures — investigate` : ''}`);
  lines.push(s.enoughData ? 'Sample size: enough to decide.' : 'Sample size: NOT enough yet (need ≥200 non-cache attempts from ≥5 rikmas).');
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node scripts/p2p-pilot-report.mjs <telemetry.jsonl | server.log> [--json]');
    process.exit(1);
  }
  const summary = summarize(parseLines(readFileSync(file, 'utf8')));
  if (process.argv.includes('--json')) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(JSON.stringify(summary, null, 2));
    console.log('\n' + verdict(summary));
  }
}
