import { describe, it, expect } from 'vitest';
import {
  computeHeadcount,
  effectOfAcceptance,
  holdsSeat,
  normalizeNeed
} from './headcount';

/** A Strapi-shaped mission-in-progress row. */
const mb = (lifecycle: string | null, finnished = false) => ({
  id: '1',
  attributes: { lifecycle, finnished }
});

/** A Strapi-shaped candidacy row. */
const ask = (archived: boolean) => ({ id: '1', attributes: { archived } });

describe('normalizeNeed', () => {
  it('treats an unset howMeny as one person', () => {
    expect(normalizeNeed(null)).toBe(1);
    expect(normalizeNeed(undefined)).toBe(1);
  });

  it('parses the biginteger string Strapi actually sends', () => {
    expect(normalizeNeed('5')).toBe(5);
    expect(normalizeNeed(5n)).toBe(5);
  });

  it('never goes below one, whatever was stored', () => {
    expect(normalizeNeed(0)).toBe(1);
    expect(normalizeNeed(-3)).toBe(1);
    expect(normalizeNeed('not a number')).toBe(1);
  });

  it('floors a fractional value rather than rounding a seat up', () => {
    expect(normalizeNeed(2.9)).toBe(2);
  });
});

describe('holdsSeat', () => {
  it('counts a legacy row with no lifecycle as active', () => {
    // The whole point of rule 2: every pre-archival mission has lifecycle null,
    // and dropping those would report the entire platform as unstaffed.
    expect(holdsSeat({ lifecycle: null })).toBe(true);
    expect(holdsSeat({})).toBe(true);
  });

  it('counts archiveProposed — the removal has only been proposed', () => {
    expect(holdsSeat({ lifecycle: 'archiveProposed' })).toBe(true);
  });

  it('releases the seat once the object is archived or released', () => {
    expect(holdsSeat({ lifecycle: 'archived' })).toBe(false);
    expect(holdsSeat({ lifecycle: 'released' })).toBe(false);
  });

  it('releases the seat when the mission is finished', () => {
    expect(holdsSeat({ lifecycle: 'active', finnished: true })).toBe(false);
  });
});

describe('computeHeadcount', () => {
  it('reports an untouched five-person mission as empty', () => {
    const v = computeHeadcount({ howMeny: '5', mesimabetahaliches: { data: [] }, asks: { data: [] } });
    expect(v).toMatchObject({ need: 5, filled: 0, remaining: 5, isFull: false, overfilled: false });
  });

  it('counts only the missions-in-progress that still hold a seat', () => {
    const v = computeHeadcount({
      howMeny: '4',
      mesimabetahaliches: {
        data: [mb('active'), mb(null), mb('archived'), mb('released'), mb('active', true)]
      }
    });
    expect(v.filled).toBe(2);
    expect(v.remaining).toBe(2);
    expect(v.isFull).toBe(false);
  });

  it('is full at exactly the requested headcount', () => {
    const v = computeHeadcount({ howMeny: 2, mesimabetahaliches: { data: [mb('active'), mb(null)] } });
    expect(v.isFull).toBe(true);
    expect(v.remaining).toBe(0);
    expect(v.overfilled).toBe(false);
  });

  it('reports over-filling without ever going negative', () => {
    const v = computeHeadcount({
      howMeny: 1,
      mesimabetahaliches: { data: [mb('active'), mb('active')] }
    });
    expect(v.filled).toBe(2);
    expect(v.remaining).toBe(0);
    expect(v.overfilled).toBe(true);
    expect(v.isFull).toBe(true);
  });

  it('counts only un-archived candidacies, and derives the recruiting gap', () => {
    const v = computeHeadcount({
      howMeny: '4',
      mesimabetahaliches: { data: [mb('active')] },
      asks: { data: [ask(false), ask(false), ask(true)] }
    });
    expect(v.candidates).toBe(2);
    // 3 seats left, 2 people applying → one seat nobody is even asking for.
    expect(v.shortfall).toBe(1);
  });

  it('reports no shortfall when there are more candidates than seats', () => {
    const v = computeHeadcount({
      howMeny: 1,
      asks: { data: [ask(false), ask(false), ask(false)] }
    });
    expect(v.shortfall).toBe(0);
  });

  it('accepts already-unwrapped arrays as well as Strapi relation payloads', () => {
    const v = computeHeadcount({
      howMeny: 3,
      mesimabetahaliches: [{ lifecycle: 'active' } as never],
      asks: [{ archived: false } as never]
    });
    expect(v.filled).toBe(1);
    expect(v.candidates).toBe(1);
  });

  it('survives a missing open mission', () => {
    expect(computeHeadcount(null)).toMatchObject({ need: 1, filled: 0, remaining: 1 });
  });
});

describe('effectOfAcceptance', () => {
  it('keeps a five-person mission open after the first acceptance', () => {
    // The bug this module exists for: before it, this returned "archive".
    const e = effectOfAcceptance({ howMeny: '5', mesimabetahaliches: { data: [] } });
    expect(e.filledAfter).toBe(1);
    expect(e.archiveOpenMission).toBe(false);
    expect(e.archiveSiblingAsks).toBe(false);
    expect(e.remainingAfter).toBe(4);
  });

  it('closes the mission on the acceptance that fills the last seat', () => {
    const e = effectOfAcceptance({
      howMeny: '3',
      mesimabetahaliches: { data: [mb('active'), mb('active')] }
    });
    expect(e.filledAfter).toBe(3);
    expect(e.archiveOpenMission).toBe(true);
    expect(e.archiveSiblingAsks).toBe(true);
    expect(e.remainingAfter).toBe(0);
  });

  it('closes a single-person mission, exactly as before', () => {
    const e = effectOfAcceptance({ howMeny: null, mesimabetahaliches: { data: [] } });
    expect(e.archiveOpenMission).toBe(true);
  });

  it('still closes when a race pushed it past the headcount', () => {
    const e = effectOfAcceptance({ howMeny: 1, mesimabetahaliches: { data: [mb('active')] } });
    expect(e.filledAfter).toBe(2);
    expect(e.archiveOpenMission).toBe(true);
  });

  it('reopens a seat freed by a member who left', () => {
    // Two of three left → one seat is free again, so the mission stays open.
    const e = effectOfAcceptance({
      howMeny: '3',
      mesimabetahaliches: { data: [mb('active'), mb('released'), mb('archived')] }
    });
    expect(e.before.filled).toBe(1);
    expect(e.archiveOpenMission).toBe(false);
    expect(e.remainingAfter).toBe(1);
  });

  it('falls back to the old behaviour when the flag is off', () => {
    const e = effectOfAcceptance({ howMeny: '5', mesimabetahaliches: { data: [] } }, { enabled: false });
    expect(e.archiveOpenMission).toBe(true);
    expect(e.archiveSiblingAsks).toBe(true);
  });
});
