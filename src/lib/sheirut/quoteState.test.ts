import { describe, it, expect } from 'vitest';
import {
  buildQuoteState,
  customerCanAccept,
  providerCanApprove,
  sideOf,
  silenceOutcome,
  totalOf
} from './quoteState';

const CUSTOMER = '7';
const GROCER = '3';
const members = [GROCER];

const nego = (id: number, by: string, price: number | null, quant = 1, at = `2026-09-2${id}T10:00:00Z`) => ({
  id,
  attributes: { price, quant, createdAt: at, users_permissions_user: { data: { id: by } } }
});

const request = (price: number | null, negos: any[] = [], quant = 1, votes: any[] = []) => ({
  price,
  quant,
  users_permissions_user: { data: { id: CUSTOMER } },
  sheirutnegos: { data: negos },
  votes: { data: votes }
});

const vote = (by: string, order: number, what = true) => ({
  attributes: { what, order, users_permissions_user: { data: { id: by } } }
});

describe('buildQuoteState', () => {
  it('an open-price request waits for the seller to quote', () => {
    const s = buildQuoteState(request(null), members);
    expect(s).toMatchObject({ order: 0, openPrice: true, turn: 'provider', total: null });
    expect(providerCanApprove(s)).toBe(false);
    expect(customerCanAccept(s)).toBe(false);
  });

  it('a priced request is the rikma’s to approve, as before', () => {
    const s = buildQuoteState(request(20, [], 2), members);
    expect(s).toMatchObject({ order: 0, price: 20, quant: 2, total: 40, turn: 'provider' });
    expect(providerCanApprove(s)).toBe(true);
  });

  it('the seller’s quote hands the turn to the customer', () => {
    const s = buildQuoteState(request(null, [nego(1, GROCER, 85)]), members);
    expect(s).toMatchObject({ order: 1, price: 85, total: 85, lastSide: 'provider', turn: 'customer' });
    expect(customerCanAccept(s)).toBe(true);
    expect(providerCanApprove(s)).toBe(false);
  });

  it('once the customer signs the quote, the rikma finishes it', () => {
    const s = buildQuoteState(
      request(null, [nego(1, GROCER, 85)], 1, [vote(GROCER, 1), vote(CUSTOMER, 1)]),
      members
    );
    expect(s).toMatchObject({ acceptedByCustomer: true, turn: 'provider' });
    expect(customerCanAccept(s)).toBe(false);
    expect(providerCanApprove(s)).toBe(true);
  });

  it('her yes on an older round is not a yes to the new one', () => {
    const s = buildQuoteState(
      request(null, [nego(1, GROCER, 85), nego(2, GROCER, 90)], 1, [vote(CUSTOMER, 1)]),
      members
    );
    expect(s).toMatchObject({ acceptedByCustomer: false, turn: 'customer' });
  });

  it('a counter hands it back; rounds are ordered by time, not by id', () => {
    const s = buildQuoteState(
      request(20, [nego(9, CUSTOMER, 70, 1, '2026-09-24T12:00:00Z'), nego(2, GROCER, 85, 1, '2026-09-24T09:00:00Z')]),
      members
    );
    expect(s.rounds.map((r) => [r.order, r.side, r.price])).toEqual([
      [1, 'provider', 85],
      [2, 'customer', 70]
    ]);
    expect(s).toMatchObject({ order: 2, price: 70, turn: 'provider' });
  });

  it('ignores a round written by someone who is neither side', () => {
    const s = buildQuoteState(request(20, [nego(1, '99', 1)]), members);
    expect(s).toMatchObject({ order: 0, price: 20 });
  });
});

describe('sideOf', () => {
  it('knows the customer, the members and strangers', () => {
    expect(sideOf(CUSTOMER, CUSTOMER, members)).toBe('customer');
    expect(sideOf(GROCER, CUSTOMER, members)).toBe('provider');
    expect(sideOf('99', CUSTOMER, members)).toBeNull();
  });
});

describe('silenceOutcome', () => {
  it('never binds a shop to an order it has not answered', () => {
    expect(silenceOutcome(buildQuoteState(request(20), members), [])).toMatchObject({ action: 'close' });
  });

  it('the seller’s quote stands when the customer stays silent', () => {
    const s = buildQuoteState(request(null, [nego(1, GROCER, 85)]), members);
    expect(silenceOutcome(s, [{ what: true, order: 1, userId: GROCER }])).toEqual({ action: 'mature' });
  });

  it('the customer’s counter stands when the rikma stays silent', () => {
    const s = buildQuoteState(request(null, [nego(1, GROCER, 85), nego(2, CUSTOMER, 75)]), members);
    expect(silenceOutcome(s, [])).toEqual({ action: 'mature' });
  });

  it('an objection to the current round stops it; one to an older round does not', () => {
    const s = buildQuoteState(request(null, [nego(1, GROCER, 85), nego(2, CUSTOMER, 75)]), members);
    expect(silenceOutcome(s, [{ what: false, order: 2, userId: GROCER }]).action).toBe('close');
    expect(silenceOutcome(s, [{ what: false, order: 1, userId: GROCER }]).action).toBe('mature');
  });
});

describe('totalOf', () => {
  it('multiplies and keeps an open price open', () => {
    expect(totalOf(12.5, 3)).toBe(37.5);
    expect(totalOf(null, 3)).toBeNull();
  });
});

import { openingPrice, plainExcerpt } from './quoteState';

describe('openingPrice', () => {
  it('a fixed product opens at its price', () => {
    expect(openingPrice({ price: 20, pricingMode: 'fixed', budget: 100 })).toBe(20);
  });
  it('a quote product opens at her budget, or open', () => {
    expect(openingPrice({ price: 20, pricingMode: 'quote', budget: 100 })).toBe(100);
    expect(openingPrice({ price: 20, pricingMode: 'quote', budget: 0 })).toBeNull();
    expect(openingPrice({ price: null, budget: null })).toBeNull();
  });
});

describe('plainExcerpt', () => {
  it('keeps lines and drops tags', () => {
    expect(plainExcerpt('<p>2 קולה</p><p>גבינה צהובה&nbsp;200 גר׳</p>')).toBe('2 קולה\nגבינה צהובה 200 גר׳');
  });
});
