import { describe, expect, it } from 'vitest';
import {
  chainFromRatson,
  chainFromSheirut,
  chainFromSheirutpend,
  chainOf,
  dealStages,
  type DealChain
} from './dealChain';

const rel = (id: string | number, attributes: any = {}) => ({ data: { id: String(id), attributes } });
const many = (...nodes: any[]) => ({ data: nodes });

describe('chainFromSheirut (qid 428)', () => {
  it('finds the wish through source_proposals first', () => {
    const chain = chainFromSheirut({
      sheirut: rel(7, {
        moneyTransfered: false,
        sheirutpend: rel(3),
        source_proposals: many({ id: '11' }),
        matanot: rel(5, { ratson: rel(99) })
      })
    });
    expect(chain).toEqual({ wishId: '11', requests: [{ id: '3', dealId: '7' }], deals: [{ id: '7', closed: false }] });
  });

  it("falls back to the wish whose composed product the deal sells (materializeWish)", () => {
    const chain = chainFromSheirut({
      sheirut: rel(7, { moneyTransfered: true, sheirutpend: rel(3), source_proposals: many(), matanot: rel(5, { ratson: rel(12) }) })
    });
    expect(chain?.wishId).toBe('12');
    expect(chain?.deals).toEqual([{ id: '7', closed: true }]);
  });

  it('a catalogue deal has no wish', () => {
    const chain = chainFromSheirut({ sheirut: rel(7, { sheirutpend: rel(3), matanot: rel(5, { ratson: { data: null } }) }) });
    expect(chain?.wishId).toBeNull();
  });

  it('null when the deal cannot be read', () => {
    expect(chainFromSheirut({ sheirut: { data: null } })).toBeNull();
    expect(chainFromSheirut(undefined)).toBeNull();
  });
});

describe('chainFromSheirutpend (qid 429)', () => {
  it('reads the wish from the proposal, and the deal it became', () => {
    const chain = chainFromSheirutpend({
      sheirutpend: rel(3, {
        sheirut: rel(7, { moneyTransfered: false }),
        ratson_proposal: rel(40, { ratson: rel(11) }),
        matanots: many()
      })
    });
    expect(chain).toEqual({ wishId: '11', requests: [{ id: '3', dealId: '7' }], deals: [{ id: '7', closed: false }] });
  });

  it('a request still waiting has no deal', () => {
    const chain = chainFromSheirutpend({
      sheirutpend: rel(3, { sheirut: { data: null }, ratson_proposal: { data: null }, matanots: many({ id: '5', attributes: { ratson: rel(12) } }) })
    });
    expect(chain).toEqual({ wishId: '12', requests: [{ id: '3', dealId: null }], deals: [] });
  });
});

describe('chainFromRatson (qid 430)', () => {
  it('collects every request and deal once, from the composed product and the proposals', () => {
    const sp = (id: number, dealId?: number, paid = false) =>
      ({ id: String(id), attributes: { sheirut: dealId ? rel(dealId, { moneyTransfered: paid }) : { data: null } } });
    const chain = chainFromRatson({
      ratson: rel(11, {
        sheiruts: many({ id: '7', attributes: { moneyTransfered: false } }),
        derivedComplexMatanot: rel(5, { sheirutpends: many(sp(3, 7)) }),
        ratson_proposals: many(
          { id: '40', attributes: { sheirutpends: many(sp(3, 7), sp(4)) } },
          { id: '41', attributes: { sheirutpends: many(sp(6, 8, true)) } }
        )
      })
    });
    expect(chain).toEqual({
      wishId: '11',
      requests: [
        { id: '3', dealId: '7' },
        { id: '4', dealId: null },
        { id: '6', dealId: '8' }
      ],
      deals: [
        { id: '7', closed: false },
        { id: '8', closed: true }
      ]
    });
  });

  it('a wish still being shaped is a chain of one', () => {
    expect(chainFromRatson({ ratson: rel(11, {}) })).toEqual({ wishId: '11', requests: [], deals: [] });
  });
});

describe('dealStages', () => {
  const brief = (chain: DealChain, at: Parameters<typeof dealStages>[1]) =>
    dealStages(chain, at).map((s) => `${s.key}:${s.here ? 'here' : s.reached ? 'reached' : 'next'}${s.active ? '*' : ''}${s.href ? `>${s.href}` : ''}`);

  it('a wish still being shaped: only the wish is reached', () => {
    expect(brief(chainOf({ kind: 'wish', id: '11' }), { kind: 'wish', id: '11' })).toEqual([
      'wish:here*',
      'request:next',
      'deal:next',
      'closed:next'
    ]);
  });

  it('from the wish page, a deal that exists is one tap away', () => {
    const chain: DealChain = { wishId: '11', requests: [{ id: '3', dealId: '7' }], deals: [{ id: '7', closed: false }] };
    expect(brief(chain, { kind: 'wish', id: '11' })).toEqual([
      'wish:here',
      'request:reached>/deals/request/3',
      'deal:reached*>/deals/7',
      'closed:next'
    ]);
  });

  it('from the deal page, back to the wish and the request', () => {
    const chain: DealChain = { wishId: '11', requests: [{ id: '3', dealId: '7' }], deals: [{ id: '7', closed: false }] };
    expect(brief(chain, { kind: 'deal', id: '7' })).toEqual([
      'wish:reached>/concierge/11',
      'request:reached>/deals/request/3',
      'deal:here*',
      'closed:next'
    ]);
  });

  it('a paid deal is closed, and its own page is not linked to itself', () => {
    const chain: DealChain = { wishId: null, requests: [{ id: '3', dealId: '7' }], deals: [{ id: '7', closed: true }] };
    expect(brief(chain, { kind: 'deal', id: '7' })).toEqual([
      'request:reached>/deals/request/3',
      'deal:reached',
      'closed:here*'
    ]);
  });

  it('a catalogue request has no wish stage', () => {
    expect(brief(chainOf({ kind: 'request', id: '3' }), { kind: 'request', id: '3' })).toEqual([
      'request:here*',
      'deal:next',
      'closed:next'
    ]);
  });

  it('several deals from one wish open the deals list, with the count', () => {
    const chain: DealChain = {
      wishId: '11',
      requests: [
        { id: '3', dealId: '7' },
        { id: '4', dealId: '8' }
      ],
      deals: [
        { id: '7', closed: false },
        { id: '8', closed: true }
      ]
    };
    const stages = dealStages(chain, { kind: 'wish', id: '11' });
    expect(stages.find((s) => s.key === 'deal')).toMatchObject({ count: 2, href: '/deals', active: true });
    // Closed only when every deal is.
    expect(stages.find((s) => s.key === 'closed')).toMatchObject({ reached: false, count: 0 });
  });

  it('a deal implies the stages before it, even when the request could not be read', () => {
    const chain: DealChain = { wishId: '11', requests: [], deals: [{ id: '7', closed: false }] };
    const stages = dealStages(chain, { kind: 'deal', id: '7' });
    expect(stages.find((s) => s.key === 'request')).toMatchObject({ reached: true, href: null });
  });
});
