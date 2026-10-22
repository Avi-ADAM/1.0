/**
 * What an automation rule does, one line each — the heart's rule card and the
 * open mission's terms (PLAN_SHOP_OPERATIONS §2.3) word a rule the same way.
 *
 * Pure: returns translation keys; the caller renders them with `$t`.
 */
import type { StepBatching, StepEffect, StepPer, StepRouting, StepTarget, StepWhen } from './plan';

export interface RuleTermsInput {
  target: StepTarget;
  roleName: string | null;
  missionName: string | null;
  per: StepPer;
  effect: StepEffect;
  when: Partial<StepWhen> | null | undefined;
  dueHours: number | null;
  batching: StepBatching;
  waveAt: string | null;
  routing: StepRouting;
}

/** A role's rule, as the open mission's terms show it (server/fulfillment/roleRules.ts). */
export interface RoleRuleView extends RuleTermsInput {
  stepId: string;
  name: string;
  roleId: string;
}

export interface TermLine {
  key: string;
  params?: Record<string, string | number>;
}

/**
 * `me` — the work lands on the reader ("a task opens for you");
 * `other` — on someone else (the author reading a counter, or a candidate who
 * does not hold the role yet).
 */
export function ruleTermLines(rule: RuleTermsInput, whose: 'me' | 'other' = 'me'): TermLine[] {
  const when = rule.when ?? {};
  const out: TermLine[] = [];
  if (when.event === 'stock.low') out.push({ key: 'lev.fulfillRule.when.stockLow' });
  else {
    const prefs = when.deliveryPreference ?? [];
    out.push({ key: prefs.length === 1 ? `lev.fulfillRule.when.${prefs[0]}` : 'lev.fulfillRule.when.any' });
    if (when.after?.length) out.push({ key: 'lev.fulfillRule.after' });
    if (when.categories?.length || when.shippingZones?.length || when.shippingMethods?.length || when.pickupPoints?.length) {
      out.push({ key: 'lev.fulfillRule.narrowed' });
    }
  }
  const ns = whose === 'me' ? 'lev.fulfillRule.target' : 'lev.fulfillRule.targetOther';
  out.push(
    rule.target === 'role'
      ? { key: `${ns}.role`, params: { role: rule.roleName || '—' } }
      : rule.target === 'mission'
        ? { key: `${ns}.mission`, params: { mission: rule.missionName || '—' } }
        : { key: `${ns}.member` }
  );
  if (rule.per === 'line') out.push({ key: 'lev.fulfillRule.per.line' });
  if (rule.per === 'unit') out.push({ key: 'lev.fulfillRule.per.unit' });
  if (rule.batching === 'wave' && rule.waveAt) out.push({ key: 'lev.fulfillRule.wave', params: { time: rule.waveAt } });
  if (rule.dueHours != null) out.push({ key: 'lev.fulfillRule.due', params: { hours: rule.dueHours } });
  if (rule.routing === 'roundRobin' || rule.routing === 'leastOpen') out.push({ key: `lev.fulfillRule.routing.${rule.routing}` });
  if (rule.effect === 'markShipped' || rule.effect === 'markFulfilled') out.push({ key: `lev.fulfillRule.effect.${rule.effect}` });
  return out;
}
