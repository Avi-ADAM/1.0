import { describe, it, expect } from 'vitest';
import { maturedSettingsFromRest, settingsDecisionsQuery } from './settingsMatured';

const project = {
  data: {
    id: 45,
    attributes: {
      slug: 'garden',
      user_1s: { data: [{ id: 256 }, { id: 258 }] },
      vallues: { data: [{ id: 9 }, { id: 12 }, { id: 7 }] }
    }
  }
};
const vote = (id: number, what = true) => ({ what, order: 0, users_permissions_user: { data: { id } } });
const row = (id: number, attributes: Record<string, unknown>) => ({
  id,
  attributes: { createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-03T00:00:00.000Z', ...attributes }
});
const T1 = Date.parse('2026-11-01T00:00:00.000Z');
const T3 = Date.parse('2026-11-03T00:00:00.000Z');

describe('maturedSettingsFromRest', () => {
  it('derives the amend from the Decision and tells silence from a full vote', () => {
    const out = maturedSettingsFromRest(
      {
        data: [
          row(1, {
            kind: 'name',
            newname: 'הגינה',
            vots: [vote(256)],
            timegrama: { data: { attributes: { date: '2026-11-03T00:00:00.000Z' } } }
          }),
          row(2, { kind: 'timtoM', timtoM: 'feh', vots: [vote(256), vote(258)] })
        ]
      },
      project
    );
    expect(out).toEqual([
      {
        decisionId: '1',
        kind: 'name',
        amend: { path: 'name', value: 'הגינה' },
        maturedBy: 'silence',
        roundStart: T1,
        maturedAt: T3,
        expectedEnd: T3,
        counted: ['256']
      },
      {
        decisionId: '2',
        kind: 'timtoM',
        amend: { path: 'restime', value: 'feh' },
        maturedBy: 'vote',
        roundStart: T1,
        maturedAt: T3,
        expectedEnd: null,
        counted: ['256', '258']
      }
    ]);
  });

  it('values: only the newest matured Decision, carrying the set the rikma has now', () => {
    const out = maturedSettingsFromRest(
      {
        data: [
          row(5, { kind: 'vallueadd', valluesadd: { data: [{ id: 12 }] } }),
          row(4, { kind: 'vallueles', valluesles: { data: [{ id: 3 }] } })
        ]
      },
      project
    );
    expect(out.map((m) => [m.decisionId, m.amend])).toEqual([['5', { path: 'values', value: ['12', '7', '9'] }]]);
  });

  it('an address is reported only while it is still the slug; a look always', () => {
    const out = maturedSettingsFromRest(
      {
        data: [
          row(7, { kind: 'address', newSlug: 'bees' }),
          row(6, { kind: 'address', newSlug: 'garden' }),
          row(8, { kind: 'look', newLook: null })
        ]
      },
      project
    );
    expect(out.map((m) => m.decisionId)).toEqual(['6', '8']);
  });

  it('skips rows it cannot read and kinds that change nothing', () => {
    expect(maturedSettingsFromRest({ data: [{ id: 1 }, row(2, { kind: 'name', newname: '' })] }, project)).toEqual([]);
    expect(maturedSettingsFromRest({}, project)).toEqual([]);
  });

  it('asks Strapi for archived settings Decisions of this rikma only, newest first', () => {
    const q = settingsDecisionsQuery('45');
    expect(q).toContain('filters[projects][id][$eq]=45');
    expect(q).toContain('filters[archived][$eq]=true');
    expect(q).toContain('sort[0]=updatedAt:desc');
  });
});
