/**
 * createComplexMatanot — how a recipe line links to what it stands for.
 *
 * A line either proposes something new (a Pendm / Pmash the rikma votes on
 * with the product) or points at a mission / resource the rikma already has.
 * The rikma import creates a one-member rikma's rows first and sends their ids
 * (materialize.ts), so a line that links must never open a vote — and a link
 * to another rikma's open mission must fail before anything is written.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/money/normalizeEntry.js', () => ({
  ENTRY_CURRENCY_PARAM: { type: 'string', required: false },
  entryFields: () => ({}),
  normalizeEntry: async ({ amounts }: { amounts: Record<string, number> }) => ({
    values: amounts,
    entryRate: null,
    entryCurrency: null,
    currency: 'ILS'
  })
}));

import { createComplexMatanotConfig } from './createComplexMatanot.js';

const handler = createComplexMatanotConfig.graphqlOperation as (
  params: Record<string, any>,
  context: any,
  util: any
) => Promise<any>;

const context = { userId: '5', jwt: 'jwt', fetch: (() => {}) as any };

function fakeStrapi({ members = 1, openMissions = {}, openMashaabims = {} }: {
  members?: number;
  openMissions?: Record<string, any>;
  openMashaabims?: Record<string, any>;
} = {}) {
  let n = 500;
  const execute = vi.fn(async (qid: string, vars: Record<string, any>) => {
    switch (qid) {
      case '3projectJSONQue':
        return { data: { project: { data: { attributes: { user_1s: { data: Array.from({ length: members }, (_, i) => ({ id: String(i + 5) })) } } } } } };
      case '91createPartof':
        return { data: { createPartof: { data: { id: '1' } } } };
      case '2forumCrBasic':
        return { data: { createForum: { data: { id: '2' } } } };
      case '92updateForumSubject':
        return {};
      case '136createMatanot':
        return { data: { createMatanot: { data: { id: '300' } } } };
      case '384getRecipeOpenMission':
        return { data: { openMission: { data: openMissions[vars.id] ? { id: vars.id, attributes: openMissions[vars.id] } : null } } };
      case '385getRecipeOpenMashaabim':
        return { data: { openMashaabim: { data: openMashaabims[vars.id] ? { id: vars.id, attributes: openMashaabims[vars.id] } : null } } };
      case '137createPendmForRecipe':
        return { data: { createPendm: { data: { id: String(++n) } } } };
      case '138createPmashForRecipe':
        return { data: { createPmash: { data: { id: String(++n) } } } };
      case '125createMatanotRecipeMission':
        return { data: { createMatanotRecipeMission: { data: { id: String(++n) } } } };
      case '128createMatanotRecipeResource':
        return { data: { createMatanotRecipeResource: { data: { id: String(++n) } } } };
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  });
  const varsOf = (qid: string) => execute.mock.calls.filter(([q]) => q === qid).map(([, v]) => v);
  return { strapi: { execute }, varsOf };
}

const base = { projectId: '90', name: 'סל לילה', pricingMode: 'estimated', estimatedPrice: 150 };

describe('createComplexMatanot — recipe lines', () => {
  it('links lines to rows that already exist and opens no vote', async () => {
    const { strapi, varsOf } = fakeStrapi({
      openMissions: { '32': { name: 'משמרות לילה', perhour: 50, noofhours: 120, iskvua: true, project: { data: { id: '90' } }, pendm: { data: null } } },
      openMashaabims: { '52': { name: 'מקרר', price: 3000, hm: 1, kindOf: 'total', project: { data: { id: '90' } }, pmash: { data: { id: '77' } } } }
    });
    await handler(
      {
        ...base,
        recipeMissions: [
          { name: 'הזמנות', mode: 'consumeExisting', mesimabetahalichId: '31', hoursPerUnit: 20, assignedMemberId: '5' },
          { name: 'משמרות לילה', mode: 'consumeExisting', openMissionId: '32', hoursPerUnit: 120 }
        ],
        recipeResources: [
          { name: 'שכירות', mode: 'consumeExisting', mashabetahalichId: '51', kindOf: 'monthly', pricePerUnit: 6000 },
          { name: 'מקרר', mode: 'consumeExisting', openMashaabimId: '52', kindOf: 'total', pricePerUnit: 3000 }
        ]
      },
      context,
      { strapi }
    );

    // The open mission had no proposal (opened directly): its record is written
    // already decided — archived, pointing at it — never as a vote.
    expect(varsOf('137createPendmForRecipe')).toEqual([
      expect.objectContaining({ name: 'משמרות לילה', archived: true, open_mission: '32', iskvua: true, perhour: 50, noofhours: 120 })
    ]);
    // The open resource came from a vote: its pmash is reused, nothing new.
    expect(varsOf('138createPmashForRecipe')).toEqual([]);

    expect(varsOf('125createMatanotRecipeMission')).toEqual([
      expect.objectContaining({ mesimabetahalich: '31', mode: 'consumeExisting', assignedMember: '5' }),
      expect.objectContaining({ pendm: '502', mode: 'consumeExisting' })
    ]);
    expect(varsOf('125createMatanotRecipeMission')[0]).not.toHaveProperty('pendm');
    expect(varsOf('128createMatanotRecipeResource')).toEqual([
      expect.objectContaining({ mashabetahalich: '51', kindOf: 'monthly', pricePerUnit: 6000, mode: 'consumeExisting' }),
      expect.objectContaining({ pmash: '77', mode: 'consumeExisting' })
    ]);
  });

  it("refuses another rikma's open mission before writing anything", async () => {
    const { strapi, varsOf } = fakeStrapi({
      openMissions: { '32': { name: 'x', project: { data: { id: '12' } }, pendm: { data: null } } }
    });
    await expect(
      handler({ ...base, recipeMissions: [{ openMissionId: '32', hoursPerUnit: 1 }] }, context, { strapi })
    ).rejects.toThrow(/not part of this rikma/);
    expect(varsOf('136createMatanot')).toEqual([]);
    expect(varsOf('91createPartof')).toEqual([]);
  });

  it('a new line is still a proposal, carrying who holds it and that it recurs', async () => {
    const { strapi, varsOf } = fakeStrapi({ members: 3 });
    const out = await handler(
      {
        ...base,
        recipeMissions: [{ name: 'הזמנות', mode: 'createNew', hoursPerUnit: 20, ratePerHour: 60, assignedMemberId: '5', iskvua: true }],
        recipeResources: [{ name: 'שכירות', mode: 'createNew', kindOf: 'monthly', pricePerUnit: 6000, assignedMemberId: '5', recurring: true }]
      },
      context,
      { strapi }
    );
    expect(out.statusOfVoting).toBe('voting');
    expect(varsOf('137createPendmForRecipe')).toEqual([
      expect.objectContaining({ name: 'הזמנות', rishon: '5', iskvua: true, perhour: 60, noofhours: 20 })
    ]);
    expect(varsOf('137createPendmForRecipe')[0]).not.toHaveProperty('archived');
    expect(varsOf('138createPmashForRecipe')).toEqual([
      expect.objectContaining({ name: 'שכירות', kindOf: 'monthly', price: 6000, recurring: true, cycleSize: 1, isSelfProposal: true, selfProposalUser: '5' })
    ]);
    expect(varsOf('138createPmashForRecipe')[0]).not.toHaveProperty('archived');
  });

  it('a one-off resource is not made recurring', async () => {
    const { strapi, varsOf } = fakeStrapi({ members: 3 });
    await handler(
      { ...base, recipeResources: [{ name: 'מקרר', kindOf: 'total', pricePerUnit: 3000, recurring: true }] },
      context,
      { strapi }
    );
    expect(varsOf('138createPmashForRecipe')[0]).not.toHaveProperty('recurring');
  });
});
