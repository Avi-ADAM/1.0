/**
 * Stock from a resource — the writes (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.4, A3).
 *
 * The planner (`$lib/fulfillment/plan.ts` + `stock.ts`) decides what an order
 * takes off which shelf; this module writes it:
 *
 *   consumeStock  — `Mashabetahalich.quantityConsumed += q` for every move the
 *                   order's ledger (`Order.stockMoves`) does not have yet, then
 *                   the ledger. A retry consumes nothing twice.
 *   restoreStock  — a cancel before shipping gives back exactly what the
 *                   ledger says was taken (the same rule as `cancelOrder`'s
 *                   restock), even if the recipe changed since.
 *   openLowStock  — a shelf at its threshold opens the `stock.low` rules' acts
 *                   (the procurement role), or tells the resource's giver when
 *                   no rule covers it.
 *   receiptValueOf — what a supply portion is worth when it settles.
 *
 * Every read here fails cleanly until `1.0b` deploys the A3 fields; the
 * callers read `null` as "stock is not ready" and change nothing.
 */
import {
  isLowStock,
  movesToApply,
  movesToRestore,
  onHandOf,
  readStockMoves,
  receiptValue,
  recipeRowOf,
  stockResourceOf,
  totalsByResource,
  type RecipeRow,
  type StockMove,
  type StockResource
} from '$lib/fulfillment/stock';
import {
  planStockLow,
  type FulfillmentStepRow,
  type PlannedConsumption,
  type RoutingState,
  type RunningMission
} from '$lib/fulfillment/plan';
import type { ActionContext } from '$lib/server/actions/types.js';

export type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;
type RunAction = (key: string, params: Record<string, any>, context: ActionContext) => Promise<{ success: boolean; data?: any; error?: any }>;
type Notifier = { notify: (config: any, params: any, result: any, context: ActionContext) => Promise<void> };

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Does the rikma link any product to a resource? false on any failure (not deployed). */
export async function hasStockLinks(run: Run, projectId: string): Promise<boolean> {
  try {
    const res = await run('stockLinksExist', { pid: projectId });
    return (res?.data?.matanotRecipeResources?.data ?? []).length > 0;
  } catch {
    return false;
  }
}

/** The essence-only rows of these products, or null when the schema is not deployed. */
export async function loadRecipes(run: Run, projectId: string, productIds: string[]): Promise<RecipeRow[] | null> {
  const ids = [...new Set(productIds.filter(Boolean))];
  if (ids.length === 0) return [];
  try {
    const res = await run('stockRecipesForProducts', { pid: projectId, products: ids });
    return (res?.data?.matanotRecipeResources?.data ?? []).map(recipeRowOf).filter((r: RecipeRow | null): r is RecipeRow => !!r);
  } catch (e) {
    console.warn('[stock] recipes unavailable (schema not deployed?):', (e as Error)?.message ?? e);
    return null;
  }
}

/** The order's ledger, or null when `Order.stockMoves` is not deployed. */
export async function loadLedger(run: Run, projectId: string, orderId: string): Promise<StockMove[] | null> {
  try {
    const res = await run('orderStockMoves', { pid: projectId, id: orderId });
    const node = res?.data?.orders?.data?.[0];
    if (!node) return null;
    return readStockMoves(node.attributes?.stockMoves);
  } catch (e) {
    console.warn('[stock] ledger unavailable (schema not deployed?):', (e as Error)?.message ?? e);
    return null;
  }
}

/** Resources by id, fenced to the rikma (a resource of another rikma is not there). */
export async function loadResources(run: Run, projectId: string, ids: string[]): Promise<Map<string, StockResource>> {
  const out = new Map<string, StockResource>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return out;
  const res = await run('stockResourcesByIds', { ids: unique });
  for (const node of res?.data?.mashabetahaliches?.data ?? []) {
    const r = stockResourceOf(node);
    if (r && r.projectId === String(projectId)) out.set(r.id, r);
  }
  return out;
}

export interface Touched {
  before: StockResource;
  after: StockResource;
}

/**
 * Take the planned consumptions off the shelves. Writes each shelf, then the
 * ledger; if the ledger cannot be written the shelves are put back, so a
 * retry starts from the same place.
 */
export async function consumeStock(
  run: Run,
  input: { projectId: string; orderId: string; planned: PlannedConsumption[]; ledger: StockMove[]; now?: Date }
): Promise<{ applied: StockMove[]; touched: Touched[] }> {
  const toApply = movesToApply(input.planned, input.ledger);
  if (toApply.length === 0) return { applied: [], touched: [] };
  const at = (input.now ?? new Date()).toISOString();
  const resources = await loadResources(run, input.projectId, toApply.map((m) => m.resourceId));
  const applicable = toApply.filter((m) => resources.has(m.resourceId));
  const totals = totalsByResource(applicable);

  const touched: Touched[] = [];
  for (const [id, qty] of totals) {
    const before = resources.get(id)!;
    const after = { ...before, quantityConsumed: round3(before.quantityConsumed + qty) };
    await run('stockResourceSet', { id, data: { quantityConsumed: after.quantityConsumed } });
    touched.push({ before, after });
  }

  const applied: StockMove[] = applicable.map((m) => ({
    key: m.externalId,
    resourceId: m.resourceId,
    quantity: m.quantity,
    at,
    ...(m.lineId ? { lineId: m.lineId } : {})
  }));
  try {
    await run('orderStockMovesSet', { id: input.orderId, moves: [...input.ledger, ...applied] });
  } catch (err) {
    // Put the shelves back: without the ledger a retry would take them again.
    for (const t of touched) {
      await run('stockResourceSet', { id: t.before.id, data: { quantityConsumed: t.before.quantityConsumed } }).catch((e) =>
        console.error('[stock] could not put back a shelf after a failed ledger write — check resource', t.before.id, e)
      );
    }
    throw err;
  }
  return { applied, touched };
}

/** A cancel before shipping: give back what the order took and was not given back yet. */
export async function restoreStock(
  run: Run,
  input: { projectId: string; orderId: string; now?: Date }
): Promise<{ restored: StockMove[]; touched: Touched[] }> {
  const ledger = await loadLedger(run, input.projectId, input.orderId);
  if (!ledger) return { restored: [], touched: [] };
  const toRestore = movesToRestore(ledger);
  if (toRestore.length === 0) return { restored: [], touched: [] };
  const at = (input.now ?? new Date()).toISOString();
  const resources = await loadResources(run, input.projectId, toRestore.map((m) => m.resourceId));
  const restorable = toRestore.filter((m) => resources.has(m.resourceId));
  const touched: Touched[] = [];
  for (const [id, qty] of totalsByResource(restorable)) {
    const before = resources.get(id)!;
    const after = { ...before, quantityConsumed: Math.max(0, round3(before.quantityConsumed - qty)) };
    await run('stockResourceSet', { id, data: { quantityConsumed: after.quantityConsumed } });
    touched.push({ before, after });
  }
  const keys = new Set(restorable.map((m) => m.key));
  const next = ledger.map((m) => (keys.has(m.key) ? { ...m, restoredAt: at } : m));
  await run('orderStockMovesSet', { id: input.orderId, moves: next });
  return { restored: restorable, touched };
}

/**
 * Shelves at their threshold ⇒ the `stock.low` rules' acts. One act per refill
 * (the externalId carries `quantityDelivered`), so a shelf that stays low
 * opens nothing twice, and the next low after a receipt opens a new one.
 */
export async function openLowStock(input: {
  projectId: string;
  touched: Touched[];
  steps: FulfillmentStepRow[];
  missions: Map<string, RunningMission>;
  routing?: RoutingState;
  run: Run;
  runAction: RunAction;
  notifier?: Notifier;
  context: ActionContext;
}): Promise<{ opened: string[]; told: string[] }> {
  const { projectId, run, runAction, notifier, context } = input;
  const opened: string[] = [];
  const told: string[] = [];
  for (const { before, after } of input.touched) {
    if (!isLowStock(after)) continue;
    let existing: string[] = [];
    try {
      const res = await run('fulfillmentStockActs', { pid: projectId, prefix: `stock:${after.id}:low:` });
      existing = (res?.data?.acts?.data ?? []).map((a: any) => a?.attributes?.externalId).filter(Boolean);
    } catch {
      existing = [];
    }
    const plan = planStockLow({
      resource: {
        resourceId: after.id,
        name: after.name,
        onHand: onHandOf(after),
        lowStockAt: after.lowStockAt ?? 0,
        quantityDelivered: after.quantityDelivered
      },
      steps: input.steps,
      missions: input.missions,
      existingExternalIds: existing,
      now: Date.now(),
      routing: input.routing
    });
    for (const act of plan.acts) {
      try {
        const res = await runAction(
          'createTask',
          {
            projectId,
            name: act.name,
            description: act.description,
            isAssigned: !!act.assignedUserId,
            ...(act.assignedUserId ? { assignedUserId: act.assignedUserId } : {}),
            ...(act.missionId ? { missionId: act.missionId } : {}),
            ...(act.roleId ? { tafkidims: [act.roleId] } : {}),
            ...(act.dueAt ? { dateF: act.dueAt } : {}),
            hashivut: 'yellow',
            externalId: act.externalId,
            source: 'automation',
            fulfillmentStepId: act.stepId
          },
          context
        );
        if (res?.success) opened.push(act.externalId);
      } catch (err) {
        console.warn('[stock] could not open a purchase act', act.externalId, err);
      }
    }
    // No rule covers it: tell the giver once — when the shelf crosses the line.
    if (!plan.matched && !isLowStock(before) && after.responsibleId && notifier) {
      try {
        await notifier.notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'targetIds', projectIdParam: 'projectId' } },
            templates: {
              title: { he: `📦 המלאי של "${after.name}" נמוך`, en: `📦 "${after.name}" is running low` },
              body: {
                he: `נשארו ${onHandOf(after)} (סף ${after.lowStockAt}). אפשר לקלוט מלאי ממסך המלאי, או להגדיר כלל "מלאי נמוך" שיפתח מטלת רכש.`,
                en: `${onHandOf(after)} left (threshold ${after.lowStockAt}). You can receive stock from the stock screen, or add a "low stock" rule that opens a purchase task.`
              }
            },
            intent: 'personal',
            metadata: { type: 'stockLow', url: `moach/${projectId}/sales/manage/stock`, priority: 'normal' }
          },
          { projectId, targetIds: [after.responsibleId] },
          null,
          context
        );
        told.push(after.id);
      } catch (err) {
        console.warn('[stock] low-stock notice failed:', err);
      }
    }
  }
  return { opened, told };
}

/**
 * What a settling cycle Maap is worth, when it is a supply portion
 * (`unit: 'unit'` with a `unitPrice`): units × price, apart from the units.
 * null = not a receipt (a recurring month), or the field is not deployed —
 * the caller then settles exactly as before.
 */
export async function receiptValueOf(
  run: Run,
  maapId: string,
  quantity: number,
  fallbackPrice: number | null | undefined
): Promise<{ value: number; unitPrice: number; note: string } | null> {
  try {
    const res = await run('stockReceiptMaap', { id: maapId });
    const a = res?.data?.maap?.data?.attributes;
    if (!a || a.unit !== 'unit' || a.unitPrice == null) return null;
    const unitPrice = Number(a.unitPrice);
    return { value: receiptValue(quantity, unitPrice, fallbackPrice), unitPrice, note: `${quantity} × ${unitPrice}` };
  } catch {
    return null;
  }
}
