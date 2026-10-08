/**
 * What a customer sees of the work on her deal (QA_CONCIERGE_E2E C-21).
 *
 * The deal page used to show "0 missions" and a progress bar driven only by the
 * delivery / payment flags, while the providers were logging hours and writing,
 * in their own words, what they had done ("cut the boards…") — none of which
 * reached her. Both come from data the page already has or can read:
 *
 * - the parts of the deal are `DealDue.lines` (C-14): each mission line knows its
 *   agreed hours, its approved hours and whether its mission is closed;
 * - the providers' own account is the `saveText` of the timers they saved on
 *   those missions (`420dealProgressUpdates`).
 *
 * Pure: the loader reads, this shapes.
 */

import type { DealDue, DealLine } from './dealDue';
import type { Mission } from '$lib/types';

export interface DealProgressUpdate {
  id: string;
  who: string;
  missionName: string;
  text: string;
  hours: number;
  at: string | null;
}

/** The deal's mission lines as the page's mission list. */
export function missionsFromDue(due: Pick<DealDue, 'lines'> | null | undefined): Mission[] {
  return (due?.lines ?? [])
    .filter((l: DealLine) => l.kind === 'mission')
    .map((l: DealLine) => {
      const hours = Number(l.agreedHours ?? l.missionHours ?? 0) || 0;
      const hoursDone = Number(l.approvedHours ?? 0) || 0;
      return {
        id: String(l.missionId ?? l.key),
        name: l.name,
        status: !l.providerId ? 'waiting' : l.closed ? 'done' : 'in-progress',
        hours,
        hoursDone,
        paid: l.paid === true,
        sub: l.providerName ?? undefined
      } satisfies Mission;
    });
}

/** done / in progress / total, for the donut. */
export function missionCounts(list: Mission[]) {
  return {
    done: list.filter((m) => m.status === 'done').length,
    inProgress: list.filter((m) => m.status === 'in-progress').length,
    total: list.length
  };
}

/**
 * Progress of the work itself: approved hours over agreed hours, per line and
 * capped at 1 each, so one part that ran long cannot make the whole deal look
 * finished. null when there is nothing to measure.
 */
export function workProgressPct(list: Mission[]): number | null {
  const measured = list.filter((m) => m.hours > 0 || m.status === 'done');
  if (measured.length === 0) return null;
  const sum = measured.reduce(
    (s, m) => s + (m.status === 'done' ? 1 : Math.min(1, m.hoursDone / m.hours)),
    0
  );
  return Math.round((sum / measured.length) * 100);
}

/** Timers (`420dealProgressUpdates`) → the updates, newest first, empty notes dropped. */
export function readProgressUpdates(res: any): DealProgressUpdate[] {
  const nodes: any[] = res?.data?.timers?.data ?? [];
  return nodes
    .map((n) => {
      const a = n?.attributes ?? {};
      return {
        id: String(n?.id ?? ''),
        who: a.users_permissions_user?.data?.attributes?.username ?? '',
        missionName: a.mesimabetahalich?.data?.attributes?.name ?? '',
        text: String(a.saveText ?? '').trim(),
        hours: Number(a.totalHours ?? 0) || 0,
        at: a.updatedAt ?? null
      };
    })
    .filter((u) => u.id && u.text)
    .sort((x, y) => String(y.at ?? '').localeCompare(String(x.at ?? '')));
}
