// src/lib/server/shop/orderMail.ts
//
// The mail a buyer gets about their order, decided and assembled on the server
// (the words are `$lib/shop/orderMail`, the SMTP is `$lib/server/mailer`).
//
// Why it lives here and not in the storefront template: the template meets the
// buyer once, at the payment, and keeps nothing. "The payment was confirmed"
// (an arranged order, confirmed by a member) and "it shipped" happen in the
// rikma, and the order webhook deliberately carries no buyer fields. The
// platform is the only side that knows both the moment and the address.
//
// What may go out, and when:
//
//   createPaidOrder       status 'paid'           → paid
//                         status 'pendingPayment' → received   (nothing charged)
//   confirmOrderPayment   changed                 → paid
//   markOrderShipped      changed                 → shipped
//   setOrderTracking      changed, order has left → tracking
//   cancelOrder           changed, never paid     → cancelledUnpaid
//                         changed, after payment  → cancelled
//   expireOrder           changed (the hourly cron) → expired
//
// A retry (`duplicated`, `changed: false`) never mails twice. Nothing here may
// fail or slow the action that triggered it — the caller runs it after the
// action returned, and every failure is a log line.
//
// Abuse: the address is typed by a stranger on a storefront. The platform mails
// from one shared account that the provider blocks outright when it sees
// unusual volume (`mailer.js`, `reportConfirmation.ts`), so the arranged-order
// "received" mail — the only one that needs no payment — is capped per address
// and per rikma, like the report confirmation is.

import { orderNumberOf } from '$lib/server/ordersApi.js';
import { readShippingConfig, shippingSchemaLive } from '$lib/server/shop/shippingConfig.js';
import { addressLine, addressOf, preferenceOf } from '$lib/shop/manage';
import { buildOrderMail, type OrderMailInput, type OrderMailKind } from '$lib/shop/orderMail';
import { readOrderShipping } from '$lib/shop/shipping';
import { readTracking } from '$lib/shop/tracking';

type Strapi = { execute: (qid: string, vars: any, jwt?: any, fetchFn?: any) => Promise<any> };

/** The actions that can produce a buyer mail. */
export const ORDER_MAIL_ACTIONS = new Set([
  'createPaidOrder',
  'confirmOrderPayment',
  'markOrderShipped',
  'setOrderTracking',
  'cancelOrder',
  'expireOrder'
]);

/**
 * Which mail does this run call for? Pure — decided from the action's result
 * alone, before any lookup, so a run that changed nothing costs nothing.
 */
export function orderMailKindFor(actionKey: string, result: any): OrderMailKind | null {
  const r = result?.data ?? result ?? {};
  switch (actionKey) {
    case 'createPaidOrder':
      if (r.duplicated) return null;
      if (r.status === 'pendingPayment') return 'received';
      return r.status === 'paid' ? 'paid' : null;
    case 'confirmOrderPayment':
      return r.changed === true && r.status === 'paid' ? 'paid' : null;
    case 'markOrderShipped':
      return r.changed === true && r.status === 'shipped' ? 'shipped' : null;
    case 'setOrderTracking':
      // Only a parcel that already left: before that, the number waits in the
      // order and rides in the "shipped" mail.
      return r.changed === true && r.tracking && (r.status === 'shipped' || r.status === 'fulfilled') ? 'tracking' : null;
    case 'cancelOrder':
      if (r.status !== 'cancelled' || r.alreadyCancelled === true) return null;
      return r.beforePayment === true ? 'cancelledUnpaid' : 'cancelled';
    case 'expireOrder':
      // The cron lapses a waiting order: nothing was ever charged.
      return r.changed === true ? 'expired' : null;
    default:
      return null;
  }
}

/** Loose, deliberately — and nothing that could break out of a header. */
const MAILBOX_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;
export function looksLikeMailbox(s: unknown): s is string {
  return typeof s === 'string' && s.length <= 254 && MAILBOX_RE.test(s);
}

// ─── the cap ────────────────────────────────────────────────────────────────

export interface MailLimits {
  /** Every mail to one address. */
  perAddress: { max: number; windowMs: number };
  /** The "received" mail of arranged orders, per rikma — the only one that needs no payment. */
  receivedPerRikma: { max: number; windowMs: number };
}

export const DEFAULT_MAIL_LIMITS: MailLimits = {
  // received + paid + shipped + tracking is four; a returning buyer has room for two orders a day.
  perAddress: { max: 8, windowMs: 24 * 60 * 60 * 1000 },
  receivedPerRikma: { max: 30, windowMs: 60 * 60 * 1000 }
};

/** In memory, like the report confirmation's cap: one process serves the API. */
export class MailThrottle {
  private seen = new Map<string, number[]>();

  constructor(private limits: MailLimits = DEFAULT_MAIL_LIMITS) {}

  private room(key: string, rule: { max: number; windowMs: number }, now: number): boolean {
    const fresh = (this.seen.get(key) ?? []).filter((t) => now - t < rule.windowMs);
    this.seen.set(key, fresh);
    return fresh.length < rule.max;
  }

  private mark(key: string, now: number) {
    this.seen.set(key, [...(this.seen.get(key) ?? []), now]);
  }

  /** Takes its slots only when it says yes, so call it right before sending. */
  take(address: string, projectId: string, kind: OrderMailKind, now = Date.now()): boolean {
    if (this.seen.size > 5000) {
      const longest = Math.max(this.limits.perAddress.windowMs, this.limits.receivedPerRikma.windowMs);
      for (const [k, ts] of this.seen) if (!ts.some((t) => now - t < longest)) this.seen.delete(k);
    }
    const addressKey = `a:${address.toLowerCase()}`;
    const rikmaKey = `r:${projectId}`;
    if (!this.room(addressKey, this.limits.perAddress, now)) return false;
    if (kind === 'received' && !this.room(rikmaKey, this.limits.receivedPerRikma, now)) return false;
    this.mark(addressKey, now);
    if (kind === 'received') this.mark(rikmaKey, now);
    return true;
  }
}

// ─── the order → the mail ───────────────────────────────────────────────────

export interface MailOrder {
  /** Where it goes. */
  to: string;
  /** The shop's name — also the name beside the sender address. */
  shopName: string;
  /** Replies go here: the member whose till took the money, when there is one. */
  replyTo: string | null;
  input: Omit<OrderMailInput, 'kind'>;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);

/**
 * A raw `orderMailByRef` node (plus its shipping record, when that column is
 * deployed) → what the mail needs. Null when the buyer left no usable address.
 */
export function mailOrderFromNode(node: any, shippingRaw: unknown): MailOrder | null {
  const a = node?.attributes;
  if (!a) return null;
  const to = str(a.buyerEmail);
  if (!looksLikeMailbox(to)) return null;

  const project = a.project?.data?.attributes ?? {};
  const holder = a.holder?.data?.attributes ?? null;
  const holderMail = holder && holder.blocked !== true ? str(holder.email) : null;
  const shipping = readOrderShipping(shippingRaw);
  const preference = preferenceOf(a.deliveryPreference);
  const shopName = str(project.projectName) ?? '1lev1';

  const lines = [...(a.lines?.data ?? [])]
    .map((row: any) => row?.attributes ?? {})
    .sort((x: any, y: any) => (num(x.position) ?? 0) - (num(y.position) ?? 0))
    .map((l: any) => ({
      name: str(l.nameSnapshot) ?? '—',
      optionLabel: str(l.optionLabelSnapshot),
      quantity: num(l.quantity) ?? 1,
      unitPrice: num(l.unitPrice),
      lineTotal: num(l.lineTotal)
    }));

  return {
    to,
    shopName,
    replyTo: looksLikeMailbox(holderMail) ? holderMail : null,
    input: {
      locale: str(a.locale),
      shopName,
      number: orderNumberOf(a.displayNumber, node.id),
      buyerName: str(a.buyerName),
      lines,
      total: num(a.total),
      currency: str(a.currencyCode) ?? 'ILS',
      delivery: {
        preference,
        addressLine: addressLine(addressOf(a.deliveryAddress)) || null,
        method: shipping?.kind === 'pickup' ? null : (shipping?.name ?? null),
        // A fee recorded as a line is already in `lines`; twice reads as two charges.
        fee: shipping?.asLine ? null : (shipping?.fee ?? null),
        pickupPointName: shipping?.pickupPointName ?? null,
        pickupAddress: shipping?.pickupAddress ?? null,
        pickupByAppointment: shipping?.pickupByAppointment === true,
        etaMinDays: shipping?.etaMinDays ?? null,
        etaMaxDays: shipping?.etaMaxDays ?? null
      },
      oversold: a.oversold === true,
      tracking: readTracking(str(a.note)),
      website: str(project.linkToWebsite),
      whatsapp: str(project.watsapplink),
      canReply: looksLikeMailbox(holderMail)
    }
  };
}

export interface MailDeps {
  /** Off switch (`ORDER_MAILS_ENABLED=false`). */
  enabled: () => boolean;
  send: (mail: { to: string; subject: string; text: string; html: string; fromName: string; replyTo?: string }) => Promise<{ ok: boolean; error?: unknown }>;
  throttle: MailThrottle;
  now?: () => number;
}

export type OrderMailOutcome =
  | { sent: true; kind: OrderMailKind; to: string }
  | { sent: false; reason: 'not-an-order-mail' | 'disabled' | 'no-order' | 'no-address' | 'throttled' | 'send-failed' | 'error' };

/**
 * Run after an order action succeeded. Never throws.
 */
export async function runOrderMail(
  opts: { actionKey: string; params: Record<string, any>; result: any; fetchFn: typeof globalThis.fetch; strapi: Strapi },
  deps: MailDeps
): Promise<OrderMailOutcome> {
  try {
    const kind = orderMailKindFor(opts.actionKey, opts.result);
    if (!kind) return { sent: false, reason: 'not-an-order-mail' };
    if (!deps.enabled()) return { sent: false, reason: 'disabled' };

    const r = opts.result?.data ?? opts.result ?? {};
    const projectId = opts.params?.projectId != null ? String(opts.params.projectId) : '';
    const ref = String(r.orderRef ?? opts.params?.orderRef ?? '');
    if (!projectId || !ref) return { sent: false, reason: 'no-order' };

    // Read with the service token (no JWT): the buyer's contact is not the member's to read through a qid.
    const run = (qid: string, vars: Record<string, unknown>) => opts.strapi.execute(qid, vars, undefined, opts.fetchFn);
    const res = await run('orderMailByRef', { pid: projectId, ref });
    const node = res?.data?.orders?.data?.[0];
    if (!node?.id) return { sent: false, reason: 'no-order' };

    // How it travels — its own read, so the mail still goes on the day `Order.shipping` is not deployed.
    let shippingRaw: unknown = null;
    if (node.attributes?.deliveryPreference === 'delivery' || node.attributes?.deliveryPreference === 'pickup') {
      try {
        if (await shippingSchemaLive(run)) {
          const s = await run('orderShippingById', { pid: projectId, id: String(node.id) });
          shippingRaw = s?.data?.orders?.data?.[0]?.attributes?.shipping ?? null;
        }
      } catch {
        /* the mail goes without the shipping method */
      }
    }

    const mail = mailOrderFromNode(node, shippingRaw);
    if (!mail) return { sent: false, reason: 'no-address' };
    if (!deps.throttle.take(mail.to, projectId, kind, deps.now?.())) {
      console.warn(`[orderMail] ${kind} to a buyer of rikma ${projectId} skipped: rate limit`);
      return { sent: false, reason: 'throttled' };
    }

    // The shop's own setting; a failed read must not cost the buyer the mail.
    let hideSentVia = false;
    let buyerWhatsapp: string | null = null;
    try {
      const { config } = await readShippingConfig(run, projectId);
      hideSentVia = config.hideSentVia;
      buyerWhatsapp = config.buyerWhatsapp;
    } catch {
      /* the mail goes with the default signature and the rikma's own link */
    }

    const built = buildOrderMail({ ...mail.input, whatsapp: buyerWhatsapp ?? mail.input.whatsapp, kind, hideSentVia });
    const sent = await deps.send({
      to: mail.to,
      subject: built.subject,
      text: built.text,
      html: built.html,
      fromName: mail.shopName,
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {})
    });
    if (!sent.ok) return { sent: false, reason: 'send-failed' };
    return { sent: true, kind, to: mail.to };
  } catch (err) {
    console.warn('[orderMail] failed:', err instanceof Error ? err.message : err);
    return { sent: false, reason: 'error' };
  }
}
