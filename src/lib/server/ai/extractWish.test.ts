import { describe, expect, it, vi } from 'vitest';

vi.mock('./conciergeAgent', () => ({ getConciergeAgent: vi.fn() }));

import { normDetails, EMPTY_DETAILS } from './extractWish';

const TODAY = '2026-09-24';

describe('normDetails', () => {
  it('is empty for junk', () => {
    expect(normDetails(null, TODAY)).toEqual(EMPTY_DETAILS);
    expect(normDetails('nope', TODAY)).toEqual(EMPTY_DETAILS);
  });

  it('keeps a stated single day on both ends', () => {
    const d = normDetails({ dateFrom: '2026-10-02' }, TODAY);
    expect([d.dateFrom, d.dateTo]).toEqual(['2026-10-02', '2026-10-02']);
  });

  it('drops days that do not exist', () => {
    expect(normDetails({ dateFrom: '2026-02-30' }, TODAY).dateFrom).toBe('');
    expect(normDetails({ dateFrom: 'next friday' }, TODAY).dateFrom).toBe('');
  });

  it('moves a finished period to next year', () => {
    const d = normDetails({ dateFrom: '2026-03-01', dateTo: '2026-03-31' }, TODAY);
    expect([d.dateFrom, d.dateTo]).toEqual(['2027-03-01', '2027-03-31']);
  });

  it('keeps a period that is still running', () => {
    const d = normDetails({ dateFrom: '2026-09-01', dateTo: '2026-09-30' }, TODAY);
    expect([d.dateFrom, d.dateTo]).toEqual(['2026-09-01', '2026-09-30']);
  });

  it('swaps a reversed range', () => {
    const d = normDetails({ dateFrom: '2026-12-10', dateTo: '2026-12-01' }, TODAY);
    expect([d.dateFrom, d.dateTo]).toEqual(['2026-12-01', '2026-12-10']);
  });

  it('reads a budget and only keeps a currency with an amount', () => {
    expect(normDetails({ budget: '3,000', currency: 'ils' }, TODAY)).toMatchObject({
      budget: 3000,
      currency: 'ILS'
    });
    expect(normDetails({ budget: null, currency: 'USD' }, TODAY)).toMatchObject({
      budget: null,
      currency: ''
    });
    expect(normDetails({ budget: -5 }, TODAY).budget).toBeNull();
  });

  it('accepts only known group kinds and a real boolean for online', () => {
    expect(normDetails({ groupKind: 'group_purchase' }, TODAY).groupKind).toBe('group_purchase');
    expect(normDetails({ groupKind: 'solo' }, TODAY).groupKind).toBe('');
    expect(normDetails({ online: 'yes' }, TODAY).online).toBeNull();
    expect(normDetails({ online: false }, TODAY).online).toBe(false);
  });
});
