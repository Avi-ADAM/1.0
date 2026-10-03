import { describe, expect, it } from 'vitest';
import {
  entryUserId,
  isTurnOf,
  otherParty,
  partyOf,
  refuseCounter,
  resolveVersion,
  sameVersion,
  standing,
  type ProposalRef,
  type WillingnessEntry
} from './proposalRounds.js';

const WISHER = '10';
const PROVIDER = '20';

const invited: ProposalRef = { proposerIds: [PROVIDER], wisherIds: [WISHER], openedBy: 'wisher' };
const volunteered: ProposalRef = { proposerIds: [PROVIDER], wisherIds: [WISHER], openedBy: 'provider' };

/** A counter: "not that one — here is mine" (agree:false). */
const counter = (user: string, hours: number, amount: number, note = '', at?: string): WillingnessEntry => ({
  user: { data: { id: user } },
  agree: false,
  willingHours: hours,
  willingAmount: amount,
  note,
  submittedAt: at
});
/** An approval of what stands (agree:true — what acceptWishOffer has always written). */
const approve = (user: string, hours: number | null, amount: number | null): WillingnessEntry => ({
  user: { data: { id: user } },
  agree: true,
  willingHours: hours,
  willingAmount: amount
});

const V = (amount: number | null, price: number | null) => ({ amount, price });

describe('who is who', () => {
  it('reads the author of an entry in any shape', () => {
    expect(entryUserId({ user: { data: { id: 7 } } })).toBe('7');
    expect(entryUserId({ user: { id: '8' } })).toBe('8');
    expect(entryUserId({ user: '9' })).toBe('9');
    expect(entryUserId({})).toBeNull();
  });

  it('knows the two parties — and a stranger', () => {
    expect(partyOf(invited, WISHER)).toBe('wisher');
    expect(partyOf(invited, PROVIDER)).toBe('provider');
    expect(partyOf(invited, '99')).toBeNull();
    expect(otherParty('wisher')).toBe('provider');
  });
});

describe('standing — where the negotiation is', () => {
  it('with no entries the first version stands, signed by whoever opened the proposal', () => {
    const inv = standing(invited, [], V(4, 600));
    expect(inv).toMatchObject({ signedBy: 'wisher', round: 0, counters: [] });
    expect(inv.version).toEqual(V(4, 600));
    expect(standing(volunteered, [], V(4, 600)).signedBy).toBe('provider');
  });

  it('a counter hands the turn to the other side', () => {
    // the proposal now carries the counter's version — a counter rewrites it
    const s = standing(invited, [counter(PROVIDER, 6, 680, 'the table needs two more hours')], V(6, 680));
    expect(s.version).toEqual(V(6, 680));
    expect(s.signedBy).toBe('provider');
    expect(s.round).toBe(1);
    expect(s.counters[0]).toMatchObject({ round: 1, by: 'provider', note: 'the table needs two more hours' });
    expect(s.counters[0].version).toEqual(V(6, 680));
    expect(isTurnOf('wisher', s)).toBe(true);
    expect(isTurnOf('provider', s)).toBe(false);
  });

  it('ping-pong: each side counters in turn, the rounds count up', () => {
    const s = standing(
      invited,
      [
        counter(PROVIDER, 6, 680, 'two more hours'),
        counter(WISHER, 5, 640, 'five is what the budget allows'),
        counter(PROVIDER, 5, 660, 'meet me at 660')
      ],
      V(5, 660)
    );
    expect(s.round).toBe(3);
    expect(s.counters.map((c) => [c.round, c.by])).toEqual([[1, 'provider'], [2, 'wisher'], [3, 'provider']]);
    expect(isTurnOf('wisher', s)).toBe(true);
  });

  it('an approval is a signature, not a counter — the round count does not move, the turn does', () => {
    const s = standing(
      invited,
      [counter(PROVIDER, 6, 680, 'two more hours'), approve(WISHER, 6, 680)],
      V(6, 680)
    );
    expect(s.round).toBe(1);
    expect(s.signedBy).toBe('wisher');
    expect(isTurnOf('provider', s)).toBe(true);
  });

  it('an approval with no numbers (a resource nobody priced) still signs', () => {
    const s = standing(invited, [approve(PROVIDER, null, null)], V(null, null));
    expect(s.signedBy).toBe('provider');
    expect(s.round).toBe(0);
  });

  it('an entry from a stranger signs nothing', () => {
    const s = standing(invited, [counter('99', 9, 999, 'who am I')], V(4, 600));
    expect(s).toMatchObject({ round: 0, signedBy: 'wisher' });
  });

  it('reads the log in the order it was written, with submission time only breaking ties', () => {
    const s = standing(
      invited,
      [
        counter(WISHER, 5, 640, 'later', '2026-10-02T10:00:00.000Z'),
        counter(PROVIDER, 6, 680, 'earlier', '2026-10-02T09:00:00.000Z')
      ],
      V(5, 640)
    );
    expect(s.counters.map((c) => c.note)).toEqual(['earlier', 'later']);
    expect(s.signedBy).toBe('wisher');
  });

  it('compares versions with a tolerance for float noise', () => {
    expect(sameVersion(V(0.1 + 0.2, 100), V(0.3, 100))).toBe(true);
    expect(sameVersion(V(2, 100), V(2, 101))).toBe(false);
  });
});

describe('refuseCounter — a counter is a version you could sign, not a veto', () => {
  const cur = V(4, 600);

  it('must change something', () => {
    expect(refuseCounter(cur, { amount: 4, price: 600 }, 'a good enough reason')).toBe('same');
    expect(refuseCounter(cur, {}, 'a good enough reason')).toBe('same');
  });

  it('may change just the price, or just the hours', () => {
    expect(refuseCounter(cur, { price: 680 }, 'the materials cost more')).toBeNull();
    expect(refuseCounter(cur, { amount: 6 }, 'it takes longer than that')).toBeNull();
  });

  it('refuses nonsense numbers', () => {
    for (const bad of [-1, 'abc', NaN, 1e9, '']) {
      expect(refuseCounter(cur, { amount: bad }, 'a good enough reason')).toBe('amount');
      expect(refuseCounter(cur, { price: bad }, 'a good enough reason')).toBe('price');
    }
  });

  it('zero is a version — "free" — not a veto', () => {
    expect(refuseCounter(cur, { price: 0 }, 'happy to do it as a gift')).toBeNull();
  });

  it('must say why — a bare number is a veto in disguise', () => {
    expect(refuseCounter(cur, { price: 680 }, '')).toBe('note');
    expect(refuseCounter(cur, { price: 680 }, 'no')).toBe('note');
  });

  it('resolves omitted numbers against the standing version', () => {
    expect(resolveVersion(cur, { price: 680 })).toEqual(V(4, 680));
    expect(resolveVersion(cur, { amount: 6, price: '700' })).toEqual(V(6, 700));
  });
});
