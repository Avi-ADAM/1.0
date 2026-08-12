/**
 * Action: previewArchiveMembership (PLAN_OBJECT_ARCHIVAL — transparency before
 * signing).
 *
 * "שקיפות לפני הכול": the plan states that the membership consequence of an
 * archive/release proposal must be known *before* anyone signs, not
 * discovered afterward. `proposeObjectArchive` already computes this via
 * `assessMembership` at submit time, and the recipients' card shows it once a
 * Decision exists — but the person opening the proposal had no way to see it
 * before they typed a reason and pressed send. This is the same read,
 * exposed read-only so the proposal drawer can show it up front.
 *
 * No side effects: whoever the object's owner is, this only counts their
 * other ties in the rikma. Safe for any project member to call while a
 * drawer is open.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { assessMembership } from '$lib/server/archive/membership.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { fetchTarget, TARGET_KINDS, type TargetKind } from '$lib/server/archive/targets.js';

const handler: ActionExecutionHandler = async (params, context) => {
  const targetKind = String(params.targetKind ?? '') as TargetKind;
  const targetId = String(params.targetId ?? '');

  if (!TARGET_KINDS.includes(targetKind)) throw new Error(`Unknown targetKind "${targetKind}"`);
  if (!targetId) throw new Error('targetId is required');

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const target = await fetchTarget(exec, targetKind, targetId);
  if (!target) throw new Error(`${targetKind} ${targetId} not found`);
  if (target.projectId && !target.memberIds.includes(userId)) {
    throw new Error('Only a member of the rikma may view this');
  }

  const assessment = await assessMembership(exec, target, target.ownerId ?? userId);

  return {
    data: {
      isLastTie: assessment.isLastTie,
      ownerId: target.ownerId,
    },
    updateStrategy: { type: 'none' as const },
  };
};

export const previewArchiveMembershipConfig: ActionConfig = {
  key: 'previewArchiveMembership',
  description:
    'Read-only preview of whether archiving/releasing an object would end its owner\'s rikma membership (no other accrued tie). Used by the archive proposal drawer to show the consequence before submission.',
  graphqlOperation: handler,

  paramSchema: {
    targetKind: { type: 'string', required: true, description: 'openMission | missionInProgress | openResource | resourceInProgress | matanot' },
    targetId: { type: 'string', required: true, description: 'Id of the object' },
  },

  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to view this' }],

  updateStrategy: { type: 'none' },
};
