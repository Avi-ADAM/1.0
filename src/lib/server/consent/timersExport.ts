// Strapi's side of the timer comparison: the closed-interval total of named
// timers in ONE rikma ($lib/consent/timerShadow). The panel asks only for the
// timers it can compare — the fresh ones on its chain — so the read stays
// bounded however many timers the rikma has.

import { closedIntervalsMs } from '$lib/consent/timerShadow';

export const MAX_TIMER_IDS = 100;

/** `?ids=1,2,3` → unique numeric ids, at most MAX_TIMER_IDS. */
export function parseTimerIds(raw: string | null | undefined): string[] {
  const out: string[] = [];
  for (const part of String(raw ?? '').split(',')) {
    const id = part.trim();
    if (/^\d{1,12}$/.test(id) && !out.includes(id)) out.push(id);
    if (out.length === MAX_TIMER_IDS) break;
  }
  return out;
}

export function timersQuery(projectId: string, ids: string[]): string {
  const q = [
    `filters[project][id][$eq]=${projectId}`,
    ...ids.map((id, i) => `filters[id][$in][${i}]=${id}`),
    'fields[0]=isActive',
    'populate[timers][fields][0]=start',
    'populate[timers][fields][1]=stop',
    `pagination[pageSize]=${MAX_TIMER_IDS}`
  ];
  return `/api/timers?${q.join('&')}`;
}

export function timerTotalsFromRest(body: unknown): { id: string; ms: number }[] {
  const rows = (body as { data?: unknown })?.data;
  if (!Array.isArray(rows)) return [];
  const out: { id: string; ms: number }[] = [];
  for (const row of rows) {
    if (row?.id == null) continue;
    out.push({ id: String(row.id), ms: closedIntervalsMs(row.attributes?.timers) });
  }
  return out;
}
