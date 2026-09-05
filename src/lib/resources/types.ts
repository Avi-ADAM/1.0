/**
 * Resource availability — shared types (docs/PLAN_RESOURCE_CALENDAR.md §2, §3).
 *
 * These describe the *booking ledger*: the one place a date range on a resource
 * is recorded, whoever the counterparty is (rikma, concierge customer, or the
 * holder blocking their own dates). Availability is never a stored flag — it is
 * computed from these rows by `availability.ts`.
 */

/**
 * The possession axis, orthogonal to `kindOf` (which is the billing axis).
 *
 * - `exclusive`  — one physical unit; a booking takes it for a date range.
 * - `pooled`     — `capacity` units; a booking takes `quantity` of them.
 * - `unlimited`  — digital/knowledge; giving it costs nothing, never taken.
 * - `consumable` — handed over and gone; the units never come back.
 */
export type AvailabilityModel = 'exclusive' | 'pooled' | 'unlimited' | 'consumable';

/** `Enum_Mashaabim_Kindof` — the existing billing axis, unchanged. */
export type ResourceKind = 'total' | 'rent' | 'monthly' | 'yearly' | 'perUnit';

/**
 * `hold | confirmed | active` hold capacity; `done | cancelled` do not.
 * A `hold` past its `holdExpiresAt` holds nothing (it lapsed on its own).
 */
export type BookingStatus = 'hold' | 'confirmed' | 'active' | 'done' | 'cancelled';

/** Who the booking is for. `blackout` is the holder blocking their own dates. */
export type BookingSource = 'rikma' | 'concierge' | 'personal' | 'blackout' | 'external';

/** Why a booking was cancelled — `conflict` is the automatic one (§2.2). */
export type CancelReason = 'conflict' | 'withdrawn' | 'expired' | 'declined' | 'replaced';

/** Display/rounding granularity. Never affects the math — see §9.2. */
export type Granularity = 'day' | 'hour';

/** A half-open interval `[start, end)`. `end: null` means open-ended. */
export interface Range {
  start: Date;
  end: Date | null;
}

/** Same, as it arrives from GraphQL — ISO strings, everything nullable. */
export interface BookingLike {
  id?: string | number | null;
  start: Date | string;
  end?: Date | string | null;
  quantity?: number | null;
  status?: BookingStatus | string | null;
  holdExpiresAt?: Date | string | null;
  source?: BookingSource | string | null;
}

/** The `Sp` row (or anything shaped like it) whose availability we are asking about. */
export interface ResourceLike {
  id?: string | number | null;
  /** Existing enum. Used to derive `availability` while that field is null. */
  kindOf?: ResourceKind | string | null;
  /** New field. **null = legacy** → derived from `kindOf`. */
  availability?: AvailabilityModel | string | null;
  /** Pool size. null → falls back to `hm`, then 1. */
  capacity?: number | null;
  /** Legacy per-unit quantity already on `Sp`. */
  hm?: number | null;
  /** The window the holder offers the resource in. null = unbounded. */
  sdate?: Date | string | null;
  fdate?: Date | string | null;
  /** Minimum gap between two bookings (cleaning, transport). */
  leadTimeHours?: number | null;
  granularity?: Granularity | string | null;
}

/** One piece of a usage profile: `[start, end)` with `quantity` units in use. */
export interface UsageSlice {
  start: Date;
  end: Date | null;
  quantity: number;
}

export type AvailabilityResult =
  /** Nothing to book — the resource is not consumed by being given. */
  | { kind: 'unlimited'; dateFit: 1 }
  /** The whole requested range fits. */
  | { kind: 'available'; dateFit: 1; freeWindows: Range[] }
  /**
   * Part of the range fits. **Not a rejection** — this is what turns into a
   * date counter-proposal through the existing nego flow (§3).
   */
  | {
      kind: 'partial';
      dateFit: number;
      freeWindows: Range[];
      freeDays: number;
      requestedDays: number;
      conflicts: BookingLike[];
    }
  /** No part of the range fits. */
  | { kind: 'taken'; dateFit: 0; nextFreeFrom: Date | null; conflicts: BookingLike[] }
  /** The request falls entirely outside the holder's own `sdate..fdate`. */
  | { kind: 'outOfWindow'; dateFit: 0; window: Range | null };
