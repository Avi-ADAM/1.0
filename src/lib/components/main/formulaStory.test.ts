import { describe, it, expect } from 'vitest';
import {
  EXAMPLES,
  CUBE_VALUE,
  PILE,
  SCENE_START,
  SCENE_MS,
  SCENE_COUNT,
  TOTAL_MS,
  NEGO_DROP_AT,
  CUBE_FALL_MS,
  totals,
  rowValue,
  sceneAt,
  buildCubes,
  buildArcs
} from './formulaStory';

describe('formulaStory examples', () => {
  for (const example of EXAMPLES) {
    describe(example.id, () => {
      it('is made of whole cubes, so the pile equals the number it shows', () => {
        for (const row of example.rows) expect(rowValue(row) % CUBE_VALUE).toBe(0);
        expect(buildCubes(example).length * CUBE_VALUE).toBe(totals(example).total);
      });

      it('gives every partner a whole percentage and a whole payout', () => {
        const { shares, payouts } = totals(example);
        for (const share of shares) expect(Number.isInteger(+(share * 100).toFixed(6))).toBe(true);
        expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
        expect(payouts.reduce((a, b) => a + b, 0)).toBe(example.sale);
      });

      it('fills a full rectangle with no two cubes in one slot', () => {
        const cubes = buildCubes(example);
        expect(cubes.length % PILE.cols).toBe(0);
        expect(new Set(cubes.map((c) => `${c.x}:${c.y}`)).size).toBe(cubes.length);
      });

      it('lands every cube inside the scene that owns it', () => {
        const last = example.rows.length - 1;
        for (const cube of buildCubes(example)) {
          const scene = cube.row === last ? 2 : 1;
          expect(cube.t0).toBeGreaterThanOrEqual(SCENE_START[scene]);
          expect(cube.t0 + CUBE_FALL_MS).toBeLessThanOrEqual(SCENE_START[scene] + SCENE_MS[scene]);
        }
      });

      it('drops the negotiated row only after it was agreed', () => {
        const last = example.rows.length - 1;
        const first = Math.min(...buildCubes(example).filter((c) => c.row === last).map((c) => c.t0));
        expect(first).toBeGreaterThanOrEqual(SCENE_START[2] + NEGO_DROP_AT);
      });

      it('draws arcs that close the ring', () => {
        const arcs = buildArcs(example);
        expect(arcs[0].from).toBe(0);
        const end = arcs[arcs.length - 1];
        expect(end.from + end.length).toBeCloseTo(1);
      });
    });
  }

  it('keeps the concrete example and the bare formula on the same numbers', () => {
    const byId = (id: string) => EXAMPLES.find((e) => e.id === id)!;
    expect(totals(byId('formula'))).toEqual(totals(byId('bakery')));
  });

  it('drops a monthly row in whole, equal months', () => {
    for (const example of EXAMPLES) {
      for (const row of example.rows.filter((r) => r.kind === 'monthly')) {
        expect((row.rate / CUBE_VALUE) % 1).toBe(0);
      }
    }
  });

  it('gives every example its own split, so switching shows the mechanism and not one answer', () => {
    const concrete = EXAMPLES.filter((e) => e.id !== 'formula');
    const splits = concrete.map((e) => totals(e).shares.map((s) => Math.round(s * 100)).join('/'));
    expect(new Set(splits).size).toBe(concrete.length);
  });
});

describe('sceneAt', () => {
  it('maps every scene start to its own scene', () => {
    SCENE_START.forEach((start, i) => expect(sceneAt(start)).toEqual({ index: i, local: 0 }));
  });

  it('clamps before the start and after the end', () => {
    expect(sceneAt(-50).index).toBe(0);
    const end = sceneAt(TOTAL_MS + 999);
    expect(end.index).toBe(SCENE_COUNT - 1);
    expect(end.local).toBe(SCENE_MS[SCENE_COUNT - 1]);
  });
});
