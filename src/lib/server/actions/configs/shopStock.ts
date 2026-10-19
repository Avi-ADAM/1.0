import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { nextStock, stockWouldChange, type StockMode } from '$lib/shop/manage.js';
import { countOf, LEGACY_UNLIMITED } from '$lib/shop/stock.js';
import type { StockChange } from '$lib/server/ordersApi.js';
import { readStockFlags, writeStock } from '$lib/server/shop/stockFlags.js';
import type { ProbeRun } from '$lib/server/apiPublic/schemaProbe.js';

/**
 * A member updates a product's or a variant's stock from the moach's sales
 * screens (PLAN_SHOP_CUSTOMER_EXPERIENCE §7.3, UX_COPY_SHOP_SALES §5 — S5).
 *
 * Stock is **operational** (§4 principle 6): counting the shelf, a delivery
 * that came in, "we make these to order" — it changes nothing anyone agreed
 * to, so it applies at once for any member, like ticking "shipped". A price
 * is a term of the product and goes through `editObject`; this never touches
 * one.
 *
 * Two modes, because people ask two different questions: `set` — "I counted
 * the shelf, there are 7"; `add` — "a delivery of 12 came in". `add` is read
 * against the stock *on the server* at the moment of the write, so a sale that
 * landed while the sheet was open is not overwritten — the same reason
 * `createSale` reads the variant's stock itself.
 *
 * "Unlimited" is a switch, written as the `unlimited` flag once it is deployed
 * (§2.5) — so a count that is `-1` stays a count, and `add` to it fills the
 * queue. Before the flag lands, `-1` is still how unlimited is written.
 *
 * Both rows are fenced to the rikma in the query (`ordersApiProducts` filters
 * by `projectcreates`; the variant must name this product and this rikma), so
 * an id from another rikma is "not found", never a write.
 */

const MODES: StockMode[] = ['set', 'add'];

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const productId = String(params.productId);
  const variantId = params.variantId != null && params.variantId !== '' ? String(params.variantId) : null;
  const mode = (MODES.includes(params.mode) ? params.mode : 'set') as StockMode;
  const unlimited = params.unlimited === true;
  const value = Number(params.value ?? 0);

  const pRes = await strapi.execute('ordersApiProducts', { pid: projectId, ids: [productId] }, context.jwt, context.fetch);
  const product = pRes?.data?.matanots?.data?.[0];
  if (!product?.id) throw new ActionError('PRODUCT_NOT_FOUND', 'No such product in this rikma');
  const hasVariants = product.attributes?.hasVariants === true;
  const stockRun: ProbeRun = (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch);
  const flags = await readStockFlags(stockRun, variantId ? { variantIds: [variantId] } : { productIds: [productId] });

  // `before` is the count, or `null` when the row is unlimited.
  let before: number | null;
  if (variantId) {
    const vRes = await strapi.execute('saleVariantInfo', { id: variantId }, context.jwt, context.fetch);
    const v = vRes?.data?.productVariant?.data;
    const va = v?.attributes ?? {};
    if (
      !v?.id ||
      String(va.matanot?.data?.id ?? '') !== productId ||
      String(va.project?.data?.id ?? '') !== projectId
    ) {
      throw new ActionError('VARIANT_NOT_FOUND', 'No such variant of this product');
    }
    before = countOf({ quant: va.quant ?? 0, unlimited: flags.variants.get(variantId)?.unlimited ?? null });
  } else {
    // A product sold by variant counts its stock on the variants — writing
    // `Matanot.quant` under them would make two stocks disagree (§2.3).
    if (hasVariants) throw new ActionError('VARIANT_REQUIRED', 'This product is stocked per variant');
    // A legacy product with no number reads as unlimited, as it always did.
    const unlimitedFlag = flags.products.get(productId)?.unlimited ?? null;
    const q = product.attributes?.quant ?? (unlimitedFlag === false ? 0 : LEGACY_UNLIMITED);
    before = countOf({ quant: q, unlimited: unlimitedFlag });
  }

  const next = nextStock(before, mode, value, unlimited);
  if (next === null) {
    throw new ActionError(
      'INVALID_STOCK',
      mode === 'add'
        ? 'Add a positive number of units to a counted stock'
        : 'Stock is a number of units, 0 or more'
    );
  }
  if (!stockWouldChange(before, next)) {
    return { productId, variantId, quant: next.quant, unlimited: next.unlimited, changed: false, stockChanges: [] };
  }

  const stored = await writeStock(stockRun, variantId ? { variantId } : { productId }, next);
  const stockChanges: StockChange[] = [{ productId, variantId, quant: stored.quant, unlimited: stored.unlimited }];
  return { productId, variantId, quant: stored.quant, unlimited: stored.unlimited, before, changed: true, stockChanges };
};

export const setShopStockConfig: ActionConfig = {
  key: 'setShopStock',
  description:
    "Update a product's or variant's stock (any rikma member): `set` the counted number, or `add` a delivery; `unlimited` switches counting off. Operational — applies at once; prices are not touched.",
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    productId: { type: 'string', required: true },
    variantId: { type: 'string', required: false, description: 'Required for a product sold by variant' },
    mode: { type: 'string', required: false, description: '`set` (default) or `add`' },
    value: { type: 'number', required: false, description: 'Units: the new count (`set`) or how many came in (`add`)' },
    unlimited: { type: 'boolean', required: false, description: 'Stock without a limit (the unlimited flag)' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to update stock' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only rikma members can update its stock'
    }
  ],
  realtime: {
    scopes: (p: Record<string, any>) => scopeList([scope('project', p.projectId), scope('product', p.productId)])
  }
};
