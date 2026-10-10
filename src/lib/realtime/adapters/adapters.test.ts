import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/utils/levSliceRegistry', () => ({ LEV_SLICES: {} }));
vi.mock('$lib/utils/levSliceLoader', () => ({ loadLevSlice: vi.fn() }));
vi.mock('$lib/utils/levDataLoader', () => ({ initializeLevData: vi.fn() }));

import { applyLevBatch, type LevRealtimeDeps } from './lev';
import { applyMoachBatch } from './moach';
import type { RealtimeBatch } from '../bus';

const batch = (scopesList: string[][], resync = false): RealtimeBatch => ({
  changes: scopesList.map((scopes) => ({ scopes, actionKey: 'a', at: '' })),
  scopes: [...new Set(scopesList.flat())],
  resync
});

function levDeps(): LevRealtimeDeps & { loadSlice: ReturnType<typeof vi.fn>; fullLoad: ReturnType<typeof vi.fn> } {
  return {
    loadSlice: vi.fn(async () => {}),
    fullLoad: vi.fn(async () => {}),
    slices: {
      pends: { qid: 'q1', source: 'project' },
      mtaha: { qid: 'q2', source: 'user' },
      pmashes: { qid: null, source: 'project' }
    }
  } as any;
}

describe('lev adapter', () => {
  it('re-reads the touched slice for the rikmas it was touched in', async () => {
    const d = levDeps();
    await applyLevBatch(batch([['project:1', 'decision:pendm:3'], ['project:2', 'decision:pendm:4']]), 'u', 'he', d);
    expect(d.loadSlice).toHaveBeenCalledTimes(1);
    expect(d.loadSlice.mock.calls[0][0]).toBe('pends');
    expect([...d.loadSlice.mock.calls[0][2]].sort()).toEqual(['1', '2']);
    expect(d.fullLoad).not.toHaveBeenCalled();
  });

  it('a user-scoped slice is read whole', async () => {
    const d = levDeps();
    await applyLevBatch(batch([['project:1', 'act:5']]), 'u', 'he', d);
    expect(d.loadSlice).toHaveBeenCalledWith('mtaha', 'u', null, 'he');
  });

  it('a slice with no qid yet falls back to one full load', async () => {
    const d = levDeps();
    await applyLevBatch(batch([['project:1', 'decision:pmash:3']]), 'u', 'he', d);
    expect(d.fullLoad).toHaveBeenCalledTimes(1);
  });

  it('a resync is one full load', async () => {
    const d = levDeps();
    await applyLevBatch(batch([], true), 'u', 'he', d);
    expect(d.fullLoad).toHaveBeenCalledTimes(1);
    expect(d.loadSlice).not.toHaveBeenCalled();
  });
});

describe('moach adapter', () => {
  const deps = () => ({ refresh: vi.fn(), refreshBase: vi.fn(), onVotes: vi.fn() });

  it('re-reads the sections this rikma’s change touched, and the votes badge', () => {
    const d = deps();
    applyMoachBatch(batch([['project:12', 'decision:pendm:1']]), '12', d);
    expect(d.refresh).toHaveBeenCalledWith('12', 'missions');
    expect(d.refreshBase).not.toHaveBeenCalled();
    expect(d.onVotes).toHaveBeenCalledTimes(1);
  });

  it('a change of the rikma itself re-runs the layout load', () => {
    const d = deps();
    applyMoachBatch(batch([['project:12']]), '12', d);
    expect(d.refreshBase).toHaveBeenCalledWith('12');
    expect(d.refresh).not.toHaveBeenCalled();
  });

  it('a resync re-reads everything once', () => {
    const d = deps();
    applyMoachBatch(batch([], true), '12', d);
    expect(d.refreshBase).toHaveBeenCalledTimes(1);
    expect(d.refresh.mock.calls.map((c) => c[1]).sort()).toEqual(['financials', 'missions']);
    expect(d.onVotes).toHaveBeenCalledTimes(1);
  });
});
