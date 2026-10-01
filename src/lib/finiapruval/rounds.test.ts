import { describe, expect, it } from 'vitest';
import {
  allSigned,
  counterHistory,
  encodeCounter,
  hasAnswered,
  hasSigned,
  parseCounter,
  refuseCounter,
  standingOrder,
  standingVotes,
  voterId
} from './rounds.js';

const strapi = (id: string, what: boolean, order?: number | null, why?: string) => ({
  what,
  order,
  why,
  users_permissions_user: { data: { id } }
});
const flat = (id: string, what: boolean, order?: number) => ({ what, order, users_permissions_user: id });

describe('who voted, in either shape', () => {
  it('reads a Strapi relation, a bare id and a flattened id', () => {
    expect(voterId(strapi('7', true))).toBe('7');
    expect(voterId(flat('8', true))).toBe('8');
    expect(voterId({ what: true, userId: 9 })).toBe('9');
    expect(voterId({ what: true })).toBeNull();
  });
});

describe('rounds — a vote with no order is round 0', () => {
  it('every vote that predates rounds stands at round 0', () => {
    const vots = [strapi('1', true), strapi('2', true, null)];
    expect(standingOrder(vots)).toBe(0);
    expect(standingVotes(vots)).toHaveLength(2);
  });

  it('the claim is on the highest round any vote has reached', () => {
    expect(standingOrder([strapi('1', true, 0), strapi('2', true, 2), strapi('3', true, 1)])).toBe(2);
    expect(standingOrder([])).toBe(0);
    expect(standingOrder(null)).toBe(0);
  });

  it('only the standing round counts — signatures on an older version are history', () => {
    const vots = [strapi('1', true, 0), strapi('2', true, 0), strapi('2', true, 1, '⇄ 5→3 | not that much')];
    expect(standingVotes(vots).map(voterId)).toEqual(['2']);
    // 1 signed the old version; the new one is not theirs yet
    expect(hasSigned(vots, '1')).toBe(false);
    expect(hasSigned(vots, '2')).toBe(true);
  });

  it('a member who voted twice on a round is read by their latest vote', () => {
    const vots = [strapi('1', false, 0), strapi('1', true, 0)];
    expect(standingVotes(vots)).toHaveLength(1);
    expect(hasSigned(vots, '1')).toBe(true);
  });
});

describe('allSigned — the version on the table, signed by everyone', () => {
  const members = ['1', '2', '3'];

  it('needs every current member, not just a head count', () => {
    expect(allSigned([strapi('1', true), strapi('2', true)], members)).toBe(false);
    expect(allSigned([strapi('1', true), strapi('2', true), strapi('3', true)], members)).toBe(true);
    // three yes votes, but one is not a member of the rikma
    expect(allSigned([strapi('1', true), strapi('2', true), strapi('9', true)], members)).toBe(false);
  });

  it('a counter sends the claim back: the old signatures no longer count', () => {
    const vots = [
      strapi('1', true, 0),
      strapi('2', true, 0),
      strapi('3', true, 0),
      strapi('3', true, 1, encodeCounter({ from: 5, to: 3, note: 'only three hours' }))
    ];
    expect(allSigned(vots, members)).toBe(false);
    // 1 and 2 sign the new version → it matures
    expect(allSigned([...vots, strapi('1', true, 1), strapi('2', true, 1)], members)).toBe(true);
  });

  it('a legacy "no" at the standing round still blocks silence — a counter on top is the way out', () => {
    const veto = [strapi('1', true, 0), strapi('2', false, 0), strapi('3', true, 0)];
    expect(allSigned(veto, members)).toBe(false);
    expect(hasAnswered(veto, '2')).toBe(true);
    const answered = [...veto, strapi('2', true, 1, encodeCounter({ from: 5, to: 4, note: 'four is fair' }))];
    expect(standingOrder(answered)).toBe(1);
    expect(hasSigned(answered, '1')).toBe(false); // everyone else is asked again
  });

  it('nobody to sign is not "all signed"', () => {
    expect(allSigned([], [])).toBe(false);
  });
});

describe('what a counter says', () => {
  it('round-trips through the vote’s reason, readable as plain text too', () => {
    const why = encodeCounter({ from: 5, to: 2.5, note: '  the second visit was a call, not work  ' });
    expect(why).toBe('⇄ 5→2.5 | the second visit was a call, not work');
    expect(parseCounter(why)).toEqual({ from: 5, to: 2.5, note: 'the second visit was a call, not work' });
  });

  it('keeps a multi-line reason whole, and an ordinary reason is not a counter', () => {
    expect(parseCounter(encodeCounter({ from: 1, to: 0, note: 'line one\nline two' }))?.note).toBe('line one\nline two');
    expect(parseCounter('this is just a comment')).toBeNull();
    expect(parseCounter(null)).toBeNull();
  });

  it('reads the negotiation back, oldest first', () => {
    const vots = [
      strapi('1', true, 0),
      strapi('3', true, 2, encodeCounter({ from: 3, to: 4, note: 'then four, meet me' })),
      strapi('2', true, 1, encodeCounter({ from: 5, to: 3, note: 'three is what I saw' }))
    ];
    expect(counterHistory(vots).map((c) => [c.round, c.userId, c.from, c.to])).toEqual([
      [1, '2', 5, 3],
      [2, '3', 3, 4]
    ]);
  });
});

describe('refuseCounter — a counter is a version, not a veto', () => {
  it('needs a real number of hours', () => {
    for (const bad of ['', null, undefined, 'abc', -1, 1001, NaN]) {
      expect(refuseCounter(5, bad, 'a good enough reason')).toBe('hours');
    }
  });

  it('zero is allowed — "I do not credit these hours" is a counter, not a no', () => {
    expect(refuseCounter(5, 0, 'none of it was done')).toBeNull();
  });

  it('must actually change something', () => {
    expect(refuseCounter(5, 5, 'a good enough reason')).toBe('same');
    expect(refuseCounter(5, '5.0000001', 'a good enough reason')).toBe('same');
  });

  it('must say why — a bare number is a veto in disguise', () => {
    expect(refuseCounter(5, 3, '')).toBe('note');
    expect(refuseCounter(5, 3, 'no')).toBe('note');
    expect(refuseCounter(5, 3, 'three is what I saw')).toBeNull();
  });
});
