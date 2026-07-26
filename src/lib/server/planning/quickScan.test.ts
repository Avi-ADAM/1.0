import { describe, expect, it } from 'vitest';
import { parseDirections, buildScanPrompt } from './quickScan';
import { buildScanSignals } from './signals';
import type { ProjectContext } from '../ai/projectContext';

const ok = JSON.stringify({
  directions: [
    { title: 'Recruit a designer', descrip: 'Bring in visual skill.', rationale: '4 missions untaken.' },
    { title: 'Define first product', descrip: 'Turn work into something sellable.', rationale: 'No products yet.' }
  ]
});

describe('parseDirections', () => {
  it('parses a clean JSON reply', () => {
    const d = parseDirections(ok);
    expect(d).toHaveLength(2);
    expect(d[0].title).toBe('Recruit a designer');
    expect(d[0].rationale).toBe('4 missions untaken.');
  });

  it('survives markdown code fences', () => {
    expect(parseDirections('```json\n' + ok + '\n```')).toHaveLength(2);
  });

  it('survives chatty prose around the JSON', () => {
    expect(parseDirections(`Sure! Here you go:\n${ok}\nHope that helps.`)).toHaveLength(2);
  });

  it('accepts a bare array, since models drift', () => {
    const bare = JSON.stringify([{ title: 'A' }, { title: 'B' }]);
    expect(parseDirections(bare)).toHaveLength(2);
  });

  it('caps at 5 directions', () => {
    const many = JSON.stringify({
      directions: Array.from({ length: 12 }, (_, i) => ({ title: `D${i}` }))
    });
    expect(parseDirections(many)).toHaveLength(5);
  });

  it('drops entries with no title and de-duplicates by title', () => {
    const messy = JSON.stringify({
      directions: [{ title: 'A' }, { title: '   ' }, { descrip: 'no title' }, { title: 'a' }]
    });
    const d = parseDirections(messy);
    expect(d).toHaveLength(1);
    expect(d[0].title).toBe('A');
  });

  it('returns empty rather than throwing on junk', () => {
    for (const junk of ['', 'not json at all', '{oops', 'null']) {
      expect(parseDirections(junk)).toEqual([]);
    }
  });

  it('clamps overlong fields', () => {
    const long = JSON.stringify({
      directions: [{ title: 'T'.repeat(500), descrip: 'D'.repeat(900), rationale: 'R'.repeat(900) }]
    });
    const [d] = parseDirections(long);
    expect(d.title.length).toBeLessThanOrEqual(120);
    expect(d.descrip.length).toBeLessThanOrEqual(400);
    expect(d.rationale.length).toBeLessThanOrEqual(400);
  });
});

describe('buildScanPrompt', () => {
  const base: ProjectContext = {
    projectId: '42',
    projectName: 'Green Roofs',
    description: 'Rooftop gardens.',
    values: [],
    restime: null,
    members: [],
    openMissions: [],
    products: [],
    myMissions: [],
    isMember: true,
    fetchedAt: Date.now()
  };

  it('states the stage explicitly so the model branches correctly', () => {
    const newP = buildScanPrompt(base, buildScanSignals(base), 'en');
    expect(newP).toMatch(/NEW stage/);

    const est = { ...base, openMissions: [{ id: '1', name: 'A' }] };
    expect(buildScanPrompt(est, buildScanSignals(est), 'en')).toMatch(/ESTABLISHED/);
  });

  it('keeps user-authored content inside the untrusted delimiters', () => {
    const prompt = buildScanPrompt(base, buildScanSignals(base), 'en');
    expect(prompt).toContain('untrusted');
    expect(prompt).toContain('<<<Green Roofs>>>');
  });
});
