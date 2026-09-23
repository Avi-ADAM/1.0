/**
 * Action: a member states whether they can come to one shift
 * (docs/PLAN_SHIFTS.md §3.3, §7).
 *
 * This statement *is* the consent (§1.1): the draft only ever places someone
 * in a shift they declared want / can / ifNeeded for. So two things are held
 * here and nowhere else:
 *
 *  - **Only for yourself.** There is no `userId` parameter at all — the row is
 *    written for `context.userId`, from the signed JWT. Nobody can declare
 *    another member available.
 *  - **Only on a mission you are on** (§14 #5). The declaration has meaning
 *    only inside the agreement that put you on the mission; a rikma member who
 *    is not on it applies to the mission first.
 *
 * Declaring is always open, up to the moment the shift ends — including after
 * the roster closed. A late `can` is exactly what the backup chain wants when
 * someone cancels at the last minute.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { shiftError } from '$lib/shifts/errors.js';
import { asUser } from '$lib/server/shifts/exec.js';
import { shiftsEnabled } from '$lib/server/shifts/mode.js';
import { loadCommitments, loadShift, upsertDeclaration } from '$lib/server/shifts/store.js';
import type { Stance } from '$lib/shifts/types.js';

const STANCES: Stance[] = ['want', 'can', 'ifNeeded', 'cannot'];

const handler: ActionExecutionHandler = async (params, context) => {
  if (!shiftsEnabled()) {
    return { data: { skipped: true, reason: 'SHIFTS=off' }, updateStrategy: { type: 'none' } };
  }
  const userId = String(context.userId);
  const exec = asUser(context);

  const ctx = await loadShift(exec, String(params.shiftId));
  if (!ctx) throw shiftError('notFound');
  const { shift } = ctx;
  if (shift.state === 'cancelled' || shift.state === 'done') {
    throw shiftError('notOpen');
  }
  if (new Date(shift.end).getTime() <= Date.now()) {
    throw shiftError('started');
  }
  if (!ctx.openMissionId) throw shiftError('noMission');

  const onMission = (await loadCommitments(exec, ctx.openMissionId)).some((c) => c.userId === userId);
  if (!onMission) {
    throw shiftError('notOnMission');
  }

  const prefRank =
    params.prefRank === undefined ? undefined : params.prefRank === null ? null : Math.max(1, Math.floor(Number(params.prefRank)));

  const declaration = await upsertDeclaration(exec, {
    shiftId: shift.id,
    planId: ctx.planId,
    projectId: ctx.projectId,
    userId,
    stance: params.stance as Stance,
    prefRank,
    note: params.note === undefined ? undefined : String(params.note ?? '').slice(0, 500) || null
  });

  return { data: { declaration }, updateStrategy: { type: 'none' } };
};

export const declareShiftAvailabilityConfig: ActionConfig = {
  key: 'declareShiftAvailability',
  description:
    'A member states want / can / ifNeeded / cannot for one shift of a mission they are on. The statement is their consent to be rostered there — always for the caller themselves.',
  graphqlOperation: handler,

  paramSchema: {
    shiftId: { type: 'string', required: true, description: 'The shift' },
    stance: {
      type: 'string',
      required: true,
      validate: (v) => STANCES.includes(v),
      description: 'want | can | ifNeeded | cannot'
    },
    prefRank: { type: 'number', required: false, description: 'Own preference order among wanted shifts; lower = more wanted' },
    note: { type: 'string', required: false, description: 'A short note for the rikma' }
  },

  authRules: [{ type: 'jwt', errorMessage: 'Must be signed in to declare availability' }],

  updateStrategy: { type: 'none' }
};
