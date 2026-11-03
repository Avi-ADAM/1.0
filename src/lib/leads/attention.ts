/**
 * "Needs attention" — the one rule for which leads to surface
 * (docs/inprogress/PLAN_LEADS.md §4.3). The table, the simple-layer banner and
 * the daily digest all ask this function; none of them re-derives it.
 *
 * A lead needs attention when:
 *  - it is `new` and nobody got back within `leadResponseHours`; or
 *  - its `followUpAt` has come (whatever the status — that is how a paused
 *    lead comes back); or
 *  - it is open and nothing happened for `leadStaleDays` (Pipedrive's "rotting").
 */

import { isOpenLead } from './status';
import type { LeadSettings } from './settings';

export type AttentionReason = 'unanswered' | 'followUpDue' | 'stale';

export interface LeadForAttention {
  status?: string | null;
  createdAt?: string | null;
  lastActivityAt?: string | null;
  followUpAt?: string | null;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function ms(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

/** Why this lead needs attention, or null. The first reason that applies wins. */
export function attentionReason(
  lead: LeadForAttention,
  now: Date | number,
  settings: Pick<LeadSettings, 'leadResponseHours' | 'leadStaleDays'>
): AttentionReason | null {
  const t = typeof now === 'number' ? now : now.getTime();
  const status = lead.status ?? 'new';
  if (status === 'spam') return null;

  const followUp = ms(lead.followUpAt);
  if (followUp != null && followUp <= t) return 'followUpDue';

  const created = ms(lead.createdAt);
  if (status === 'new' && created != null && t - created >= settings.leadResponseHours * HOUR) {
    return 'unanswered';
  }

  if (isOpenLead(status)) {
    const last = ms(lead.lastActivityAt) ?? created;
    if (last != null && t - last >= settings.leadStaleDays * DAY) return 'stale';
  }
  return null;
}

export function needsAttention(
  lead: LeadForAttention,
  now: Date | number,
  settings: Pick<LeadSettings, 'leadResponseHours' | 'leadStaleDays'>
): boolean {
  return attentionReason(lead, now, settings) !== null;
}
