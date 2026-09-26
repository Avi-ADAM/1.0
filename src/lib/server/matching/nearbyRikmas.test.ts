import { describe, expect, it } from 'vitest';
import { nearbyRikmas, nearbyProjectOf } from './nearbyRikmas.js';

const project = (id: string, name: string, values: [string, string][], members: { id: string; skills: [string, string][] }[]) =>
  nearbyProjectOf({
    id,
    attributes: {
      projectName: name,
      vallues: { data: values.map(([vid, n]) => ({ id: vid, attributes: { valueName: n } })) },
      user_1s: {
        data: members.map((m) => ({ id: m.id, attributes: { skills: { data: m.skills.map(([sid, n]) => ({ id: sid, attributes: { skillName: n } })) } } }))
      }
    }
  });

const projects = [
  project('1', 'הגינה', [['v1', 'קהילה'], ['v2', 'קיימות']], [{ id: '10', skills: [['s1', 'UX']] }]),
  project('2', 'הסטודיו', [['v3', 'יצירה']], [{ id: '11', skills: [['s1', 'UX']] }, { id: '12', skills: [['s2', 'פיגמה']] }]),
  project('3', 'שלי', [['v1', 'קהילה']], [{ id: '5', skills: [] }]),
  project('4', 'רחוקה', [['v9', 'אחר']], [{ id: '13', skills: [] }])
];

describe('nearbyRikmas', () => {
  it('ranks by shared values first, then member skills; says why; skips my rikmas and far ones', () => {
    const r = nearbyRikmas({ userId: '5', valueIds: ['v1', 'v2'], skillIds: ['s1', 's2'] }, projects);
    expect(r).toEqual([
      { id: '1', name: 'הגינה', score: 5, sharedValues: ['קהילה', 'קיימות'], sharedSkills: ['UX'] },
      { id: '2', name: 'הסטודיו', score: 2, sharedValues: [], sharedSkills: ['UX', 'פיגמה'] }
    ]);
  });

  it('at most the max, and nothing when nothing is shared', () => {
    expect(nearbyRikmas({ userId: '5', valueIds: ['v1', 'v2'], skillIds: [] }, projects, 1)).toHaveLength(1);
    expect(nearbyRikmas({ userId: '5', valueIds: [], skillIds: [] }, projects)).toEqual([]);
  });
});
