/**
 * Stock from a resource — the actions (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.4, A3).
 *
 *   receiveStock          — "I bought another 50 jars at 4": a supply portion,
 *                           a cycle `Maap` on the resource the rikma already
 *                           has (not open_mashaabim → askm → maap again). The
 *                           shelf grows by the units and the giver's Rikmash by
 *                           their value once it settles — by everyone's yes,
 *                           or by silence within restime once the giver signed
 *                           (PLAN_TIMEGRAMA D1: only the giver knows the figure).
 *                           An opening count of what was already credited is
 *                           the same receipt at price 0.
 *   setResourceStock      — the low-stock threshold (any member) and how the
 *                           resource is accounted (its giver only).
 *   linkProductResource   — "every jar of honey takes one jar": an essence-only
 *                           BOM row (`priceMode: 'none'`), optionally for one
 *                           variant. It never prices anything (bomPrice.ts).
 *   unlinkProductResource — remove such a row; priced BOM rows are not touched here.
 *
 * Every Strapi call is a serviceAdmin qid (qidsFulfillment.js); the checks
 * below are the gate. Until `1.0b` deploys the A3 fields every read fails and
 * the action answers NOT_READY instead of writing half a thing.
 */
import type { ActionConfig, ActionContext, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { decisionScope, scope, scopeList } from '$lib/realtime/scopes.js';
import { calcDeadlineMs } from './actionUtils.js';
import {
  onHandOf,
  receiptName,
  receiptValue,
  recipeRowOf,
  stockResourceOf,
  type RecipeRow,
  type StockResource
} from '$lib/fulfillment/stock';
import { settleCycleMaap } from '$lib/server/recurring/settleCycleMaap';

type Strapi = { execute: (qid: string, vars: any, jwt?: any, fetchFn?: any) => Promise<any> };
type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

const runner = (strapi: Strapi, context: ActionContext): Run => (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch);

async function runAction(key: string, params: Record<string, any>, context: ActionContext) {
  const { actionService } = await import('$lib/server/actions/index.js');
  return actionService.executeAction(key, params, context);
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;
const ENTITY_ID = /^\d{1,12}$/;
const idParam = (v: unknown): string | null => {
  const s = v == null ? '' : String(v).trim();
  return ENTITY_ID.test(s) ? s : null;
};
const numParam = (v: unknown): number | null => (v == null || v === '' ? null : Number(v));

/** The resource, fenced to the rikma. NOT_READY when the A3 fields are not deployed. */
async function loadResource(run: Run, projectId: string, resourceId: string): Promise<{ node: any; resource: StockResource }> {
  let node: any;
  try {
    const res = await run('stockResource', { pid: projectId, id: resourceId });
    node = res?.data?.mashabetahaliches?.data?.[0];
  } catch (e) {
    console.warn('[stock] resource unavailable (schema not deployed?):', (e as Error)?.message ?? e);
    throw new ActionError('NOT_READY', 'Stock from resources is not available yet');
  }
  const resource = node ? stockResourceOf(node) : null;
  if (!node || !resource || node.attributes?.lifecycle === 'archived') {
    throw new ActionError('NOT_FOUND', `No resource ${resourceId} in this rikma`);
  }
  return { node, resource };
}

const fmtDeadline = (iso: string, lang: 'he' | 'en') => {
  try {
    return new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', {
      timeZone: 'Asia/Jerusalem',
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const fmtNum = (n: number) => String(round3(n));

// ── receiveStock ──────────────────────────────────────────────────────────────

const receiveStock: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const projectId = String(params.projectId);
  const actor = String(context.userId);
  const run = runner(strapi, context);

  const resourceId = idParam(params.resourceId);
  if (!resourceId) throw new ActionError('VALIDATION_FAILED', 'resourceId is required');
  const rawQuantity = numParam(params.quantity);
  const quantity = rawQuantity == null ? NaN : round3(rawQuantity);
  if (!(Number.isFinite(quantity) && quantity > 0 && quantity <= 1_000_000)) {
    throw new ActionError('VALIDATION_FAILED', 'quantity must be a number above 0');
  }
  const givenPrice = numParam(params.unitPrice);
  if (givenPrice != null && !(Number.isFinite(givenPrice) && givenPrice >= 0 && givenPrice <= 10_000_000)) {
    throw new ActionError('VALIDATION_FAILED', 'unitPrice must be 0 or more');
  }

  const { node, resource } = await loadResource(run, projectId, resourceId);
  const attrs = node.attributes ?? {};
  if (attrs.recurring === true) {
    throw new ActionError('VALIDATION_FAILED', 'A recurring resource settles month by month — it has no shelf to receive into');
  }
  const giverId = resource.responsibleId;
  if (!giverId) {
    // D1: a receipt settles only with its giver's signature — with nobody to sign it would never count.
    throw new ActionError('NO_GIVER', 'This resource has no member responsible for it, so a receipt could never be signed');
  }
  // Always a number on the receipt: `unitPrice` is what tells a supply portion
  // from a recurring month when it settles (receiptValueOf). 0 = an opening count.
  const unitPrice = givenPrice ?? resource.pricePerUnit ?? 0;
  const value = receiptValue(quantity, unitPrice, resource.pricePerUnit);
  const cycleIndex =
    (attrs.maaps?.data ?? []).reduce((mx: number, m: any) => Math.max(mx, Number(m?.attributes?.cycleIndex ?? 0) || 0), 0) + 1;

  const projectRes = await run('128getProjectMembersAndRestime', { pid: projectId });
  const project = projectRes?.data?.project?.data?.attributes ?? {};
  const memberIds: string[] = (project.user_1s?.data ?? []).map((u: any) => String(u.id));
  const nameOf = (id: string) => (project.user_1s?.data ?? []).find((u: any) => String(u.id) === id)?.attributes?.username ?? null;
  const now = new Date();
  const deadline = new Date(now.getTime() + calcDeadlineMs(project.restime ?? 'feh')).toISOString();
  const isGiver = actor === giverId;

  // Rounds start at 0, as a recurring month's do (voteOnMaap / submitNegoMaap).
  const vots = [{ what: true, users_permissions_user: actor, order: 0, ide: parseInt(actor, 10), zman: now.toISOString() }];
  // The heart's receipt card reads the price back from the name (receiptPriceOf).
  const name = receiptName(resource.name, quantity, unitPrice);

  let maapId: string | null = null;
  try {
    const res = await run('stockReceiptCreate', {
      data: {
        name,
        project: projectId,
        mashabetahalich: resource.id,
        cycleIndex,
        quantityDelivered: quantity,
        unit: 'unit',
        unitPrice,
        isSelfProposal: isGiver,
        vots,
        archived: false,
        publishedAt: now.toISOString()
      }
    });
    const id = res?.data?.createMaap?.data?.id;
    maapId = id != null ? String(id) : null;
  } catch (e) {
    console.warn('[stock] receipt not created (schema not deployed?):', (e as Error)?.message ?? e);
    throw new ActionError('NOT_READY', 'Receiving stock is not available yet');
  }
  if (!maapId) throw new Error('Failed to create the stock receipt');

  // The clock — the same finalizer as a recurring month (timegrama `maap`).
  let timegramaId: string | null = null;
  try {
    const tg = await run('mrCreateCycleTimegrama', { date: deadline, maapId });
    const id = tg?.data?.createTimegrama?.data?.id;
    timegramaId = id != null ? String(id) : null;
    if (timegramaId) await run('mrLinkMaapTimegrama', { id: maapId, timegrama: timegramaId });
  } catch (e) {
    console.error('[stock] the receipt has no clock — it settles only by everyone signing:', maapId, e);
  }

  // A solo rikma whose only member gives the resource: everyone has signed.
  let settled = false;
  if (isGiver && memberIds.length === 1 && memberIds[0] === actor) {
    await settleCycleMaap(
      strapi,
      { jwt: context.jwt, fetch: context.fetch },
      {
        maapId,
        projectId,
        mashId: resource.id,
        mashAttrs: attrs,
        maapName: name,
        cycleIndex,
        spend: quantity,
        value,
        note: `${fmtNum(quantity)} × ${fmtNum(unitPrice)}`,
        vots,
        confirmedBy: actor,
        timegramaId,
        now
      }
    );
    settled = true;
  }

  // The purchase act this receipt answers, when it came from one.
  let act: { actId: string; done: boolean; error?: string } | null = null;
  const actId = idParam(params.actId);
  if (actId) {
    const r = await runAction('completeFulfillmentAct', { projectId, actId }, context);
    act = r.success ? { actId, done: true } : { actId, done: false, error: r.error?.message };
  }

  if (!settled && notifier) {
    const who = nameOf(actor) ?? '';
    const giverName = nameOf(giverId) ?? '';
    const valueLine = {
      he: unitPrice > 0 ? ` (${fmtNum(unitPrice)} ליחידה, סה״כ ${fmtNum(value)})` : ' (ספירת פתיחה, בלי שווי חדש)',
      en: unitPrice > 0 ? ` (${fmtNum(unitPrice)} per unit, ${fmtNum(value)} in all)` : ' (an opening count, no new value)'
    };
    const url = `/moach/${projectId}/votes`;
    const others = memberIds.filter((m) => m !== actor && m !== giverId);
    try {
      if (others.length) {
        await notifier.notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'targetIds', projectIdParam: 'projectId' } },
            templates: {
              title: { he: `📦 קליטת מלאי: ${resource.name} +${fmtNum(quantity)}`, en: `📦 Stock received: ${resource.name} +${fmtNum(quantity)}` },
              body: {
                he: `${who} דיווח/ה על קליטה של ${fmtNum(quantity)} יח׳${valueLine.he}. אם אין התנגדות עד ${fmtDeadline(deadline, 'he')} והנותן/ת חתם/ה — המלאי נכנס והשווי נזקף ל${giverName}.`,
                en: `${who} reported receiving ${fmtNum(quantity)} units${valueLine.en}. With no objection by ${fmtDeadline(deadline, 'en')} and the giver's signature, it goes on the shelf and the value is credited to ${giverName}.`
              }
            },
            intent: 'review',
            metadata: { type: 'stockReceipt', url, priority: 'normal' }
          },
          { projectId, targetIds: others },
          null,
          context
        );
      }
      if (!isGiver) {
        await notifier.notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'targetIds', projectIdParam: 'projectId' } },
            templates: {
              title: { he: `📦 נדרשת החתימה שלך: ${resource.name} +${fmtNum(quantity)}`, en: `📦 Your signature is needed: ${resource.name} +${fmtNum(quantity)}` },
              body: {
                he: `${who} דיווח/ה שהתקבלו ${fmtNum(quantity)} יח׳ של "${resource.name}" שאת/ה נותן/ת${valueLine.he}. בלי החתימה שלך זה לא ייכנס — אפשר לאשר או להציע כמות אחרת.`,
                en: `${who} reported receiving ${fmtNum(quantity)} units of "${resource.name}", which you give${valueLine.en}. It does not count without your signature — approve it or propose another figure.`
              }
            },
            intent: 'consent',
            metadata: { type: 'stockReceipt', url, priority: 'high' }
          },
          { projectId, targetIds: [giverId] },
          null,
          context
        );
      }
    } catch (err) {
      console.warn('[stock] receipt notification failed:', err);
    }
  }

  return {
    maapId,
    resourceId: resource.id,
    quantity,
    unitPrice,
    value,
    deadline: settled ? null : deadline,
    settled,
    waitingForGiver: !settled && !isGiver,
    onHand: settled ? round3(onHandOf(resource) + quantity) : onHandOf(resource),
    act
  };
};

// ── setResourceStock ──────────────────────────────────────────────────────────

const setStock: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const actor = String(context.userId);
  const run = runner(strapi, context);
  const resourceId = idParam(params.resourceId);
  if (!resourceId) throw new ActionError('VALIDATION_FAILED', 'resourceId is required');
  const { node, resource } = await loadResource(run, projectId, resourceId);
  if (node.attributes?.recurring === true) {
    throw new ActionError('VALIDATION_FAILED', 'A recurring resource has no shelf');
  }

  const data: Record<string, unknown> = {};
  if ('lowStockAt' in params) {
    const low = numParam(params.lowStockAt);
    if (low != null && !(Number.isFinite(low) && low >= 0 && low <= 1_000_000)) {
      throw new ActionError('VALIDATION_FAILED', 'lowStockAt must be 0 or more (or empty to clear it)');
    }
    data.lowStockAt = low == null ? null : round3(low);
  }
  if (params.accounting != null) {
    if (params.accounting !== 'owned' && params.accounting !== 'perUse') {
      throw new ActionError('VALIDATION_FAILED', 'accounting must be owned or perUse');
    }
    // How the giver is credited is the giver's to say.
    if (params.accounting !== resource.accounting && resource.responsibleId !== actor) {
      throw new ActionError('NOT_GIVER', 'Only the member who gives this resource can change how it is accounted');
    }
    data.accounting = params.accounting;
  }
  if (Object.keys(data).length === 0) throw new ActionError('VALIDATION_FAILED', 'Nothing to change');
  await run('stockResourceSet', { id: resource.id, data });
  const after = { ...resource, ...(data as Partial<StockResource>) };
  return { resourceId: resource.id, lowStockAt: after.lowStockAt ?? null, accounting: after.accounting, onHand: onHandOf(after) };
};

// ── link / unlink a product ───────────────────────────────────────────────────

const linkProduct: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const run = runner(strapi, context);
  const resourceId = idParam(params.resourceId);
  const productId = idParam(params.productId);
  if (!resourceId || !productId) throw new ActionError('VALIDATION_FAILED', 'resourceId and productId are required');
  const variantId = params.variantId == null || params.variantId === '' ? null : idParam(params.variantId);
  if (params.variantId != null && params.variantId !== '' && !variantId) throw new ActionError('VALIDATION_FAILED', 'variantId is not valid');
  const rawQ = numParam(params.quantityPerUnit);
  const quantityPerUnit = rawQ == null ? NaN : round3(rawQ);
  if (!(Number.isFinite(quantityPerUnit) && quantityPerUnit > 0 && quantityPerUnit <= 100_000)) {
    throw new ActionError('VALIDATION_FAILED', 'quantityPerUnit must be a number above 0');
  }

  const { node, resource } = await loadResource(run, projectId, resourceId);
  if (node.attributes?.recurring === true) {
    throw new ActionError('VALIDATION_FAILED', 'A recurring resource has no shelf for a product to take from');
  }

  const productRes = await run('stockProduct', { pid: projectId, id: productId });
  const product = productRes?.data?.matanots?.data?.[0];
  if (!product) throw new ActionError('NOT_FOUND', 'That product is not of this rikma');
  if (variantId) {
    const variants = (product.attributes?.product_variants?.data ?? []).map((v: any) => String(v.id));
    if (!variants.includes(variantId)) throw new ActionError('NOT_FOUND', 'That variant is not of this product');
  }

  // One row per product × variant × resource: linking again changes the quantity.
  let existing: RecipeRow | null = null;
  try {
    const res = await run('stockRecipesForProducts', { pid: projectId, products: [productId] });
    existing =
      (res?.data?.matanotRecipeResources?.data ?? [])
        .map(recipeRowOf)
        .find((r: RecipeRow | null) => !!r && r.resourceId === resource.id && (r.variantId ?? null) === variantId) ?? null;
  } catch (e) {
    console.warn('[stock] recipes unavailable (schema not deployed?):', (e as Error)?.message ?? e);
    throw new ActionError('NOT_READY', 'Stock from resources is not available yet');
  }

  if (existing) {
    await run('stockRecipeUpdate', { id: existing.id, data: { quantityPerUnit } });
    return { recipeId: existing.id, resourceId: resource.id, productId, variantId, quantityPerUnit, updated: true };
  }
  const res = await run('stockRecipeCreate', {
    data: {
      matanot: productId,
      mashabetahalich: resource.id,
      ...(variantId ? { product_variant: variantId } : {}),
      quantityPerUnit,
      // Essence only: what a unit takes off the shelf — never what it costs.
      priceMode: 'none',
      mode: 'consumeExisting',
      kindOf: 'perUnit',
      publishedAt: new Date().toISOString()
    }
  });
  const id = res?.data?.createMatanotRecipeResource?.data?.id;
  if (!id) throw new Error('Failed to link the product to the resource');
  return { recipeId: String(id), resourceId: resource.id, productId, variantId, quantityPerUnit, updated: false };
};

const unlinkProduct: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const run = runner(strapi, context);
  const recipeId = idParam(params.recipeId);
  if (!recipeId) throw new ActionError('VALIDATION_FAILED', 'recipeId is required');
  let row: any;
  try {
    const res = await run('stockRecipe', { pid: projectId, id: recipeId });
    row = res?.data?.matanotRecipeResources?.data?.[0];
  } catch (e) {
    console.warn('[stock] recipe unavailable (schema not deployed?):', (e as Error)?.message ?? e);
    throw new ActionError('NOT_READY', 'Stock from resources is not available yet');
  }
  if (!row) throw new ActionError('NOT_FOUND', `No stock link ${recipeId} in this rikma`);
  // A priced row is part of a product's price — that is the product editor's, not this.
  if (row.attributes?.priceMode !== 'none') {
    throw new ActionError('NOT_ALLOWED', 'Only a stock link (essence only) can be removed here');
  }
  await run('stockRecipeDelete', { id: recipeId });
  return {
    recipeId,
    resourceId: row.attributes?.mashabetahalich?.data?.id != null ? String(row.attributes.mashabetahalich.data.id) : null,
    productId: row.attributes?.matanot?.data?.id != null ? String(row.attributes.matanot.data.id) : null,
    removed: true
  };
};

// ── configs ───────────────────────────────────────────────────────────────────

const memberRules = (what: string) => [
  { type: 'jwt' as const, errorMessage: `Must be authenticated to ${what}` },
  {
    type: 'projectMember' as const,
    config: { projectIdParam: 'projectId' },
    errorMessage: `Only rikma members can ${what}`
  }
];

export const receiveStockConfig: ActionConfig = {
  key: 'receiveStock',
  description:
    "Receive stock into a resource the rikma has (\"bought another 50 jars at 4\"): a supply portion — a cycle Maap with the units and their value — that settles by everyone's yes, or by silence within restime once the resource's giver signed. The shelf grows by the units and the giver's contribution by their value. Price 0 = an opening count of what was already credited.",
  graphqlOperation: receiveStock,
  paramSchema: {
    projectId: { type: 'string', required: true },
    resourceId: { type: 'string', required: true },
    quantity: { type: 'number', required: true, description: 'Units received (above 0)' },
    unitPrice: { type: 'number', required: false, description: "Price per unit; absent = the resource's price; 0 = an opening count" },
    actId: { type: 'string', required: false, description: 'The purchase act this receipt answers — completed with it' }
  },
  authRules: memberRules('receive stock'),
  realtime: {
    scopes: (p, r) => scopeList([scope('project', p.projectId), scope('resource', p.resourceId), decisionScope('maap', r?.data?.maapId ?? r?.maapId)])
  }
};

export const setResourceStockConfig: ActionConfig = {
  key: 'setResourceStock',
  description:
    "Set a resource's low-stock threshold (any member; empty clears it) and how it is accounted — owned or perUse (its giver only).",
  graphqlOperation: setStock,
  paramSchema: {
    projectId: { type: 'string', required: true },
    resourceId: { type: 'string', required: true },
    lowStockAt: { type: 'number', required: false, description: 'At or below this, the resource is low (null clears it)' },
    accounting: { type: 'string', required: false, description: 'owned | perUse — the giver only' }
  },
  authRules: memberRules('change a resource’s stock settings'),
  realtime: { scopes: (p) => scopeList([scope('project', p.projectId), scope('resource', p.resourceId)]) }
};

export const linkProductResourceConfig: ActionConfig = {
  key: 'linkProductResource',
  description:
    'Say what a product (or one variant of it) takes off a resource’s shelf per unit sold — an essence-only BOM row that never prices anything. Linking again changes the quantity.',
  graphqlOperation: linkProduct,
  paramSchema: {
    projectId: { type: 'string', required: true },
    resourceId: { type: 'string', required: true },
    productId: { type: 'string', required: true },
    variantId: { type: 'string', required: false, description: 'Only this variant; absent = every variant' },
    quantityPerUnit: { type: 'number', required: true, description: 'Resource units per product unit' }
  },
  authRules: memberRules('link a product to a resource'),
  realtime: {
    scopes: (p) => scopeList([scope('project', p.projectId), scope('resource', p.resourceId), scope('product', p.productId)])
  }
};

export const unlinkProductResourceConfig: ActionConfig = {
  key: 'unlinkProductResource',
  description: 'Remove a stock link (an essence-only BOM row) between a product and a resource. Priced BOM rows are not touched.',
  graphqlOperation: unlinkProduct,
  paramSchema: {
    projectId: { type: 'string', required: true },
    recipeId: { type: 'string', required: true }
  },
  authRules: memberRules('unlink a product from a resource'),
  realtime: {
    scopes: (p, r) =>
      scopeList([
        scope('project', p.projectId),
        scope('resource', r?.data?.resourceId ?? r?.resourceId),
        scope('product', r?.data?.productId ?? r?.productId)
      ])
  }
};

export const stockResourceActionConfigs: ActionConfig[] = [
  receiveStockConfig,
  setResourceStockConfig,
  linkProductResourceConfig,
  unlinkProductResourceConfig
];
