/**
 * Shared shapes for the shift modules (docs/PLAN_SHIFTS.md §3, §6).
 *
 * Everything in src/lib/shifts is pure: these types describe plain data the
 * server loaders and actions hand in, never Strapi payloads. Keeping the
 * modules free of the `{ data: { attributes } }` wrapping is what lets the
 * same roster be computed by the cron, previewed in the browser and replayed
 * in a test from a stored seed.
 */

/** A member's statement about one shift (§3.3). `cannot` is still stored — it answers the question. */
export type Stance = 'want' | 'can' | 'ifNeeded' | 'cannot';

/** One staffed window inside a day of the weekly pattern. Times are wall-clock "HH:MM". */
export interface ShiftWindow {
  start: string;
  end: string;
  /** How many people at once. */
  need: number;
  /** Restrict the window to a role (`tafkidim` id). Null/absent = anyone on the mission. */
  tafkidimId?: string | null;
}

export interface PatternDay {
  /** 0 = Sunday … 6 = Saturday. */
  dow: number;
  /** For a multi-week cycle: which week of the cycle (0-based). Absent = every week. */
  week?: number;
  windows: ShiftWindow[];
}

export interface PatternException {
  /** Local calendar date, "YYYY-MM-DD". Replaces that day's windows entirely. */
  date: string;
  windows: ShiftWindow[];
}

/** `shift-plan.pattern` (§3.6). */
export interface ShiftPattern {
  version: 1;
  /** Cycle length in weeks. 1 = the same every week. */
  weeks?: number;
  /** A Sunday ("YYYY-MM-DD") that starts week 0 of a multi-week cycle. */
  anchor?: string;
  days: PatternDay[];
  exceptions?: PatternException[];
}

/** One concrete shift materialized from a pattern (§6.1). */
export interface ShiftInstance {
  /** `<planId>|<startISO>|<tafkidimId or empty>` — stored as `shift.slotKey`, unique. */
  slotKey: string;
  start: string;
  end: string;
  need: number;
  tafkidimId: string | null;
  /** The local date the window belongs to (its start day, even when it crosses midnight). */
  localDate: string;
}

/** A shift as the roster modules need it — a materialized instance with its stored id. */
export interface ShiftLike {
  id: string;
  start: string;
  end: string;
  need: number;
  tafkidimId?: string | null;
  state?: 'open' | 'rostered' | 'running' | 'done' | 'cancelled' | null;
}

export interface Declaration {
  shiftId: string;
  userId: string;
  stance: Stance;
  /** The member's own order among the shifts they want; lower = more wanted. */
  prefRank?: number | null;
  declaredAt: string;
}

/**
 * The per-cycle shift commitment agreed as a term of the assignment (§3.8).
 * NULL min = 0; NULL max = no cap beyond what the member declared available.
 */
export interface Commitment {
  userId: string;
  min?: number | null;
  max?: number | null;
  /** Roles the member holds on this mission, for role-restricted windows. */
  tafkidimIds?: string[];
}

/**
 * Why the draft placed a person where it did (§1.5, §6.6). The UI turns each
 * into a sentence through `shifts.reason.<code>`.
 */
export type ReasonCode =
  | 'onlyCandidate'
  | 'wanted'
  | 'ownPreference'
  | 'belowQuota'
  | 'owed'
  | 'declaredFirst'
  | 'tieBreak'
  | 'overQuota'
  | 'backup'
  | 'volunteered'
  | 'swapped'
  | 'cover';

export interface DraftAssignment {
  shiftId: string;
  userId: string;
  /** 1 = comes; 2, 3, … = the backup chain in order. */
  rank: number;
  reason: ReasonCode;
}

export interface Hole {
  shiftId: string;
  /** Seats nobody could fill. */
  missing: number;
}

export type AssignmentState = 'draft' | 'confirmed' | 'released' | 'done';
export type AssignmentSource = 'auto' | 'swap' | 'volunteer' | 'cover';

/** A stored `shift-assignment`, flattened. */
export interface AssignmentLike {
  id?: string;
  shiftId: string;
  userId: string;
  rank: number;
  state: AssignmentState;
  source?: AssignmentSource;
  reason?: string | null;
}
