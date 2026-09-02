/**
 * TIMEGRAMA — the rikma's maturation clock (docs/PLAN_TIMEGRAMA.md).
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
//ask need to creater 0on first vote or on request if the requester is project member4
//מעביר ראשון ראשון ברסק , אם מישהו ביקש מחכים למענה בעניינו ורק לאחר שיש כן 1 לפחות או לא 1 לפחות  ניתן לקבלו או לא 1 לפחות וניתן להציע לאנשים נוספים, בקשה של הקודם כאשר יש לא נשארת אך ניתן להוסיף עוד סקשות
import { SendToAdmin } from '$lib/server/sendToAdmin.js';
// Server-only secret — never exposed to the client bundle (no VITE_ prefix).
import { ADMINMONTHER } from '$env/static/private';

/**
 * Kinds that already have a finalizer below. Everything the codebase creates
 * must end up here — `docs/PLAN_TIMEGRAMA.md` §6 makes that the rule for any
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
  'askwant'
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

/** Close a clock. Every "we are not acting on this" path ends here. */
async function markDone(taid, why) {
  try {
    await SendToAdmin(
      `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
      ADMINMONTHER
    );
    console.log(`[timegrama] closed #${taid} — ${why}`);
  } catch (e) {
    console.error(`[timegrama] failed to close #${taid} (${why}):`, e);
  }
}

async function x(id, kind, taid, fetch) {
  if (kind == 'ask') {
    await Ask(id, taid, fetch);
  } else if (kind == 'askm') {
    await Askm(id, taid);
  } else if (kind == 'pendm') {
    // fetch is passed through so the match-suggestion engine can
    // send "new suggestion" emails via the relative /api/sendMail.
    await Pend(id, taid, fetch);
  } else if (kind == 'pmash') {
    await PendM(id, taid, fetch);
  } else if (kind == 'finiapruval') {
    await finiapp(id, taid);
  } else if (kind == 'decision') {
    // saleClaim silence-as-consent maturation (PLAN_sale_holder_consent)
    await Decision(id, taid);
  } else if (kind == 'mesimabetahalich') {
    // Dormancy clock (PLAN_OBJECT_ARCHIVAL): a mission nobody touched for
    // dormancyDays opens its own release proposal.
    await Dormancy(id, taid);
  } else if (kind == 'mashabetahalich' || kind == 'matanot') {
    // A recurring commitment archived "at end of cycle" — this is the day.
    await ArchiveEffective(id, taid, kind);
  } else if (kind == 'stipend_payment') {
    // "Did the stipend arrive?" — no answer within restime confirms it
    // (PLAN_STIPEND §6), which is what lets its equity lines count.
    // `fetch` is passed through so the maturation can tell both sides it
    // happened — silence moves two people's percentages, and it used to move
    // them without a word (docs/FIXES.md §8).
    await StipendPayment(id, taid, fetch);
  } else if (kind == 'tosplit') {
    // A profit split nobody objected to within restime settles itself
    // (PLAN_TIMEGRAMA D5).
    await Tosplit(id, taid);
  } else if (kind == 'maap') {
    // A recurring month settles once the responsible member has signed it and
    // the rikma's restime has run out (PLAN_TIMEGRAMA D1).
    await Maap(id, taid);
  } else if (kind == 'sheirutpend') {
    // A proposed service nobody objected to joins the rikma's catalogue
    // (PLAN_TIMEGRAMA phase 4.3).
    await Sheirutpend(id, taid);
  } else if (kind == 'askwant') {
    // Someone asked to receive a service. Matures only once a member said yes
    // (PLAN_TIMEGRAMA D2).
    await Askwant(id, taid);
  }
}

export async function GET({ fetch }) {
  const d = new Date();
  const oneHourFromNow = new Date(d.getTime() + 60 * 60 * 1000);

  // Explicit pagination and sort: without them Strapi returns one default-sized
  // page of an unbounded, unordered set, so once the backlog outgrows that page
  // the newest clocks simply stop being seen. Oldest first, so the queue drains.
  const qu = `{
  timegramas (
    filters: { done: { ne: true }, date: { lte: "${oneHourFromNow.toISOString()}" } }
    sort: "date:asc"
    pagination: { limit: 500 }
  ) {data{ id attributes{
    whatami date
    ${RELATION_FIELDS.map((f) => `${f}{data{id}}`).join('\n    ')}
}}}
 }
    `;

  const stats = { seen: 0, ran: 0, scheduled: 0, closed: 0, waiting: 0 };

  try {
    const res = await SendToAdmin(qu, ADMINMONTHER);
    const all = res?.data?.timegramas?.data ?? [];
    stats.seen = all.length;

    for (const element of all) {
      const tgid = element.id;
      const kind = element.attributes.whatami;
      const dateof = new Date(element.attributes.date);

      // A kind nobody handles and nobody is going to: dead relation fields, or
      // a typo'd whatami. Nothing will ever act on it — close it rather than
      // re-reading it every run for the rest of the system's life.
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

      if (d >= dateof) {
        // Awaited: the response used to return before the handlers had run, so
        // a restart could cut one off between its first mutation and markDone.
        stats.ran++;
        await x(myid, kind, tgid, fetch);
      } else {
        // Still in the future. Held in process memory for now — this goes away
        // with the move to our own timer (PLAN_TIMEGRAMA §4.6).
        stats.scheduled++;
        setTimeout(function () {
          x(myid, kind, tgid, fetch);
        }, dateof.getTime() - d.getTime());
      }
    }
  } catch (e) {
    console.error('[timegrama] run failed:', e);
  }

  console.log(
    `[timegrama] run ${d.toISOString()} — seen ${stats.seen}, ran ${stats.ran}, ` +
      `scheduled ${stats.scheduled}, closed ${stats.closed}, awaiting handler ${stats.waiting}`
  );

  return new Response('Hello Cron!');
}
