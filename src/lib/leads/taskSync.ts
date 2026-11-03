/**
 * What a change to a lead's task means for the lead
 * (docs/inprogress/PLAN_LEADS.md §3). Pure — the server reads the act and the
 * lead, asks this, and writes what it returns.
 *
 *  - taken and accepted (`myIshur`) ⇒ the taker owns the lead;
 *  - handed back ⇒ nobody owns it;
 *  - marked done ⇒ the lead is NOT closed (only `won`/`paused`/`spam` close a
 *    lead); a lead still `new` becomes `contacted`, since somebody got back.
 *
 * Ownership never comes from a silent assignment: an assignee who has not
 * accepted yet does not own the lead.
 */

export const LEAD_TASK_PREFIX = 'lead:';

export function leadTaskExternalId(leadId: string | number): string {
  return `${LEAD_TASK_PREFIX}${leadId}`;
}

/** `lead:77` ⇒ `77`; anything else ⇒ null. */
export function leadIdOfTaskExternalId(externalId: string | null | undefined): string | null {
  if (typeof externalId !== 'string' || !externalId.startsWith(LEAD_TASK_PREFIX)) return null;
  const id = externalId.slice(LEAD_TASK_PREFIX.length);
  return /^\d+$/.test(id) ? id : null;
}

export interface LeadTaskView {
  /** The act's assignee, if any. */
  assigneeId: string | null;
  myIshur: boolean;
  naasa: boolean;
}

export interface LeadTaskSnapshot {
  status: string | null;
  ownerId: string | null;
}

export interface LeadTaskEffect {
  /** `undefined` = leave the owner alone; `null` = clear it. */
  ownerId?: string | null;
  status?: 'contacted';
  activities: Array<
    | { kind: 'assign'; actorId: string }
    | { kind: 'release'; actorId: string | null; previousOwnerId: string }
    | { kind: 'statusChange'; actorId: string | null; fromStatus: string; toStatus: 'contacted' }
  >;
}

export function leadEffectOfTask(
  task: LeadTaskView,
  lead: LeadTaskSnapshot,
  actorId: string | null
): LeadTaskEffect {
  const effect: LeadTaskEffect = { activities: [] };
  const owner = task.assigneeId && task.myIshur ? task.assigneeId : null;

  if (owner && owner !== lead.ownerId) {
    effect.ownerId = owner;
    effect.activities.push({ kind: 'assign', actorId: owner });
  } else if (!task.assigneeId && lead.ownerId) {
    effect.ownerId = null;
    effect.activities.push({ kind: 'release', actorId, previousOwnerId: lead.ownerId });
  }

  if (task.naasa && (lead.status ?? 'new') === 'new') {
    effect.status = 'contacted';
    effect.activities.push({ kind: 'statusChange', actorId, fromStatus: 'new', toStatus: 'contacted' });
  }
  return effect;
}

export function isEmptyEffect(e: LeadTaskEffect): boolean {
  return e.ownerId === undefined && e.status === undefined && e.activities.length === 0;
}
