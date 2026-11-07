/**
 * How a lead asked to be reached (docs/inprogress/PLAN_LEADS.md L4) — on the
 * site (a message on 1lev1, for someone signed in), by email, by phone, or on
 * WhatsApp. An international customer may have no phone that matters; a
 * local one may never read email. The person chooses; the lead page puts
 * that channel first, and the offer goes out that way.
 *
 * Stored as `details.contactVia` (no schema change); read only through here.
 */

export const CONTACT_CHANNELS = ['site', 'email', 'phone', 'whatsapp'] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export const CONTACT_VIA_KEY = 'contactVia';

export function isContactChannel(v: unknown): v is ContactChannel {
  return typeof v === 'string' && (CONTACT_CHANNELS as readonly string[]).includes(v);
}

export interface Reach {
  phone: string | null;
  email: string | null;
  /** The person's 1lev1 account, when they asked while signed in. */
  customerUserId: string | null;
}

/** The channels this person can actually be reached on, in the order of the list. */
export function reachableChannels(r: Reach): ContactChannel[] {
  return CONTACT_CHANNELS.filter((c) =>
    c === 'site' ? !!r.customerUserId : c === 'email' ? !!r.email : !!r.phone
  );
}

/**
 * The channel to use: the one they chose if it can still be used, else the
 * first that can. A choice that cannot be honoured (they chose WhatsApp and
 * left no phone) is never invented into a reach.
 */
export function preferredChannel(chosen: unknown, r: Reach): ContactChannel | null {
  const can = reachableChannels(r);
  if (isContactChannel(chosen) && can.includes(chosen)) return chosen;
  return can[0] ?? null;
}

/** A form's choice, kept only if the form also gave what it needs. */
export function acceptedChoice(chosen: unknown, r: Reach): ContactChannel | null {
  return isContactChannel(chosen) && reachableChannels(r).includes(chosen) ? chosen : null;
}

/** `wa.me/<number>?text=…` — WhatsApp opens with the message written. */
export function whatsappWithText(href: string | null, text: string): string | null {
  return href ? `${href}?text=${encodeURIComponent(text)}` : null;
}

export function mailtoWithText(email: string | null, subject: string, body: string): string | null {
  if (!email) return null;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** A member's message to the person on 1lev1, as it is written in the log. */
export const SITE_MESSAGE_PREFIX = 'site:';

export function siteMessageOf(body: string | null | undefined): string | null {
  return typeof body === 'string' && body.startsWith(SITE_MESSAGE_PREFIX) ? body.slice(SITE_MESSAGE_PREFIX.length) : null;
}

/** What a member offered, as the offer form hands it back. */
export interface OfferSummary {
  lines: Array<{ name: string; quantity: number; unitPrice: number }>;
  total: number;
  note: string | null;
}

/**
 * The offer as plain text — the same words whether it goes by email, on
 * WhatsApp or as a message on 1lev1. `fmt` formats money in the rikma's way.
 */
export function offerText(
  o: OfferSummary,
  words: { greeting: string; total: string; closing: string },
  fmt: (n: number) => string
): string {
  const lines = o.lines.map((l) => `• ${l.name} — ${l.quantity} × ${fmt(l.unitPrice)}`);
  return [words.greeting, '', ...lines, '', `${words.total}: ${fmt(o.total)}`, ...(o.note ? ['', o.note] : []), '', words.closing].join('\n');
}
