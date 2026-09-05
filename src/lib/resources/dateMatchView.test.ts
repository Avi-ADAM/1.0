import { describe, it, expect } from 'vitest';
import { dateMatchFrom } from './dateMatchView.js';

const request = { sqadualed: '2026-05-01T00:00:00Z', sqadualedf: '2026-06-01T00:00:00Z' };

describe('dateMatchFrom', () => {
  it('says nothing when the offer covers the whole request', () => {
    // A line that states the obvious on every card is noise.
    expect(dateMatchFrom(null, request, { sdate: '2026-01-01', fdate: '2026-12-31' })).toBeNull();
  });

  it('says nothing when there are no request dates to schedule against', () => {
    expect(dateMatchFrom(null, {}, { sdate: '2026-01-01', fdate: '2026-12-31' })).toBeNull();
    expect(dateMatchFrom(null, { sqadualed: '2026-05-01' }, { sdate: '2026-01-01' })).toBeNull();
  });

  it('says nothing when the holder never stated a window — that is not a gap', () => {
    expect(dateMatchFrom(null, request, {})).toBeNull();
    expect(dateMatchFrom(null, request, { sdate: null, fdate: null })).toBeNull();
  });

  it('reports a partial overlap with the days it covers', () => {
    const match = dateMatchFrom(null, request, { sdate: '2026-05-03', fdate: '2026-05-20' });
    expect(match?.kind).toBe('partial');
    expect(match?.days).toBe(17);
    expect(match?.fit).toBeCloseTo(17 / 31, 5);
    expect(match?.offerStart).toBe('2026-05-03T00:00:00.000Z');
  });

  it('reports no overlap at all', () => {
    const match = dateMatchFrom(null, request, { sdate: '2024-01-01', fdate: '2024-06-01' });
    expect(match?.kind).toBe('none');
    expect(match?.days).toBe(0);
    expect(match?.fit).toBe(0);
  });

  it('prefers the fit the matcher stored', () => {
    // The matcher may have considered bookings the card cannot see.
    const match = dateMatchFrom(
      { dateFit: 0.25, offerStart: '2026-05-03', offerEnd: '2026-05-20' },
      request,
      { sdate: '2026-05-03', fdate: '2026-05-20' }
    );
    expect(match?.fit).toBe(0.25);
  });

  it('clamps a nonsense stored fit instead of trusting it', () => {
    const high = dateMatchFrom({ dateFit: 7 }, request, { sdate: '2026-05-03', fdate: '2026-05-20' });
    expect(high).toBeNull(); // clamped to 1 → nothing to say
    const low = dateMatchFrom({ dateFit: -3 }, request, { sdate: '2026-05-03', fdate: '2026-05-20' });
    expect(low?.fit).toBe(0);
  });

  it('an open-ended offer that starts late is still partial', () => {
    const match = dateMatchFrom(null, request, { sdate: '2026-05-20', fdate: null });
    expect(match?.kind).toBe('partial');
    expect(match?.days).toBe(12);
  });

  it('ignores unparseable dates rather than producing NaN', () => {
    expect(dateMatchFrom(null, { sqadualed: 'soon', sqadualedf: 'later' }, { sdate: 'x' })).toBeNull();
  });
});
