import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RENDERABLE_ANIS, rowCtaKey } from '$lib/components/lev/cards/cardKinds.js';
import {
  ROUND_GUARDED_ACTIONS,
  dealNotices,
  levNotice,
  mergeNotices,
  termKey,
  wishNotice,
  type Notice,
  type NoticeText,
  type WishNoticeInput
} from './index';

const NOW = Date.parse('2026-10-05T10:00:00.000Z');
const HOUR = 3600_000;

// ── the translation files ──────────────────────────────────────────────────

const TR = join(dirname(fileURLToPath(import.meta.url)), '../translations');
const LOCALES = ['he', 'en', 'ar', 'ru', 'es'];
const load = (locale: string, ns: string) => JSON.parse(readFileSync(join(TR, locale, `${ns}.json`), 'utf8'));
const notices = Object.fromEntries(LOCALES.map((l) => [l, load(l, 'notices')]));
const lev = Object.fromEntries(LOCALES.map((l) => [l, load(l, 'lev')]));

function lookup(locale: string, key: string): unknown {
  const [ns, ...path] = key.split('.');
  const root = ns === 'notices' ? notices[locale] : ns === 'lev' ? lev[locale] : undefined;
  return path.reduce((o: any, p) => (o == null ? undefined : o[p]), root);
}

function leaves(o: any, prefix = ''): [string, string][] {
  return Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'string' ? [[prefix + k, v] as [string, string]] : leaves(v, `${prefix}${k}.`)
  );
}

/** Every `$t()` key a notice would look up — its sentence, nested params, detail, terms. */
function keysOf(n: Notice): string[] {
  const walk = (t: NoticeText | null | undefined): string[] => {
    if (!t || !('key' in t)) return [];
    const nested = Object.values(t.params ?? {}).flatMap((p) =>
      typeof p === 'object' && p !== null ? walk(p as NoticeText) : []
    );
    return [t.key, ...nested];
  };
  return [...walk(n.sentence), ...walk(n.detail), ...n.terms.map((t) => termKey(t.kind))];
}

function expectRenderable(n: Notice) {
  for (const key of keysOf(n)) {
    for (const l of LOCALES) {
      expect(typeof lookup(l, key), `${l}: ${key}`).toBe('string');
    }
  }
}

/** PLAN §3.3 — approving signs only figures the notice shows. */
function expectTermsShown(n: Notice) {
  if (!n.approve) return;
  for (const t of n.approve.terms) {
    expect(n.terms, `${n.key} signs ${t.kind}=${t.value} without showing it`).toContainEqual(t);
  }
  expect(n.approve.terms.length).toBeGreaterThan(0);
  expect(ROUND_GUARDED_ACTIONS.has(n.approve.actionKey), `${n.approve.actionKey} does not refuse moved terms`).toBe(true);
  const guard = n.approve.params.expectRound ?? n.approve.params.expectAmount;
  expect(guard, `${n.key} approves without saying what it saw`).not.toBeUndefined();
}

describe('notices.json', () => {
  it('has the same keys in every locale', () => {
    const he = leaves(notices.he).map(([k]) => k).sort();
    for (const l of LOCALES) expect(leaves(notices[l]).map(([k]) => k).sort(), l).toEqual(he);
  });

  it('uses only {{name}} placeholders the parser can fill, the same ones in every locale', () => {
    for (const [key, he] of leaves(notices.he)) {
      const names = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();
      for (const l of LOCALES) {
        const s = lookup(l, `notices.${key}`) as string;
        expect(s, `${l}.${key}: single-brace placeholder`).not.toMatch(/(^|[^{])\{\w+\}(?!\})/);
        for (const n of names(s)) expect(n.length, `${l}.${key}: {{${n}}}`).toBeGreaterThanOrEqual(2);
        expect(names(s), `${l}.${key}`).toEqual(names(he));
      }
    }
  });

  // PLAN §3.2: there is no gender field on a user, so no sentence may guess one.
  it('never guesses anyone’s gender', () => {
    const gendered: Record<string, RegExp> = {
      // A past form at the start of a word — `\b` does not see Hebrew letters, and
      // the infinitive "להוסיף" contains the past "הוסיף".
      he: /(?<![א-ת])(ביקש|הציע|אישר|שלח|סיים|הוסיף|דיווחה)|\/ה(?![א-ת])|\/ת(?![א-ת])/,
      en: /\b(he|she|his|her|him)\b/i,
      ar: /طلبت|اقترحت|أرسلت|وافقت|أنهت|\(ة\)/,
      ru: /попросил|предложил|отправил|завершил|согласил|добавил|\(а\)|\/а\b/,
      es: /\(a\)|o\/a\b|\/a\b/
    };
    for (const l of LOCALES) {
      for (const [key, s] of leaves(notices[l])) expect(s, `${l}.${key}`).not.toMatch(gendered[l]);
    }
  });
});

// ── the heart ──────────────────────────────────────────────────────────────

const levItem = (ani: string, extra: Record<string, unknown> = {}) => ({
  ani,
  id: '11',
  coinlapach: `c-${ani}`,
  pl: 100,
  projectId: '5',
  projectName: 'Gefen',
  nameRaw: 'Logo',
  ...extra
});

describe('levNotice', () => {
  it('says something renderable for every kind the heart renders — or nothing, when the card only invites a look', () => {
    for (const ani of RENDERABLE_ANIS) {
      const item = levItem(ani);
      const n = levNotice(item, NOW);
      if (rowCtaKey(item) === 'lev.list.cta.view') {
        expect(n, ani).toBeNull();
        continue;
      }
      expect(n, ani).not.toBeNull();
      expectRenderable(n!);
      expect(n!.source).toBe('lev');
      expect(n!.where).toEqual({ kind: 'rikma', id: '5', name: 'Gefen' });
    }
  });

  it('is silent about what the viewer already signed', () => {
    expect(levNotice(levItem('pends', { already: true }), NOW)).toBeNull();
    expect(levNotice(levItem('pends', { pl: 700 }), NOW)).toBeNull();
  });

  it('names who asks, what and where, with the figures', () => {
    const n = levNotice(
      levItem('askedcoin', { username: 'Dana', openName: 'Design', nhours: 5, perhour: 80 }),
      NOW
    )!;
    expect(n.sentence).toEqual({
      key: 'notices.lev.askedcoin',
      params: { who: { text: 'Dana' }, item: { text: 'Design' }, rikma: 'Gefen' }
    });
    expect(n.terms).toEqual([
      { kind: 'hours', value: 5 },
      { kind: 'rate', value: 80 }
    ]);
    expect(n.subject).toBe('candidacy:ask:11');
  });

  it('outside the heart, expand opens the heart on that kind in that rikma', () => {
    const n = levNotice(levItem('askedcoin', { username: 'Dana' }), NOW)!;
    expect(n.expand).toEqual({ kind: 'lev', ani: 'askedcoin', coinlapach: 'c-askedcoin', href: '/lev?focus=askedcoin&project=5' });
  });

  it('runs the restime clock only where there is a deadline, and flags the last day', () => {
    const soon = new Date(NOW + 5 * HOUR).toISOString();
    const n = levNotice(levItem('pends', { timegramaDate: soon }), NOW)!;
    expect(n.clockRuns).toBe(true);
    expect(n.urgent).toBe(true);
    expect(levNotice(levItem('pends'), NOW)!.clockRuns).toBe(false);
  });

  describe('an edit of a mission — "a request to add N hours"', () => {
    const edit = (hmFrom: number, hmTo: number, priceTo: number | null = null) =>
      levItem('archObject', {
        archive: {
          kind: 'editObject',
          scope: 'archive',
          targetKind: 'missionInProgress',
          targetName: 'Logo',
          standingOrder: 2,
          current: { hm: hmFrom, price: 80 },
          standing: { ordern: 2, mode: 'keep', hm: hmTo, price: priceTo, proposedByName: 'Dana' }
        }
      });

    it('says how many hours', () => {
      const n = levNotice(edit(10, 15), NOW)!;
      expect(n.sentence).toMatchObject({ key: 'notices.lev.addHours', params: { count: 5, who: { text: 'Dana' } } });
      expect(n.terms).toEqual([{ kind: 'hours', value: 15 }]);
      expect(n.key).toBe('lev:archObject:11:v2');
      expectRenderable(n);
    });

    it('has a sentence of its own for one hour, and for fewer hours', () => {
      expect(levNotice(edit(10, 11), NOW)!.sentence).toMatchObject({ key: 'notices.lev.addHoursOne' });
      expect(levNotice(edit(10, 7), NOW)!.sentence).toMatchObject({ key: 'notices.lev.removeHours', params: { count: 3 } });
    });

    it('falls back to "a request to change" when more than the hours moved', () => {
      const n = levNotice(edit(10, 12, 95), NOW)!;
      expect(n.sentence).toMatchObject({ key: 'notices.lev.edit' });
      expect(n.terms).toEqual([
        { kind: 'hours', value: 12 },
        { kind: 'rate', value: 95 }
      ]);
    });
  });
});

// ── the concierge ──────────────────────────────────────────────────────────

const wishInput = (over: Partial<WishNoticeInput['proposal']> = {}, viewer: 'wisher' | 'provider' = 'wisher'): WishNoticeInput => ({
  viewer,
  wish: { id: '7', name: 'Kitchen' },
  proposal: {
    id: '70',
    status: 'suggested',
    proposerName: 'Avi',
    wisherName: 'Noa',
    itemName: 'Plumbing',
    itemKind: 'mission',
    negotiation: { round: 0, yourTurn: true, amount: 6, price: 400, deadlineAt: null },
    createdAt: '2026-10-01T08:00:00.000Z',
    ...over
  }
});

describe('wishNotice', () => {
  it('a new offer: who, for what, on which wish, at what terms — approvable on those terms', () => {
    const n = wishNotice(wishInput(), NOW)!;
    expect(n.kind).toBe('wishOffer');
    expect(n.terms).toEqual([
      { kind: 'hours', value: 6 },
      { kind: 'price', value: 400 }
    ]);
    expect(n.approve).toEqual({
      actionKey: 'acceptRatsonProposal',
      params: { proposalId: '70', ratsonId: '7', expectRound: 0 },
      terms: n.terms,
      round: 0
    });
    expect(n.expand).toEqual({ kind: 'href', href: '/concierge/7#proposal-70' });
    expect(n.subject).toBe('proposal:70');
    expectRenderable(n);
    expectTermsShown(n);
  });

  it('a counter carries its round in the key and its reason as the detail', () => {
    const n = wishNotice(
      wishInput({
        negotiation: {
          round: 2,
          yourTurn: true,
          amount: 8,
          price: 520,
          deadlineAt: new Date(NOW + 30 * HOUR).toISOString(),
          counters: [{ by: 'wisher' }, { by: 'provider', note: 'Two more pipes than planned' }]
        }
      }),
      NOW
    )!;
    expect(n.kind).toBe('wishCounter');
    expect(n.key).toBe('wish:70:v2');
    expect(n.detail).toEqual({ text: 'Two more pipes than planned' });
    expect(n.approve?.params.expectRound).toBe(2);
    expect(n.clockRuns).toBe(true);
    expect(n.urgent).toBe(false);
    expectTermsShown(n);
  });

  it('the provider is asked about an invitation, in the wisher’s name', () => {
    const n = wishNotice(wishInput({}, 'provider'), NOW)!;
    expect(n.kind).toBe('wishInvite');
    expect(n.sentence).toMatchObject({ key: 'notices.wish.invite', params: { who: 'Noa' } });
    expect(n.expand).toEqual({ kind: 'href', href: '/wish/7' });
  });

  it('nothing while it is the other side’s move, or once the proposal is closed', () => {
    expect(wishNotice(wishInput({ negotiation: { round: 1, yourTurn: false, amount: 6, price: 400, deadlineAt: null } }), NOW)).toBeNull();
    expect(wishNotice(wishInput({ status: 'accepted' }), NOW)).toBeNull();
  });

  it('a product offer is priced by quote: shown, never approved in one tap', () => {
    const n = wishNotice(wishInput({ negotiation: null, productName: 'Kitchen set', totalPrice: 9000 }), NOW)!;
    expect(n.kind).toBe('wishProduct');
    expect(n.approve).toBeNull();
    expect(wishNotice(wishInput({ negotiation: null }, 'provider'), NOW)).toBeNull();
  });

  it('no figures, no one-tap approval — there would be nothing on screen to sign', () => {
    const n = wishNotice(wishInput({ negotiation: { round: 0, yourTurn: true, amount: null, price: null, deadlineAt: null } }), NOW)!;
    expect(n.approve).toBeNull();
  });
});

// ── the deal ───────────────────────────────────────────────────────────────

const deal = { sheirutId: '8', name: 'Laptop repair' };
const offers = {
  customerIds: ['261'],
  offers: [
    {
      kind: 'mission' as const,
      offerId: '300',
      name: 'Diagnostics',
      amount: 4,
      unitPrice: 100,
      candidacies: [
        { side: 'ask' as const, id: '5', candidateId: '9', candidateName: 'Avi', candidatePic: null, amount: 4, unitPrice: 100, price: 400, round: 1, signedByViewer: false, clientsPending: 1, membersSigned: true, candidateAgreed: true, approvable: false },
        { side: 'ask' as const, id: '6', candidateId: '10', candidateName: 'Ben', candidatePic: null, amount: 4, unitPrice: 100, price: 400, round: 0, signedByViewer: true, clientsPending: 0, membersSigned: true, candidateAgreed: true, approvable: true }
      ]
    }
  ]
};
const editView = (over: Record<string, unknown> = {}) => ({
  decisionId: '44',
  missionId: '12',
  missionName: 'Diagnostics',
  providerName: 'Avi',
  cap: 400,
  agreedHours: 4,
  missionHours: 4,
  missionRate: 100,
  standing: { order: 2, hm: 6, price: 100, value: 600, why: 'The board is older than it looked', proposedById: '9', proposedByName: 'Avi', zman: '2026-10-04T08:00:00.000Z' },
  rounds: [],
  raise: 200,
  needsCustomer: true,
  customersPending: ['261'],
  membersPending: [],
  deadline: null,
  membersMatured: false,
  viewerSigned: false,
  ...over
});

describe('dealNotices', () => {
  it('asks the customer to co-sign each candidacy she has not signed', () => {
    const list = dealNotices({ viewerId: '261', deal, offers }, NOW);
    expect(list).toHaveLength(1);
    const [n] = list;
    expect(n.kind).toBe('dealOffer');
    expect(n.approve).toMatchObject({ actionKey: 'signDealOffer', params: { side: 'ask', id: '5', expectRound: 1 }, round: 1 });
    expect(n.key).toBe('deal:offer:ask:5:v1');
    expect(n.subject).toBe('candidacy:ask:5');
    expectRenderable(n);
    expectTermsShown(n);
  });

  it('asks nobody who is not a customer of the deal', () => {
    expect(dealNotices({ viewerId: '9', deal, offers }, NOW)).toEqual([]);
  });

  it('an edit that raises her price: the new terms, the raise, and why', () => {
    const [n] = dealNotices({ viewerId: '261', deal, edits: [editView() as any] }, NOW);
    expect(n.kind).toBe('dealEdit');
    expect(n.terms).toEqual([
      { kind: 'hours', value: 6 },
      { kind: 'rate', value: 100 },
      { kind: 'raise', value: 200 }
    ]);
    expect(n.detail).toEqual({ text: 'The board is older than it looked' });
    expect(n.approve).toMatchObject({ actionKey: 'signDealEdit', params: { decisionId: '44', expectRound: 2 } });
    expectRenderable(n);
    expectTermsShown(n);
  });

  it('her silence is never her yes — no deal notice runs a clock', () => {
    const list = dealNotices(
      {
        viewerId: '261',
        deal,
        offers,
        edits: [editView({ deadline: new Date(NOW + 2 * HOUR).toISOString() }) as any],
        due: { remaining: 300, customerIds: ['261'] }
      },
      NOW
    );
    expect(list.length).toBe(3);
    for (const n of list) expect(n.clockRuns, n.kind).toBe(false);
  });

  it('what is still due is shown, never paid in a tap', () => {
    const [n] = dealNotices({ viewerId: '261', deal, due: { remaining: 300, customerIds: ['261'] } }, NOW);
    expect(n.kind).toBe('dealDue');
    expect(n.approve).toBeNull();
    expect(n.terms).toEqual([{ kind: 'amount', value: 300 }]);
  });

  it('a provider confirms receiving her part — once the customer has paid, with the amount on screen', () => {
    const parts = {
      parts: [{ providerId: '9', name: 'Avi', due: 400, cap: 400 }],
      confirmed: [],
      pending: ['9'],
      allConfirmed: false,
      customerPaid: true
    };
    const [n] = dealNotices({ viewerId: '9', deal, parts }, NOW);
    expect(n.kind).toBe('dealPart');
    expect(n.approve).toMatchObject({ actionKey: 'confirmDealPartReceived', params: { sheirutId: '8', expectAmount: 400 } });
    expectTermsShown(n);
    expect(dealNotices({ viewerId: '9', deal, parts: { ...parts, customerPaid: false } }, NOW)).toEqual([]);
  });
});

// ── merging ────────────────────────────────────────────────────────────────

describe('mergeNotices', () => {
  it('one row for a wish offer the heart and the concierge both know, the concierge’s', () => {
    const fromWish = wishNotice(wishInput(), NOW)!;
    const fromLev = levNotice(levItem('wishoffer', { id: '70', volunteerName: 'Avi', missionName: 'Plumbing', ratsonName: 'Kitchen' }), NOW)!;
    expect(fromLev.subject).toBe(fromWish.subject);
    const merged = mergeNotices([fromWish], [fromLev]);
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe('wish');
  });

  it('most pressing first: urgent, then the nearest deadline, then the longest waiting', () => {
    const at = (h: number) => new Date(NOW + h * HOUR).toISOString();
    const a = levNotice(levItem('pends', { id: 'a', created_at: at(-50) }), NOW)!;
    const b = levNotice(levItem('pends', { id: 'b', timegramaDate: at(40) }), NOW)!;
    const c = levNotice(levItem('pends', { id: 'c', timegramaDate: at(3) }), NOW)!;
    const d = levNotice(levItem('pends', { id: 'd', created_at: at(-10) }), NOW)!;
    expect(mergeNotices([a, b, c, d]).map((n) => n.key.split(':')[2])).toEqual(['c', 'b', 'a', 'd']);
  });
});

describe('groupNotices', () => {
  it('folds identical rows into one with a count, keeping every key for hiding', async () => {
    const { groupNotices } = await import('./index');
    const report = (id: string) => levNotice(levItem('wegets', { id, username: 'Asus', nameRaw: 'Server cost', price: 11 }), NOW)!;
    const other = levNotice(levItem('wegets', { id: '9', username: 'Asus', nameRaw: 'Cleaning', price: 11 }), NOW)!;
    const out = groupNotices([report('1'), other, report('2'), report('3')]);
    expect(out.map((n) => n.count ?? 1)).toEqual([3, 1]);
    expect(out[0].groupKeys).toEqual(['lev:wegets:1:v0', 'lev:wegets:2:v0', 'lev:wegets:3:v0']);
  });

  it('never folds something to sign — which one would "approve" sign?', async () => {
    const { groupNotices } = await import('./index');
    const a = wishNotice(wishInput({ id: '70' }), NOW)!;
    const b = { ...a, key: 'wish:71:v0', subject: 'proposal:71' };
    expect(groupNotices([a, b])).toHaveLength(2);
  });
});
