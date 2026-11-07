/**
 * Start Offsite Deal (docs/inprogress/PLAN_OFFSITE_CLIENT.md P1) — the work for a
 * customer who is not on the site. From a lead and a product of the rikma: an
 * approved deal (`Sheirut`) with no customer account on it (or the lead's, if it
 * has one), the product's BOM turned into live work, and the lead pointing at the
 * deal.
 *
 * The product is the link between the work and the customer (C-19 — product-scoped,
 * never rikma-scoped): a BOM line already holding a mission in progress keeps it, so
 * a timer that is already running is this deal's work from now on. Unlike a request
 * from the site (`createSheirutFromPending`), a fixed-price product activates its BOM
 * lines too — a simple product with one mission line is the simple case here.
 *
 * Nobody signs: the customer is not on the site, and this is the rikma's own report
 * of its own work. The lead's status does not move — `won` means money (PLAN_LEADS
 * §4.0). A lead that already has a deal gets that deal back.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { leadStore, loadLeadInProject, recordActivity, updateLead } from '$lib/server/leads/store';
import { activateBom } from '$lib/server/deal/activateBom';
import { offsiteDealTerms } from '$lib/sheirut/offsiteDeal';

const clean = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/**
 * A customer whose details are not on the site at all: they become a lead first, so the
 * deal has someone to be for and the person can be reached or join later. Any of their
 * details may be missing — the member records them by hand (`source: 'manual'`, no
 * consent text) and the lead needs no phone or email (`intake: 'offsiteDeal'`). The
 * same phone or email as an open lead folds into it, as every new lead does.
 */
async function leadForCustomer(params: Record<string, any>, context: any): Promise<string> {
  const c = (params.customer ?? {}) as Record<string, unknown>;
  const { actionService } = await import('../index.js');
  const res: any = await actionService.executeAction(
    'createLead',
    {
      projectId: String(params.projectId),
      name: clean(c.name) ?? clean(params.defaultName) ?? 'Customer',
      phone: clean(c.phone),
      email: clean(c.email),
      organization: clean(c.organization),
      productId: String(params.productId),
      source: 'manual',
      openTask: false
    },
    { ...context, intake: 'offsiteDeal' }
  );
  const id = res?.data?.leadId;
  if (!res?.success || !id) {
    const err = res?.error ?? {};
    throw new ActionError(err.code ?? 'EXECUTION_FAILED', err.message ?? 'The customer could not be recorded');
  }
  return String(id);
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const store = leadStore(strapi, context.fetch);
  const leadId = params.leadId ? String(params.leadId) : await leadForCustomer(params, context);
  const lead = await loadLeadInProject(store, leadId, projectId);
  if (!lead) throw new ActionError('NOT_FOUND', 'No such lead in this rikma');
  if (lead.status === 'spam') throw new ActionError('VALIDATION_FAILED', 'This lead was put away as spam or a duplicate');

  const side = (await store.run('offsiteDealLead', { id: lead.id }))?.data?.lead?.data?.attributes ?? {};
  const existing = side.sheirut?.data?.id != null ? String(side.sheirut.data.id) : null;
  if (existing) return { leadId: lead.id, sheirutId: existing, missionIds: [], existing: true };
  const customerUserId = side.customer_user?.data?.id != null ? String(side.customer_user.data.id) : null;

  const product = (await store.run('offsiteDealProduct', { id: String(params.productId) }))?.data?.matanot?.data;
  const pa = product?.attributes;
  const productProject = pa?.projectcreates?.data?.[0]?.id;
  if (!product || String(productProject ?? '') !== projectId) {
    throw new ActionError('NOT_FOUND', 'No such product in this rikma');
  }
  if (pa.archived === true || pa.lifecycle === 'archived') {
    throw new ActionError('VALIDATION_FAILED', 'This product was archived');
  }

  const terms = offsiteDealTerms({ productPrice: pa.price, price: params.price, quantity: params.quantity });
  if (terms.ok === false) throw new ActionError('VALIDATION_FAILED', terms.message);

  const now = new Date().toISOString();
  const created = await strapi.execute(
    '87createSheirut',
    {
      data: {
        project: projectId,
        users_permissions_users: customerUserId ? [customerUserId] : [],
        matanot: String(product.id),
        name: pa.name ?? '',
        descrip: pa.desc ?? '',
        price: terms.price,
        quant: terms.quantity,
        total: terms.total,
        startDate: now,
        oneTime: params.oneTime !== false,
        equaliSplited: false,
        isApruved: true,
        archived: false
      }
    },
    context.jwt,
    context.fetch
  );
  const sheirutId = created?.data?.createSheirut?.data?.id;
  if (!sheirutId) throw new Error('startOffsiteDeal: createSheirut returned no id');

  const { missionIds } = await activateBom(
    (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch),
    { projectId, matanot: product, fallbackSellerId: context.userId, remindExisting: false }
  );

  await updateLead(store, lead.id, { sheirut: String(sheirutId), lastActivityAt: now });
  await recordActivity(store, {
    leadId: lead.id,
    kind: 'system',
    body: `offsiteDeal:${sheirutId}`,
    actorId: context.userId,
    at: now
  });

  return { leadId: lead.id, sheirutId: String(sheirutId), missionIds, existing: false };
};

export const startOffsiteDealConfig: ActionConfig = {
  key: 'startOffsiteDeal',
  description: "Open a deal for a lead who is not on the site: the product's work starts in the rikma, linked to the lead",
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    leadId: { type: 'string', required: false, description: 'The lead the work is for — or leave it out and give `customer`' },
    customer: {
      type: 'object',
      required: false,
      description: '{ name?, phone?, email?, organization? } — a customer not yet a lead; every field may be empty'
    },
    defaultName: { type: 'string', required: false, description: "The name for a customer who gave none, in the member's language" },
    productId: { type: 'string', required: true, description: 'A product of this rikma' },
    quantity: { type: 'number', required: false, description: 'How many (default 1)' },
    price: { type: 'number', required: false, description: 'Unit price agreed with the customer (default: the product price)' },
    oneTime: { type: 'boolean', required: false, description: 'Paid once (default true)' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: "Only the rikma's members work its leads"
    }
  ],

  realtime: {
    scopes: (p) => scopeList([scope('project', p.projectId)])
  }
};
