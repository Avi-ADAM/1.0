/**
 * What the "in progress" tab and the lead page read
 * (docs/inprogress/PLAN_LEADS.md §4.1, §4.2).
 *
 * Every caller is a `sales/manage/*` loader that has already passed the moach
 * layout's membership check (`await parent()`), so these read with the
 * service token — the lead qids are serviceAdmin-only because a lead carries
 * a phone and an email. The rows leave the server only inside a members-only
 * page payload.
 *
 * Strapi rows become plain shapes here; the pure path (`$lib/leads/pipeline`)
 * never reads `attributes.x.data`.
 */

import { strapiClient } from '$lib/server/actions';
import { orderNumberOf } from '$lib/server/ordersApi.js';
import { resolveLeadSettings, type LeadSettings } from '$lib/leads/settings';
import type { PipelineData, PipelineLeadInput, PipelineProposalInput } from '$lib/leads/pipeline';
import type { CustomerLeadInput } from '$lib/leads/customers';

export type { PipelineData };

type FetchFn = typeof fetch;

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const idOf = (rel: any): string | null => (rel?.data?.id != null ? String(rel.data.id) : null);
const run = (qid: string, vars: Record<string, unknown>, fetchFn?: FetchFn) =>
  strapiClient.execute(qid, vars, undefined, fetchFn);

export function toPipelineLead(node: any): PipelineLeadInput | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const orders = (a.orders?.data ?? []) as any[];
  return {
    id: String(node.id),
    name: str(a.name),
    organization: str(a.organization),
    status: str(a.status),
    source: str(a.source),
    sourceLabel: str(a.sourceLabel),
    ownerId: idOf(a.owner),
    ownerName: str(a.owner?.data?.attributes?.username),
    actId: idOf(a.act),
    followUpAt: str(a.followUpAt),
    nextAction: str(a.nextAction),
    lastActivityAt: str(a.lastActivityAt),
    createdAt: str(a.createdAt),
    pausedReason: str(a.pausedReason),
    products: ((a.products?.data ?? []) as any[]).map((p) => str(p?.attributes?.name)).filter((n): n is string => !!n),
    orderIds: orders.map((o) => String(o.id)),
    orderStatuses: orders.map((o) => String(o?.attributes?.status ?? '')),
    estimatedValue: num(a.estimatedValue),
    currency: str(a.currencyCode)
  };
}

export function toPipelineProposal(node: any): PipelineProposalInput | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  return {
    id: String(node.id),
    ratsonId: idOf(a.ratson),
    name: str(a.ratson?.data?.attributes?.name),
    status: str(a.status_proposal),
    hiddenByWisher: a.hidden_by_wisher === true,
    hasConversation: (a.negos?.data?.length ?? 0) > 0 || (a.ratson_willingness_entry?.length ?? 0) > 0,
    hasPrice: (num(a.total_price) ?? 0) > 0,
    createdAt: str(a.createdAt),
    updatedAt: str(a.updatedAt),
    total: num(a.total_price)
  };
}

/**
 * The leads and the concierge proposals of a rikma, with its settings. Each
 * read fails on its own: no proposals is still a table of leads.
 */
export async function loadPipeline(projectId: string, fetchFn?: FetchFn): Promise<PipelineData> {
  const [leadsRes, proposalsRes, settingsRes] = await Promise.allSettled([
    run('moachPipelineLeads', { pid: projectId }, fetchFn),
    run('moachPipelineProposals', { pid: projectId }, fetchFn),
    run('leadProjectSettings', { pid: projectId }, fetchFn)
  ]);
  const settings = resolveLeadSettings(
    settingsRes.status === 'fulfilled' ? settingsRes.value?.data?.project?.data?.attributes?.leadSettings : null
  );
  const proposals =
    proposalsRes.status === 'fulfilled'
      ? ((proposalsRes.value?.data?.ratsonProposals?.data ?? []) as any[])
          .map(toPipelineProposal)
          .filter((p): p is PipelineProposalInput => !!p)
      : [];
  if (leadsRes.status === 'rejected') {
    console.error('[leads] pipeline read failed:', (leadsRes.reason as any)?.getMessages?.() ?? leadsRes.reason);
    // Before L0 deploys `leads` is not in the schema at all; that is "not ready", not a failure.
    return { ready: false, leads: [], proposals, settings, failed: true };
  }
  const leads = ((leadsRes.value?.data?.leads?.data ?? []) as any[])
    .map(toPipelineLead)
    .filter((l): l is PipelineLeadInput => !!l);
  return { ready: true, leads, proposals, settings };
}

// ─── one lead ───────────────────────────────────────────────────────────────

export interface LeadActivityView {
  id: string;
  kind: string;
  direction: 'in' | 'out' | null;
  body: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  at: string | null;
  actorId: string | null;
  actorName: string | null;
}

export interface LeadOrderView {
  id: string;
  ref: string | null;
  number: string;
  status: string;
  total: number | null;
  currency: string | null;
  createdAt: string | null;
}

export interface LeadPageView {
  id: string;
  name: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  message: string | null;
  /** The site's own fields, flattened to text pairs. */
  details: Array<[string, string]>;
  lang: string | null;
  status: string;
  pausedReason: string | null;
  pausedNote: string | null;
  followUpAt: string | null;
  nextAction: string | null;
  source: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  estimatedValue: number | null;
  currency: string | null;
  consentAt: string | null;
  createdAt: string | null;
  lastActivityAt: string | null;
  ownerId: string | null;
  ownerName: string | null;
  actId: string | null;
  /** The 1lev1 account they wrote from (L4) — they can be answered on the site. */
  customerUserId: string | null;
  customerName: string | null;
  /** How they asked to be reached (`$lib/leads/contact`), if they said. */
  contactVia: string | null;
  previousLeadId: string | null;
  products: Array<{ id: string; name: string }>;
  orders: LeadOrderView[];
  activities: LeadActivityView[];
}

/** `details` is free json from a site: show its scalar fields as text, nothing else. */
export function detailPairs(details: unknown): Array<[string, string]> {
  let d: unknown = details;
  if (typeof d === 'string') {
    try {
      d = JSON.parse(d);
    } catch {
      return [];
    }
  }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return [];
  const out: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(d as Record<string, unknown>)) {
    if (v === null || v === undefined || v === '' || k === 'contactVia') continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out.push([k, String(v)]);
    else if (Array.isArray(v) && v.every((x) => typeof x === 'string' || typeof x === 'number'))
      out.push([k, v.join(', ')]);
  }
  return out.slice(0, 30);
}

export function toLeadPage(node: any): LeadPageView | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  return {
    id: String(node.id),
    name: str(a.name),
    organization: str(a.organization),
    email: str(a.email),
    phone: str(a.phone),
    city: str(a.city),
    address: str(a.address),
    message: str(a.message),
    details: detailPairs(a.details),
    lang: str(a.lang),
    status: str(a.status) ?? 'new',
    pausedReason: str(a.pausedReason),
    pausedNote: str(a.pausedNote),
    followUpAt: str(a.followUpAt),
    nextAction: str(a.nextAction),
    source: str(a.source),
    sourceLabel: str(a.sourceLabel),
    sourceUrl: str(a.sourceUrl),
    estimatedValue: num(a.estimatedValue),
    currency: str(a.currencyCode),
    consentAt: str(a.consentAt),
    createdAt: str(a.createdAt),
    lastActivityAt: str(a.lastActivityAt),
    ownerId: idOf(a.owner),
    ownerName: str(a.owner?.data?.attributes?.username),
    actId: idOf(a.act),
    customerUserId: idOf(a.customer_user),
    customerName: str(a.customer_user?.data?.attributes?.username),
    contactVia: (() => {
      const d = typeof a.details === 'string' ? (() => { try { return JSON.parse(a.details); } catch { return null; } })() : a.details;
      return typeof d?.contactVia === 'string' ? d.contactVia : null;
    })(),
    previousLeadId: idOf(a.previousLead),
    products: ((a.products?.data ?? []) as any[])
      .map((p) => ({ id: String(p.id), name: str(p?.attributes?.name) ?? '' }))
      .filter((p) => p.name),
    orders: ((a.orders?.data ?? []) as any[]).map((o) => {
      const oa = o?.attributes ?? {};
      return {
        id: String(o.id),
        ref: str(oa.ref),
        number: orderNumberOf(oa.displayNumber, o.id),
        status: String(oa.status ?? ''),
        total: num(oa.total),
        currency: str(oa.currencyCode),
        createdAt: str(oa.createdAt)
      };
    }),
    activities: ((a.activities?.data ?? []) as any[]).map((r) => {
      const ra = r?.attributes ?? {};
      return {
        id: String(r.id),
        kind: String(ra.kind ?? 'note'),
        direction: ra.direction === 'in' || ra.direction === 'out' ? ra.direction : null,
        body: str(ra.body),
        fromStatus: str(ra.fromStatus),
        toStatus: str(ra.toStatus),
        at: str(ra.at),
        actorId: idOf(ra.actor),
        actorName: str(ra.actor?.data?.attributes?.username)
      };
    })
  };
}

/** The lead, only when it belongs to this rikma — another rikma's id reads as missing. */
export async function loadLeadPage(projectId: string, leadId: string, fetchFn?: FetchFn): Promise<LeadPageView | null> {
  if (!/^\d+$/.test(leadId)) return null;
  const res = await run('moachLeadPage', { id: leadId }, fetchFn);
  const node = res?.data?.lead?.data;
  if (idOf(node?.attributes?.project) !== String(projectId)) return null;
  return toLeadPage(node);
}

export async function loadLeadSettings(projectId: string, fetchFn?: FetchFn): Promise<LeadSettings> {
  try {
    const res = await run('leadProjectSettings', { pid: projectId }, fetchFn);
    return resolveLeadSettings(res?.data?.project?.data?.attributes?.leadSettings);
  } catch {
    return resolveLeadSettings(null);
  }
}

// ─── customers (L6, §5.5) ───────────────────────────────────────────────────

/** Won leads of the rikma — the lead half of the customers view. Null when unreadable. */
export async function loadCustomerLeads(projectId: string, fetchFn?: FetchFn): Promise<CustomerLeadInput[] | null> {
  try {
    const res = await run('moachCustomerLeads', { pid: projectId }, fetchFn);
    return ((res?.data?.leads?.data ?? []) as any[]).map((node) => {
      const a = node?.attributes ?? {};
      return {
        id: String(node.id),
        name: str(a.name),
        organization: str(a.organization),
        email: str(a.email),
        phone: str(a.phone),
        createdAt: str(a.createdAt),
        lastActivityAt: str(a.lastActivityAt)
      };
    });
  } catch (e) {
    console.error('[leads] customers read failed:', (e as any)?.getMessages?.() ?? e);
    return null;
  }
}
