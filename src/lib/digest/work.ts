/**
 * "x missions waiting for you, y tasks" — PLAN_DAILY_DIGEST §4.2–§4.3.
 *
 * Reads the `mesimabetahaliches` block of qid `317digestWork` (or of the
 * service twin `320digestForUser`) — missions the user took, not finished,
 * not waiting for approval, not archived — with their acts, their running
 * timer and their dormancy clock.
 *
 * Three distinctions make the numbers worth sending rather than noise:
 *  - a mission with a running timer is being worked on right now, it is not
 *    "waiting"; one with no hours yet has not been started at all;
 *  - "17 open tasks" says nothing, "2 overdue, 1 due today" says what to do;
 *  - a mission whose dormancy clock (PLAN_OBJECT_ARCHIVAL) is about to run out
 *    will get a release proposal opened on it. The digest is the one place
 *    that can say so *before* it happens.
 *
 * Pure. Day boundaries are the site's (Asia/Jerusalem), like the send window.
 */

import { effectiveDormancyDays } from '$lib/archive/dormancy.js';

export const SITE_TIMEZONE = 'Asia/Jerusalem';

/** Warn about a dormancy clock this many days before it runs out. */
export const DORMANCY_WARN_DAYS = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** How many task lines the digest carries; the full list is on the site. */
export const MAX_TASK_ITEMS = 3;

export interface DormantSoonItem {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  /** When the dormancy clock runs out and the release proposal opens. */
  deadline: string;
  daysLeft: number;
  /** The rikma's period — "after N days without activity". */
  periodDays: number;
}

export interface TaskItem {
  id: string;
  title: string;
  missionName: string;
  projectId: string;
  projectName: string;
  due: string | null;
  overdue: boolean;
}

export interface WorkSummary {
  missions: {
    /** Every mission the user is carrying. */
    active: number;
    /** A timer is running on it right now. */
    running: number;
    /** No hours logged and no timer — taken, not started. */
    notStarted: number;
    dormantSoon: DormantSoonItem[];
  };
  tasks: {
    open: number;
    overdue: number;
    /** Due today or tomorrow (site time). */
    dueSoon: number;
    /** The most pressing few: overdue first, then nearest due date. */
    items: TaskItem[];
  };
}

export function emptyWorkSummary(): WorkSummary {
  return {
    missions: { active: 0, running: 0, notStarted: 0, dormantSoon: [] },
    tasks: { open: 0, overdue: 0, dueSoon: 0, items: [] }
  };
}

/** `YYYY-MM-DD` of an instant, in site time. */
export function siteDayKey(at: number | string | Date): string {
  const d = at instanceof Date ? at : new Date(at);
  // en-CA formats as ISO-style YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

function finiteTime(value: unknown): number | null {
  if (value == null || value === '') return null;
  const t = new Date(value as string).getTime();
  return Number.isFinite(t) ? t : null;
}

function isRunning(attrs: any): boolean {
  return attrs?.activeTimer?.data?.attributes?.isActive === true;
}

export function processWork(raw: any, now: number = Date.now()): WorkSummary {
  const missions = raw?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];
  const out = emptyWorkSummary();

  const today = siteDayKey(now);
  const tomorrow = siteDayKey(now + MS_PER_DAY);
  const seenActs = new Set<string>();
  const pressing: TaskItem[] = [];

  for (const m of missions) {
    const a = m?.attributes ?? {};
    const project = a.project?.data;
    const projectId = project?.id != null ? String(project.id) : '';
    const projectName = project?.attributes?.projectName ?? '';
    const hours = Number(a.howmanyhoursalready ?? 0);
    const hasHours = Number.isFinite(hours) && hours > 0;
    const running = isRunning(a);

    out.missions.active++;
    if (running) out.missions.running++;
    else if (!hasHours) out.missions.notStarted++;

    // The dormancy clock opens a proposal only on a mission where nothing ever
    // happened (openDormancyProposal refuses otherwise), so only those get the
    // warning — warning someone with logged hours would be a false alarm.
    const clock = finiteTime(a.timegramas?.data?.[0]?.attributes?.date);
    if (clock != null && !running && !hasHours) {
      const msLeft = clock - now;
      if (msLeft > 0 && msLeft <= DORMANCY_WARN_DAYS * MS_PER_DAY) {
        out.missions.dormantSoon.push({
          id: String(m.id),
          title: a.name ?? '',
          projectId,
          projectName,
          deadline: new Date(clock).toISOString(),
          daysLeft: Math.max(1, Math.ceil(msLeft / MS_PER_DAY)),
          periodDays: effectiveDormancyDays(a.dormancyDays, project?.attributes?.dormancyDays)
        });
      }
    }

    for (const act of a.acts?.data ?? []) {
      const id = String(act.id);
      // One act can hang off several missions; count it once.
      if (seenActs.has(id)) continue;
      seenActs.add(id);

      const aa = act.attributes ?? {};
      if (aa.naasa === true) continue;

      const dueT = finiteTime(aa.dateF);
      const dueDay = dueT != null ? siteDayKey(dueT) : null;
      const overdue = dueDay != null && dueDay < today;

      out.tasks.open++;
      if (overdue) out.tasks.overdue++;
      else if (dueDay === today || dueDay === tomorrow) out.tasks.dueSoon++;
      else continue; // open, but nothing to say about it this morning

      pressing.push({
        id,
        title: aa.shem ?? '',
        missionName: a.name ?? '',
        projectId,
        projectName,
        due: dueT != null ? new Date(dueT).toISOString() : null,
        overdue
      });
    }
  }

  out.missions.dormantSoon.sort((x, y) => x.deadline.localeCompare(y.deadline));

  out.tasks.items = pressing
    .sort((x, y) => {
      if (x.overdue !== y.overdue) return x.overdue ? -1 : 1;
      return (x.due as string).localeCompare(y.due as string);
    })
    .slice(0, MAX_TASK_ITEMS);

  return out;
}
