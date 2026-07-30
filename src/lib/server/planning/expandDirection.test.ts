import { describe, expect, it } from 'vitest';
import {
  findExisting,
  dedupeAgainstProject,
  collectExistingCandidates,
  toExpandedItem,
  DUPLICATE_THRESHOLD,
  type ExpandedItem
} from './expandDirection';
import { EMPTY_EXTRAS, type PlanningExtras } from './planningContext';
import type { PlannedRow } from './expandAgent';
import type { ProjectContext } from '../ai/projectContext';

function ctx(over: Partial<ProjectContext> = {}): ProjectContext {
  return {
    projectId: '42',
    projectName: 'P',
    description: '',
    values: [],
    restime: null,
    members: [],
    openMissions: [],
    products: [],
    myMissions: [],
    isMember: true,
    fetchedAt: Date.now(),
    ...over
  };
}

function row(name: string, over: Partial<ExpandedItem> = {}): ExpandedItem {
  return {
    kind: 'mission',
    name,
    descrip: '',
    imp: 'nice',
    spec: {},
    existingRef: null,
    order: 0,
    ...over
  };
}

const liveProject = ctx({
  openMissions: [{ id: '10', name: 'עיצוב לוגו' }],
  myMissions: [
    {
      id: '20',
      name: 'Write landing page copy',
      hoursAlready: 1,
      hoursAssigned: 4,
      activeTimer: null
    }
  ],
  products: [{ id: '30', name: 'Seed kit', price: 20 }]
});

describe('collectExistingCandidates', () => {
  it('gathers open missions, in-progress missions and products', () => {
    const c = collectExistingCandidates(liveProject);
    expect(c).toHaveLength(3);
    expect(c.map((x) => x.type).sort()).toEqual([
      'missionInProgress',
      'openMission',
      'product'
    ]);
  });

  it('ignores entries without a name', () => {
    const c = collectExistingCandidates(
      ctx({ openMissions: [{ id: '1', name: '' }] as any })
    );
    expect(c).toHaveLength(0);
  });
});

describe('findExisting', () => {
  it('matches an already-open mission by exact name', () => {
    const hit = findExisting('עיצוב לוגו', collectExistingCandidates(liveProject));
    expect(hit).not.toBeNull();
    expect(hit!.type).toBe('openMission');
    expect(hit!.id).toBe('10');
  });

  it('matches a mission already in progress', () => {
    const hit = findExisting(
      'Write landing page copy',
      collectExistingCandidates(liveProject)
    );
    expect(hit!.type).toBe('missionInProgress');
    expect(hit!.id).toBe('20');
  });

  it('returns null for a genuinely new need', () => {
    expect(
      findExisting('Negotiate with suppliers', collectExistingCandidates(liveProject))
    ).toBeNull();
  });

  it('returns null for blank input', () => {
    expect(findExisting('   ', collectExistingCandidates(liveProject))).toBeNull();
  });

  it('prefers the strongest match when several pass', () => {
    const candidates = collectExistingCandidates(
      ctx({
        openMissions: [
          { id: '1', name: 'Design' },
          { id: '2', name: 'Design logo for the brand' }
        ]
      })
    );
    const hit = findExisting('Design logo for the brand', candidates);
    expect(hit!.id).toBe('2');
    expect(hit!.similarity).toBeGreaterThanOrEqual(DUPLICATE_THRESHOLD);
  });
});

describe('collectExistingCandidates with planning extras', () => {
  const extras: PlanningExtras = {
    ...EMPTY_EXTRAS,
    openResources: [{ id: '50', name: 'מצלמה', kindOf: 'equipment', price: null }],
    resourcesInProgress: [{ id: '51', name: 'Studio space', kindOf: 'space', price: null }],
    // Another member's work — invisible in ctx.myMissions.
    missionsInProgress: [{ id: '60', name: 'Community outreach', holder: 'dana', roles: [] }]
  };

  it('adds resources and rikma-wide work in progress', () => {
    const c = collectExistingCandidates(liveProject, extras);
    expect(c.map((x) => x.type)).toContain('openResource');
    expect(c.map((x) => x.type)).toContain('resourceInProgress');
    expect(c.filter((x) => x.type === 'missionInProgress')).toHaveLength(2);
  });

  it('does not list the same mission twice when both sources carry it', () => {
    const c = collectExistingCandidates(liveProject, {
      ...EMPTY_EXTRAS,
      missionsInProgress: [{ id: '20', name: 'Write landing page copy', holder: 'me', roles: [] }]
    });
    expect(c.filter((x) => x.type === 'missionInProgress')).toHaveLength(1);
  });

  it('flags a resource the rikma already asked for', () => {
    const hit = findExisting('מצלמה', collectExistingCandidates(liveProject, extras), DUPLICATE_THRESHOLD, 'resource');
    expect(hit?.type).toBe('openResource');
  });

  it('never calls a mission a duplicate of a resource', () => {
    const candidates = collectExistingCandidates(liveProject, extras);
    expect(findExisting('מצלמה', candidates, DUPLICATE_THRESHOLD, 'mission')).toBeNull();
    // …and a resource is not a duplicate of a similarly-named mission.
    expect(findExisting('עיצוב לוגו', candidates, DUPLICATE_THRESHOLD, 'resource')).toBeNull();
  });

  it('never flags a note row', () => {
    const candidates = collectExistingCandidates(liveProject, extras);
    expect(findExisting('עיצוב לוגו', candidates, DUPLICATE_THRESHOLD, 'note')).toBeNull();
  });
});

describe('toExpandedItem', () => {
  function planned(over: Partial<PlannedRow> = {}): PlannedRow {
    return {
      kind: 'mission',
      name: 'Build the landing page',
      descrip: 'Live page with the three offerings.',
      imp: 'must',
      rationale: 'The site lists three workshops with no way to book.',
      skills: ['מתכנת'],
      roles: [],
      workways: [],
      nhours: 12,
      valph: null,
      assigneeKind: null,
      assigneeName: null,
      missionName: null,
      kindOf: null,
      price: null,
      quantity: null,
      ...over
    };
  }

  it('carries the mission prefill the creation form actually reads', () => {
    const item = toExpandedItem(planned(), 0);
    expect(item.spec).toEqual({
      rationale: 'The site lists three workshops with no way to book.',
      skills: ['מתכנת'],
      nhours: 12
    });
    expect(item.descrip).toBe('Live page with the three offerings.');
  });

  it('carries the chore target on an act row', () => {
    const item = toExpandedItem(
      planned({
        kind: 'act',
        skills: [],
        nhours: null,
        assigneeKind: 'role',
        missionName: 'Community outreach'
      }),
      1
    );
    expect(item.spec.assigneeKind).toBe('role');
    expect(item.spec.missionName).toBe('Community outreach');
    expect(item.spec.skills).toBeUndefined();
  });

  it('carries price and kind on a resource row', () => {
    const item = toExpandedItem(
      planned({ kind: 'resource', skills: [], nhours: null, kindOf: 'equipment', price: 900 }),
      2
    );
    expect(item.spec).toMatchObject({ kindOf: 'equipment', price: 900 });
  });

  it('drops empty fields rather than writing nulls into the spec', () => {
    const item = toExpandedItem(planned({ rationale: '', skills: [], nhours: null }), 0);
    expect(Object.keys(item.spec)).toEqual([]);
  });
});

describe('dedupeAgainstProject', () => {
  it('flags duplicates instead of dropping them', () => {
    const out = dedupeAgainstProject([row('עיצוב לוגו'), row('Negotiate with suppliers')], liveProject);
    expect(out).toHaveLength(2);

    const dup = out.find((r) => r.name === 'עיצוב לוגו')!;
    expect(dup.existingRef?.type).toBe('openMission');

    const fresh = out.find((r) => r.name === 'Negotiate with suppliers')!;
    expect(fresh.existingRef).toBeNull();
  });

  it('collapses rows the model repeated', () => {
    const out = dedupeAgainstProject([row('Build a website'), row('build a website  ')], ctx());
    expect(out).toHaveLength(1);
  });

  it('keeps same-named rows of different kinds', () => {
    const out = dedupeAgainstProject(
      [row('Camera'), row('Camera', { kind: 'resource' })],
      ctx()
    );
    expect(out).toHaveLength(2);
  });

  it('puts new must-rows first and already-existing rows last', () => {
    const out = dedupeAgainstProject(
      [
        row('עיצוב לוגו', { imp: 'must' }), // duplicate of an open mission
        row('Nice to have', { imp: 'nice' }),
        row('Critical new thing', { imp: 'must' })
      ],
      liveProject
    );
    expect(out.map((r) => r.name)).toEqual([
      'Critical new thing',
      'Nice to have',
      'עיצוב לוגו'
    ]);
  });

  it('renumbers order to match the final sequence', () => {
    const out = dedupeAgainstProject(
      [row('a', { order: 7 }), row('b', { order: 3 })],
      ctx()
    );
    expect(out.map((r) => r.order)).toEqual([0, 1]);
  });

  it('never mutates the input rows', () => {
    const input = [row('עיצוב לוגו')];
    dedupeAgainstProject(input, liveProject);
    expect(input[0].existingRef).toBeNull();
  });
});
