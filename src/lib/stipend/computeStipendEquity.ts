/**
 * computeStipendEquity — the single source of truth for `(k − α)·P`
 * (docs/PLAN_STIPEND.md §1, §2, §5).
 *
 * Pure and deterministic, so the same numbers are produced by the action that
 * writes the ledger row, by the card that asks the recipient to sign, and by
 * the dilution preview every member sees before voting. If these three ever
 * disagree, someone signed one deal and got another.
 *
 * The whole model is three lines:
 *
 *     recipient contribution  =  M×H  −  α·P
 *     funder contribution     =        +  k·P     (mode 'equity' only)
 *     change in rikma total   =  (k − α)·P
 *
 * and one consequence: while the rikma total does not move, nobody outside the
 * two parties is affected, so the agreement is bilateral. The moment it grows,
 * everyone else is diluted — and everyone else signs.
 */

import type {
  PartialStipendTerms,
  StipendEnvelope,
  StipendMode,
  StipendPolicy,
  StipendTerms
} from './types.js';
import { DEFAULT_TERMS } from './types.js';

/** Round money/equity to 2 decimals without floating-point dust. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Fill in the blanks and clamp α to [0,1] and k to ≥ 1. */
export function normalizeTerms(input: PartialStipendTerms | null | undefined): StipendTerms {
  const t = { ...DEFAULT_TERMS, ...(input ?? {}) };
  // `advance` was removed as a choice, but rows written while it existed can
  // still arrive here. It is read as `gift`, which is what it always was in
  // this function — both produced zeros — so a legacy row keeps its true
  // behaviour instead of silently becoming an equity stake nobody agreed to.
  const raw = String(t.mode ?? '');
  const mode: StipendMode = raw === 'gift' || raw === 'advance' ? 'gift' : 'equity';
  return {
    ...t,
    mode,
    costShare: Math.min(1, Math.max(0, num(t.costShare, 1))),
    equityMultiplier: Math.max(1, num(t.equityMultiplier, 1)),
    stipendRate: Math.max(0, num(t.stipendRate, 0)),
    monthlyCap: t.monthlyCap == null ? null : Math.max(0, num(t.monthlyCap, 0)),
    totalCap: t.totalCap == null ? null : Math.max(0, num(t.totalCap, 0)),
    noticeCycles: t.noticeCycles == null ? 1 : Math.max(0, Math.round(num(t.noticeCycles, 1))),
    cycleSize: t.cycleSize == null ? 1 : Math.max(1, Math.round(num(t.cycleSize, 1)))
  };
}

export interface StipendEquityLines {
  /** ₪ added to the funder's contribution ledger (`k·P`, equity mode only). */
  equityCredit: number;
  /** ₪ removed from the recipient's contribution ledger (`α·P`). */
  equityDebit: number;
  /** `(k − α)·P` — how much the rikma's total value moves. */
  netChange: number;
}

/**
 * The equity valve. One payment of `amount` in, two signed numbers out.
 *
 * `advance` and `gift` produce zeros: real money moved, but the percentages
 * were never part of the deal.
 */
export function computeStipendEquity(
  amount: number,
  terms: PartialStipendTerms | null | undefined
): StipendEquityLines {
  const t = normalizeTerms(terms);
  const P = Math.max(0, num(amount, 0));

  if (t.mode !== 'equity' || P === 0) {
    return { equityCredit: 0, equityDebit: 0, netChange: 0 };
  }

  const equityCredit = round2(t.equityMultiplier * P);
  const equityDebit = round2(t.costShare * P);
  return {
    equityCredit,
    equityDebit,
    netChange: round2(equityCredit - equityDebit)
  };
}

/** Who has to agree, derived from the terms — never chosen by hand (§2). */
export type StipendConsensusScope = 'bilateral' | 'rikma';

export function consensusScope(terms: PartialStipendTerms | null | undefined): StipendConsensusScope {
  const t = normalizeTerms(terms);
  if (t.mode !== 'equity') return 'bilateral';
  // Any budget makes the sign of (k − α) the whole answer; use P = 1.
  return computeStipendEquity(1, t).netChange > 0 ? 'rikma' : 'bilateral';
}

/**
 * `Project.stipendPolicy`, with the legacy rule spelled out once: an unset
 * policy is `bilateral`, the mode that cannot dilute a third party (§7).
 */
export function effectiveStipendPolicy(policy: StipendPolicy | null | undefined): StipendPolicy {
  return policy == null ? 'bilateral' : policy;
}

export interface TermsValidationInput {
  terms: PartialStipendTerms;
  /** Market rate on the mission(s) the stipend pays against. */
  marketRate?: number | null;
  /** The rikma's policy, already read from the project (null = legacy). */
  policy?: StipendPolicy | null;
  /** The program the pledge must fit inside, when one exists. */
  envelope?: StipendEnvelope | null;
}

export interface TermsValidation {
  ok: boolean;
  /** i18n keys under the `stipend.error.*` namespace, in order of severity. */
  errors: string[];
  scope: StipendConsensusScope;
}

/**
 * Everything that can make a set of terms illegal, in one place, so the form,
 * the action and the maturation agree. Returns translation keys rather than
 * sentences — the caller renders them with `$t()`.
 */
export function validateStipendTerms(input: TermsValidationInput): TermsValidation {
  const t = normalizeTerms(input.terms);
  const errors: string[] = [];
  const policy = effectiveStipendPolicy(input.policy);
  const scope = consensusScope(t);

  if (!(t.stipendRate > 0)) errors.push('rateRequired');

  // The hard one (§11.2): paying more per hour than the work is booked at
  // drives the recipient's own equity negative.
  const market = input.marketRate == null ? null : Number(input.marketRate);
  if (market != null && Number.isFinite(market) && market > 0 && t.stipendRate > market) {
    errors.push('rateAboveMarket');
  }
  if (market != null && Number.isFinite(market) && market <= 0 && t.mode === 'equity') {
    // §11.3 — with no market rate α is undefined; the honest form is a gift.
    errors.push('noMarketRate');
  }

  const env = input.envelope;

  if (policy === 'off') errors.push('policyOff');
  // `bilateral` means "this rikma has not agreed to be diluted" — so terms that
  // dilute need the rikma's consent. An **active** program is exactly that
  // consent, already given and already bounded by its cap, so a pledge sitting
  // inside one is not asking again. Without that, an approved program was
  // unusable: every pledge under it still failed on the policy it was voted to
  // authorise.
  if (policy === 'bilateral' && scope === 'rikma' && !env?.active) {
    errors.push('policyBilateralOnly');
  }

  if (env) {
    if (env.mode && env.mode !== t.mode) errors.push('outsideEnvelopeMode');
    if (env.stipendRate != null && t.stipendRate > Number(env.stipendRate)) {
      errors.push('outsideEnvelopeRate');
    }
    // A pledge may shift cost onto the rikma no further than the program said.
    if (env.costShare != null && t.costShare < Number(env.costShare)) {
      errors.push('outsideEnvelopeCostShare');
    }
    if (env.equityMultiplier != null && t.equityMultiplier > Number(env.equityMultiplier)) {
      errors.push('outsideEnvelopeMultiplier');
    }
    if (env.remainingCap != null && Number(env.remainingCap) <= 0) {
      errors.push('programExhausted');
    }
  }

  return { ok: errors.length === 0, errors, scope };
}

export interface DilutionInput {
  /** The voter's contribution total today. */
  myTotal: number;
  /** Σ of every member's contribution total today (the `net` of the split page). */
  rikmaTotal: number;
  /** The program's budget — the *most* that can ever be paid under it. */
  budget: number;
  terms: PartialStipendTerms;
}

export interface DilutionResult {
  /** 0..100 today. */
  currentPct: number;
  /** 0..100 if the whole budget is spent. */
  projectedPct: number;
  /** currentPct − projectedPct, in percentage points (positive = diluted). */
  deltaPoints: number;
  /** The rikma total after the budget is spent. */
  projectedRikmaTotal: number;
}

/**
 * The number every member must see before voting on a program (§4).
 *
 * Deliberately computed against the *whole* budget, not the amount paid so
 * far: nobody votes on "open-ended dilution", they vote on a closed number.
 */
export function computeStipendDilution(input: DilutionInput): DilutionResult {
  const myTotal = Math.max(0, num(input.myTotal, 0));
  const rikmaTotal = Math.max(0, num(input.rikmaTotal, 0));
  const budget = Math.max(0, num(input.budget, 0));
  const { netChange } = computeStipendEquity(budget, input.terms);

  const currentPct = rikmaTotal > 0 ? (100 * myTotal) / rikmaTotal : 0;
  const projectedRikmaTotal = Math.max(0, rikmaTotal + netChange);
  const projectedPct = projectedRikmaTotal > 0 ? (100 * myTotal) / projectedRikmaTotal : 0;

  return {
    currentPct: round2(currentPct),
    projectedPct: round2(projectedPct),
    deltaPoints: round2(currentPct - projectedPct),
    projectedRikmaTotal: round2(projectedRikmaTotal)
  };
}

/**
 * What the *recipient* gives up, which is the other half of the same trade and
 * the one the plan insists must be visible at signing time (§8).
 *
 * `missionValue` is M×H — the mission's market value. The recipient ends with
 * `missionValue − α·P` of equity and `P` in cash.
 */
export interface RecipientTradeoffInput {
  missionValue: number;
  /** Cash the recipient will receive over the pledge — `S × H`. */
  stipendTotal: number;
  /** Rikma total *excluding* this mission, so both scenarios share a base. */
  rikmaTotalWithout: number;
  terms: PartialStipendTerms;
}

export interface RecipientTradeoff {
  /** Share of the rikma with no stipend at all. */
  sharePctWithout: number;
  /** Share of the rikma under these terms. */
  sharePctWith: number;
  /** Cash in hand — the thing being bought. */
  cash: number;
  /** Equity value given up, in ₪ of contribution (α·P). */
  equityGivenUp: number;
}

export function computeRecipientTradeoff(input: RecipientTradeoffInput): RecipientTradeoff {
  const missionValue = Math.max(0, num(input.missionValue, 0));
  const cash = Math.max(0, num(input.stipendTotal, 0));
  const without = Math.max(0, num(input.rikmaTotalWithout, 0));
  const { equityCredit, equityDebit } = computeStipendEquity(cash, input.terms);

  const baseWithout = without + missionValue;
  const myWith = Math.max(0, missionValue - equityDebit);
  const baseWith = without + myWith + equityCredit;

  return {
    sharePctWithout: baseWithout > 0 ? round2((100 * missionValue) / baseWithout) : 0,
    sharePctWith: baseWith > 0 ? round2((100 * myWith) / baseWith) : 0,
    cash: round2(cash),
    equityGivenUp: round2(equityDebit)
  };
}
