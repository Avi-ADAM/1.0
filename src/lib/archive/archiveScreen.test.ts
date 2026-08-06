import { describe, it, expect } from 'vitest';
import { buildArchiveEntries } from './archiveScreen.js';

function project(over: any = {}) {
  return {
    projectName: 'ריקמת הבוקר',
    open_missions: { data: [] },
    mesimabetahaliches: { data: [] },
    open_mashaabims: { data: [] },
    mashabetahaliches: { data: [] },
    matanotofs: { data: [] },
    decisions: { data: [] },
    ...over,
  };
}

const mission = (over: any = {}) => ({
  id: '10',
  attributes: {
    name: 'עיצוב לוגו',
    lifecycle: 'archived',
    updatedAt: '2026-06-01T00:00:00.000Z',
    users_permissions_user: { data: { id: '2', attributes: { username: 'יואב' } } },
    ...over,
  },
});

const decision = (over: any = {}) => ({
  id: '500',
  attributes: {
    kind: 'archiveObject',
    targetKind: 'missionInProgress',
    archWhy: 'הצורך התבטל',
    archEndsMembership: false,
    updatedAt: '2026-06-01T00:00:00.000Z',
    negoarch: [{ ordern: 1, mode: 'archive', why: 'הצורך התבטל', hoursOutcome: 'waive' }],
    archMesimabetahalich: { data: { id: '10' } },
    ...over,
  },
});

describe('buildArchiveEntries', () => {
  it('returns nothing for a rikma that has archived nothing', () => {
    expect(buildArchiveEntries(project())).toEqual([]);
    expect(buildArchiveEntries(null)).toEqual([]);
  });

  it('joins the decision onto its object, so each row says why it left', () => {
    const entries = buildArchiveEntries(
      project({
        mesimabetahaliches: { data: [mission()] },
        decisions: { data: [decision()] },
      }),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      targetKind: 'missionInProgress',
      targetId: '10',
      name: 'עיצוב לוגו',
      ownerName: 'יואב',
      lifecycle: 'archived',
      why: 'הצורך התבטל',
      hoursOutcome: 'waive',
      decisionId: '500',
    });
  });

  it('reports the credited hours from the round that actually matured', () => {
    const entries = buildArchiveEntries(
      project({
        mesimabetahaliches: { data: [mission()] },
        decisions: {
          data: [
            decision({
              negoarch: [
                { ordern: 1, mode: 'archive', hoursOutcome: 'waive' },
                { ordern: 2, mode: 'archive', hoursOutcome: 'credit', hoursToCredit: 8, why: 'סוכם על 8' },
              ],
            }),
          ],
        },
      }),
    );
    expect(entries[0].hoursOutcome).toBe('credit');
    expect(entries[0].hoursCredited).toBe(8);
    expect(entries[0].why).toBe('סוכם על 8');
  });

  it('picks the last decision when an object carries several over its life', () => {
    // An earlier proposal matured into "keep"; a later one removed it.
    const entries = buildArchiveEntries(
      project({
        mesimabetahaliches: { data: [mission()] },
        decisions: {
          data: [
            decision({
              id: '400',
              updatedAt: '2026-01-01T00:00:00.000Z',
              negoarch: [{ ordern: 1, mode: 'keep', why: 'ניסיון ראשון' }]
            }),
            decision({
              id: '500',
              updatedAt: '2026-06-01T00:00:00.000Z',
              negoarch: [{ ordern: 1, mode: 'archive', why: 'ההסרה בפועל' }]
            }),
          ],
        },
      }),
    );
    expect(entries[0].decisionId).toBe('500');
    expect(entries[0].why).toBe('ההסרה בפועל');
  });

  it('still lists an object whose decision is missing, rather than hiding it', () => {
    const entries = buildArchiveEntries(project({ mesimabetahaliches: { data: [mission()] } }));
    expect(entries).toHaveLength(1);
    expect(entries[0].decisionId).toBeNull();
    expect(entries[0].why).toBeNull();
  });

  it('separates a released commitment from an archived need', () => {
    const entries = buildArchiveEntries(
      project({ mesimabetahaliches: { data: [mission({ lifecycle: 'released' })] } }),
    );
    expect(entries[0].lifecycle).toBe('released');
  });

  it('surfaces that a membership ended with the object', () => {
    const entries = buildArchiveEntries(
      project({
        mesimabetahaliches: { data: [mission()] },
        decisions: { data: [decision({ archEndsMembership: true })] },
      }),
    );
    expect(entries[0].endsMembership).toBe(true);
  });

  it('reads every collection with its own field names', () => {
    const entries = buildArchiveEntries(
      project({
        open_missions: { data: [{ id: '1', attributes: { name: 'משימה', lifecycle: 'archived' } }] },
        open_mashaabims: { data: [{ id: '2', attributes: { name: 'משאב', lifecycle: 'archived' } }] },
        matanotofs: {
          data: [{ id: '3', attributes: { name: 'מוצר', desc: 'תיאור', lifecycle: 'archived' } }],
        },
      }),
    );
    expect(entries.map((e) => e.targetKind).sort()).toEqual([
      'matanot',
      'openMission',
      'openResource',
    ]);
    expect(entries.find((e) => e.targetKind === 'matanot')?.descrip).toBe('תיאור');
  });

  it('uses the scheduled date for an end-of-cycle close, not the edit date', () => {
    const entries = buildArchiveEntries(
      project({
        mashabetahaliches: {
          data: [
            {
              id: '4',
              attributes: {
                name: 'אחסון',
                lifecycle: 'archived',
                updatedAt: '2026-06-01T00:00:00.000Z',
                archiveEffectiveFrom: '2026-07-01T00:00:00.000Z',
              },
            },
          ],
        },
      }),
    );
    expect(entries[0].at).toBe('2026-07-01T00:00:00.000Z');
  });

  it('reads newest first, so the archive is a history not a heap', () => {
    const entries = buildArchiveEntries(
      project({
        open_missions: {
          data: [
            { id: '1', attributes: { name: 'ישנה', lifecycle: 'archived', updatedAt: '2026-01-01T00:00:00.000Z' } },
            { id: '2', attributes: { name: 'חדשה', lifecycle: 'archived', updatedAt: '2026-06-01T00:00:00.000Z' } },
          ],
        },
      }),
    );
    expect(entries.map((e) => e.name)).toEqual(['חדשה', 'ישנה']);
  });
});
