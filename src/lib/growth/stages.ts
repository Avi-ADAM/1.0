/**
 * The acquisition pipeline's stages (docs/inprogress/PLAN_GROWTH_AGENT.md §4).
 *
 * Order matters: `furthest` and the funnel compare by index. `declined` and
 * `doNotContact` are not steps along the way — they are where a business
 * answered, and they close the door to any further outreach (§4.2).
 */

export const STAGES = [
  'discovered',
  'researching',
  'researched',
  'profilePrepared',
  'awaitingApproval',
  'invitationReady',
  'invitationSent',
  'interested',
  'onboardingStarted',
  'joined',
  'activeProvider',
  'declined',
  'doNotContact'
] as const;

export type Stage = (typeof STAGES)[number];

/** The stages along the way, in order. */
export const FLOW: readonly Stage[] = STAGES.slice(0, 11);

/** Closed doors: no message, no link, no follow-up. */
export const CLOSED: readonly Stage[] = ['declined', 'doNotContact'];

export function isStage(s: unknown): s is Stage {
  return typeof s === 'string' && (STAGES as readonly string[]).includes(s);
}

export function isClosed(s: Stage): boolean {
  return CLOSED.includes(s);
}

/** The stage's position along the way; a closed stage has none (-1). */
export function flowIndex(s: Stage): number {
  return FLOW.indexOf(s);
}

/** The further of two stages along the way (closed stages never advance it). */
export function furthestOf(a: Stage, b: Stage): Stage {
  return flowIndex(b) > flowIndex(a) ? b : a;
}

/** Has the business reached `s` at some point? */
export function reached(furthest: Stage, s: Stage): boolean {
  return flowIndex(furthest) >= flowIndex(s);
}

/**
 * Moving forward by itself (the agent finished a step) never moves a business
 * backwards or out of a closed stage: a decline is the business's answer, and
 * only an operator changes it, on purpose (`manualStageChange`).
 */
export function advanceTo(current: Stage, next: Stage): Stage {
  if (isClosed(current)) return current;
  return flowIndex(next) > flowIndex(current) ? next : current;
}

/** Stages from which the operator may write to the business. */
export function canContact(s: Stage): boolean {
  return !isClosed(s);
}

export type ManualChangeRefusal = 'SAME_STAGE' | 'REASON_REQUIRED';

/**
 * A stage the operator sets by hand. Leaving `doNotContact` reopens a door the
 * business itself closed, so it needs a stated reason ("they wrote to us
 * asking to join") that goes into the log.
 */
export function manualStageChange(
  from: Stage,
  to: Stage,
  reason: string | null | undefined
): { ok: true } | { ok: false; code: ManualChangeRefusal } {
  if (from === to) return { ok: false, code: 'SAME_STAGE' };
  if (from === 'doNotContact' && !(reason ?? '').trim()) return { ok: false, code: 'REASON_REQUIRED' };
  return { ok: true };
}

/** The funnel's steps — what "conversion" is measured between. */
export const FUNNEL: readonly Stage[] = [
  'discovered',
  'researched',
  'profilePrepared',
  'invitationReady',
  'invitationSent',
  'interested',
  'joined',
  'activeProvider'
];
