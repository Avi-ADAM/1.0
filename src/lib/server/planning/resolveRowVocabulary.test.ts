import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ResolvedMissionSpec } from '../mission/resolveMissionSpec';
import type { ExpandedItem } from './expandDirection';

// The real resolver reaches Pinecone and /api/vocab/create. What matters here
// is the contract between it and the plan rows, so it is mocked wholesale.
const resolveMissionSpec = vi.fn();
vi.mock('../mission/resolveMissionSpec.js', () => ({
  resolveMissionSpec: (...args: unknown[]) => resolveMissionSpec(...args)
}));

const { resolveRowVocabulary } = await import('./expandDirection');

function cat(resolved: { id: string; name: string }[]) {
  return { ids: resolved.map((r) => r.id), resolved, suggestions: [], newlyCreated: [] };
}

function resolution(over: Partial<ResolvedMissionSpec> = {}): ResolvedMissionSpec {
  return {
    skills: cat([]),
    roles: cat([]),
    workways: cat([]),
    vallues: cat([]),
    ...over
  } as ResolvedMissionSpec;
}

function row(over: Partial<ExpandedItem> = {}): ExpandedItem {
  return {
    kind: 'mission',
    name: 'Build the order page',
    descrip: 'A page people can order from.',
    imp: 'must',
    spec: { skills: ['מתכנתת'], roles: [], workways: [] },
    existingRef: null,
    order: 0,
    ...over
  };
}

const fetchStub = (() => {}) as unknown as typeof fetch;

describe('resolveRowVocabulary', () => {
  // mockClear, not mockReset: resetting a mock whose last call rejected makes
  // vitest re-surface that rejection in the next test.
  beforeEach(() => {
    resolveMissionSpec.mockClear();
    resolveMissionSpec.mockImplementation(async () => resolution());
  });

  it('replaces the model\'s wording with the catalogue\'s, and keeps the ids', async () => {
    resolveMissionSpec.mockImplementation(async () =>
      resolution({
        // The model wrote "מתכנתת"; the catalogue calls it "מתכנת".
        skills: cat([{ id: '7', name: 'מתכנת' }]),
        roles: cat([{ id: '3', name: 'מעצבת' }])
      })
    );

    const [out] = await resolveRowVocabulary([row()], fetchStub, 'he');

    expect(out.spec.skills).toEqual(['מתכנת']);
    expect(out.spec.roles).toEqual(['מעצבת']);
    // The authoritative half — what the form actually submits.
    expect(out.spec.vocab).toEqual({
      skills: [{ id: '7', name: 'מתכנת' }],
      roles: [{ id: '3', name: 'מעצבת' }],
      workways: []
    });
  });

  it('carries an id for a skill that had to be created', async () => {
    resolveMissionSpec.mockImplementation(async () =>
      resolution({ skills: cat([{ id: '99', name: 'אפייה מקצועית' }]) })
    );

    const [out] = await resolveRowVocabulary(
      [row({ spec: { skills: ['אפייה מקצועית'] } })],
      fetchStub,
      'he'
    );

    // A term created moments ago is absent from the catalogue the form loaded,
    // so without the pair its chip would be shown and then dropped on submit.
    expect((out.spec.vocab as any).skills).toEqual([{ id: '99', name: 'אפייה מקצועית' }]);
  });

  it('resolves only mission rows', async () => {
    const rows = [
      row({ kind: 'resource', name: 'Espresso machine', spec: { kindOf: 'equipment' } }),
      row({ kind: 'product', name: 'Breakfast', spec: { price: 98 } }),
      row({ kind: 'act', name: 'Photograph the dishes', spec: {} })
    ];
    const out = await resolveRowVocabulary(rows, fetchStub, 'he');

    expect(resolveMissionSpec).not.toHaveBeenCalled();
    expect(out.every((r) => r.spec.vocab === undefined)).toBe(true);
  });

  it('does not call the resolver for a mission with no vocabulary', async () => {
    const out = await resolveRowVocabulary(
      [row({ spec: { skills: [], roles: [], workways: [] } })],
      fetchStub,
      'he'
    );
    expect(resolveMissionSpec).not.toHaveBeenCalled();
    expect(out[0].spec.vocab).toBeUndefined();
  });

  it('passes the row through untouched when resolution fails', async () => {
    resolveMissionSpec.mockImplementation(async () => {
      throw new Error('pinecone down');
    });

    const input = row();
    const [out] = await resolveRowVocabulary([input], fetchStub, 'he');

    // Degraded, not lost: the member still gets the suggestion, and the form
    // falls back to its own catalogue lookup.
    expect(out.spec.skills).toEqual(['מתכנתת']);
    expect(out.spec.vocab).toBeUndefined();
  });

  it('keeps the original names when the resolver matched nothing', async () => {
    const [out] = await resolveRowVocabulary([row()], fetchStub, 'he');
    expect(out.spec.skills).toEqual(['מתכנתת']);
    expect((out.spec.vocab as any).skills).toEqual([]);
  });

  it('forwards the row to the resolver with its hours and rate', async () => {
    await resolveRowVocabulary(
      [row({ spec: { skills: ['מתכנתת'], nhours: 12, valph: 90 } })],
      fetchStub,
      'en'
    );

    expect(resolveMissionSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Build the order page',
        skills: ['מתכנתת'],
        nhours: 12,
        valph: 90,
        lang: 'en'
      }),
      fetchStub
    );
  });
});
