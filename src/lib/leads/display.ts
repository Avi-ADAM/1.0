/**
 * How a lead looks on the manage screens (docs/inprogress/PLAN_LEADS.md §4.1,
 * §4.2) — the chip colour of each stage and the links that reach the person.
 * Pure; the words come from `shop.leads.*`.
 */

import type { Stage } from './stage';

/** One colour per stage: waiting on us is the accent, an offer out is gold, money is ok. */
export const STAGE_CHIP: Record<Stage, string> = {
  new: 'sh-chip-accent',
  contacted: 'sh-chip-info',
  talking: 'sh-chip-info',
  offered: 'sh-chip-gold',
  won: 'sh-chip-ok',
  paused: 'sh-chip-muted',
  spam: 'sh-chip-muted'
};

/** The stages a filter offers, in path order ("paused" is its own filter). */
export const STAGE_FILTERS = ['open', 'new', 'contacted', 'talking', 'offered', 'paused'] as const;

/** Digits a dialler or wa.me understands; an Israeli 05x number becomes 9725x for WhatsApp. */
function digits(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = digits(phone);
  return d.replace(/\D/g, '').length >= 6 ? `tel:${d}` : null;
}

export function whatsappHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = digits(phone);
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (/^0\d{8,9}$/.test(d)) d = `972${d.slice(1)}`;
  d = d.replace(/\D/g, '');
  return d.length >= 8 ? `https://wa.me/${d}` : null;
}

export function mailtoHref(email: string | null | undefined): string | null {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return `mailto:${email}`;
}

/** A date input's `YYYY-MM-DD` as a morning instant in the member's own time zone. */
export function followUpIso(day: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const t = new Date(`${day}T09:00`).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/** An ISO instant back to the date input's `YYYY-MM-DD`, in local time. */
export function dayOf(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** What a lead page `depends` on — invalidated after every write on it. */
export function leadKey(leadId: string | number): string {
  return `app:lead:${leadId}`;
}
