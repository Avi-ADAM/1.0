/**
 * The leads API (docs/inprogress/PLAN_LEADS.md §5, §7.3, §7.4) — what a site's
 * server may send and read back, and what a webhook says.
 *
 * The rule throughout: a person's contact details go IN and never come back
 * OUT. The status view and the webhook body carry the lead's id, its
 * `externalId` and its status — no name, no phone, no email, not who owns it.
 */

import { LEAD_SOURCES } from '$lib/leads/status';

export const LEADS_CREATE_SCOPE = 'leads:create';
export const LEADS_READ_SCOPE = 'leads:read';

/**
 * A browser form's key (§5.2, L5): the raw key sits in a public web page, so
 * it may do exactly one thing — file a lead, from the rikma's own origins,
 * a few times an hour per visitor — and read nothing at all.
 */
export const LEADS_CREATE_PUBLIC_SCOPE = 'leads:create:public';
/** Leads per hour from one address through a public key. */
export const PUBLIC_LEADS_PER_IP_HOUR = 10;

/**
 * Why a key with the public scope cannot be minted as asked, or null.
 * It goes on a key of its own (anything else on it would be readable by
 * whoever opens the page), and only with the origins it may be used from.
 */
export function publicLeadKeyRefusal(scopes: string[], allowedOrigins: string[]): string | null {
  if (!scopes.includes(LEADS_CREATE_PUBLIC_SCOPE)) return null;
  if (scopes.length > 1) return `${LEADS_CREATE_PUBLIC_SCOPE} goes on a key of its own — the key is visible in the page`;
  if (!allowedOrigins.length) return `${LEADS_CREATE_PUBLIC_SCOPE} needs the site's address (allowedOrigins)`;
  return null;
}

/** `https://Site.example/path` ⇒ `https://site.example`; anything that is not an http(s) origin ⇒ null. */
export function normalizeOrigin(raw: unknown): string | null {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  try {
    const u = new URL(text);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * Sources a site's server may claim. Not `manual` (a member recording a phone
 * call — the only source that may skip consent) and not `demo` (the central
 * rikma's own form).
 */
export const API_LEAD_SOURCES = LEAD_SOURCES.filter((s) => s !== 'manual' && s !== 'demo' && s !== 'event');

export interface LeadStatusView {
  leadId: string;
  externalId: string | null;
  status: string;
  hasOwner: boolean;
  lastActivityAt: string | null;
}

export function toLeadStatusView(row: any): LeadStatusView | null {
  if (!row?.id) return null;
  const a = row.attributes ?? {};
  return {
    leadId: String(row.id),
    externalId: a.externalId ?? null,
    status: a.status ?? 'new',
    hasOwner: a.owner?.data?.id != null,
    lastActivityAt: a.lastActivityAt ?? null
  };
}

// ─── webhooks ───────────────────────────────────────────────────────────────

export const LEAD_WEBHOOK_EVENTS = ['lead.created', 'lead.statusChanged', 'lead.won'] as const;
export type LeadWebhookEvent = (typeof LEAD_WEBHOOK_EVENTS)[number];

/** Lead events go only to a key that deals in leads — a task desk never asked for them. */
export function mayReceiveLead(scopes: unknown): boolean {
  const s = Array.isArray(scopes) ? scopes.map(String) : [];
  return s.includes(LEADS_CREATE_SCOPE) || s.includes(LEADS_READ_SCOPE);
}

export interface LeadChange {
  leadId: string;
  externalId: string | null;
  status: string;
}

/**
 * Which events an action's run produced. A retry (`duplicated`) and a log entry
 * that did not move the status produce none. `lead.won` arrives with the
 * order/sale sync (L3a), the only place a lead becomes `won`.
 */
export function leadEventsFor(actionKey: string, result: any): LeadWebhookEvent[] {
  const r = result?.data ?? result ?? {};
  switch (actionKey) {
    case 'createLead':
      return r.duplicated ? [] : ['lead.created'];
    case 'updateLeadStatus':
      return ['lead.statusChanged'];
    case 'logLeadActivity':
      return r.statusChanged ? ['lead.statusChanged'] : [];
    default:
      return [];
  }
}

export function leadWebhookBody(
  event: LeadWebhookEvent,
  projectId: string,
  change: LeadChange,
  at = new Date().toISOString()
): string {
  return JSON.stringify({
    event,
    at,
    projectId,
    data: { leadId: change.leadId, externalId: change.externalId, status: change.status }
  });
}
