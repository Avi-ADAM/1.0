/**
 * The backfill driver (§8 of docs/PLAN_UGC_TRANSLATION.md).
 *
 *   npx tsx src/lib/jobs/backfill-translations.ts --status        what's left, what it'd cost
 *   npx tsx src/lib/jobs/backfill-translations.ts --dry           decide out loud, spend nothing
 *   npx tsx src/lib/jobs/backfill-translations.ts --budget 400    spend at most 400 requests, then stop clean
 *   npx tsx src/lib/jobs/backfill-translations.ts --only openMission
 *   npx tsx src/lib/jobs/backfill-translations.ts --locales ru,es
 *
 * **The work itself lives in `/api/cron/translate-backfill`, not here.** §8
 * sketched this as a standalone job in the shape of `sync-vocabulary.ts`, and
 * two things moved the worker into the server instead — both correctness, not
 * convenience:
 *
 *  1. §5.3's reserved on-demand slice only means something if backfill and the
 *     warm endpoint count against the *same* governor. A second process has a
 *     second counter and the reserve becomes fiction.
 *  2. Per CLAUDE.md every write goes through the Action System, and
 *     `cacheTranslations` is deliberately the only door into the cache.
 *
 * So this file is the hand-run driver the phase asked for: the flags, the
 * output a human reads, and a clean exit code. Same relationship
 * `scripts/scheduler/scheduler.mjs` already has to `/api/timegrama` and
 * `/api/monthi` — and the scheduler drives the same endpoint on a daily clock
 * (§8.3), so there is one worker with two ways to start it, not two workers.
 *
 * Reads `.env` through `dotenv/config`, like `sync-vocabulary.ts`.
 */

import 'dotenv/config';
import { fileURLToPath } from 'node:url';

const BASE = (process.env.BACKFILL_BASE_URL || process.env.SCHEDULER_BASE_URL || 'http://127.0.0.1:3000')
    .replace(/\/+$/, '');
const CRON_SECRET = process.env.CRON_SECRET || '';

interface Args {
    status: boolean;
    dry: boolean;
    budget?: number;
    only?: string;
    locales?: string;
    pageSize?: number;
    help: boolean;
}

export function parseArgs(argv: string[]): Args {
    const out: Args = { status: false, dry: false, help: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--status') out.status = true;
        else if (arg === '--dry') out.dry = true;
        else if (arg === '--help' || arg === '-h') out.help = true;
        else if (arg === '--budget') out.budget = Number(argv[++i]);
        else if (arg === '--only') out.only = argv[++i];
        else if (arg === '--locales') out.locales = argv[++i];
        else if (arg === '--pageSize') out.pageSize = Number(argv[++i]);
    }
    return out;
}

export function buildUrl(base: string, args: Args, key: string): string {
    const url = new URL(`${base}/api/cron/translate-backfill`);
    if (key) url.searchParams.set('key', key);
    if (args.status) url.searchParams.set('status', '1');
    if (args.dry) url.searchParams.set('dry', '1');
    if (Number.isFinite(args.budget)) url.searchParams.set('budget', String(args.budget));
    if (args.only) url.searchParams.set('only', args.only);
    if (args.locales) url.searchParams.set('locales', args.locales);
    if (Number.isFinite(args.pageSize)) url.searchParams.set('pageSize', String(args.pageSize));
    return url.toString();
}

const USAGE = `
backfill-translations — fill the UGC translation cache before a guest arrives

  --status              what is left and what it would cost. Changes nothing.
  --dry                 decide out loud. No request is bought, no row is written,
                        and the cursor is NOT advanced on disk.
  --budget N            spend at most N engine requests, then stop clean.
  --only a,b            restrict to these source keys (see --status).
  --locales ru,es       restrict the target locales bought.
  --pageSize N          rows per corpus page (default 200).

The server does the work; this drives it. Set BACKFILL_BASE_URL (or
SCHEDULER_BASE_URL) if it is not http://127.0.0.1:3000.
`.trim();

function printStatus(body: any): void {
    console.log(`state dir  : ${body.stateDir ?? '(none — TRANSLATE_STATE_DIR is unset, the cursor is not persisted)'}`);
    console.log(`engine     : ${body.engine ?? 'none — identity rows only (free)'}`);
    console.log('');
    console.log('surfaces reading the cache:');
    for (const [key, on] of Object.entries(body.surfaces ?? {})) {
        console.log(`   ${on ? 'on ' : 'off'}  ${key}`);
    }
    console.log('');
    console.log('sources:');
    for (const s of body.sources ?? []) {
        const c = s.cursor;
        console.log(`   ${s.active ? 'active ' : 'skipped'}  tier ${s.tier}  ${s.key} — ${s.label}`);
        console.log(
            `            cursor: ${c ? `page ${c.page}${c.pageCount ? ` of ${c.pageCount}` : ''}, ${c.passes} full pass(es), last ${c.lastRun ?? 'never'}` : 'never run'}`
        );
    }
    console.log('');
    const g = body.governor ?? {};
    console.log(`governor   : day ${g.day} — ${g.total}/${g.rpd} spent (backfill ${g.backfill}/${g.backfillCeiling}, on-demand ${g.onDemand})`);
    console.log('');
    const d = body.demand ?? {};
    console.log(`guest demand: ${d.outstanding ?? 0} outstanding string(s)`);
    for (const row of d.byLocale ?? []) console.log(`   ${row.locale}  ${row.count} ask(s)`);
    if (!d.outstanding) {
        console.log('   (empty. Either nobody has missed yet, or TRANSLATE_STATE_DIR is unset —');
        console.log('    without it the log has nowhere to live and the walk order is all there is.)');
    }
}

function printRun(body: any): void {
    for (const line of body.log ?? []) console.log(`  ${line}`);
    console.log('');
    console.log(`walked        : ${body.walked} node(s)`);
    console.log(`considered    : ${body.considered} distinct string(s)`);
    console.log(`already cached: ${body.alreadyCached}`);
    console.log(`identity rows : ${body.identityRows}  (free — no engine request)`);
    console.log(`requests      : ${body.requests}`);
    console.log(`rows          : ${body.rowsCreated} created, ${body.rowsSkipped} skipped, ${body.rowsRejected} rejected`);
    console.log(`cache pairs   : ${body.covered} (locale x string) now filled`);
    if (body.unfilled) console.log(`unfilled      : ${body.unfilled} (the engine returned nothing usable)`);
    console.log(`stopped       : ${body.stopped}${body.reason ? ` (${body.reason})` : ''}`);
    if (body.dry) console.log('\n(dry run — nothing was bought, nothing was written, the cursor was not moved)');
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
    const args = parseArgs(argv);
    if (args.help) {
        console.log(USAGE);
        return 0;
    }

    const url = buildUrl(BASE, args, CRON_SECRET);
    console.log(`→ ${url.replace(/key=[^&]*/, 'key=***')}\n`);

    let res: Response;
    try {
        res = await fetch(url);
    } catch (err) {
        console.error(`could not reach the app at ${BASE} — is it running?`);
        console.error(err instanceof Error ? err.message : err);
        return 1;
    }

    const body = await res.json().catch(() => null);
    if (!res.ok || !body) {
        console.error(`HTTP ${res.status}: ${body ? JSON.stringify(body) : '(no body)'}`);
        return 1;
    }

    if (args.status) printStatus(body);
    else printRun(body);

    // `budget` and `governor` are the designed stopping conditions, not
    // failures: the whole point is a run that ends clean and resumes tomorrow.
    // Only a real error is worth a non-zero exit, so a cron does not alert on
    // a working day's quota running out.
    return body.stopped === 'error' || body.ok === false ? 1 : 0;
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
    main().then((code) => {
        process.exitCode = code;
    });
}
