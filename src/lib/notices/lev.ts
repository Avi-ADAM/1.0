/**
 * Notices from the heart: one sentence per heart item that waits for the viewer.
 *
 * Built on cardKinds.js, which already knows where each processor puts the
 * names and figures of its kind (`rowContent`). A kind with a builder here says
 * it as a sentence; any other kind falls back to the row's own title and
 * subtitle, so a kind added to the heart tomorrow is never missing from the
 * notices — a test walks RENDERABLE_ANIS to keep it so.
 *
 * Approving from a heart notice is stage 3 (an `approveSpec` the card itself
 * uses, so the two can never send different params); until then `approve` is null.
 */

import {
  rowContent,
  rowCtaKey,
  rowIsActionable,
  rowKindKey,
  rowTimegrama,
  rowTitle
} from '$lib/components/lev/cards/cardKinds.js';
import { standingChanges } from '$lib/archive/decisionView';
import { isUrgent } from '$lib/digest/hubSummary.js';
import { k, terms, term, txt, type Notice, type NoticeTerm, type NoticeText } from './types';

type Built = { sentence: NoticeText; detail?: NoticeText | null; terms?: NoticeTerm[] };

/** Decision kinds that change a field of the rikma — each has a label in `lev.list.decision`. */
const FIELD_DECISIONS = new Set([
  'name', 'pubdes', 'prides', 'newFlink', 'newWlink', 'timtoM',
  'vallueadd', 'vallueles', 'pic', 'codeLicense', 'address', 'look', 'sheirutpends'
]);

const who = (b: any) => txt(b.username) ?? txt(b.useraplyname);
const item = (b: any, ...fields: unknown[]) =>
  fields.map(txt).find(Boolean) ?? txt(rowTitle(b)) ?? k('notices.lev.someItem');

const BUILDERS: Record<string, (b: any) => Built> = {
  pends: (b) => ({
    sentence: k('notices.lev.pends', { item: item(b), rikma: b.projectName }),
    terms: terms(term('hours', b.noofhours), term('rate', b.perhour))
  }),

  pmashes: (b) => ({
    sentence: k('notices.lev.pmashes', { item: item(b), rikma: b.projectName }),
    terms: terms(term('qty', b.hm), term('price', b.price), term('amount', b.easy))
  }),

  askedcoin: (b) => ({
    sentence: k(who(b) ? 'notices.lev.askedcoin' : 'notices.lev.askedcoinAnon', {
      who: who(b),
      item: item(b, b.openName),
      rikma: b.projectName
    }),
    terms: terms(term('hours', b.nhours), term('rate', b.perhour))
  }),

  askedm: (b) => ({
    sentence: k(who(b) ? 'notices.lev.askedm' : 'notices.lev.askedmAnon', {
      who: who(b),
      item: item(b, b.openName),
      rikma: b.projectName
    }),
    terms: terms(term('qty', b.myp), term('price', b.price), term('amount', b.easy))
  }),

  fiapp: (b) => ({
    sentence: k(who(b) ? 'notices.lev.fiapp' : 'notices.lev.fiappAnon', {
      who: who(b),
      item: item(b),
      rikma: b.projectName
    }),
    terms: terms(term('hours', b.nhours), term('rate', b.perhour))
  }),

  wegets: (b) => ({
    sentence: k(who(b) ? 'notices.lev.wegets' : 'notices.lev.wegetsAnon', {
      who: who(b),
      item: item(b),
      rikma: b.projectName
    }),
    terms: terms(term('qty', b.hm), term('price', b.price), term('amount', b.easy))
  }),

  wishoffer: (b) => ({
    sentence: k(txt(b.volunteerName) ? 'notices.lev.wishoffer' : 'notices.lev.wishofferAnon', {
      who: txt(b.volunteerName),
      item: item(b, b.missionName, b.ratsonName),
      wish: txt(b.ratsonName) ?? k('notices.lev.someWish')
    }),
    terms: terms(term('hours', b.hours), term('price', b.price))
  }),

  hachla: (b) => {
    if (b.kind === 'saleClaim') {
      const sc = b.saleClaim ?? {};
      return {
        sentence: k('notices.lev.saleClaim', {
          item: txt(sc.productName) ?? k('notices.lev.someItem'),
          rikma: b.projectName
        }),
        terms: terms(
          term('price', sc.standing?.price ?? sc.current?.price),
          term('qty', sc.standing?.hm ?? sc.current?.unit)
        )
      };
    }
    const what: NoticeText = FIELD_DECISIONS.has(b.kind)
      ? k(`lev.list.decision.${b.kind}`)
      : (txt(b.name) ?? k('lev.list.decision.generic'));
    return { sentence: k('notices.lev.decision', { what, rikma: b.projectName }) };
  },

  // Archive / edit / release of a rikma object (PLAN_OBJECT_ARCHIVAL). "A request
  // to add 5 hours to X" is the difference between the standing round and the
  // object as it is — `standingChanges` already computes it for the card's table.
  archObject: (b) => {
    const av = b.archive ?? {};
    const proposer = txt(av.standing?.proposedByName) ?? txt(av.ownerName);
    const target = txt(av.targetName) ?? item(b);
    const isMission = av.targetKind === 'openMission' || av.targetKind === 'missionInProgress';
    const base = { who: proposer, item: target, rikma: b.projectName };
    const anon = proposer ? '' : 'Anon';

    if (av.kind !== 'editObject') {
      const verb = av.scope === 'release' ? 'release' : 'archive';
      return {
        sentence: k(`notices.lev.${verb}${anon}`, base),
        detail: txt(av.why),
        terms: terms(term('hours', av.accruedHours))
      };
    }

    const changed = standingChanges(av).filter((r) => r.isNumeric && r.delta != null);
    const hoursRow = changed.find((r) => r.field === 'hm');
    // One figure moved, and it is a mission's hours: say it as the request it is.
    if (isMission && hoursRow && changed.length === 1 && hoursRow.delta) {
      const up = hoursRow.delta > 0;
      const count = Math.abs(hoursRow.delta);
      // "1 שעות" / "1 hours" reads wrong in every locale here; one hour has its own sentence.
      const one = count === 1 ? 'One' : '';
      return {
        sentence: k(`notices.lev.${up ? 'addHours' : 'removeHours'}${one}${anon}`, { ...base, count }),
        detail: txt(av.why),
        terms: terms(term('hours', hoursRow.to))
      };
    }
    return {
      sentence: k(`notices.lev.edit${anon}`, base),
      detail: txt(av.why),
      // The new values of what moved — hours/quantity and rate/price; the rest
      // (dates, head counts, wording) is the full card's to show.
      terms: terms(
        ...changed.map((r) =>
          r.field === 'hm'
            ? term(isMission ? 'hours' : 'qty', r.to)
            : r.field === 'price'
              ? term(isMission ? 'rate' : 'price', r.to)
              : null
        )
      )
    };
  }
};

/**
 * What a heart item is about, in the terms the other sources use: a wish offer
 * is the proposal the concierge also lists; a candidacy (askedcoin / askedm) is
 * the one a deal lists when it fills a customer's part; the rest are the heart's own.
 */
function subjectOf(b: any, id: string): string {
  if (b.ani === 'wishoffer') return `proposal:${id}`;
  if (b.ani === 'askedcoin') return `candidacy:ask:${b.askId ?? id}`;
  if (b.ani === 'askedm') return `candidacy:askm:${b.askId ?? id}`;
  if (b.ani === 'archObject' || b.ani === 'hachla' || b.ani === 'stipend') return `decision:${b.pendId ?? id}`;
  return `lev:${b.ani}:${id}`;
}

/** The round a heart item stands at, for the dismissal key. */
function roundOf(b: any): number {
  const r =
    b.archive?.standingOrder ??
    b.stipend?.standingOrder ??
    b.saleClaim?.standingOrder ??
    b.orderon ??
    0;
  const n = Number(r);
  return Number.isFinite(n) ? n : 0;
}

/**
 * The notice for one heart item, or null when nothing in it waits for the
 * viewer: already signed, or a kind whose only action is to look (an active
 * timer, a welcome, an accrual) — the same line the row's button draws.
 */
export function levNotice(b: any, now: number = Date.now()): Notice | null {
  if (!b?.ani || !rowIsActionable(b)) return null;
  if (rowCtaKey(b) === 'lev.list.cta.view') return null;

  const built: Built = BUILDERS[b.ani]?.(b) ?? fallback(b);
  const deadline = rowTimegrama(b);
  const id = String(b.id ?? b.pendId ?? b.coinlapach ?? '');

  return {
    key: `lev:${b.ani}:${id}:v${roundOf(b)}`,
    subject: subjectOf(b, id),
    source: 'lev',
    kind: b.ani,
    sentence: built.sentence,
    detail: built.detail ?? null,
    terms: built.terms ?? [],
    where: b.projectId ? { kind: 'rikma', id: String(b.projectId), name: b.projectName ?? '' } : null,
    deadline,
    urgent: isUrgent(deadline, now),
    // A rikma's restime: silence approves the version on the table when it runs out.
    clockRuns: !!deadline,
    approve: null,
    expand: {
      kind: 'lev',
      ani: b.ani,
      coinlapach: String(b.coinlapach ?? id),
      href: `/lev?focus=${encodeURIComponent(b.ani)}${b.projectId ? `&project=${encodeURIComponent(String(b.projectId))}` : ''}`
    },
    at: b.created_at ?? b.createdAt ?? null
  };
}

/** Any kind without its own sentence: "<kind>: <title>", the row's subtitle beneath. */
function fallback(b: any): Built {
  const content = rowContent(b);
  return {
    sentence: k('notices.lev.fallback', {
      kind: k(rowKindKey(b)),
      what: (content.title as NoticeText | null) ?? k('notices.lev.someItem')
    }),
    detail: (content.subtitle as NoticeText | null) ?? null,
    terms: (content.facts ?? [])
      .map((f: { key: string; value: unknown }) =>
        ['hours', 'rate', 'price', 'qty', 'amount'].includes(f.key) ? term(f.key as any, f.value) : null
      )
      .filter((t: NoticeTerm | null): t is NoticeTerm => t !== null)
      .slice(0, 3)
  };
}

export function levNotices(items: any[], now: number = Date.now()): Notice[] {
  return (items ?? []).map((b) => levNotice(b, now)).filter((n): n is Notice => n !== null);
}
