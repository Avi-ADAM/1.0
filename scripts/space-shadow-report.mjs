#!/usr/bin/env node
/**
 * Turn the shadow-projection telemetry (A3, docs/inprogress/PLAN_DISTRIBUTED_EXECUTION.md)
 * into the T2 exit criterion, per pilot rikma: has it run long enough, on
 * enough signed events, with zero mismatches between the Space projection
 * and Strapi?
 *
 *   node scripts/space-shadow-report.mjs <file> [--json]
 *
 * <file> is the CONSENT_TELEMETRY_FILE JSONL, or a raw server log / Axiom
 * export of the sveltekit-api container — lines tagged
 * `[space-shadow-telemetry]` are picked out of anything else.
 *
 * The bar (HANDOFF_DISTRIBUTED_DB, T2): 30 days AND 1,000 events — the later
 * of the two — with 0 unexplained mismatches. Explaining one is a human's job;
 * this script lists every distinct one so nothing is explained away by count.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TAG = '[space-shadow-telemetry]';
export const EXIT_DAYS = 30;
export const EXIT_EVENTS = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** @param {string} text */
export function parseLines(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const at = line.indexOf(TAG);
    const json = at >= 0 ? line.slice(at + TAG.length).trim() : line.trim();
    if (!json.startsWith('{')) continue;
    try {
      const row = JSON.parse(json);
      if (row?.v === 1 && row.pid && Array.isArray(row.mismatches)) out.push(row);
    } catch {
      /* not a telemetry line */
    }
  }
  return out;
}

/** The per-rikma table, from parsed rows. */
export function summarize(rows) {
  const byPid = new Map();
  for (const r of rows) {
    const list = byPid.get(r.pid) ?? [];
    list.push(r);
    byPid.set(r.pid, list);
  }

  const rikmas = [];
  for (const [pid, list] of byPid) {
    const times = list.map((r) => Date.parse(r.at)).filter(Number.isFinite).sort((a, b) => a - b);
    const first = times[0] ?? null;
    const last = times[times.length - 1] ?? null;
    const days = first !== null && last !== null ? Math.round(((last - first) / DAY_MS) * 10) / 10 : 0;
    const maxEvents = Math.max(0, ...list.map((r) => Number(r.events) || 0));

    // Three members seeing the same difference is one mismatch, not three.
    const distinct = new Map();
    for (const r of list) {
      for (const m of r.mismatches) {
        const key = `${m.kind}:${m.member}:${m.chain}:${m.strapi}`;
        if (!distinct.has(key)) distinct.set(key, { ...m, firstAt: r.at, events: r.events });
      }
    }

    const missing = [];
    if (days < EXIT_DAYS) missing.push(`${days}/${EXIT_DAYS} days`);
    if (maxEvents < EXIT_EVENTS) missing.push(`${maxEvents}/${EXIT_EVENTS} events`);
    if (distinct.size > 0) missing.push(`${distinct.size} mismatch(es) to explain`);

    rikmas.push({
      pid,
      reports: list.length,
      firstAt: first !== null ? new Date(first).toISOString() : null,
      lastAt: last !== null ? new Date(last).toISOString() : null,
      days,
      maxEvents,
      maxCompared: Math.max(0, ...list.map((r) => Number(r.compared) || 0)),
      cleanReports: list.filter((r) => r.mismatches.length === 0).length,
      mismatches: [...distinct.values()],
      exitReady: missing.length === 0,
      missing
    });
  }
  rikmas.sort((a, b) => Number(a.pid) - Number(b.pid));
  return { reports: rows.length, rikmas };
}

function verdict(s) {
  if (!s.rikmas.length) return 'No shadow telemetry yet.';
  const lines = [];
  for (const r of s.rikmas) {
    lines.push(
      `rikma ${r.pid}: ${r.reports} reports over ${r.days} days, ${r.maxEvents} events, ` +
        `${r.mismatches.length} distinct mismatch(es) — ${r.exitReady ? '✅ exit criterion met' : '⏳ ' + r.missing.join(', ')}`
    );
    for (const m of r.mismatches) {
      lines.push(`    ${m.kind} ${m.member}: chain=${m.chain} strapi=${m.strapi} (first ${m.firstAt}, at ${m.events} events)`);
    }
  }
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node scripts/space-shadow-report.mjs <telemetry.jsonl | server.log> [--json]');
    process.exit(1);
  }
  const summary = summarize(parseLines(readFileSync(file, 'utf8')));
  if (process.argv.includes('--json')) console.log(JSON.stringify(summary, null, 2));
  else console.log(verdict(summary));
}
