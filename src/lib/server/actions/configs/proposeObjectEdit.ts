/**
 * Action: proposeObjectEdit (PLAN_OBJECT_ARCHIVAL — phase 1).
 *
 * The other half of the same machinery: changing an object's terms after it
 * exists — the mission owner adding hours or updating the hourly value, a
 * member correcting a resource's price. Same Decision, same votes, same clock;
 * only the round's `mode` differs (`keep` instead of `archive`), which is why
 * a negotiation can move a proposal between the two without changing anything
 * structural.
 *
 * This also closes the half-built `Decision.moreHours` / `newHours` pair that
 * has been sitting unused in the schema.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { restimeLabel } from './actionUtils.js';
import { applyObjectChange, setLifecycle, type StandingRound } from '$lib/server/archive/apply.js';
import { openObjectChangeDecision } from '$lib/server/archive/decision.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { fetchTarget, TARGET_KINDS, type TargetKind } from '$lib/server/archive/targets.js';

const KIND_OFS = ['total', 'monthly', 'yearly', 'perUnit', 'rent', 'unlimited', 'daily'];

/** Only the fields a round can carry; anything else is silently ignored. */
function buildRound(values: Record<string, any>, why: string): StandingRound {
  const num = (v: unknown) => (v == null || v === '' ? null : Number(v));
  const kindOf = values.kindOf && KIND_OFS.includes(String(values.kindOf)) ? String(values.kindOf) : null;
  return {
    ordern: 1,
    mode: 'keep',
    why: why || null,
    name: values.name != null ? String(values.name) : null,
    descrip: values.descrip != null ? String(values.descrip) : null,
    hm: num(values.hm ?? values.noofhours ?? values.hours),
    price: num(values.price ?? values.perhour),
    kindOf,
    sqadualed: values.sqadualed ? String(values.sqadualed) : null,
    sqadualedf: values.sqadualedf ? String(values.sqadualedf) : null,
  };
}

function hasAnyChange(round: StandingRound): boolean {
  return [round.name, round.descrip, round.hm, round.price, round.kindOf, round.sqadualed, round.sqadualedf].some(
    (v) => v != null && v !== '',
  );
}

const handler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const targetKind = String(params.targetKind ?? '') as TargetKind;
  const targetId = String(params.targetId ?? '');
  const why = params.why ? String(params.why).trim() : '';
  const values = (params.newValues ?? {}) as Record<string, any>;

  if (!TARGET_KINDS.includes(targetKind)) throw new Error(`Unknown targetKind "${targetKind}"`);
  if (!targetId) throw new Error('targetId is required');

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const target = await fetchTarget(exec, targetKind, targetId);
  if (!target) throw new Error(`${targetKind} ${targetId} not found`);

  if (target.lifecycle === 'archived') throw new Error('This object is archived');
  if (target.openDecisionIds.length > 0) {
    throw new Error('There is already an open proposal on this object — respond to it instead');
  }
  if (target.projectId && !target.memberIds.includes(userId)) {
    throw new Error('Only a member of the rikma may propose changes to its objects');
  }

  const round = buildRound(values, why);
  if (!hasAnyChange(round)) throw new Error('Nothing to change — send at least one new value');

  const otherMembers = target.memberIds.filter((id) => id !== userId);

  // A rikma of one is unanimous by definition.
  if (otherMembers.length === 0) {
    const result = await applyObjectChange(exec, { target, round, scope: 'archive', why: why || null });
    return {
      data: { ...result, immediate: true, decisionId: null },
      updateStrategy: { type: 'fullRefresh' as const },
    };
  }

  const opened = await openObjectChangeDecision(exec, {
    kind: 'editObject',
    target,
    round,
    scope: 'archive',
    source: 'user',
    why: why || null,
    initiatorId: userId,
    decisionName: `עדכון: ${target.name}`,
  });

  await setLifecycle(exec, target.kind, target.id, 'archiveProposed').catch((e: unknown) =>
    console.warn('[proposeObjectEdit] marking archiveProposed failed (non-fatal):', e),
  );

  if (notifier && target.projectId) {
    const lang = (context.lang === 'he' ? 'he' : 'en') as 'he' | 'en';
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: {
              he: `הצעה לעדכון: ${target.name}`,
              en: `Proposed change: ${target.name}`,
            },
            body: {
              he: `${why || 'ללא נימוק'} — האובייקט נשאר, רק הפרטים משתנים. אפשר לאשר, להציע נוסחה אחרת או לפתוח שיחה.`,
              en: `${why || 'No reason given'} — the object stays, only its terms change. Approve, propose different terms, or open a discussion. No response within ${restimeLabel(target.projectRestime, lang)} approves it.`,
            },
          },
          channels: ['socket', 'push'],
          metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' },
        },
        { recipients: otherMembers, projectId: target.projectId },
        { projectId: target.projectId, decisionId: opened.decisionId },
        context,
      )
      .catch((e: unknown) => console.warn('[proposeObjectEdit] notification failed:', e));
  }

  return {
    data: {
      decisionId: opened.decisionId,
      timegramaId: opened.timegramaId,
      deadline: opened.deadline,
      targetKind,
      targetId,
      immediate: false,
    },
    updateStrategy: { type: 'fullRefresh' as const },
  };
};

export const proposeObjectEditConfig: ActionConfig = {
  key: 'proposeObjectEdit',
  description:
    'Propose changing the terms of an existing rikma object (hours, hourly value, name, description, dates). Opens an editObject Decision unless the rikma has a single member, in which case it applies immediately.',
  graphqlOperation: handler,

  paramSchema: {
    targetKind: { type: 'string', required: true, description: 'openMission | missionInProgress | openResource | resourceInProgress | matanot' },
    targetId: { type: 'string', required: true, description: 'Id of the object' },
    newValues: { type: 'object', required: true, description: 'Proposed values: { name, descrip, hm, price, kindOf, sqadualed, sqadualedf }' },
    why: { type: 'string', required: false, description: 'Why the change is proposed' },
  },

  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to propose a change' }],

  updateStrategy: { type: 'fullRefresh' },
};
