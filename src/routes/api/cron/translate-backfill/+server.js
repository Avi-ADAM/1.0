/**
 * `GET /api/cron/translate-backfill` — the backfill worker (§8, §15 of
 * docs/PLAN_UGC_TRANSLATION.md).
 *
 * This is the phase the whole feature was justified by. §1 opens on a Spanish
 * speaker landing on `/availableMission` and reading a wall of Hebrew — and
 * that reader is not signed in, so they are `onDemand`, so they never warm the
 * cache, so as the code stood before this endpoint they were the one class of
 * reader who could never see a translation on any page in any language. The
 * answer is not to let guests spend (a crawler would be the day's budget in
 * one walk). It is to have already paid before they arrive.
 *
 * **Why the worker is an endpoint and not `npx tsx`.** §8 sketched a
 * standalone job in the shape of `sync-vocabulary.ts`. Two things pulled it
 * here instead, and both are correctness rather than convenience:
 *
 *  1. **One governor.** §5.3's reserved on-demand slice — the thing that stops
 *     a backfill run from making every live miss un-fillable until midnight —
 *     only means anything if backfill and the warm endpoint count against the
 *     *same* counter. A separate process has a separate governor, and the
 *     reserve would be fiction.
 *  2. **One write path.** Per CLAUDE.md every write goes through the Action
 *     System, and `cacheTranslations` is deliberately the only door into the
 *     cache. A standalone worker would have to duplicate it or route around it.
 *
 * `src/lib/jobs/backfill-translations.ts` is still the hand-run driver §8 asked
 * for, with `--status` / `--dry` / `--budget` / `--only` / `--locales`; it
 * calls this. Same relationship the scheduler already has to `/api/timegrama`
 * and `/api/monthi`.
 *
 * Everything it can do is bounded before it starts: the governor caps the
 * requests, `TRANSLATE_SURFACES` caps which strings are worth filling at all,
 * and with no Gemini key it still does the free half — identity rows (§15.3.5).
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sendToSer } from '$lib/send/sendToSer.js';
import { limits, readsCache, stateDir, writeEnabled, apiKey } from '$lib/server/translation/config.js';
import { serverGovernor } from '$lib/server/translation/governor.js';
import { fileGovernorStore } from '$lib/server/translation/governorStore.js';
import { geminiEngine } from '$lib/server/translation/gemini.js';
import { runBackfill } from '$lib/server/translation/backfill.js';
import { loadBackfillState, saveBackfillState } from '$lib/server/translation/backfillStore.js';
import { BACKFILL_SOURCES, activeSources } from '$lib/server/translation/backfillSources.js';
import { compactDemand, demandByLocale, readDemand, serverDemandLog } from '$lib/server/translation/demand.js';

/** Optional, and enforced only when present — same guard as /api/cron/maagad. */
const CRON_SECRET = env.CRON_SECRET || '';

const LOCALES = /** @type {import('$lib/translation/types.js').Locale[]} */ ([
  'he', 'en', 'ar', 'ru', 'es'
]);

/** @param {string | null} raw */
function list(raw) {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET({ url, fetch }) {
  if (CRON_SECRET && url.searchParams.get('key') !== CRON_SECRET) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  const dir = stateDir();
  const cfg = limits();
  const governor = serverGovernor(cfg, fileGovernorStore(dir));

  // The demand log lives partly on disk and partly in the buffer of the
  // process that is serving pages. Flushing first is what makes a run see the
  // misses from the last thirty seconds rather than the last thirty minutes.
  serverDemandLog(dir)?.flush();
  const demand = readDemand(dir);

  if (url.searchParams.has('status')) {
    const state = loadBackfillState(dir);
    return json({
      surfaces: Object.fromEntries(
        BACKFILL_SOURCES.flatMap((s) => s.surfaces).map((k) => [k, readsCache(k)])
      ),
      sources: BACKFILL_SOURCES.map((s) => ({
        key: s.key,
        label: s.label,
        tier: s.tier,
        active: activeSources(readsCache).some((a) => a.key === s.key),
        cursor: state.sources[s.key] ?? null
      })),
      engine: writeEnabled() ? cfg.model : null,
      identityOnly: !writeEnabled(),
      stateDir: dir || null,
      governor: governor.status(),
      demand: {
        outstanding: demand.length,
        byLocale: demandByLocale(demand),
        top: demand.slice(0, 10).map((d) => ({ locale: d.locale, count: d.count, path: d.path }))
      }
    });
  }

  const dry = url.searchParams.has('dry');
  const budgetRaw = Number(url.searchParams.get('budget'));
  const budget = Number.isFinite(budgetRaw) && budgetRaw >= 0 ? budgetRaw : Infinity;
  const only = list(url.searchParams.get('only'));
  const wanted = list(url.searchParams.get('locales')).filter((l) => LOCALES.includes(/** @type {any} */ (l)));
  const locales = wanted.length ? /** @type {any} */ (wanted) : LOCALES;

  const state = loadBackfillState(dir);
  const lines = /** @type {string[]} */ ([]);

  const io = {
    /**
     * @param {string} qid
     * @param {Record<string, unknown>} variables
     */
    query: (qid, variables) => sendToSer(variables, qid, 0, 0, true, fetch),

    /** @param {string[]} hashes */
    async cached(hashes) {
      const res = await sendToSer({ hashes, limit: 1500 }, '316translationCoverage', 0, 0, true, fetch);
      /** @type {Map<string, Set<string>>} */
      const map = new Map();
      for (const node of res?.data?.textTranslations?.data ?? []) {
        const a = node?.attributes;
        if (!a?.hash || !a?.tgtLang) continue;
        const set = map.get(a.hash) ?? new Set();
        set.add(a.tgtLang);
        map.set(a.hash, set);
      }
      return map;
    },

    /** @param {import('$lib/server/actions/configs/cacheTranslations.js').CacheRowInput[]} rows */
    async store(rows) {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'cacheTranslations',
          params: { rows, userId: 'system' },
          isSer: true
        })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || body?.success === false) {
        throw new Error(body?.error?.message || `cacheTranslations failed (${res.status})`);
      }
      const data = body?.data ?? {};
      return {
        created: data.created ?? 0,
        skipped: data.skipped ?? 0,
        rejected: Array.isArray(data.rejected) ? data.rejected.length : 0
      };
    }
  };

  let report;
  try {
    report = await runBackfill({
      io,
      governor,
      // No key, no engine — and that is a *useful* mode, not a broken one: the
      // identity pass needs neither an API key nor a single request, and on a
      // Hebrew-majority corpus read by a Hebrew-majority audience it is the
      // most common render on the site turning from a permanent miss into a
      // hit, for free (§15.3.5).
      engine: writeEnabled() ? geminiEngine({ apiKey: apiKey(), model: cfg.model }) : undefined,
      enabled: readsCache,
      state,
      demand,
      budget,
      batch: cfg.batch,
      pageSize: Number(url.searchParams.get('pageSize')) || 200,
      only,
      locales,
      model: cfg.model,
      dry,
      log: (line) => {
        lines.push(line);
        console.log(`[translation:backfill] ${line}`);
      }
    });
  } catch (err) {
    // Nothing here is on a reader's critical path, but a cron that 500s is a
    // cron that gets muted, so the failure is reported as data.
    console.error('[translation:backfill] run failed:', err);
    return json({ ok: false, error: err instanceof Error ? err.message : String(err), log: lines }, { status: 500 });
  }

  // The cursor is saved whatever ended the run — stopping clean on an
  // exhausted budget is the design, and a run that forgot where it stopped
  // would start the same page again tomorrow forever.
  if (!dry) {
    saveBackfillState(dir, report.state);
    // Demand that is now filled has been answered; keeping it would make every
    // future run re-prioritise strings that are already cache hits.
    if (report.covered.length > 0) {
      const done = new Set(report.covered);
      compactDemand(dir, (e) => !done.has(`${e.locale} ${e.hash}`));
    }
  }

  return json({
    ranAt: new Date().toISOString(),
    dry,
    ...report,
    // The cursor is in the state file; echoing every pair it filled would be
    // the response's whole weight for no reader.
    covered: report.covered.length,
    state: undefined,
    cursors: report.state.sources,
    governor: governor.status(),
    log: lines
  });
}
