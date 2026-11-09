import { beforeEach, describe, expect, it, vi } from 'vitest';

const notify = vi.fn(async () => {});
vi.mock('$lib/server/actions/index.js', () => ({ strapiClient: { execute: vi.fn() }, serverNotifier: { notify: (...a: unknown[]) => (notify as any)(...a) } }));
const matchMission = vi.fn(async () => ({ created: 0 }));
const matchResource = vi.fn(async () => ({ created: 0 }));
const accept = vi.fn(async () => {});
vi.mock('$lib/server/actions/helpers/runResourceAskmAcceptance.js', () => ({ runResourceAskmAcceptance: (...a: unknown[]) => (accept as any)(...a) }));
vi.mock('$lib/server/matching/engine.js', () => ({
  matchOpenMissionToUsers: (...a: unknown[]) => (matchMission as any)(...a),
  matchOpenMashaabimToUsers: (...a: unknown[]) => (matchResource as any)(...a)
}));

import { withResourcePicks, applyBomTerms, bomField, bomLinksBelong, bomTermsLive, bomTermsSummary, resetBomTermsProbe } from './bomTerms';
import type { BomAddTerm, BomTerm } from '$lib/shop/bomEditor';

const addMission: BomAddTerm = {
  kind: 'add',
  line: 'mission',
  name: 'תפירה',
  amount: 2,
  units: 3,
  unit: 50,
  notes: 'בעבודת יד',
  resourceKind: null,
  mesimabetahalichId: null,
  pmashId: null,
  openMashaabimId: null,
  assignedMemberId: null,
  assigneeName: null
};
const addResource: BomAddTerm = { ...addMission, line: 'resource', name: 'בד', amount: 4, units: 1, unit: 25, resourceKind: 'good' };
const change: BomTerm = { kind: 'change', line: 'mission', id: '1', name: 'עיצוב', units: 3, held: true, fromAmount: 2, toAmount: 2, fromUnit: 100, toUnit: 120 };
const remove: BomTerm = { kind: 'remove', line: 'resource', id: '5', name: 'חוט', cost: 40, held: true };

function fakeStrapi(lines: { missions?: any[]; resources?: any[] } = {}) {
  const queries: string[] = [];
  const exec = vi.fn(async (q: string) => {
    queries.push(q);
    if (q.includes('matanot_recipe_missions(')) {
      return {
        data: {
          matanot: {
            data: {
              id: '10',
              attributes: {
                process: { data: { id: '77' } },
                matanot_recipe_missions: { data: lines.missions ?? [] },
                matanot_recipe_resources: { data: lines.resources ?? [] }
              }
            }
          }
        }
      };
    }
    const created = /mutation \{ (create\w+)/.exec(q)?.[1];
    if (created) return { data: { [created]: { data: { id: `${created}-id` } } } };
    return { data: {} };
  });
  return { exec, queries, mutations: () => queries.filter((q) => q.startsWith('mutation')) };
}

const missionRow = { id: '1', attributes: { hoursPerUnit: 2, unitsPerProduct: 3, ratePerHour: 100, pendm: { data: { attributes: { name: 'עיצוב' } } } } };
const resourceRow = { id: '5', attributes: { quantityPerUnit: 2, pricePerUnit: 20, pmash: { data: { attributes: { name: 'חוט' } } } } };

beforeEach(() => {
  notify.mockClear();
  accept.mockClear();
  matchMission.mockClear();
  matchResource.mockClear();
});

describe('bomTermsLive', () => {
  beforeEach(() => resetBomTermsProbe());

  it('reads "the field is not there" as no, and remembers it', async () => {
    const exec = vi.fn(async () => ({ errors: [{ message: 'Cannot query field "bom" on type' }] }));
    expect(await bomTermsLive(exec)).toBe(false);
    expect(await bomTermsLive(exec)).toBe(false);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('never reads another failure as an answer', async () => {
    await expect(bomTermsLive(async () => ({ errors: [{ message: 'Forbidden' }] }))).rejects.toThrow();
  });
});

describe('bomField', () => {
  it('writes nothing for no terms', () => {
    expect(bomField([])).toBeNull();
    expect(bomField(null)).toBeNull();
    expect(bomField([remove])).toContain('bom: [');
  });
});

describe('bomTermsSummary', () => {
  it('says each change in one line, with what it costs', () => {
    expect(bomTermsSummary([change, remove, addMission], 'he')).toBe('עיצוב בהרכב: 600 ← 720\nיוסר מההרכב: חוט\nנוסף להרכב: תפירה · 300');
    expect(bomTermsSummary([remove], 'en')).toBe('Removed from the recipe: חוט');
  });
});

describe('bomLinksBelong', () => {
  it('refuses a link into another rikma', async () => {
    const term = { ...addMission, mesimabetahalichId: '9' };
    const answer = (id: string) => async () => ({ data: { node: { data: { attributes: { project: { data: { id } } } } } } });
    expect(await bomLinksBelong(answer('57'), '57', [term])).toBe(true);
    expect(await bomLinksBelong(answer('99'), '57', [term])).toBe(false);
  });
});

describe('withResourcePicks', () => {
  const owned = { ...addResource, assignedMemberId: '5' };
  const own = (id: string) => async () => ({ data: { sp: { data: { attributes: { users_permissions_user: { data: { id } } } } } } });

  it('takes a resource of their own', async () => {
    expect((await withResourcePicks(own('5'), [owned], '5', [{ index: 0, spId: '44' }]))[0]).toMatchObject({ spId: '44' });
  });

  it('refuses someone else’s', async () => {
    await expect(withResourcePicks(own('9'), [owned], '5', [{ index: 0, spId: '44' }])).rejects.toThrow();
  });

  it('creates a new one from the line', async () => {
    const queries: string[] = [];
    const exec = async (q: string) => (queries.push(q), { data: { createSp: { data: { id: '77' } } } });
    expect((await withResourcePicks(exec, [owned], '5', [{ index: 0, create: { myp: 12 } }]))[0]).toMatchObject({ spId: '77' });
    expect(queries[0]).toContain('myp: 12');
  });

  it('wants an answer for each', async () => {
    await expect(withResourcePicks(own('5'), [owned], '5', [])).rejects.toThrow(/Choose/);
  });
});

describe('applyBomTerms', () => {
  it('moves a line’s numbers and keeps the row', async () => {
    const { exec, mutations } = fakeStrapi({ missions: [missionRow], resources: [resourceRow] });
    const r = await applyBomTerms(exec, { id: '10', projectId: '57' }, [change]);
    expect(r.changed).toEqual(['1']);
    expect(mutations()[0]).toContain('updateMatanotRecipeMission(id: "1"');
    expect(mutations()[0]).toContain('ratePerHour: 120');
    expect(mutations().some((q) => q.includes('delete'))).toBe(false);
  });

  it('detaches a removed line, and never deletes it', async () => {
    const { exec, mutations } = fakeStrapi({ resources: [resourceRow] });
    const r = await applyBomTerms(exec, { id: '10', projectId: '57' }, [remove]);
    expect(r.removed).toEqual(['5']);
    expect(mutations()[0]).toContain('updateMatanotRecipeResource(id: "5"');
    expect(mutations()[0]).toContain('matanot: null');
    expect(mutations()[0]).toContain('archived: true');
    expect(mutations().some((q) => q.includes('delete'))).toBe(false);
  });

  it('skips a line that left the product since the proposal', async () => {
    const { exec, mutations } = fakeStrapi();
    const r = await applyBomTerms(exec, { id: '10', projectId: '57' }, [change, remove]);
    expect(r).toMatchObject({ changed: [], removed: [], skipped: 2 });
    expect(mutations().filter((q) => q.includes('Recipe'))).toEqual([]);
  });

  it('opens a new mission at once, with the record a decided vote leaves', async () => {
    const { exec, mutations } = fakeStrapi();
    const r = await applyBomTerms(exec, { id: '10', projectId: '57' }, [addMission]);
    const [open, anchor, line] = mutations();
    expect(open).toContain('createOpenMission');
    expect(open).toContain('noofhours: 6');
    expect(anchor).toContain('createPendm');
    expect(anchor).toContain('archived: true');
    expect(anchor).toContain('open_mission: "createOpenMission-id"');
    expect(line).toContain('createMatanotRecipeMission');
    expect(line).toContain('pendm: "createPendm-id"');
    expect(line).toContain('mode: createNew');
    expect(line).toContain('partof: "77"');
    expect(r.added).toEqual(['createMatanotRecipeMission-id']);
    expect(matchMission).toHaveBeenCalledTimes(1);
  });

  it('opens a new resource the same way', async () => {
    const { exec, mutations } = fakeStrapi();
    await applyBomTerms(exec, { id: '10', projectId: '57' }, [addResource]);
    const [open, anchor, line] = mutations();
    expect(open).toContain('createOpenMashaabim');
    expect(open).toContain('kindOf: perUnit');
    expect(anchor).toContain('createPmash');
    expect(anchor).toContain('open_mashaabim: "createOpenMashaabim-id"');
    expect(line).toContain('createMatanotRecipeResource');
    expect(line).toContain('pmash: "createPmash-id"');
    expect(matchResource).toHaveBeenCalledTimes(1);
  });

  it('a mission whose owner signed the version starts on their name, with nothing left to ask', async () => {
    const { exec, mutations } = fakeStrapi();
    await applyBomTerms(exec, { id: '10', projectId: '57' }, [{ ...addMission, assignedMemberId: '5' }], { signerIds: ['7', '5'] });
    expect(mutations().find((q) => q.includes('createMesimabetahalich'))).toContain('users_permissions_user: "5"');
    const line = mutations().find((q) => q.includes('createMatanotRecipeMission'))!;
    expect(line).toContain('mesimabetahalich: "createMesimabetahalich-id"');
    expect(line).toContain('mode: createNew');
    expect(line).toContain('assignedMember: "5"');
    expect(mutations().some((q) => q.includes('createAsk') || q.includes('createOpenMission'))).toBe(false);
    expect(matchMission).not.toHaveBeenCalled();
  });

  it('a resource whose owner chose what they bring registers at once', async () => {
    const { exec, mutations } = fakeStrapi();
    await applyBomTerms(exec, { id: '10', projectId: '57' }, [{ ...addResource, assignedMemberId: '5', spId: '44' }], { signerIds: ['7', '5'], memberIds: ['7', '5'] });
    expect(mutations().find((q) => q.includes('createAskm'))).toContain('sp: "44"');
    expect(accept).toHaveBeenCalledTimes(1);
    expect((accept.mock.calls[0] as any[])[2]).toMatchObject({ spId: '44', acceptedUserId: '5', existingMemberIds: ['7', '5'] });
    expect(notify).not.toHaveBeenCalled();
  });

  it('a line for a running mission only links it, and opens nothing', async () => {
    const { exec, mutations, queries } = fakeStrapi();
    const base = exec.getMockImplementation()!;
    (exec as any).mockImplementation(async (q: string) =>
      q.includes('node: mesimabetahalich') ? { data: { node: { data: { attributes: { project: { data: { id: '57' } } } } } } } : base(q)
    );
    await applyBomTerms(exec, { id: '10', projectId: '57' }, [{ ...addMission, mesimabetahalichId: '9' }]);
    expect(queries.length).toBeGreaterThan(0);
    expect(mutations().some((q) => q.includes('createOpenMission'))).toBe(false);
    const line = mutations().find((q) => q.includes('createMatanotRecipeMission'));
    expect(line).toContain('mesimabetahalich: "9"');
    expect(line).toContain('mode: consumeExisting');
  });

  it('does not write a new line twice when a retry finds it standing', async () => {
    const standing = { id: '8', attributes: { hoursPerUnit: 2, unitsPerProduct: 3, ratePerHour: 50, pendm: { data: { attributes: { name: 'תפירה' } } } } };
    const { exec, mutations } = fakeStrapi({ missions: [standing] });
    const r = await applyBomTerms(exec, { id: '10', projectId: '57' }, [addMission]);
    expect(r).toMatchObject({ added: [], skipped: 1 });
    expect(mutations().some((q) => q.includes('createOpenMission'))).toBe(false);
  });

  it('the stored estimate follows the recipe', async () => {
    const { exec, mutations } = fakeStrapi({ missions: [missionRow], resources: [resourceRow] });
    await applyBomTerms(exec, { id: '10', projectId: '57' }, [change]);
    expect(mutations().at(-1)).toContain('updateMatanot(id: "10"');
    // Read back from the fake, which still answers with the stored 600 + 40.
    expect(mutations().at(-1)).toContain('estimatedPrice: 640');
  });
});
