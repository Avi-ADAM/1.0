/**
 * Stock from a resource against an in-memory Strapi (PLAN_SHOP_OPERATIONS A3):
 * a receipt is a cycle Maap in units that the giver must sign, a solo giver's
 * receipt settles at once, the threshold is anyone's and the accounting the
 * giver's, and a product link is an essence-only BOM row — never a price.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const executeAction = vi.fn(async () => ({ success: true, data: { done: true } }));
vi.mock('$lib/server/actions/index.js', () => ({ actionService: { executeAction } }));

import {
  linkProductResourceConfig,
  receiveStockConfig,
  setResourceStockConfig,
  unlinkProductResourceConfig
} from './stockResource.js';

type Row = Record<string, any>;
let resources: Map<string, Row>;
let recipes: Map<string, Row>;
let products: Map<string, Row>;
let members: string[];
let deployed: boolean;
let calls: { qid: string; vars: any }[];
let notified: { recipients: string[]; intent: string; title: string }[];
let nextId: number;

const rel = (id: string | null) => ({ data: id == null ? null : { id, attributes: { username: `u${id}` } } });

function resourceNode(id: string) {
  const r = resources.get(id)!;
  return {
    id,
    attributes: {
      name: r.name,
      recurring: r.recurring ?? false,
      lifecycle: r.lifecycle ?? null,
      pricePerUnit: r.pricePerUnit ?? null,
      kindOf: 'perUnit',
      quantityDelivered: r.delivered ?? null,
      quantityConsumed: r.consumed ?? null,
      lowStockAt: r.lowStockAt ?? null,
      accounting: r.accounting ?? null,
      users_permissions_user: rel(r.giver ?? null),
      project: { data: { id: r.project } },
      rikmash: { data: r.rikmash ? { id: r.rikmash } : null },
      maaps: { data: (r.cycles ?? []).map((c: number, i: number) => ({ id: `m${i}`, attributes: { cycleIndex: c } })) }
    }
  };
}

const strapi = {
  async execute(qid: string, vars: any) {
    calls.push({ qid, vars });
    switch (qid) {
      case 'stockResource': {
        if (!deployed) throw new Error('GRAPHQL_VALIDATION_FAILED: Cannot query field "quantityConsumed"');
        const r = resources.get(vars.id);
        return { data: { mashabetahaliches: { data: r && r.project === vars.pid ? [resourceNode(vars.id)] : [] } } };
      }
      case '128getProjectMembersAndRestime':
        return {
          data: {
            project: { data: { attributes: { restime: 'sth', user_1s: { data: members.map((id) => ({ id, attributes: { username: `u${id}` } })) } } } }
          }
        };
      case 'stockReceiptCreate':
        return { data: { createMaap: { data: { id: `maap${nextId++}` } } } };
      case 'mrCreateCycleTimegrama':
        return { data: { createTimegrama: { data: { id: 'tg1' } } } };
      case 'mrLinkMaapTimegrama':
      case 'mrUpdateCycleMaap':
      case 'mrSetTimegramaDone':
      case 'mrLinkRikmashToMashabetahalich':
        return {};
      case 'mrCreateRikmash':
        return { data: { createRikmash: { data: { id: 'rk1' } } } };
      case 'mrGetRikmashForDelivery':
        return { data: { rikmash: { data: { attributes: { total: 100, cyclesCount: 1, deliveries: [] } } } } };
      case 'mrUpdateRikmash':
        return {};
      case 'mrUpdateMashabetahalich': {
        const r = resources.get(vars.id)!;
        r.delivered = vars.data.quantityDelivered;
        return {};
      }
      case 'stockResourceSet':
        Object.assign(resources.get(vars.id)!, vars.data);
        return {};
      case 'stockProduct': {
        const p = products.get(vars.id);
        return {
          data: {
            matanots: {
              data:
                p && p.project === vars.pid
                  ? [{ id: vars.id, attributes: { name: p.name, product_variants: { data: (p.variants ?? []).map((v: string) => ({ id: v })) } } }]
                  : []
            }
          }
        };
      }
      case 'stockRecipesForProducts': {
        if (!deployed) throw new Error('GRAPHQL_VALIDATION_FAILED: Unknown field "product_variant"');
        const data = [...recipes.entries()]
          .filter(([, r]) => r.priceMode === 'none' && !r.archived && (vars.products as string[]).includes(r.product) && resources.get(r.resource)?.project === vars.pid)
          .map(([id, r]) => ({
            id,
            attributes: {
              priceMode: r.priceMode,
              quantityPerUnit: r.qpu,
              matanot: { data: { id: r.product } },
              product_variant: { data: r.variant ? { id: r.variant } : null },
              mashabetahalich: { data: { id: r.resource } }
            }
          }));
        return { data: { matanotRecipeResources: { data } } };
      }
      case 'stockRecipeCreate': {
        const id = String(600 + nextId++);
        recipes.set(id, {
          product: vars.data.matanot,
          resource: vars.data.mashabetahalich,
          variant: vars.data.product_variant ?? null,
          qpu: vars.data.quantityPerUnit,
          priceMode: vars.data.priceMode,
          mode: vars.data.mode
        });
        return { data: { createMatanotRecipeResource: { data: { id } } } };
      }
      case 'stockRecipeArchive':
        recipes.get(vars.id)!.archived = true;
        return {};
      case 'stockRecipe': {
        const r = recipes.get(vars.id);
        const fenced = r && resources.get(r.resource)?.project === vars.pid;
        return {
          data: {
            matanotRecipeResources: {
              data: fenced
                ? [{ id: vars.id, attributes: { priceMode: r.priceMode, archived: r.archived ?? null, mashabetahalich: { data: { id: r.resource } }, matanot: { data: { id: r.product } } } }]
                : []
            }
          }
        };
      }
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  }
};

const notifier = {
  async notify(config: any, params: any) {
    notified.push({ recipients: params.targetIds, intent: config.intent, title: config.templates.title.en });
  }
};

const call = (config: any, params: Record<string, unknown>, userId = '7') =>
  config.graphqlOperation({ projectId: '57', ...params }, { userId, jwt: undefined, fetch: undefined }, { strapi, notifier });

const qids = () => calls.map((c) => c.qid);
const varsOf = (qid: string) => calls.find((c) => c.qid === qid)?.vars;

beforeEach(() => {
  resources = new Map([
    // Jars Dana (7) gives; 13 received at most, 3 cycles so far.
    ['40', { name: 'צנצנות', project: '57', giver: '7', pricePerUnit: 4, delivered: 100, consumed: 93, cycles: [1, 3, 2] }],
    ['41', { name: 'שכירות', project: '57', giver: '7', recurring: true }],
    ['42', { name: 'בד', project: '57', giver: null, pricePerUnit: 30 }],
    ['50', { name: 'של רקמה אחרת', project: '58', giver: '7' }]
  ]);
  recipes = new Map([['500', { product: '10', resource: '40', variant: null, qpu: 1, priceMode: 'none' }], ['509', { product: '10', resource: '40', variant: null, qpu: 2, priceMode: 'fixed' }]]);
  products = new Map([
    ['10', { name: 'דבש', project: '57', variants: ['77', '78'] }],
    ['99', { name: 'זר', project: '58', variants: [] }]
  ]);
  members = ['7', '8', '9'];
  deployed = true;
  calls = [];
  notified = [];
  nextId = 1;
  executeAction.mockClear();
});

describe('receiveStock', () => {
  it('refuses nothing, a recurring resource, one with no giver, and another rikma’s', async () => {
    await expect(call(receiveStockConfig, { resourceId: '40', quantity: 0 })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(call(receiveStockConfig, { resourceId: '41', quantity: 5 })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(call(receiveStockConfig, { resourceId: '42', quantity: 5 })).rejects.toMatchObject({ code: 'NO_GIVER' });
    await expect(call(receiveStockConfig, { resourceId: '50', quantity: 5 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(qids()).not.toContain('stockReceiptCreate');
  });

  it('answers NOT_READY, writing nothing, until the A3 fields deploy', async () => {
    deployed = false;
    await expect(call(receiveStockConfig, { resourceId: '40', quantity: 5 })).rejects.toMatchObject({ code: 'NOT_READY' });
    expect(qids()).toEqual(['stockResource']);
  });

  it('a member’s receipt is a cycle Maap in units, on the clock, waiting for the giver', async () => {
    const before = Date.now();
    const out = await call(receiveStockConfig, { resourceId: '40', quantity: 50, unitPrice: 4.5 }, '8');
    const data = varsOf('stockReceiptCreate').data;
    expect(data).toMatchObject({
      name: 'צנצנות · +50 × 4.5',
      project: '57',
      mashabetahalich: '40',
      cycleIndex: 4,
      quantityDelivered: 50,
      unit: 'unit',
      unitPrice: 4.5,
      isSelfProposal: false,
      archived: false
    });
    // The reporter's yes, in round 0 like a recurring month — not the giver's.
    expect(data.vots).toEqual([expect.objectContaining({ what: true, users_permissions_user: '8', order: 0 })]);
    // restime `sth` = 72 hours.
    const due = Date.parse(varsOf('mrCreateCycleTimegrama').date);
    expect(due - before).toBeGreaterThanOrEqual(72 * 3600_000 - 1000);
    expect(due - before).toBeLessThanOrEqual(72 * 3600_000 + 5000);
    expect(varsOf('mrLinkMaapTimegrama')).toEqual({ id: 'maap1', timegrama: 'tg1' });
    expect(out).toMatchObject({ maapId: 'maap1', quantity: 50, unitPrice: 4.5, value: 225, settled: false, waitingForGiver: true, onHand: 7 });
    // Nothing settles here: the shelf and the giver's share wait for the clock.
    expect(qids()).not.toContain('mrUpdateMashabetahalich');
    // The rest of the rikma may object; the giver is asked to sign.
    expect(notified).toEqual([
      { recipients: ['9'], intent: 'review', title: expect.stringContaining('Stock received') },
      { recipients: ['7'], intent: 'consent', title: expect.stringContaining('Your signature is needed') }
    ]);
  });

  it('takes the resource’s price when none is given — and price 0 is an opening count', async () => {
    const out = await call(receiveStockConfig, { resourceId: '40', quantity: 10 });
    expect(out.unitPrice).toBe(4);
    expect(varsOf('stockReceiptCreate').data.name).toBe('צנצנות · +10 × 4');
    calls = [];
    const opening = await call(receiveStockConfig, { resourceId: '40', quantity: 100, unitPrice: 0 });
    expect(opening).toMatchObject({ unitPrice: 0, value: 0 });
    expect(varsOf('stockReceiptCreate').data).toMatchObject({ name: 'צנצנות · +100', unitPrice: 0, isSelfProposal: true });
  });

  it('a solo rikma’s giver has everyone’s signature — it settles at once', async () => {
    members = ['7'];
    const out = await call(receiveStockConfig, { resourceId: '40', quantity: 20, unitPrice: 4 });
    expect(out).toMatchObject({ settled: true, deadline: null, waitingForGiver: false, onHand: 27 });
    // The shelf grows by the units, the giver's Rikmash by their value.
    expect(varsOf('mrUpdateMashabetahalich')).toEqual({ id: '40', data: { quantityDelivered: 120 } });
    expect(varsOf('mrCreateRikmash').data).toMatchObject({ total: 80, users_permissions_user: '7' });
    expect(varsOf('mrUpdateCycleMaap').data).toMatchObject({ archived: true, quantityDelivered: 20 });
    expect(varsOf('mrSetTimegramaDone')).toEqual({ id: 'tg1', done: true });
    expect(notified).toEqual([]);
  });

  it('closes the purchase act it answers', async () => {
    const out = await call(receiveStockConfig, { resourceId: '40', quantity: 5, actId: '300' });
    expect(executeAction).toHaveBeenCalledWith('completeFulfillmentAct', { projectId: '57', actId: '300' }, expect.anything());
    expect(out.act).toEqual({ actId: '300', done: true });
  });
});

describe('setResourceStock', () => {
  it('any member sets — or clears — the low-stock threshold', async () => {
    const out = await call(setResourceStockConfig, { resourceId: '40', lowStockAt: 12 }, '9');
    expect(varsOf('stockResourceSet')).toEqual({ id: '40', data: { lowStockAt: 12 } });
    expect(out).toMatchObject({ lowStockAt: 12, onHand: 7 });
    calls = [];
    await call(setResourceStockConfig, { resourceId: '40', lowStockAt: null }, '9');
    expect(varsOf('stockResourceSet')).toEqual({ id: '40', data: { lowStockAt: null } });
  });

  it('how the giver is credited is the giver’s to say', async () => {
    await expect(call(setResourceStockConfig, { resourceId: '40', accounting: 'perUse' }, '9')).rejects.toMatchObject({ code: 'NOT_GIVER' });
    const out = await call(setResourceStockConfig, { resourceId: '40', accounting: 'perUse' }, '7');
    expect(out.accounting).toBe('perUse');
  });

  it('refuses nothing to change and a resource with no shelf', async () => {
    await expect(call(setResourceStockConfig, { resourceId: '40' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(call(setResourceStockConfig, { resourceId: '41', lowStockAt: 3 })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});

describe('linkProductResource / unlinkProductResource', () => {
  it('writes an essence-only row — what a unit takes, never what it costs', async () => {
    const out = await call(linkProductResourceConfig, { resourceId: '40', productId: '10', variantId: '77', quantityPerUnit: 2 });
    expect(out).toMatchObject({ updated: false, variantId: '77', quantityPerUnit: 2 });
    expect(varsOf('stockRecipeCreate').data).toMatchObject({
      matanot: '10',
      mashabetahalich: '40',
      product_variant: '77',
      quantityPerUnit: 2,
      priceMode: 'none',
      mode: 'consumeExisting'
    });
  });

  it('linking again with another quantity archives the old link and writes a new one', async () => {
    const out = await call(linkProductResourceConfig, { resourceId: '40', productId: '10', quantityPerUnit: 3 });
    expect(out).toMatchObject({ updated: true, replaced: '500', quantityPerUnit: 3 });
    expect(out.recipeId).not.toBe('500');
    expect(recipes.get('500')).toMatchObject({ archived: true, qpu: 1 });
    expect(recipes.get(out.recipeId)!.qpu).toBe(3);
  });

  it('linking again with the same quantity writes nothing', async () => {
    const out = await call(linkProductResourceConfig, { resourceId: '40', productId: '10', quantityPerUnit: 1 });
    expect(out).toMatchObject({ recipeId: '500', updated: false });
    expect(qids()).not.toContain('stockRecipeCreate');
    expect(qids()).not.toContain('stockRecipeArchive');
  });

  it('names only this rikma’s products and their own variants', async () => {
    await expect(call(linkProductResourceConfig, { resourceId: '40', productId: '99', quantityPerUnit: 1 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(call(linkProductResourceConfig, { resourceId: '40', productId: '10', variantId: '5', quantityPerUnit: 1 })).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
    await expect(call(linkProductResourceConfig, { resourceId: '40', productId: '10', quantityPerUnit: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED'
    });
  });

  it('unlinks a stock link by archiving it — never a delete — and leaves a priced BOM row to the product editor', async () => {
    await expect(call(unlinkProductResourceConfig, { recipeId: '509' })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
    expect(recipes.get('509')!.archived).toBeFalsy();
    const out = await call(unlinkProductResourceConfig, { recipeId: '500' });
    expect(out).toEqual({ recipeId: '500', resourceId: '40', productId: '10', removed: true });
    expect(recipes.get('500')).toMatchObject({ archived: true });
    expect(varsOf('stockRecipeArchive')).toMatchObject({ id: '500', at: expect.any(String) });
  });

  it('an archived link no longer takes from the shelf, and unlinking it again writes nothing', async () => {
    await call(unlinkProductResourceConfig, { recipeId: '500' });
    calls.length = 0;
    await call(unlinkProductResourceConfig, { recipeId: '500' });
    expect(qids()).not.toContain('stockRecipeArchive');
    const out = await call(linkProductResourceConfig, { resourceId: '40', productId: '10', quantityPerUnit: 1 });
    expect(out).toMatchObject({ updated: false });
    expect(out.recipeId).not.toBe('500');
  });
});
