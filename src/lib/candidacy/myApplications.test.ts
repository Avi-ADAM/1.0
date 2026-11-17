import { describe, expect, it } from 'vitest';
import { shapeApplications } from './myApplications';
import { candidacyFor, isMyCandidacyItem } from '$lib/utils/levMyApplications';

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

describe('my candidacies on the heart’s own cards', () => {
  const missionCard = { ani: 'meData', alreadyi: true, askId: '11' };
  const resourceCard = { ani: 'huca', myAskId: '20' };

  it('?focus=myapp keeps only the opening cards I applied to', () => {
    expect(isMyCandidacyItem(missionCard)).toBe(true);
    expect(isMyCandidacyItem(resourceCard)).toBe(true);
    // A suggestion I have not applied to, and a resource card with no Askm of mine.
    expect(isMyCandidacyItem({ ani: 'meData', alreadyi: false, askId: '11' })).toBe(false);
    expect(isMyCandidacyItem({ ani: 'huca', askId: '20' })).toBe(false);
    expect(isMyCandidacyItem({ ani: 'pend', alreadyi: true, askId: '11' })).toBe(false);
    expect(isMyCandidacyItem(null)).toBe(false);
  });

  it('finds where the card’s candidacy stands, by kind and id', () => {
    const map = new Map(shapeApplications(data, '7').map((a) => [`${a.kind}:${a.applicationId}`, a]));
    expect(candidacyFor(map, missionCard)?.name).toBe('Bake bread');
    expect(candidacyFor(map, resourceCard)?.name).toBe('Oven');
    // Ask 20 is not a mission candidacy: ids never cross kinds.
    expect(candidacyFor(map, { ani: 'meData', alreadyi: true, askId: '20' })).toBeNull();
  });
});
