import { describe, expect, it } from 'vitest';
import { stageOf, stageOfOrder, stageOfProposal, syncedStatus } from './stage';

describe('stageOfOrder', () => {
  it('reads an offer, money, and silence', () => {
    for (const s of ['sent', 'seen', 'priced', 'accepted', 'pendingPayment']) expect(stageOfOrder(s)).toBe('offered');
    for (const s of ['paid', 'shipped', 'fulfilled']) expect(stageOfOrder(s)).toBe('won');
    expect(stageOfOrder('cancelled')).toBeNull();
    expect(stageOfOrder(null)).toBeNull();
  });
});

describe('stageOf', () => {
  it('is the lead’s own status while nothing is linked', () => {
    expect(stageOf({ status: 'talking' })).toBe('talking');
    expect(stageOf({})).toBe('new');
  });

  it('an open order makes it offered; money makes it won', () => {
    expect(stageOf({ status: 'talking' }, { orderStatuses: ['sent'] })).toBe('offered');
    expect(stageOf({ status: 'offered' }, { orderStatuses: ['sent', 'paid'] })).toBe('won');
    expect(stageOf({ status: 'new' }, { saleCount: 1 })).toBe('won');
  });

  it('money beats a pause, an open offer does not', () => {
    expect(stageOf({ status: 'paused' }, { orderStatuses: ['paid'] })).toBe('won');
    expect(stageOf({ status: 'paused' }, { orderStatuses: ['sent'] })).toBe('paused');
  });

  it('a cancelled order sends an offered or won lead back to talking', () => {
    expect(stageOf({ status: 'offered' }, { orderStatuses: ['cancelled'] })).toBe('talking');
    expect(stageOf({ status: 'won' }, { orderStatuses: ['cancelled'] })).toBe('talking');
  });
});

describe('syncedStatus', () => {
  it('writes only moves into or out of offered/won', () => {
    expect(syncedStatus({ status: 'talking' }, { orderStatuses: ['sent'] })).toBe('offered');
    expect(syncedStatus({ status: 'offered' }, { orderStatuses: ['paid'] })).toBe('won');
    expect(syncedStatus({ status: 'offered' }, { orderStatuses: ['cancelled'] })).toBe('talking');
    expect(syncedStatus({ status: 'won' }, { orderStatuses: ['paid'] })).toBeNull();
    expect(syncedStatus({ status: 'talking' }, {})).toBeNull();
  });
});

describe('stageOfProposal', () => {
  it('walks a wish proposal along the same path', () => {
    expect(stageOfProposal({ status: 'suggested' })).toEqual({ stage: 'new' });
    expect(stageOfProposal({ status: 'viewed', hasConversation: true })).toEqual({ stage: 'talking' });
    expect(stageOfProposal({ status: 'viewed', hasPrice: true })).toEqual({ stage: 'offered' });
    expect(stageOfProposal({ status: 'accepted' })).toEqual({ stage: 'offered' });
    expect(stageOfProposal({ status: 'accepted', hasSale: true })).toEqual({ stage: 'won' });
  });

  it('stopped is paused with a reason, never lost', () => {
    expect(stageOfProposal({ status: 'expired' })).toEqual({ stage: 'paused', pausedReason: 'timing' });
    expect(stageOfProposal({ status: 'rejected' })).toEqual({ stage: 'paused', pausedReason: 'choseOther' });
    expect(stageOfProposal({ status: 'viewed', hiddenByWisher: true })).toEqual({ stage: 'paused', pausedReason: 'choseOther' });
  });
});
