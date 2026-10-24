import { describe, it, expect } from 'vitest';
import {
  boardsToVisionPreview,
  isEmptyPreview,
  MAX_PREVIEW_MISSIONS,
  MAX_PREVIEW_RESOURCES
} from './preview';

describe('boardsToVisionPreview', () => {
  it('splits rows by kind and computes each mission’s share of the missions’ value', () => {
    const p = boardsToVisionPreview([
      {
        items: [
          { kind: 'mission', name: 'Find land', nhours: 100, valph: 100 },
          { kind: 'mission', name: 'Business plan', nhours: 50, valph: 200 },
          { kind: 'resource', name: 'Seed capital' },
          { kind: 'product', name: 'Retreat stays' },
          { kind: 'act', name: 'Call the council' }
        ]
      }
    ]);
    expect(p.missions.map((m) => m.share)).toEqual([50, 50]);
    expect(p.resources).toEqual(['Seed capital']);
    expect(p.products).toEqual(['Retreat stays']);
    expect(p.more).toBe(0);
  });

  it('leaves the share empty for a mission with no hours or rate', () => {
    const p = boardsToVisionPreview([
      { items: [{ kind: 'mission', name: 'A', nhours: 10, valph: 100 }, { kind: 'mission', name: 'B' }] }
    ]);
    expect(p.missions[0].share).toBe(100);
    expect(p.missions[1]).toMatchObject({ value: null, share: null });
  });

  it('caps each list and counts what it left out', () => {
    const missions = Array.from({ length: 8 }, (_, i) => ({ kind: 'mission', name: `M${i}` }));
    const resources = Array.from({ length: 6 }, (_, i) => ({ kind: 'resource', name: `R${i}` }));
    const p = boardsToVisionPreview([{ items: missions }, { items: resources }]);
    expect(p.missions).toHaveLength(MAX_PREVIEW_MISSIONS);
    expect(p.resources).toHaveLength(MAX_PREVIEW_RESOURCES);
    expect(p.more).toBe(8 - MAX_PREVIEW_MISSIONS + 6 - MAX_PREVIEW_RESOURCES);
  });

  it('skips nameless rows and survives garbage', () => {
    const p = boardsToVisionPreview([{ items: [{ kind: 'mission', name: '  ' }] }, null as never]);
    expect(isEmptyPreview(p)).toBe(true);
  });
});
