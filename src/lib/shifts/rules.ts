/**
 * Standing rules — "I'm never in on Fridays", "Sunday mornings are mine"
 * (docs/PLAN_SHIFTS.md §3.3, P10).
 *
 * A rule is a standing declaration: the same consent a tap on the grid gives
 * (§1.1), said once for every shift it matches instead of shift by shift. So
 * it is never stored per shift. It is derived when the roster is read — the
 * same "derived, not stored" rule as coverage and balance (§1.4) — which is
 * why changing a rule applies at once to every coming shift nobody answered
 * yet, and never leaves stale rows behind.
 *
 * An explicit declaration always wins: a rule fills only the silence. Within a
 * member's own rules the first match wins, so a specific rule ("Friday
 * mornings: can") placed above a general one ("Fridays: cannot") carves out
 * its exception.
 *
 * The tie-break for declaring early (§6.3) reads `declaredAt`; a rule's
 * declarations carry the moment the rule was saved, so saying it once, early,
 * is worth exactly as much as tapping every shift early.
 *
 * Pure.
 */

import { fromAbsolute } from '@internationalized/date';
import type { Declaration, ShiftLike, Stance } from './types.js';

export interface StandingRule {
  /** Local weekdays the rule covers, 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** Local start-time range "HH:MM" (from inclusive, to exclusive). Absent = the whole day. */
  from?: string | null;
  to?: string | null;
  stance: Stance;
}

export interface MemberRules {
  userId: string;
  rules?: StandingRule[] | null;
  /** When the rules were last saved — the declaredAt of what they derive. */
  rulesAt?: string | null;
}

export type DerivedDeclaration = Declaration & { fromRule?: boolean };

export const MAX_RULES = 20;
/** A rule with no saved moment ranks last among the early declarers, never first. */
const LATEST = '9999-12-31T00:00:00.000Z';
const STANCES: readonly Stance[] = ['want', 'can', 'ifNeeded', 'cannot'];
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const minutes = (hhmm: string) => {
  const m = TIME.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};

export type RuleIssue = { index: number; code: 'noDays' | 'badDay' | 'badTime' | 'emptyRange' | 'badStance' } | { index: -1; code: 'tooMany' };

/** What is wrong with a rule set, if anything — the action refuses on any issue. */
export function validateRules(rules: unknown): RuleIssue[] {
  if (!Array.isArray(rules)) return [{ index: -1, code: 'tooMany' }];
  const issues: RuleIssue[] = [];
  if (rules.length > MAX_RULES) issues.push({ index: -1, code: 'tooMany' });
  rules.forEach((r: any, index) => {
    if (!Array.isArray(r?.days) || r.days.length === 0) issues.push({ index, code: 'noDays' });
    else if (r.days.some((d: unknown) => !Number.isInteger(d) || (d as number) < 0 || (d as number) > 6)) issues.push({ index, code: 'badDay' });
    const hasFrom = r?.from != null && r.from !== '';
    const hasTo = r?.to != null && r.to !== '';
    if ((hasFrom && Number.isNaN(minutes(r.from))) || (hasTo && Number.isNaN(minutes(r.to)))) issues.push({ index, code: 'badTime' });
    else if (hasFrom && hasTo && minutes(r.from) >= minutes(r.to)) issues.push({ index, code: 'emptyRange' });
    if (!STANCES.includes(r?.stance)) issues.push({ index, code: 'badStance' });
  });
  return issues;
}

/** Keep only what a rule is made of — nothing else is stored. */
export function normalizeRules(rules: StandingRule[]): StandingRule[] {
  return rules.map((r) => ({
    days: [...new Set(r.days)].sort((a, b) => a - b),
    ...(r.from ? { from: r.from } : {}),
    ...(r.to ? { to: r.to } : {}),
    stance: r.stance
  }));
}

/** The stance a member's rules give one shift, or null when no rule speaks to it. */
export function ruleStance(shift: Pick<ShiftLike, 'start'>, rules: StandingRule[] | null | undefined, timeZone: string): Stance | null {
  if (!rules?.length) return null;
  const local = fromAbsolute(new Date(shift.start).getTime(), timeZone);
  const dow = new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay();
  const at = local.hour * 60 + local.minute;
  for (const r of rules) {
    if (!r.days?.includes(dow)) continue;
    if (r.from && at < minutes(r.from)) continue;
    if (r.to && at >= minutes(r.to)) continue;
    return r.stance;
  }
  return null;
}

/**
 * The declarations as the roster should read them: every explicit one, plus
 * what each member's rules say about the shifts they left unanswered.
 */
export function withStandingRules(
  declarations: Declaration[],
  shifts: ShiftLike[],
  members: MemberRules[],
  timeZone: string
): DerivedDeclaration[] {
  const withRules = members.filter((m) => m.rules?.length);
  if (withRules.length === 0) return declarations;
  const said = new Set(declarations.map((d) => `${d.shiftId}|${d.userId}`));
  const out: DerivedDeclaration[] = [...declarations];
  for (const m of withRules) {
    const uid = String(m.userId);
    for (const s of shifts) {
      if (s.state === 'cancelled' || said.has(`${s.id}|${uid}`)) continue;
      const stance = ruleStance(s, m.rules, timeZone);
      if (!stance) continue;
      out.push({ shiftId: String(s.id), userId: uid, stance, prefRank: null, declaredAt: m.rulesAt ?? LATEST, fromRule: true });
    }
  }
  return out;
}
