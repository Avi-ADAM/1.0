/**
 * Action: proposeObjectArchive (PLAN_OBJECT_ARCHIVAL — phase 1).
 *
 * Removing an object from a rikma is not a unilateral act: it reopens the
 * question of whether the rikma still needs that mission / resource / product.
 * So this action proposes, it does not delete.
 *
 * Two scopes, because two different things are being given up:
 *   - `release` — I withdraw *my* commitment. The need goes back to the open
 *     pool. Sovereign: when nothing has accrued, it takes effect immediately.
 *   - `archive` — the need itself should stop existing. Always the rikma's
 *     call (a single-member rikma is unanimous by definition, so it applies
 *     immediately there).
 *
 * There is no "no" on the other side: a member who disagrees counters with a
 * `keep` round through counterObjectChange, and the object survives with the
 * negotiated details instead of being removed.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { restimeLabel } from './actionUtils.js';
import {
  applyObjectChange,
  setLifecycle,
  type ArchiveScope,
  type HoursOutcome,
  type StandingRound,
} from '$lib/server/archive/apply.js';
import type { Exec } from '$lib/server/archive/gql.js';
import { openObjectChangeDecision } from '$lib/server/archive/decision.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { fetchTarget, TARGET_META, TARGET_KINDS, type TargetKind } from '$lib/server/archive/targets.js';
import { assessMembership } from '$lib/server/archive/membership.js';
import { effectiveDormancyDays, hasAccruedValue, isDormant } from '$lib/archive/dormancy.js';

const OUTCOMES: readonly HoursOutcome[] = ['credit', 'waive', 'transfer', 'endOfCycle'];

const handler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const targetKind = String(params.targetKind ?? '') as TargetKind;
  const targetId = String(params.targetId ?? '');
  const scope = (params.scope === 'release' ? 'release' : 'archive') as ArchiveScope;
  const why = params.why ? String(params.why).trim() : '';
  const alsoProposeArchive = params.alsoProposeArchive === true;

  if (!TARGET_KINDS.includes(targetKind)) {
    throw new Error(`Unknown targetKind "${targetKind}"`);
  }
  if (!targetId) throw new Error('targetId is required');

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const target = await fetchTarget(exec, targetKind, targetId);
  if (!target) throw new Error(`${targetKind} ${targetId} not found`);

  // ── state guards ────────────────────────────────────────────────────────
  if (target.lifecycle === 'archived') {
    throw new Error('This object is already archived');
  }
  if (target.openDecisionIds.length > 0) {
    throw new Error('There is already an open proposal on this object — respond to it instead');
  }
  if (target.projectId && !target.memberIds.includes(userId)) {
    throw new Error('Only a member of the rikma may propose archiving its objects');
  }
  if (scope === 'release' && !TARGET_META[targetKind].inProgress) {
    throw new Error('Only an in-progress mission or resource can be released');
  }
  if (scope === 'release' && target.ownerId && target.ownerId !== userId) {
    throw new Error('Only the person carrying the commitment may release it');
  }

  // ── settlement rules ────────────────────────────────────────────────────
  const accrued = hasAccruedValue({
    hoursAlready: target.hoursAlready,
    finnishedMissionCount: target.finnishedMissionIds.length,
  });

  // A removal that touches someone's accrued value must say why. Where nothing
  // accrued, a reason is welcome but never a gate.
  if (accrued && !why) {
    throw new Error('Please say why — this object carries accrued hours');
  }

  let hoursOutcome = params.hoursOutcome as HoursOutcome | undefined;
  if (hoursOutcome && !OUTCOMES.includes(hoursOutcome)) {
    throw new Error(`Unknown hoursOutcome "${hoursOutcome}"`);
  }
  if (accrued && !hoursOutcome) {
    throw new Error('An object with accrued hours needs an hoursOutcome');
  }
  if (!accrued && !hoursOutcome) hoursOutcome = 'waive';

  const transferToId = params.transferToId ? String(params.transferToId) : null;
  if (hoursOutcome === 'transfer' && !transferToId) {
    throw new Error('transfer needs a transferToId');
  }
  // A recurring commitment defaults to ending at its cycle boundary rather
  // than being cut in the middle of one.
  if (hoursOutcome === 'endOfCycle' && !params.effectiveFrom && !target.cycleEnd) {
    throw new Error('endOfCycle needs an effectiveFrom date — this object has no known cycle end');
  }

  const dormant = isDormant(
    {
      hoursAlready: target.hoursAlready,
      finnishedMissionCount: target.finnishedMissionIds.length,
      hasActiveTimer: target.hasActiveTimer,
      lastActivityAt: target.lastActivityAt,
    },
    effectiveDormancyDays(target.dormancyDays, target.projectDormancyDays),
  );

  // ── does this end a membership? ─────────────────────────────────────────
  // Someone who joined for this one mission, with nothing accrued, has no
  // other tie to the rikma — approving the removal ends their membership.
  // Assessed here so the proposal states it before anyone signs; re-checked
  // at maturation, because the situation can change during the restime.
  const membership = await assessMembership(exec, target, userId);

  const round: StandingRound = {
    ordern: 1,
    mode: 'archive',
    why: why || null,
    hoursOutcome,
    hoursToCredit:
      params.hoursToCredit != null ? Number(params.hoursToCredit) : accrued ? target.hoursAlready : null,
    transferToId,
    effectiveFrom: params.effectiveFrom ? String(params.effectiveFrom) : target.cycleEnd,
  };

  // ── the immediate paths ─────────────────────────────────────────────────
  // (a) a rikma of one has nobody to ask; (b) withdrawing my own commitment
  // when nothing accrued is a sovereign self-report, not a claim on anyone.
  const otherMembers = target.memberIds.filter((id) => id !== userId);
  const soleMember = otherMembers.length === 0;
  const sovereignRelease = scope === 'release' && !accrued && target.ownerId === userId;

  if (soleMember || sovereignRelease) {
    const result = await applyObjectChange(exec, { target, round, scope, why: why || null });

    // "…and propose closing the need entirely" — the release already happened;
    // the need's fate is still the rikma's to decide.
    let followUpDecisionId: string | null = null;
    if (alsoProposeArchive && !soleMember && target.openMissionId) {
      const openTarget = await fetchTarget(exec, 'openMission', target.openMissionId);
      if (openTarget && openTarget.lifecycle !== 'archived') {
        const opened = await openObjectChangeDecision(exec, {
          kind: 'archiveObject',
          target: openTarget,
          round: { ordern: 1, mode: 'archive', why: why || null, hoursOutcome: 'waive' },
          scope: 'archive',
          source: 'user',
          why: why || null,
          initiatorId: userId,
          decisionName: `ארכוב: ${openTarget.name}`,
        });
        followUpDecisionId = opened.decisionId;
        await setProposedLifecycle(exec, openTarget.kind, openTarget.id);
      }
    }

    return {
      data: {
        ...result,
        immediate: true,
        dormant,
        decisionId: null,
        followUpDecisionId,
        // `result.membershipEnded` is the authoritative answer (re-checked at
        // apply time); this is what the user was told would happen.
        endsMembership: membership.isLastTie,
      },
      updateStrategy: { type: 'fullRefresh' as const },
    };
  }

  // ── the ordinary path: open the proposal ───────────────────────────────
  const decisionName = `${scope === 'release' ? 'שחרור' : 'ארכוב'}: ${target.name}`;
  const opened = await openObjectChangeDecision(exec, {
    kind: 'archiveObject',
    target,
    round,
    scope,
    source: 'user',
    why: why || null,
    initiatorId: userId,
    decisionName,
    endsMembership: membership.isLastTie,
    memberId: membership.isLastTie ? membership.userId : null,
  });

  await setProposedLifecycle(exec, target.kind, target.id);

  if (notifier && target.projectId) {
    const lang = (context.lang === 'he' ? 'he' : 'en') as 'he' | 'en';
    const window = restimeLabel(target.projectRestime, lang);
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: {
              he: `הצעה ${scope === 'release' ? 'לשחרור' : 'לארכוב'}: ${target.name}`,
              en: `Proposal to ${scope === 'release' ? 'release' : 'archive'}: ${target.name}`,
            },
            body: {
              he: `${why || 'ללא נימוק'}${membership.isLastTie ? ' · שימו לב: זו המשימה היחידה של החבר בריקמה ולא נצברו בה שעות, ולכן אישור ההצעה יסיים גם את חברותו בריקמה.' : ''} — אפשר לאשר, להציע נוסחה חליפית או לפתוח שיחה. ללא תגובה תוך ${restimeLabel(target.projectRestime, 'he')} ההצעה תאושר מעצמה.`,
              en: `${why || 'No reason given'}${membership.isLastTie ? ' · Note: this is the member’s only commitment here and nothing accrued, so approving also ends their membership of the rikma.' : ''} — approve, propose different terms, or open a discussion. With no response within ${window} it is approved on its own.`,
            },
          },
          channels: ['socket', 'push'],
          metadata: { type: 'voteUpdate', url: 'lev', priority: 'high' },
        },
        { recipients: otherMembers, projectId: target.projectId },
        { projectId: target.projectId, decisionId: opened.decisionId },
        context,
      )
      .catch((e: unknown) => console.warn('[proposeObjectArchive] notification failed:', e));
  }

  return {
    data: {
      decisionId: opened.decisionId,
      timegramaId: opened.timegramaId,
      deadline: opened.deadline,
      targetKind,
      targetId,
      scope,
      dormant,
      immediate: false,
      endsMembership: membership.isLastTie,
      membershipUserId: membership.isLastTie ? membership.userId : null,
    },
    updateStrategy: { type: 'fullRefresh' as const },
  };
};

/**
 * Mark the object as "under discussion" — it stays fully usable meanwhile;
 * the flag exists so a second proposal is refused and the UI can say so.
 */
async function setProposedLifecycle(exec: Exec, kind: TargetKind, id: string) {
  await setLifecycle(exec, kind, id, 'archiveProposed').catch((e: unknown) =>
    console.warn('[proposeObjectArchive] marking archiveProposed failed (non-fatal):', e),
  );
}

export const proposeObjectArchiveConfig: ActionConfig = {
  key: 'proposeObjectArchive',
  description:
    'Propose archiving a rikma object (open/in-progress mission, open/in-progress resource, product) or releasing an in-progress commitment. Opens an archiveObject Decision unless the rikma has a single member or the release is a sovereign withdrawal with nothing accrued.',
  graphqlOperation: handler,

  paramSchema: {
    targetKind: { type: 'string', required: true, description: 'openMission | missionInProgress | openResource | resourceInProgress | matanot' },
    targetId: { type: 'string', required: true, description: 'Id of the object' },
    scope: { type: 'string', required: false, description: "'archive' (default) removes the need; 'release' withdraws the commitment" },
    why: { type: 'string', required: false, description: 'Reason — required when hours have accrued' },
    hoursOutcome: { type: 'string', required: false, description: 'credit | waive | transfer | endOfCycle' },
    hoursToCredit: { type: 'number', required: false, description: 'Hours to settle (defaults to the accrued hours)' },
    transferToId: { type: 'string', required: false, description: 'Mesimabetahalich to move the hours onto (hoursOutcome=transfer)' },
    effectiveFrom: { type: 'string', required: false, description: 'When the archive takes effect (hoursOutcome=endOfCycle)' },
    alsoProposeArchive: { type: 'boolean', required: false, description: 'On a sovereign release: also open a rikma proposal to close the need itself' },
  },

  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to propose archiving an object' }],

  updateStrategy: { type: 'fullRefresh' },
};
