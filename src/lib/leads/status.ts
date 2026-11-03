/**
 * A lead's status, and which moves a member may make by hand
 * (docs/inprogress/PLAN_LEADS.md §2.1, §4.0).
 *
 * There is no `lost` and no `rejected`: a lead that stops moving is `paused`
 * ("not now"), with a reason from a short list so the rikma can count *why*.
 * `offered` and `won` are never chosen from a form — they follow from an order
 * or a sale linked to the lead, so success cannot be typed in.
 */

export const LEAD_STATUSES = ['new', 'contacted', 'talking', 'offered', 'won', 'paused', 'spam'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Set by a member (or by logging activity). Any of these may follow any other. */
export const MANUAL_STATUSES = ['new', 'contacted', 'talking', 'paused', 'spam'] as const;
export type ManualLeadStatus = (typeof MANUAL_STATUSES)[number];

/** Written only by the order/sale sync (L3a). */
export const DERIVED_STATUSES = ['offered', 'won'] as const;

export const PAUSED_REASONS = ['timing', 'budget', 'noAnswer', 'choseOther', 'notFit', 'other'] as const;
export type PausedReason = (typeof PAUSED_REASONS)[number];

export const LEAD_SOURCES = ['api', 'form', 'shop', 'quote', 'manual', 'bot', 'demo', 'import'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/** Activity a member records by hand. The rest (`statusChange`, `assign`, …) only the system writes. */
export const MANUAL_ACTIVITY_KINDS = ['note', 'call', 'whatsapp', 'email', 'meeting'] as const;
export type ManualActivityKind = (typeof MANUAL_ACTIVITY_KINDS)[number];

export const ACTIVITY_KINDS = [
  ...MANUAL_ACTIVITY_KINDS,
  'statusChange',
  'assign',
  'release',
  'inbound',
  'linkOrder',
  'system'
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Kinds that are contact with the person, and so carry a direction. */
const CONTACT_KINDS: ReadonlySet<string> = new Set(['call', 'whatsapp', 'email', 'meeting']);

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === 'string' && (LEAD_STATUSES as readonly string[]).includes(v);
}

export function isManualStatus(v: unknown): v is ManualLeadStatus {
  return typeof v === 'string' && (MANUAL_STATUSES as readonly string[]).includes(v);
}

export function isPausedReason(v: unknown): v is PausedReason {
  return typeof v === 'string' && (PAUSED_REASONS as readonly string[]).includes(v);
}

export function isManualActivityKind(v: unknown): v is ManualActivityKind {
  return typeof v === 'string' && (MANUAL_ACTIVITY_KINDS as readonly string[]).includes(v);
}

export function isContactKind(kind: string): boolean {
  return CONTACT_KINDS.has(kind);
}

/** Still in play: not a customer yet, not put aside, not spam. */
export function isOpenLead(status: string | null | undefined): boolean {
  return status !== 'won' && status !== 'paused' && status !== 'spam';
}

/**
 * Whether a lead with this status takes a returning contact as a repeat of the
 * same enquiry (§2.4). A customer who writes again is a new enquiry; spam is
 * not worth reviving.
 */
export function absorbsRepeatContact(status: string | null | undefined): boolean {
  return status !== 'won' && status !== 'spam';
}

export type TransitionRefusal = 'NOT_MANUAL' | 'DERIVED_LOCKED' | 'PAUSED_REASON_REQUIRED' | 'UNCHANGED';

/**
 * Can a member move a lead from `from` to `to` by hand?
 *
 * - Only the manual statuses can be chosen.
 * - A lead at `offered`/`won` follows its order or sale; moving it back by hand
 *   would contradict the money. Cancelling the order is what reopens it.
 * - `paused` needs a reason — that is what makes "not now" countable.
 */
export function checkManualTransition(
  from: string | null | undefined,
  to: string,
  opts: { pausedReason?: string | null } = {}
): TransitionRefusal | null {
  if (!isManualStatus(to)) return 'NOT_MANUAL';
  if (from === 'offered' || from === 'won') return 'DERIVED_LOCKED';
  if (to === 'paused' && !isPausedReason(opts.pausedReason)) return 'PAUSED_REASON_REQUIRED';
  if ((from ?? 'new') === to && to !== 'paused') return 'UNCHANGED';
  return null;
}

/**
 * The status after a member records activity: the first outgoing contact with
 * a `new` lead means somebody got back to them. A meeting counts whichever
 * side asked for it. Anything else leaves the status alone.
 */
export function statusAfterActivity(
  status: string | null | undefined,
  kind: string,
  direction: 'in' | 'out' | null | undefined
): LeadStatus | null {
  if ((status ?? 'new') !== 'new') return null;
  if (!isContactKind(kind)) return null;
  if (kind === 'meeting' || direction === 'out') return 'contacted';
  return null;
}
