import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/stores/levStores', async () => {
  const { writable } = await import('svelte/store');
  return { projectsStore: writable([]) };
});
vi.mock('$lib/utils/projectHelpers.js', () => ({ createProjectInfo: () => ({}) }));

const { shapeApplications } = await import('./myApplications');
const { processMyApplications } = await import('$lib/utils/levMyApplications');

const project = { data: { id: '5', attributes: { projectName: 'Bakery', user_1s: { data: [{ id: '1', attributes: { username: 'dan' } }] } } } };

const data = {
  asks: {
    data: [
      { id: '11', attributes: { createdAt: '2026-11-10T10:00:00Z', project, open_mission: { data: { id: '40', attributes: { name: 'Bake bread', noofhours: 10, perhour: 50 } } } } },
      // Lapsed: the rikma's to revive, not an open candidacy any more.
      { id: '12', attributes: { createdAt: '2026-11-11T10:00:00Z', lapsedAt: '2026-11-12T10:00:00Z', project, open_mission: { data: { id: '41', attributes: { name: 'Old one' } } } } }
    ]
  },
  askms: {
    data: [{ id: '20', attributes: { createdAt: '2026-11-09T10:00:00Z', project, open_mashaabim: { data: { id: '60', attributes: { name: 'Oven', price: 300 } } } } }]
  }
};

describe('shapeApplications', () => {
  it('drops lapsed asks and links each opening to its public page', () => {
    const out = shapeApplications(data, '7');
    expect(out.map((a) => a.applicationId)).toEqual(['11', '20']);
    expect(out[0].openingPath).toBe('/availableMission/40');
    expect(out[0].votePath).toBe('/moach/5/votes/ask/11');
    expect(out[1].openingPath).toBe('/availiableResorce/60');
    expect(out[1].kind).toBe('resource');
  });
});

describe('processMyApplications', () => {
  it('makes one myapp card per candidacy, named after the rikma when I am not in it', () => {
    const items = processMyApplications(shapeApplications(data, '7'));
    expect(items).toHaveLength(2);
    expect(items[0].ani).toBe('myapp');
    expect(items[0].projectName).toBe('Bakery');
    expect(items[0].coinlapach).toBe('myapp-mission-11');
    expect(items[1].coinlapach).toBe('myapp-resource-20');
    expect(items[0].when?.at).toBe('2026-11-10T10:00:00.000Z');
  });

  it('never throws on missing data', () => {
    expect(processMyApplications(null)).toEqual([]);
  });
});
