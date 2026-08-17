/**
 * Repair endpoint — rebuilds each mission's monthly `monter` ledger from its
 * Timer records.
 *
 * Why it exists: `howmanyhoursalready` is a single scalar with no month
 * attached, and /api/monthi used to file it as-is under the month it was
 * closing. A run that happened after new hours had been logged filed the wrong
 * month's hours and then zeroed the counter, losing both months. monthi now
 * derives the closing month from the timers, but the rows a previous run
 * already wrote are still wrong — this endpoint fixes them, and can be re-run
 * whenever a ledger looks off.
 *
 * The rules live in `$lib/recurring/missionMonths.ts` (pure + tested):
 * approved rows are never touched, the open month is never filed (it belongs on
 * the counter for monthi to file at the turn of the month), duplicate rows for
 * one month collapse, and a month with no timer evidence keeps its row unless
 * `dropEmpty` is asked for.
 *
 *   GET /api/fixer?key=<ADMINMONTHER>                 → dry run, changes nothing
 *   GET /api/fixer?key=…&apply=1                      → write the repairs
 *   GET /api/fixer?key=…&ids=12,34                    → only these missions
 *   GET /api/fixer?key=…&apply=1&dropEmpty=1          → also delete rows the timers cannot back
 *   GET /api/fixer?key=…&includeFinished=1            → include finished / awaiting-approval missions
 *   GET /api/fixer?key=…&start=200&limit=100          → one page at a time
 *
 * The key is ADMINMONTHER — the same service token /api/monthi runs on. Send it
 * as an `x-fixer-key` header where possible; `?key=` is the fallback.
 */

import { objToString } from '$lib/func/objToString.svelte';
import { SendToAdmin } from '$lib/server/sendToAdmin.js';
import { ADMINMONTHER } from '$env/static/private';
import { normalizeRows, reconcileMonter } from '$lib/recurring/missionMonths.js';

const PAGE_SIZE = 100;

/** Length-independent comparison, so the key cannot be probed byte by byte. */
function secretMatches(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string' || !expected) return false;
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/** One page of missions, with their current ledger. */
async function fetchMissions({ ids, includeFinished, start, limit }) {
  const filters = ids.length
    ? `filters: { id: { in: [${ids.map((i) => `"${i}"`).join(',')}] } }`
    : includeFinished
      ? `filters: { iskvua: { eq: true } }`
      : `filters: { iskvua: { eq: true }, finnished: { eq: false }, forappruval: { eq: false } }`;

  const que = `{
    mesimabetahaliches(${filters}, pagination: { start: ${start}, limit: ${limit} }) {
      data { id attributes {
        name hoursassinged howmanyhoursalready
        monter { monthStart hours isDone hoursDone }
      } }
      meta { pagination { total } }
    }
  }`;
  const res = await SendToAdmin(que, ADMINMONTHER);
  if (res?.errors) throw new Error(JSON.stringify(res.errors));
  return {
    missions: res?.data?.mesimabetahaliches?.data ?? [],
    total: res?.data?.mesimabetahaliches?.meta?.pagination?.total ?? 0
  };
}

/**
 * Every timer segment for a batch of missions, keyed by mission id. Batched
 * rather than queried per mission — the repair otherwise costs one round-trip
 * per mission and times out on a large instance.
 */
async function fetchSegmentsFor(missionIds) {
  const byMission = new Map();
  if (!missionIds.length) return byMission;

  const que = `{
    timers(
      filters: { mesimabetahalich: { id: { in: [${missionIds.map((i) => `"${i}"`).join(',')}] } } }
      pagination: { limit: -1 }
    ) {
      data { attributes {
        timers { start stop }
        mesimabetahalich { data { id } }
      } }
    }
  }`;
  const res = await SendToAdmin(que, ADMINMONTHER);
  if (res?.errors) throw new Error(JSON.stringify(res.errors));

  for (const row of res?.data?.timers?.data ?? []) {
    const mid = row.attributes?.mesimabetahalich?.data?.id;
    if (!mid) continue;
    const segments = row.attributes?.timers ?? [];
    byMission.set(String(mid), [...(byMission.get(String(mid)) ?? []), ...segments]);
  }
  return byMission;
}

export async function GET({ url, request }) {
  // Header first: a query string ends up in nginx access logs and browser
  // history, so prefer `-H "x-fixer-key: …"` where the caller can send one.
  const key = request.headers.get('x-fixer-key') || url.searchParams.get('key') || '';
  if (!secretMatches(key, ADMINMONTHER)) {
    return json({ error: 'forbidden' }, 403);
  }

  const apply = url.searchParams.get('apply') === '1';
  const dropEmpty = url.searchParams.get('dropEmpty') === '1';
  const includeFinished = url.searchParams.get('includeFinished') === '1';
  const ids = (url.searchParams.get('ids') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));
  const startAt = Number(url.searchParams.get('start') ?? 0) || 0;
  // `limit` caps how many missions this call touches, so a big instance can be
  // repaired in chunks (?start=0&limit=100, then ?start=100&limit=100, …).
  const maxMissions = Number(url.searchParams.get('limit') ?? 0) || Infinity;

  const now = new Date();
  const report = {
    mode: apply ? 'applied' : 'dry-run',
    at: now.toISOString(),
    openMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    dropEmpty,
    scanned: 0,
    total: 0,
    changed: [],
    skipped: [],
    errors: []
  };

  let start = startAt;

  try {
    for (;;) {
      const remaining = maxMissions - report.scanned;
      if (remaining <= 0) break;
      const pageSize = Math.min(PAGE_SIZE, remaining);
      const { missions, total } = await fetchMissions({ ids, includeFinished, start, limit: pageSize });
      report.total = total;
      if (!missions.length) break;

      const segmentsByMission = await fetchSegmentsFor(missions.map((m) => String(m.id)));

      for (const mission of missions) {
        const id = String(mission.id);
        const at = mission.attributes ?? {};
        report.scanned++;

        try {
          const segments = segmentsByMission.get(id) ?? [];
          if (!segments.length) {
            // No timers means no evidence of *when* anything was worked. Filing
            // or zeroing from here would invent history, so leave it alone.
            report.skipped.push({ id, name: at.name, reason: 'no-timers' });
            continue;
          }

          const before = normalizeRows(at.monter);
          const { rows, counter, changes } = reconcileMonter({
            rows: before,
            segments,
            hoursassinged: at.hoursassinged,
            now,
            dropEmpty
          });

          const counterFrom = Number(at.howmanyhoursalready ?? 0) || 0;
          const counterChanged = Math.abs(counterFrom - counter) > 1e-6;
          const monterChanged = JSON.stringify(rows) !== JSON.stringify(before);
          if (!counterChanged && !monterChanged) continue;

          const entry = {
            id,
            name: at.name,
            changes,
            counter: counterChanged ? { from: counterFrom, to: counter } : undefined,
            monthsBefore: before.length,
            monthsAfter: rows.length
          };

          if (apply) {
            const mutation = `mutation {
              updateMesimabetahalich(id: "${id}", data: {
                monter: [ ${objToString(rows)} ],
                howmanyhoursalready: ${counter}
              }) { data { id } }
            }`;
            const res = await SendToAdmin(mutation, ADMINMONTHER);
            if (!res?.data?.updateMesimabetahalich?.data) {
              report.errors.push({ id, error: JSON.stringify(res?.errors ?? res) });
              continue;
            }
          }

          report.changed.push(entry);
        } catch (e) {
          report.errors.push({ id, error: e instanceof Error ? e.message : String(e) });
        }
      }

      start += missions.length;
      if (ids.length) break; // an explicit id list is never paged
      if (missions.length < pageSize) break; // last page
    }
  } catch (e) {
    report.errors.push({ id: null, error: e instanceof Error ? e.message : String(e) });
  }

  // Where to resume when the run was capped with ?limit=
  if (!ids.length && start < report.total) report.nextStart = start;

  console.log(
    `fixer: ${report.mode} - scanned ${report.scanned}, changed ${report.changed.length},`,
    `skipped ${report.skipped.length}, errors ${report.errors.length}`
  );
  return json(report);
}
