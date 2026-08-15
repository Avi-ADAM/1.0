/**
 * Shared shapes for the subsistence stipend (docs/PLAN_STIPEND.md).
 *
 * A stipend is one partner paying another a monthly amount computed from the
 * hours they contributed, at a rate far *below* the market rate written on the
 * mission. The market rate is what buys equity; the stipend rate is what buys
 * groceries. Everything here exists to answer one question: what do those
 * shekels do to the rikma's books.
 */

/** What the money buys. */
export type StipendMode = 'equity' | 'advance' | 'gift';

/** Who the pledge covers. */
export type StipendScope = 'allMissions' | 'selectedMissions' | 'singleMission';

/** Whether an advance can ever be collected from the recipient personally. */
export type StipendRecourse = 'nonRecourse' | 'personal';

/** `Project.stipendPolicy`. **null = legacy = `bilateral`** (§7). */
export type StipendPolicy = 'off' | 'bilateral' | 'collective';

/** Lifecycle of a pledge / program row. */
export type StipendStatus = 'proposed' | 'active' | 'exhausted' | 'closed' | 'withdrawn';

/** Lifecycle of one settled cycle. */
export type StipendPaymentStatus = 'pending' | 'sent' | 'confirmed' | 'cancelled';

/**
 * The three parameters of §1. Every stipend in the system is one point in this
 * space — there are no separate "models", only combinations.
 */
export interface StipendTerms {
  mode: StipendMode;
  /** α — who carries the cost. 1 = the recipient alone, 0 = the whole rikma. */
  costShare: number;
  /** k — the funder's risk premium. ≥ 1. */
  equityMultiplier: number;
  /** ₪ per hour paid. Must never exceed the mission's market `perhour`. */
  stipendRate: number;
  monthlyCap?: number | null;
  totalCap?: number | null;
  noticeCycles?: number | null;
  revenueTrigger?: number | null;
  recourse?: StipendRecourse;
  scope?: StipendScope;
  start?: string | null;
  end?: string | null;
  cycleSize?: number | null;
}

/** Terms as they arrive from a negotiation round or a form — all optional. */
export type PartialStipendTerms = Partial<StipendTerms>;

/** The envelope a pledge must stay inside when a program exists (§5). */
export interface StipendEnvelope {
  mode?: StipendMode | null;
  costShare?: number | null;
  equityMultiplier?: number | null;
  /** Maximum ₪/hour the program allows. */
  stipendRate?: number | null;
  /** What is left of the program's budget. */
  remainingCap?: number | null;
}

export const DEFAULT_TERMS: StipendTerms = {
  mode: 'equity',
  costShare: 1,
  equityMultiplier: 1,
  stipendRate: 0,
  monthlyCap: null,
  totalCap: null,
  noticeCycles: 1,
  revenueTrigger: null,
  recourse: 'nonRecourse',
  scope: 'allMissions',
  cycleSize: 1
};
