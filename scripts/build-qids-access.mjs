#!/usr/bin/env node
/**
 * build-qids-access.mjs — generate a DRAFT of src/routes/api/send/qidsAccess.js
 *
 * Scans the codebase for every qid defined in src/routes/api/send/qids.js and
 * classifies which principal kinds may run it, based on how it is actually
 * called today:
 *
 *   - called only with isSer:true            → ['serviceAdmin']
 *   - called from client / with isSer:false  → ['user', 'serviceAdmin']
 *   - member of CONSENSUS_QIDS               → ['user', 'serviceConsensus']
 *   - never referenced                       → ['user', 'serviceAdmin']  (marked "unreferenced")
 *
 * The output is a starting point for manual review, not an automatic truth:
 * tighten entries by hand (the file is committed and owned by humans after
 * generation). Re-running the script OVERWRITES qidsAccess.js — re-apply
 * manual tightening after a regeneration, or merge by hand.
 *
 * Usage: node scripts/build-qids-access.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const QIDS_PATH = join(ROOT, 'src/routes/api/send/qids.js');
const OUT_PATH = join(ROOT, 'src/routes/api/send/qidsAccess.js');

// Must mirror CONSENSUS_QIDS in src/routes/api/send/+server.js
const CONSENSUS_QIDS = new Set([
  '39GetNegotiation', '40CreateNegotiation', '41CreatePosition', '42UpdatePosition',
  'GetNegotiationByToken', 'ListLocalNegotiations',
  'ListArguments', 'CreateArgument', 'UpdateArgument', 'ListPlaces',
  'ListIssues', 'ListClauses', 'CreateIssue', 'CreateClause', 'UpdateClause'
]);

// ── 1. Extract qid keys ─────────────────────────────────────────────────────
// qids.js is a dependency-free ESM module — import it and take the real keys
// instead of parsing with a regex (keys are not always at line start).
const { qids } = await import(QIDS_PATH);
const qidKeys = Object.keys(qids);
if (qidKeys.length === 0) {
  console.error('No qids found — has the format of qids.js changed?');
  process.exit(1);
}
console.log(`Found ${qidKeys.length} qids in qids.js`);

// ── 2. Collect source files ─────────────────────────────────────────────────
const EXT = new Set(['.js', '.ts', '.svelte']);
const SKIP_FILES = new Set([QIDS_PATH, OUT_PATH, join(ROOT, 'src/routes/api/send/qidsValidator.js')]);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'generated') continue;
      yield* walk(p);
    } else {
      if (SKIP_FILES.has(p)) continue;
      if (p.endsWith('.dead') || p.endsWith('.backup')) continue;
      if (/\.(test|spec)\.(js|ts)$/.test(p)) continue;
      if ([...EXT].some((e) => p.endsWith(e))) yield p;
    }
  }
}

const files = [...walk(join(ROOT, 'src'))].map((p) => ({
  path: relative(ROOT, p),
  content: readFileSync(p, 'utf8')
}));

// ── 3. Classify each qid ────────────────────────────────────────────────────
// sendToSer / sendToSerTyped signature: (arg, queId, me, project, isSer, fetch, options)
// After the qid literal the 3rd positional argument is isSer.
function classifyUsage(content, idx, qid) {
  const after = content.slice(idx, idx + 300);
  // '<qid>', me, project, isSer
  const argMatch = after.match(
    /^['"`][^'"`]+['"`]\s*,\s*[^,()]*\s*,\s*[^,()]*\s*,\s*(true|false)\b/
  );
  if (argMatch) return argMatch[1] === 'true' ? 'service' : 'user';
  // Direct body usage: { isSer: true, data: { arg, queId: '<qid>' } }
  const around = content.slice(Math.max(0, idx - 400), idx + 300);
  if (/queId\s*:/.test(around)) {
    return /isSer\s*:\s*true/.test(around) ? 'service' : 'user';
  }
  return 'unknown';
}

const report = {};
for (const qid of qidKeys) {
  const flags = { user: false, service: false, unknown: false, refs: 0 };
  for (const f of files) {
    let idx = -1;
    while ((idx = f.content.indexOf(qid, idx + 1)) !== -1) {
      const before = f.content[idx - 1];
      const afterCh = f.content[idx + qid.length];
      // must be a quoted string literal exactly matching the qid
      if (!["'", '"', '`'].includes(before) || before !== afterCh) continue;
      flags.refs++;
      const cls = classifyUsage(f.content, idx - 1, qid);
      if (cls === 'service') flags.service = true;
      else if (cls === 'user') flags.user = true;
      else flags.unknown = true;
    }
  }
  report[qid] = flags;
}

// ── 4. Emit manifest ────────────────────────────────────────────────────────
function allowFor(qid, flags) {
  if (CONSENSUS_QIDS.has(qid)) return { allow: ['user', 'serviceConsensus'], note: 'consensus' };
  if (flags.refs === 0) return { allow: ['user', 'serviceAdmin'], note: 'unreferenced — candidate for tightening' };
  if (flags.service && !flags.user && !flags.unknown) return { allow: ['serviceAdmin'], note: 'server-only callers' };
  return { allow: ['user', 'serviceAdmin'], note: null };
}

const lines = [];
lines.push('// GENERATED DRAFT — created by scripts/build-qids-access.mjs, then human-reviewed.');
lines.push('// Maps every qid in qids.js to the principal kinds allowed to run it via /api/send.');
lines.push("// Kinds: 'user' (cookie JWT) | 'serviceAdmin' (isSer + internal secret) |");
lines.push("//        'serviceConsensus' (isSer + x-consensus-secret) | 'apiKey' (Bearer 1lev1_…).");
lines.push('// A qid missing here fails the coverage test (qidsAccess.test.ts) — classify it consciously.');
lines.push('// Enforcement mode is controlled by AUTHZ_MODE (off | log | enforce), see src/lib/server/authz/.');
lines.push('');
lines.push('export const qidsAccess = {');
for (const qid of qidKeys) {
  const { allow, note } = allowFor(qid, report[qid]);
  const allowStr = `[${allow.map((k) => `'${k}'`).join(', ')}]`;
  lines.push(`  '${qid}': { allow: ${allowStr} },${note ? ` // ${note}` : ''}`);
}
lines.push('};');
lines.push('');

writeFileSync(OUT_PATH, lines.join('\n'));

const counts = { serviceOnly: 0, unreferenced: 0, consensus: 0, general: 0 };
for (const qid of qidKeys) {
  const { note, allow } = allowFor(qid, report[qid]);
  if (note === 'consensus') counts.consensus++;
  else if (note?.startsWith('unreferenced')) counts.unreferenced++;
  else if (allow.length === 1) counts.serviceOnly++;
  else counts.general++;
}
console.log(`Wrote ${relative(ROOT, OUT_PATH)}:`);
console.log(`  user+serviceAdmin: ${counts.general}`);
console.log(`  serviceAdmin only: ${counts.serviceOnly}`);
console.log(`  consensus:         ${counts.consensus}`);
console.log(`  unreferenced:      ${counts.unreferenced}`);
