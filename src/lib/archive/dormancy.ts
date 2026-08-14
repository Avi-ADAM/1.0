/**
 * Dormancy — the clock that turns a forgotten commitment back into an open
 * need (PLAN_OBJECT_ARCHIVAL, "רדימות").
 *
 * The period is a rikma parameter, like `restime`, with a per-object override:
 * an urgent mission wants its assignment cancelled faster than the rikma's
 * default. Resolution order is object → project → DEFAULT_DORMANCY_DAYS.
 *
 * Pure module — imported by both the lev cards and the server actions.
 */

/** Fallback when neither the object nor the rikma set a period. */
export const DEFAULT_DORMANCY_DAYS = 30;

/** Shortest period a rikma may configure — below this the clock is noise. */
export const MIN_DORMANCY_DAYS = 1;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toPositiveInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const days = Math.floor(n);
  return days >= MIN_DORMANCY_DAYS ? days : null;
}

/**
 * The period that actually applies to one object.
 *
 * @param objectDays  `dormancyDays` on the object (mission/resource) — wins.
 * @param projectDays `dormancyDays` on the rikma — the default for its objects.
 */
export function effectiveDormancyDays(
  objectDays?: number | string | null,
  projectDays?: number | string | null,
): number {
  return (
    toPositiveInt(objectDays) ?? toPositiveInt(projectDays) ?? DEFAULT_DORMANCY_DAYS
  );
}

/** When the clock on an object whose last activity was `from` runs out. */
export function dormancyDeadline(
  from: string | number | Date,
  days: number,
): Date {
  const base = from instanceof Date ? from.getTime() : new Date(from).getTime();
  const start = Number.isFinite(base) ? base : Date.now();
  return new Date(start + days * MS_PER_DAY);
}

export interface DormancyInput {
  /** Hours already logged on the object (`howmanyhoursalready`). */
  hoursAlready?: number | string | null;
  /** How many FinnishedMission rows it produced — any means work happened. */
  finnishedMissionCount?: number | null;
  /** A running timer means it is active right now, whatever the dates say. */
  hasActiveTimer?: boolean | null;
  /** Last real activity (the dormancy timegrama's date minus the period). */
  lastActivityAt?: string | number | Date | null;
}

/**
 * "Nothing ever happened here."
 *
 * Deliberately strict: any logged hour, any finished-mission row or a running
 * timer disqualifies an object, because from that moment archiving it is a
 * question about someone's accrued value and not a cleanup.
 */
export function isDormant(
  input: DormancyInput,
  days: number,
  now: Date = new Date(),
): boolean {
  const hours = Number(input.hoursAlready ?? 0);
  if (Number.isFinite(hours) && hours > 0) return false;
  if ((input.finnishedMissionCount ?? 0) > 0) return false;
  if (input.hasActiveTimer) return false;
  if (!input.lastActivityAt) return false;

  return now.getTime() >= dormancyDeadline(input.lastActivityAt, days).getTime();
}

/**
 * Whether accrued value makes this an object whose removal needs a settlement
 * discussion (hours block in the card) rather than a plain cleanup.
 */
export function hasAccruedValue(input: DormancyInput): boolean {
  const hours = Number(input.hoursAlready ?? 0);
  return (Number.isFinite(hours) && hours > 0) || (input.finnishedMissionCount ?? 0) > 0;
}
