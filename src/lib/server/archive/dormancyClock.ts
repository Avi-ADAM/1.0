/**
 * The dormancy clock (PLAN_OBJECT_ARCHIVAL — phase 3ג׳).
 *
 * A mission someone took and then never touched should not sit on their name
 * forever. The clock is a `timegrama` on the mesimabetahalich, pushed forward
 * by every piece of real activity — that is what makes "no activity" a single
 * date field instead of an expensive scan.
 *
 * When it runs out it does NOT cancel the assignment on the spot. It opens the
 * ordinary release proposal, so the cancellation still happens without anyone
 * lifting a finger (silence matures it), while the assignee keeps a full
 * restime to say "I'm on it" — by countering with `mode: 'keep'`, which resets
 * the clock. Automatic, but never a surprise.
 */

import { effectiveDormancyDays, dormancyDeadline } from '$lib/archive/dormancy.js';
import { openObjectChangeDecision } from './decision.js';
import { dateField, fields, gqlStr, run, strField, type Exec } from './gql.js';
import { assessMembership } from './membership.js';
import { fetchTarget } from './targets.js';

/** `whatami` must name a real relation — the cron dispatcher resolves it. */
const WHATAMI = 'mesimabetahalich';

/**
 * Create or push forward the dormancy clock for one in-progress mission.
 *
 * Best-effort by design: this is called from the middle of timer/status/task
 * actions, and a clock that failed to move is a mission that gets asked about
 * early — not a broken write.
 */
export async function touchDormancy(exec: Exec, missionId: string): Promise<string | null> {
  try {
    const data = await run(
      exec,
      `{ mesimabetahalich(id: ${gqlStr(missionId)}) { data { id attributes {
        lifecycle dormancyDays
        project { data { id attributes { dormancyDays } } }
        timegramas(filters: { whatami: { eq: "${WHATAMI}" }, done: { ne: true } }) {
          data { id }
        }
      } } } }`,
      'dormancy:read',
    );

    const a = data?.mesimabetahalich?.data?.attributes;
    if (!a) return null;
    // An object on its way out does not need a dormancy clock.
    if (a.lifecycle === 'archived' || a.lifecycle === 'released') return null;

    const days = effectiveDormancyDays(a.dormancyDays, a.project?.data?.attributes?.dormancyDays);
    const deadline = dormancyDeadline(Date.now(), days);
    const existingId = a.timegramas?.data?.[0]?.id;

    if (existingId) {
      await run(
        exec,
        `mutation { updateTimegrama(id: ${gqlStr(existingId)}, data: {
          ${fields(dateField('date', deadline), 'done: false')}
        }) { data { id } } }`,
        'dormancy:push',
      );
      return String(existingId);
    }

    const created = await run(
      exec,
      `mutation { createTimegrama(data: { ${fields(
        dateField('date', deadline),
        strField('whatami', WHATAMI),
        strField(WHATAMI, String(missionId)),
        'done: false',
      )} }) { data { id } } }`,
      'dormancy:create',
    );
    return created?.createTimegrama?.data?.id ? String(created.createTimegrama.data.id) : null;
  } catch (e) {
    console.warn(`[dormancy] could not move the clock for mission ${missionId}:`, e);
    return null;
  }
}

export interface DormancyOutcome {
  opened: boolean;
  reason: string;
  decisionId?: string;
}

/**
 * The clock ran out. Open the release proposal on the assignee's behalf.
 *
 * Refuses in every case where the object is not actually dormant any more —
 * the cron fires on a schedule, and by the time it does the mission may be
 * finished, archived, or freshly worked on.
 */
export async function openDormancyProposal(
  exec: Exec,
  missionId: string,
): Promise<DormancyOutcome> {
  const target = await fetchTarget(exec, 'missionInProgress', missionId);
  if (!target) return { opened: false, reason: 'not-found' };
  if (target.lifecycle === 'archived' || target.lifecycle === 'released') {
    return { opened: false, reason: 'already-gone' };
  }
  if (target.openDecisionIds.length > 0) {
    return { opened: false, reason: 'proposal-already-open' };
  }
  if (!target.ownerId) return { opened: false, reason: 'no-assignee' };
  // Work happened after all — the clock should simply have been pushed.
  if (target.hoursAlready > 0 || target.finnishedMissionIds.length > 0 || target.hasActiveTimer) {
    await touchDormancy(exec, missionId);
    return { opened: false, reason: 'active-after-all' };
  }
  // A rikma of one has nobody to release the mission back to.
  if (target.memberIds.length <= 1) return { opened: false, reason: 'sole-member' };

  const days = effectiveDormancyDays(target.dormancyDays, target.projectDormancyDays);
  const membership = await assessMembership(exec, target, target.ownerId).catch(() => null);

  const opened = await openObjectChangeDecision(exec, {
    kind: 'archiveObject',
    target,
    round: {
      ordern: 1,
      mode: 'archive',
      why: `לא נרשמה פעילות במשך ${days} ימים`,
      hoursOutcome: 'waive',
    },
    scope: 'release',
    source: 'dormancy',
    why: `לא נרשמה פעילות במשך ${days} ימים`,
    // Nobody chose to open this, so the clock signs round 1 on the rikma's
    // behalf through the assignee — silence from everyone then completes it.
    initiatorId: target.ownerId,
    decisionName: `שחרור (רדימות): ${target.name}`,
    endsMembership: membership?.isLastTie ?? false,
    memberId: membership?.isLastTie ? membership.userId : null,
  });

  await run(
    exec,
    `mutation { updateMesimabetahalich(id: ${gqlStr(missionId)}, data: {
      lifecycle: archiveProposed
    }) { data { id } } }`,
    'dormancy:mark',
  ).catch((e) => console.warn('[dormancy] marking archiveProposed failed (non-fatal):', e));

  return { opened: true, reason: 'dormant', decisionId: opened.decisionId };
}
