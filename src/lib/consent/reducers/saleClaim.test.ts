import { describe, it, expect } from 'vitest';
import { project } from '../projection';
import type { ConsentEvent } from '../event';

function ev(p: Partial<ConsentEvent> & { id: string; action: string }): ConsentEvent {
  return {
    v: 1,
    id: p.id,
    actor: p.actor ?? 'A',
    device: 'd',
    action: p.action as ConsentEvent['action'],
    subject: p.subject ?? { type: 'sale', id: 's1' },
    predicate: p.predicate,
    parents: p.parents ?? [],
    ts: p.ts ?? 0,
    nonce: 'n',
    sig: 's'
  } as ConsentEvent;
}

describe('sale.record reducer', () => {
  it('self-report is final immediately (status:self, no saleClaim opened)', () => {
    const state = project([
      ev({ id: 'r1', actor: 'A', action: 'sale.record',
        subject: { type: 'sale', id: 's1' },
        predicate: { holder: 'A', total: 500, quantity: 1, holderStatus: 'self', order: 1 }, ts: 1 })
    ]);
    expect(state.sales.get('s1')).toMatchObject({ status: 'self', reporterId: 'A', holderId: 'A' });
    expect(state.saleClaims.size).toBe(0);
  });

  it('other-holder report opens a saleClaim at round 1 with the reporter already signed', () => {
    const state = project([
      ev({ id: 'r1', actor: 'A', action: 'sale.record',
        subject: { type: 'sale', id: 's1' },
        predicate: { holder: 'B', total: 3500, quantity: 7, holderStatus: 'open', decisionId: 'd1', order: 1 }, ts: 1 })
    ]);
    expect(state.sales.get('s1')).toMatchObject({ status: 'open', decisionId: 'd1', reporterId: 'A', holderId: 'B' });
    const claim = state.saleClaims.get('d1');
    expect(claim).toMatchObject({ saleId: 's1', holderId: 'B', reporterId: 'A', standingOrder: 1 });
    expect(claim?.signers.has('A')).toBe(true);
    expect(claim?.signers.has('B')).toBe(false);
  });
});

describe('saleClaim mutual-vote maturation (decision.vote)', () => {
  const openEvent = ev({ id: 'r1', actor: 'A', action: 'sale.record',
    subject: { type: 'sale', id: 's1' },
    predicate: { holder: 'B', total: 3500, quantity: 7, holderStatus: 'open', decisionId: 'd1', order: 1 }, ts: 1 });

  it('the reporter alone (via the report itself) is not enough — stays open', () => {
    const state = project([openEvent]);
    expect(state.sales.get('s1')?.status).toBe('open');
    expect(state.saleClaims.get('d1')?.signers.has('A')).toBe(true);
    expect(state.saleClaims.get('d1')?.signers.has('B')).toBe(false);
  });

  it('mutual sign on round 1 matures the claim (confirmedBy:vote)', () => {
    const state = project([
      openEvent,
      ev({ id: 'v1', actor: 'B', action: 'decision.vote',
        subject: { type: 'decision', id: 'd1' },
        predicate: { what: true, order: 1 }, parents: ['r1'], ts: 2 })
    ]);
    expect(state.sales.get('s1')).toMatchObject({ status: 'confirmed', confirmedBy: 'vote' });
    expect(state.saleClaims.get('d1')?.closed).toMatchObject({ by: 'vote' });
  });

  it('a vote on a stale (superseded) round is ignored', () => {
    const state = project([
      openEvent,
      ev({ id: 'c1', actor: 'B', action: 'proposal.counter',
        subject: { type: 'decision', id: 'd1' },
        predicate: { order: 2, newValues: { hm: 5, price: 500 } }, parents: ['r1'], ts: 2 }),
      // A tries to sign round 1 after B already moved the standing round to 2.
      ev({ id: 'v1', actor: 'A', action: 'decision.vote',
        subject: { type: 'decision', id: 'd1' },
        predicate: { what: true, order: 1 }, parents: ['c1'], ts: 3 })
    ]);
    expect(state.sales.get('s1')?.status).toBe('open'); // still open — A's vote was stale
  });

  it('decision.vote on an untracked (non-saleClaim) decision is a no-op', () => {
    const state = project([
      ev({ id: 'v1', actor: 'A', action: 'decision.vote',
        subject: { type: 'decision', id: 'pic1' },
        predicate: { what: true, order: 0 }, ts: 1 })
    ]);
    expect(state.saleClaims.size).toBe(0);
    expect(state.sales.size).toBe(0);
  });
});

describe('saleClaim negotiation ping-pong (proposal.counter)', () => {
  const openEvent = ev({ id: 'r1', actor: 'A', action: 'sale.record',
    subject: { type: 'sale', id: 's1' },
    predicate: { holder: 'B', total: 3500, quantity: 7, holderStatus: 'open', decisionId: 'd1', order: 1 }, ts: 1 });

  it('a counter bumps the standing round and resets signers to the proposer', () => {
    const state = project([
      openEvent,
      ev({ id: 'c1', actor: 'B', action: 'proposal.counter',
        subject: { type: 'decision', id: 'd1' },
        predicate: { order: 2, newValues: { hm: 5, price: 500 } }, parents: ['r1'], ts: 2 })
    ]);
    const claim = state.saleClaims.get('d1');
    expect(claim?.standingOrder).toBe(2);
    expect(claim?.signers.has('B')).toBe(true);
    expect(claim?.signers.has('A')).toBe(false); // A must re-sign the new round
  });

  it('full ping-pong: A reports, B counters to 5 units, A agrees → confirmed', () => {
    const state = project([
      openEvent,
      ev({ id: 'c1', actor: 'B', action: 'proposal.counter',
        subject: { type: 'decision', id: 'd1' },
        predicate: { order: 2, newValues: { hm: 5, price: 500 } }, parents: ['r1'], ts: 2 }),
      ev({ id: 'v1', actor: 'A', action: 'decision.vote',
        subject: { type: 'decision', id: 'd1' },
        predicate: { what: true, order: 2 }, parents: ['c1'], ts: 3 })
    ]);
    expect(state.sales.get('s1')).toMatchObject({ status: 'confirmed', confirmedBy: 'vote' });
    expect(state.saleClaims.get('d1')?.standingOrder).toBe(2);
  });

  it('"I received nothing" is a counter to 0, not a rejection — still matures via the same mechanism', () => {
    const state = project([
      openEvent,
      ev({ id: 'c1', actor: 'B', action: 'proposal.counter',
        subject: { type: 'decision', id: 'd1' },
        predicate: { order: 2, newValues: { hm: 0, price: 0 } }, parents: ['r1'], ts: 2 }),
      ev({ id: 'v1', actor: 'A', action: 'decision.vote',
        subject: { type: 'decision', id: 'd1' },
        predicate: { what: true, order: 2 }, parents: ['c1'], ts: 3 })
    ]);
    expect(state.sales.get('s1')?.status).toBe('confirmed');
  });
});

describe('saleClaim silence-as-consent (consensus.timeout)', () => {
  const openEvent = ev({ id: 'r1', actor: 'A', action: 'sale.record',
    subject: { type: 'sale', id: 's1' },
    predicate: { holder: 'B', total: 3500, quantity: 7, holderStatus: 'open', decisionId: 'd1', order: 1 }, ts: 1 });

  it('matures the standing round on silence (confirmedBy:timeout)', () => {
    const state = project([
      openEvent,
      ev({ id: 't1', actor: 'A', action: 'consensus.timeout',
        subject: { type: 'decision', id: 'd1' },
        predicate: { closingRound: 1, decision: 'approve' }, parents: ['r1'], ts: 100 })
    ]);
    expect(state.sales.get('s1')).toMatchObject({ status: 'confirmed', confirmedBy: 'timeout' });
    expect(state.saleClaims.get('d1')?.closed).toMatchObject({ by: 'timeout' });
  });

  it('a stale timeout (round already advanced by a counter) is ignored', () => {
    const state = project([
      openEvent,
      ev({ id: 'c1', actor: 'B', action: 'proposal.counter',
        subject: { type: 'decision', id: 'd1' },
        predicate: { order: 2, newValues: { hm: 5, price: 500 } }, parents: ['r1'], ts: 2 }),
      // A stale timeout for round 1 arrives after B already countered to round 2.
      ev({ id: 't1', actor: 'A', action: 'consensus.timeout',
        subject: { type: 'decision', id: 'd1' },
        predicate: { closingRound: 1, decision: 'approve' }, parents: ['r1'], ts: 100 })
    ]);
    expect(state.sales.get('s1')?.status).toBe('open'); // still open on round 2
  });

  it('a timeout does not re-close an already vote-confirmed claim', () => {
    const state = project([
      openEvent,
      ev({ id: 'v1', actor: 'B', action: 'decision.vote',
        subject: { type: 'decision', id: 'd1' },
        predicate: { what: true, order: 1 }, parents: ['r1'], ts: 2 }),
      ev({ id: 't1', actor: 'A', action: 'consensus.timeout',
        subject: { type: 'decision', id: 'd1' },
        predicate: { closingRound: 1, decision: 'approve' }, parents: ['v1'], ts: 100 })
    ]);
    expect(state.sales.get('s1')?.confirmedBy).toBe('vote'); // unchanged — vote won the race
  });
});
