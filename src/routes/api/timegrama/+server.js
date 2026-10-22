/**
 * TIMEGRAMA — the rikma's maturation clock (docs/inprogress/PLAN_TIMEGRAMA.md).
 *
 * Pulls every timegrama whose deadline has arrived and dispatches it to the
 * handler for its `whatami`. "Silence is consent, at the rikma's pace" is what
 * actually happens here: the version standing on the table when the clock runs
 * out is the one that takes effect.
 *
 * The one rule every path obeys: **a timegrama we are not going to act on must
 * be closed**. A row left `done:false` is re-picked on every run, forever — it
 * was how 6 of 29 stuck rows accumulated (one for 1040 days), and how the queue
 * grows toward the point where it no longer fits in one page.
 */
import { Pend } from './pend.svelte';
import { PendM } from './pendM.svelte';

import { finiapp } from './finiapp.svelte';
import { Ask } from './ask.svelte';
import { Askm } from './askm.svelte';
import { Decision } from './decision.svelte';
import { Dormancy } from './mesimabetahalich.svelte';
import { ArchiveEffective } from './archiveEffective.svelte';
import { StipendPayment } from './stipendPayment.svelte';
import { Tosplit } from './tosplit.svelte';
import { Maap } from './maap.svelte';
import { Sheirutpend } from './sheirutpend.svelte';
import { Askwant } from './askwant.svelte';
import { WishProposal } from './wishProposal';
import { wishClockEnabled } from '$lib/server/wish/mode.js';
import { matureRosterPeriod } from '$lib/server/shifts/engine.js';
import { asService } from '$lib/server/shifts/exec.js';
import { shiftsEnabled, shiftsMode } from '$lib/server/shifts/mode.js';
//ask need to creater 0on first vote or on request if the requester is project member4
//מעביר ראשון ראשון ברסק , אם מישהו ביקש מחכים למענה בעניינו ורק לאחר שיש כן 1 לפחות או לא 1 לפחות  ניתן לקבלו או לא 1 לפחות וניתן להציע לאנשים נוספים, בקשה של הקודם כאשר יש לא נשארת אך ניתן להוסיף עוד סקשות
import { SendToAdmin } from '$lib/server/sendToAdmin.js';
import { realtimeBroadcaster, strapiClient } from '$lib/server/actions/index.js';
import { maturedScopes, relationSelection } from '$lib/server/realtime/timegramaScopes';
import { projectIdsOf } from '$lib/realtime/scopes';
import { tellMatured } from '$lib/server/notifications/matured';
import { rosterClosed } from '$lib/server/notifications/maturedNotices';
import { remindAct } from '$lib/server/fulfillment/reminder';
// Server-only secret — never exposed to the client bundle (no VITE_ prefix).
import { env } from '$env/dynamic/private';

/**
 * Kinds that already have a finalizer below. Everything the codebase creates
 * must end up here — `docs/inprogress/PLAN_TIMEGRAMA.md` §6 makes that the rule for any
 * new kind.
 */
const HANDLED_KINDS = new Set([
  'ask',
  'askm',
  'pendm',
  'pmash',
  'finiapruval',
  'decision',
  'mesimabetahalich',
  'mashabetahalich',
  'matanot',
  'stipend_payment',
  'tosplit',
  'maap',
  'sheirutpend',
  'askwant',
  // A roster cycle's objection window has run out (docs/inprogress/PLAN_SHIFTS.md §7).
  // The whatami is the relation's own name — the dispatcher reads
  // `attributes[whatami]` — so it is `roster_period`, not `rosterPeriod`.
  'roster_period',
  // A wish proposal's terms nobody answered within the wish's pace (QA C-9). Like
  // roster_period, the relation only exists once 1.0b is deployed — see wishClockEnabled.
  'ratson_proposal',
  // A reminder before an automatic act is due (PLAN_SHOP_OPERATIONS A2,
  // $lib/server/fulfillment/reminder.ts). A reminder, not a consent clock.
  'act'
]);

/**
 * Kinds that are created by live code but whose finalizer is still to be
 * written. They would be deliberately **left open**: each one is a real
 * proposal standing on the table, and closing it silently would discard it
 * rather than mature it (D5). Empty since phase 4.4 — every kind the codebase
 * creates now has a finalizer, and §6 of the plan makes that the rule for any
 * new one.
 */
const AWAITING_HANDLER = new Set();

/** Every relation the dispatcher may need to resolve, including the unused
 *  ones — a field we forget to select is indistinguishable from a deleted
 *  target, and would close a live clock by mistake. */
const RELATION_FIELDS = [
  'ask',
  'askm',
  'askwant',
  'decision',
  'finiapruval',
  'maap',
  'mesimabetahalich',
  'pendm',
  'tosplit',
  'pmash',
  'act',
  'actt',
  'matanotpend',
  'open_mission',
  'open_mashaabim',
  'timer',
  'sheirutpend',
  'stipend_payment',
  'mashabetahalich',
  'matanot'
];

/**
 * `roster_period` only exists once the shift schema is deployed. Every field
 * here goes into ONE query, so asking for it before then would fail the whole
 * query and stop every consent clock on the platform — not just the shift
 * ones. It is asked for only while SHIFTS is on (shadow or on), which is only
 * ever switched after the deploy.
 */
function relationFields() {
  // Each optional relation only joins the query once its schema is live: one unknown field
  // would fail the whole query and stop every consent clock on the platform.
  return [
    ...RELATION_FIELDS,
    ...(shiftsEnabled() ? ['roster_period'] : []),
    ...(wishClockEnabled() ? ['ratson_proposal'] : [])
  ];
}

/** Close a clock. Every "we are not acting on this" path ends here. */
async function markDone(taid, why) {
  try {
    await SendToAdmin(
      `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
      env.ADMINMONTHER
    );
    console.log(`[timegrama] closed #${taid} — ${why}`);
  } catch (e) {
    console.error(`[timegrama] failed to close #${taid} (${why}):`, e);
  }
}

/**
 * Clocks this process already holds — a timer waiting for them, or a finalizer
 * running on them right now. A run looks an hour ahead and the scheduler runs
 * every 10 minutes, so without this a clock due in an hour got a fresh timer
 * from each of six runs, all firing in the same millisecond: each read the
 * candidacy as still open before any of them wrote, and tg#479 created six
 * missions and sent six "you were accepted" emails (2026-10-10 04:05Z).
 */
const claimed = new Set();

/**
 * Tell the screens of the clock's rikma (or wish) that it ran (B9). The handlers
 * write outside the Action System, so without this a silence maturation reached
 * nobody until their next reload. Fire-and-forget, like every realtime publish.
 */
async function publishMatured(kind, scopes, fetch) {
  if (!scopes?.length) return;
  try {
    await realtimeBroadcaster.publish(
      `timegrama:${kind}`,
      { scopes: () => scopes },
      {},
      null,
      { jwt: '', fetch, userId: '', lang: 'he' }
    );
  } catch (e) {
    console.warn(`[timegrama] realtime publish for ${kind} failed:`, e);
  }
}

/** Run a clock's finalizer unless this process is already holding it. */
async function runClaimed(id, kind, taid, fetch, scopes = []) {
  try {
    await x(id, kind, taid, fetch, scopes);
    await publishMatured(kind, scopes, fetch);
  } finally {
    // Released either way: a finalizer that left the clock open (a failed
    // write it wants retried) must be picked up again by a later run.
    claimed.delete(String(taid));
  }
}

// Every finalizer gets `fetch`: a maturation tells the people it concerns
// (N5, $lib/server/notifications/maturedNotices.ts), and the email fallback and
// push go out through SvelteKit's fetch.
async function x(id, kind, taid, fetch, scopes = []) {
  if (kind == 'ask') {
    await Ask(id, taid, fetch);
  } else if (kind == 'askm') {
    await Askm(id, taid, fetch);
  } else if (kind == 'pendm') {
    // fetch is passed through so the match-suggestion engine can
    // send "new suggestion" emails via the relative /api/sendMail.
    await Pend(id, taid, fetch);
  } else if (kind == 'pmash') {
    await PendM(id, taid, fetch);
  } else if (kind == 'finiapruval') {
    await finiapp(id, taid, fetch);
  } else if (kind == 'decision') {
    // saleClaim silence-as-consent maturation (PLAN_sale_holder_consent)
    await Decision(id, taid, fetch);
  } else if (kind == 'mesimabetahalich') {
    // Dormancy clock (PLAN_OBJECT_ARCHIVAL): a mission nobody touched for
    // dormancyDays opens its own release proposal.
    await Dormancy(id, taid, fetch);
  } else if (kind == 'mashabetahalich' || kind == 'matanot') {
    // A recurring commitment archived "at end of cycle" — this is the day.
    await ArchiveEffective(id, taid, kind, fetch);
  } else if (kind == 'stipend_payment') {
    // "Did the stipend arrive?" — no answer within restime confirms it
    // (PLAN_STIPEND §6), which is what lets its equity lines count.
    // `fetch` is passed through so the maturation can tell both sides it
    // happened — silence moves two people's percentages, and it used to move
    // them without a word (docs/inprogress/FIXES.md §8).
    await StipendPayment(id, taid, fetch);
  } else if (kind == 'tosplit') {
    // A profit split nobody objected to within restime settles itself
    // (PLAN_TIMEGRAMA D5).
    await Tosplit(id, taid, fetch);
  } else if (kind == 'maap') {
    // A recurring month settles once the responsible member has signed it and
    // the rikma's restime has run out (PLAN_TIMEGRAMA D1).
    await Maap(id, taid, fetch);
  } else if (kind == 'sheirutpend') {
    // A proposed service nobody objected to joins the rikma's catalogue
    // (PLAN_TIMEGRAMA phase 4.3).
    await Sheirutpend(id, taid, fetch);
  } else if (kind == 'roster_period') {
    // The draft becomes the roster (PLAN_SHIFTS §7). Idempotent: the shifts
    // cron may have closed it already, and then this only closes the clock.
    try {
      const outcome = await matureRosterPeriod(String(id), { exec: asService(fetch), mode: shiftsMode() });
      if (outcome !== 'off') await markDone(taid, `roster period ${outcome}`);
      // The roster's rikma rides in on the clock's scopes (B9).
      if (outcome === 'closed') await tellMatured(rosterClosed({ projectId: projectIdsOf(scopes)[0] }), fetch);
    } catch (e) {
      console.error(`[timegrama] roster period #${id} failed:`, e);
    }
  } else if (kind == 'askwant') {
    // Someone asked to receive a service. Matures only once a member said yes
    // (PLAN_TIMEGRAMA D2).
    await Askwant(id, taid, fetch);
  } else if (kind == 'ratson_proposal') {
    // The terms of a wish proposal nobody answered within the wish's pace: the version on
    // the table is approved for the side that stayed silent (C-9).
    await WishProposal(id, taid, fetch);
  } else if (kind == 'act') {
    // An automatic act is close to its due time (PLAN_SHOP_OPERATIONS A2). Whatever
    // the act's state, the clock ends here; a failed read leaves it for the next run.
    try {
      const outcome = await remindAct(
        (qid, vars) => strapiClient.execute(qid, vars),
        String(id),
        (notice) => tellMatured(notice, fetch)
      );
      await markDone(taid, `act reminder: ${outcome}`);
    } catch (e) {
      console.error(`[timegrama] act reminder #${id} failed:`, e);
    }
  }
}

export async function GET({ fetch }) {
  const d = new Date();
  const oneHourFromNow = new Date(d.getTime() + 60 * 60 * 1000);

  // Explicit pagination and sort: without them Strapi returns one default-sized
  // page of an unbounded, unordered set, so once the backlog outgrows that page
  // the newest clocks simply stop being seen. Oldest first, so the queue drains.
  /** `select` maps a relation field to its GraphQL selection. */
  const queryWith = (select) => `{
  timegramas (
    filters: { done: { ne: true }, date: { lte: "${oneHourFromNow.toISOString()}" } }
    sort: "date:asc"
    pagination: { limit: 500 }
  ) {data{ id attributes{
    whatami date
    ${relationFields().map(select).join('\n    ')}
}}}
 }
    `;

  const stats = { seen: 0, ran: 0, scheduled: 0, held: 0, closed: 0, waiting: 0 };

  try {
    // The rikma of each target rides along so a maturation can be published (B9).
    // That richer read must never cost the clock itself: if it is refused, read the
    // queue the old way and mature without publishing.
    let res = await SendToAdmin(queryWith(relationSelection), env.ADMINMONTHER);
    if (res?.errors?.length || !res?.data?.timegramas) {
      console.warn('[timegrama] queue read with rikmas refused — falling back:', res?.errors?.[0]?.message);
      res = await SendToAdmin(queryWith((f) => `${f}{data{id}}`), env.ADMINMONTHER);
    }
    const all = res?.data?.timegramas?.data ?? [];
    stats.seen = all.length;

    for (const element of all) {
      const tgid = element.id;
      const kind = element.attributes.whatami;
      const dateof = new Date(element.attributes.date);

      // A kind nobody handles and nobody is going to: dead relation fields, or
      // a typo'd whatami. Nothing will ever act on it — close it rather than
      // re-reading it every run for the rest of the system's life.
      // With SHIFTS off the relation above is not even queried, so the check
      // below would read it as a deleted target and close a live clock. Leave
      // it standing instead: when shifts come back on, it matures as normal.
      if (kind === 'roster_period' && !shiftsEnabled()) {
        stats.waiting++;
        continue;
      }
      // Same for the wish clock: its relation is not in the query while WISH_CLOCK is off.
      if (kind === 'ratson_proposal' && !wishClockEnabled()) {
        stats.waiting++;
        continue;
      }

      if (!HANDLED_KINDS.has(kind) && !AWAITING_HANDLER.has(kind)) {
        console.warn(`[timegrama] #${tgid}: unknown whatami="${kind}"`);
        await markDone(tgid, `unknown whatami "${kind}"`);
        stats.closed++;
        continue;
      }

      // The clock points at something that no longer exists. There is nothing
      // left to mature, and no future run will change that.
      const relation = element.attributes[kind];
      if (!relation || relation.data == null) {
        await markDone(tgid, `target ${kind} was deleted`);
        stats.closed++;
        continue;
      }

      // Kind is real, target is real, but its finalizer isn't written yet
      // (PLAN_TIMEGRAMA phase 4). Leave the proposal standing.
      if (AWAITING_HANDLER.has(kind)) {
        stats.waiting++;
        continue;
      }

      const myid = relation.data.id;
      const scopes = maturedScopes(kind, relation.data);

      // Already waiting on a timer from an earlier run, or running right now.
      if (claimed.has(String(tgid))) {
        stats.held++;
        continue;
      }
      claimed.add(String(tgid));

      if (d >= dateof) {
        // Awaited: the response used to return before the handlers had run, so
        // a restart could cut one off between its first mutation and markDone.
        stats.ran++;
        await runClaimed(myid, kind, tgid, fetch, scopes);
      } else {
        // Still in the future. Held in process memory for now — this goes away
        // with the move to our own timer (PLAN_TIMEGRAMA §4.6).
        stats.scheduled++;
        setTimeout(function () {
          runClaimed(myid, kind, tgid, fetch, scopes).catch((e) =>
            console.error(`[timegrama] #${tgid} (${kind}) failed:`, e)
          );
        }, dateof.getTime() - d.getTime());
      }
    }
  } catch (e) {
    console.error('[timegrama] run failed:', e);
  }

  console.log(
    `[timegrama] run ${d.toISOString()} — seen ${stats.seen}, ran ${stats.ran}, ` +
      `scheduled ${stats.scheduled}, already held ${stats.held}, closed ${stats.closed}, ` +
      `awaiting handler ${stats.waiting}`
  );

  return new Response('Hello Cron!');
}
