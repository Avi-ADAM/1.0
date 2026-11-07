/**
 * Send Lead Offer (docs/inprogress/PLAN_LEADS.md §4.0 "send an offer", L4) —
 * the step forward from a lead: an order the buyer still has to pay for, with
 * their details filled in from the lead, linked to it. The lead becomes
 * `offered`, and `won` the moment the order is paid (the L3a money sync).
 *
 * The order is written by `createPaidOrder` with `payment: 'arranged'` — the
 * same row, lines, expiry and "confirm payment" flow as a site order whose
 * buyer asked to pay by arrangement (PLAN_SHOP_OPERATIONS §5). Nothing new to
 * learn in the orders tab, and nothing moves (stock, sales, value) until the
 * member who gets the money confirms it.
 *
 * The offer is sent the way the person asked to be reached — email, phone,
 * WhatsApp or a message on 1lev1 (an international customer may have no
 * phone that matters), so any one of a phone, an email or a linked account
 * will do (`arrangedReach: 'any'`). A product is required: an offer is for
 * something the rikma sells (open question 5 — answered "a product").
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { validateOrderPayload } from '$lib/server/ordersApi.js';
import { syncedStatus } from '$lib/leads/stage';
import { leadStore, loadLeadInProject, recordActivity, updateLead } from '$lib/server/leads/store';

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const store = leadStore(strapi, context.fetch);
  const lead = await loadLeadInProject(store, String(params.leadId), projectId);
  if (!lead) throw new ActionError('NOT_FOUND', 'No such lead in this rikma');
  if (lead.status === 'spam') throw new ActionError('VALIDATION_FAILED', 'This lead was put away as spam or a duplicate');

  const sideRes = await store.run('leadMergeSide', { id: lead.id });
  const a = sideRes?.data?.lead?.data?.attributes ?? {};
  const phone = str(a.phone);
  const email = str(a.email);
  const customerUserId = a.customer_user?.data?.id != null ? String(a.customer_user.data.id) : null;
  // The offer reaches them the way they asked — email, phone, WhatsApp or the
  // site. Some way there must be.
  if (!phone && !email && !customerUserId) {
    throw new ActionError('NEEDS_CONTACT', 'Add a phone or an email to the lead first — there is no way to send them the offer');
  }
  const linked: string[] = ((a.orders?.data ?? []) as any[]).map((o) => String(o.id));
  const linkedStatuses: string[] = ((a.orders?.data ?? []) as any[]).map((o) => String(o?.attributes?.status ?? ''));

  const lines = Array.isArray(params.lines) ? params.lines : [];
  if (!lines.length) throw new ActionError('VALIDATION_FAILED', 'An offer needs at least one product');

  const v = validateOrderPayload(
    {
    // Unique per offer: a second offer to the same lead is a second order.
    externalId: `lead-${lead.id}-${Date.now().toString(36)}`,
    payment: 'arranged',
    expiresInHours: params.expiresInHours ?? null,
    buyer: { name: lead.name, phone, email },
    delivery: { preference: 'contact' },
    note: str(params.note),
    lines: lines.map((l: any) => ({
      productId: l?.productId,
      variantId: l?.variantId ?? null,
      quantity: l?.quantity,
      unitPrice: l?.unitPrice
    }))
    },
    { arrangedReach: 'any', hasAccount: !!customerUserId }
  );
  if (v.ok === false) {
    const refusal = v as Extract<typeof v, { ok: false }>;
    throw new ActionError('VALIDATION_FAILED', refusal.message, { problems: refusal.problems });
  }

  const { actionService } = await import('../index.js');
  const created: any = await actionService.executeAction('createPaidOrder', { projectId, order: v.value }, context);
  if (!created?.success) {
    const err = created?.error ?? {};
    throw new ActionError(err.code ?? 'EXECUTION_FAILED', err.message ?? 'The offer could not be written');
  }
  const orderId = String(created.data?.orderId ?? '');
  if (!orderId) throw new Error('sendLeadOffer: createPaidOrder returned no order');

  // Link it, and let the money rule say the stage (an open offer ⇒ offered).
  const now = new Date().toISOString();
  const next = syncedStatus({ status: lead.status }, { orderStatuses: [...linkedStatuses, 'pendingPayment'] });
  await updateLead(store, lead.id, {
    orders: [...new Set([...linked, orderId])],
    lastActivityAt: now,
    ...(next ? { status: next } : {})
  });
  await recordActivity(store, {
    leadId: lead.id,
    kind: 'linkOrder',
    body: `order:${created.data?.displayNumber ?? orderId}`,
    actorId: context.userId,
    at: now
  });
  if (next) {
    await recordActivity(store, { leadId: lead.id, kind: 'statusChange', fromStatus: lead.status, toStatus: next, at: now });
  }

  return {
    leadId: lead.id,
    orderId,
    orderRef: created.data?.orderRef ?? null,
    total: created.data?.total ?? null,
    currency: created.data?.currency ?? null,
    expiresAt: created.data?.expiresAt ?? null,
    status: next ?? lead.status
  };
};

export const sendLeadOfferConfig: ActionConfig = {
  key: 'sendLeadOffer',
  description: 'Send a lead an offer: an order waiting for an arranged payment, linked to the lead',
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    leadId: { type: 'string', required: true, description: 'The lead' },
    lines: {
      type: 'array',
      required: true,
      description: '[{ productId, variantId?, quantity, unitPrice }] — products of this rikma'
    },
    note: { type: 'string', required: false, description: 'A note on the offer' },
    expiresInHours: { type: 'number', required: false, description: 'How long the offer stands (default: the arranged-order default)' }
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
