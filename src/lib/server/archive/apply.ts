/**
 * Applying a matured archive/edit decision (PLAN_OBJECT_ARCHIVAL).
 *
 * One module, three callers: the vote branch that reaches full consensus, the
 * timegrama handler that matures on silence, and the single-member fast path
 * that never opens a Decision at all. They differ only in transport (see
 * `Exec` in ./gql.ts) — the effects must not differ at all.
 *
 * The standing round decides what "matured" means:
 *   mode 'keep'    → the object survives with the negotiated values (this is
 *                    what a negotiation on an archive proposal turns into, and
 *                    what an `editObject` proposal is from the start).
 *   mode 'archive' → the object leaves, after its accrued value is settled.
 */

import {
  dateField,
  enumField,
  fields,
  gqlStr,
  numField,
  run,
  strField,
  type Exec,
} from './gql.js';
import { TARGET_META, type ArchiveTarget, type Lifecycle, type TargetKind } from './targets.js';
import { assessMembership, endMembership } from './membership.js';

export type RoundMode = 'archive' | 'keep';
export type HoursOutcome = 'credit' | 'waive' | 'transfer' | 'endOfCycle';
export type ArchiveScope = 'archive' | 'release';

const LIFECYCLES: readonly Lifecycle[] = ['active', 'archiveProposed', 'archived', 'released'];

export interface StandingRound {
  ordern?: number;
  mode: RoundMode;
  why?: string | null;
  name?: string | null;
  descrip?: string | null;
  hm?: number | null;
  price?: number | null;
  kindOf?: string | null;
  sqadualed?: string | null;
  sqadualedf?: string | null;
  hoursOutcome?: HoursOutcome | null;
  hoursToCredit?: number | null;
  transferToId?: string | null;
  effectiveFrom?: string | null;
}

export interface ApplyResult {
  targetKind: TargetKind;
  targetId: string;
  lifecycle: Lifecycle;
  /** Set when the settlement produced or grew a FinnishedMission. */
  finnishedMissionId?: string;
  hoursCredited?: number;
  /** Set for `endOfCycle`: the archive takes effect later, not now. */
  effectiveFrom?: string;
  /** Offers/asks closed because the need disappeared. */
  closedOfferIds: string[];
  /** The open mission a released assignment went back to. */
  reopenedOpenMissionId?: string;
  /**
   * Set when this was the member's last tie to the rikma and their membership
   * ended with the object. Never a silent side effect — the proposal says so
   * before the vote, and this reports what actually happened.
   */
  membershipEnded?: { userId: string; projectId: string; remainingMembers: number };
}

/** Set `lifecycle` (and optionally `archiveEffectiveFrom`) on any target. */
export async function setLifecycle(
  exec: Exec,
  kind: TargetKind,
  id: string,
  lifecycle: Lifecycle,
  effectiveFrom?: string | null,
): Promise<void> {
  const data = fields(
    enumField('lifecycle', lifecycle, LIFECYCLES),
    dateField('archiveEffectiveFrom', effectiveFrom),
  );
  await run(
    exec,
    `mutation { ${TARGET_META[kind].mutation}(id: ${gqlStr(id)}, data: { ${data} }) { data { id } } }`,
    `lifecycle:${kind}`,
  );
}

/** Field mapping for a surviving object, per collection. */
function editFragment(kind: TargetKind, round: StandingRound): string {
  switch (kind) {
    case 'openMission':
      return fields(
        strField('name', round.name),
        strField('descrip', round.descrip),
        numField('noofhours', round.hm),
        numField('perhour', round.price),
        dateField('sqadualed', round.sqadualed),
        dateField('dates', round.sqadualedf),
      );
    case 'missionInProgress':
      return fields(
        strField('name', round.name),
        strField('descrip', round.descrip),
        numField('hoursassinged', round.hm),
        numField('perhour', round.price),
        dateField('start', round.sqadualed),
        dateField('dates', round.sqadualedf),
      );
    case 'openResource':
      return fields(
        strField('name', round.name),
        strField('descrip', round.descrip),
        numField('hm', round.hm),
        numField('price', round.price),
        dateField('sqadualed', round.sqadualed),
        dateField('sqadualedf', round.sqadualedf),
      );
    case 'resourceInProgress':
      return fields(
        strField('name', round.name),
        strField('descrip', round.descrip),
        numField('quantityAssigned', round.hm),
        numField('pricePerUnit', round.price),
        dateField('start', round.sqadualed),
        dateField('end', round.sqadualedf),
      );
    case 'matanot':
      return fields(
        strField('name', round.name),
        strField('desc', round.descrip),
        numField('quant', round.hm),
        numField('price', round.price),
        dateField('startDate', round.sqadualed),
        dateField('finnishDate', round.sqadualedf),
      );
  }
}

/**
 * Credit accrued hours as a FinnishedMission, so the work keeps its value in
 * the rikma's splits after the mission itself is gone. Mirrors the timer-save
 * branch of closeFiniapruval — one active FinnishedMission per mission, grown
 * rather than duplicated.
 */
async function creditHours(
  exec: Exec,
  target: ArchiveTarget,
  hours: number,
  why: string,
  onMissionId?: string | null,
): Promise<{ finnishedMissionId?: string; hoursCredited: number }> {
  if (!(hours > 0)) return { hoursCredited: 0 };

  const perhour = target.perhour ?? 0;
  const total = hours * perhour;
  const nowISO = new Date().toISOString();

  // Transfer: the hours land on another in-progress mission, always as a new
  // row — merging into that mission's own active row would silently rewrite a
  // number its owner never agreed to.
  const holderId = onMissionId ?? target.id;
  const existingId = onMissionId ? null : target.finnishedMissionIds[0] ?? null;

  if (existingId) {
    const cur = await run(
      exec,
      `{ finnishedMission(id: ${gqlStr(existingId)}) { data { id attributes { noofhours } } } }`,
      'credit:read',
    );
    const prev = Number(cur?.finnishedMission?.data?.attributes?.noofhours ?? 0);
    const grown = prev + hours;
    await run(
      exec,
      `mutation { updateFinnishedMission(id: ${gqlStr(existingId)}, data: { ${fields(
        numField('noofhours', grown),
        numField('total', grown * perhour),
      )} }) { data { id } } }`,
      'credit:grow',
    );
    return { finnishedMissionId: existingId, hoursCredited: hours };
  }

  const data = fields(
    strField('missionName', target.name),
    numField('noofhours', hours),
    strField('mesimabetahalich', holderId),
    target.missionId ? strField('mission', target.missionId) : null,
    target.projectId ? strField('project', target.projectId) : null,
    target.ownerId ? strField('users_permissions_user', target.ownerId) : null,
    numField('perhour', perhour),
    numField('total', total),
    strField('why', why),
    dateField('publishedAt', nowISO),
    'isNotFinished: true',
    'isFinished: false',
  );
  const res = await run(
    exec,
    `mutation { createFinnishedMission(data: { ${data} }) { data { id } } }`,
    'credit:create',
  );
  const id = res?.createFinnishedMission?.data?.id;

  await run(
    exec,
    `mutation { updateMesimabetahalich(id: ${gqlStr(holderId)}, data: { ${numField(
      'totalHoursSaved',
      hours,
    )} }) { data { id } } }`,
    'credit:totalHoursSaved',
  ).catch((e) => console.warn('[archive] totalHoursSaved update failed (non-fatal):', e));

  return { finnishedMissionId: id ? String(id) : undefined, hoursCredited: hours };
}

/** Close the open offers that only existed because the need existed. */
async function closeOpenOffers(exec: Exec, target: ArchiveTarget): Promise<string[]> {
  if (!target.openOfferIds.length) return [];
  const mutation = target.kind === 'openMission' ? 'updateAsk' : 'updateAskm';
  const closed: string[] = [];
  for (const id of target.openOfferIds) {
    try {
      await run(
        exec,
        `mutation { ${mutation}(id: ${gqlStr(id)}, data: { archived: true }) { data { id } } }`,
        'closeOffer',
      );
      closed.push(id);
    } catch (e) {
      console.warn(`[archive] closing offer ${id} failed (non-fatal):`, e);
    }
  }
  return closed;
}

/**
 * Put the need back on the table: the assignment ends, the open mission it
 * came from returns to the pool. Only the *commitment* is withdrawn here —
 * archiving the need itself is a separate, rikma-wide decision.
 */
async function reopenOpenMission(exec: Exec, openMissionId: string): Promise<void> {
  await run(
    exec,
    `mutation { updateOpenMission(id: ${gqlStr(openMissionId)}, data: {
      archived: false, isRishon: false, rishon: null, lifecycle: active
    }) { data { id } } }`,
    'release:reopen',
  );
}

/**
 * A scheduled end-of-cycle archive needs something to actually flip it on the
 * day. Without this the date is written and nothing ever acts on it, which
 * reads as "archived" in the UI while the object keeps running.
 *
 * Only `mashabetahalich` and `matanot` can be scheduled — they are the two
 * that carry recurring commitments — and both now have a timegrama relation.
 */
async function scheduleEndOfCycle(
  exec: Exec,
  kind: TargetKind,
  id: string,
  effectiveFrom: string,
): Promise<void> {
  const whatami =
    kind === 'resourceInProgress' ? 'mashabetahalich' : kind === 'matanot' ? 'matanot' : null;
  if (!whatami) {
    console.warn(`[archive] ${kind} cannot carry a scheduled archive — applying now instead`);
    return;
  }
  await run(
    exec,
    `mutation { createTimegrama(data: { ${fields(
      dateField('date', effectiveFrom),
      strField('whatami', whatami),
      strField(whatami, id),
      'done: false',
    )} }) { data { id } } }`,
    'scheduleEndOfCycle',
  ).catch((e) =>
    console.error('[archive] scheduling the end-of-cycle archive failed:', e),
  );
}

/**
 * Settle an in-progress resource. Deliveries are already recorded as maaps
 * (and accumulated on the rikmash), so "credit" simply leaves that record
 * standing; "waive" archives the cycles that were opened but never delivered,
 * so nothing further is claimed against the rikma.
 */
async function settleResource(
  exec: Exec,
  target: ArchiveTarget,
  outcome: HoursOutcome,
): Promise<void> {
  if (outcome === 'transfer') {
    throw new Error('A resource commitment cannot be transferred — use credit or waive');
  }
  if (outcome === 'waive') {
    for (const maapId of target.openCycleIds) {
      await run(
        exec,
        `mutation { updateMaap(id: ${gqlStr(maapId)}, data: { archived: true }) { data { id } } }`,
        'settleResource:waive',
      ).catch((e) => console.warn(`[archive] archiving maap ${maapId} failed (non-fatal):`, e));
    }
  }
  // Stop the engine either way, so /api/monthi opens no further cycles.
  await run(
    exec,
    `mutation { updateMashabetahalich(id: ${gqlStr(target.id)}, data: {
      status_mashab: closed, finnished: true
    }) { data { id } } }`,
    'settleResource:close',
  ).catch((e) => console.warn('[archive] closing the resource engine failed (non-fatal):', e));
}

/** Stop a running timer so no hours land on an object that just left. */
async function stopActiveTimer(exec: Exec, target: ArchiveTarget): Promise<void> {
  if (!target.hasActiveTimer) return;
  await run(
    exec,
    `mutation { updateMesimabetahalich(id: ${gqlStr(target.id)}, data: { activeTimer: null }) { data { id } } }`,
    'stopTimer',
  ).catch((e) => console.warn('[archive] detaching active timer failed (non-fatal):', e));
}

export interface ApplyInput {
  target: ArchiveTarget;
  round: StandingRound;
  scope?: ArchiveScope;
  /** Free text stored on the credited FinnishedMission. */
  why?: string | null;
}

/**
 * Apply the standing version. Idempotent on an already-archived target: the
 * vote path and the timegrama path can both fire for the same Decision when a
 * cron run overlaps a last-second vote.
 */
export async function applyObjectChange(
  exec: Exec,
  { target, round, scope = 'archive', why }: ApplyInput,
): Promise<ApplyResult> {
  const base: ApplyResult = {
    targetKind: target.kind,
    targetId: target.id,
    lifecycle: target.lifecycle ?? 'active',
    closedOfferIds: [],
  };

  if (target.lifecycle === 'archived') return base;

  // ── the object survives, with the negotiated values ────────────────────
  if (round.mode === 'keep') {
    const frag = editFragment(target.kind, round);
    const data = fields(frag || null, enumField('lifecycle', 'active', LIFECYCLES));
    await run(
      exec,
      `mutation { ${TARGET_META[target.kind].mutation}(id: ${gqlStr(target.id)}, data: { ${data} }) { data { id } } }`,
      `keep:${target.kind}`,
    );
    return { ...base, lifecycle: 'active' };
  }

  // ── the object leaves ──────────────────────────────────────────────────
  const outcome: HoursOutcome = round.hoursOutcome ?? 'waive';
  const meta = TARGET_META[target.kind];

  // A recurring commitment is not cut mid-cycle: it is marked to end at the
  // agreed date and stays live until then.
  if (outcome === 'endOfCycle') {
    const effectiveFrom = round.effectiveFrom ?? target.cycleEnd;
    if (!effectiveFrom) {
      throw new Error('endOfCycle needs an effectiveFrom date or a known cycle end');
    }
    await setLifecycle(exec, target.kind, target.id, 'archiveProposed', effectiveFrom);
    await scheduleEndOfCycle(exec, target.kind, target.id, effectiveFrom);
    return { ...base, lifecycle: 'archiveProposed', effectiveFrom };
  }

  let finnishedMissionId: string | undefined;
  let hoursCredited = 0;

  if (meta.inProgress) {
    await stopActiveTimer(exec, target);

    const hours = round.hoursToCredit != null ? Number(round.hoursToCredit) : target.hoursAlready;
    const reason = why ?? round.why ?? 'archived by rikma decision';

    if (target.kind === 'resourceInProgress') {
      // A resource's value lives in its maaps/rikmash, not in hours.
      await settleResource(exec, target, outcome);
    } else if (outcome === 'credit' || outcome === 'transfer') {
      const credited = await creditHours(
        exec,
        target,
        hours,
        reason,
        outcome === 'transfer' ? round.transferToId ?? null : null,
      );
      finnishedMissionId = credited.finnishedMissionId;
      hoursCredited = credited.hoursCredited;
    }
  }

  const closedOfferIds = await closeOpenOffers(exec, target);

  // release = the commitment ends and the need returns to the pool;
  // archive  = the need itself is gone.
  let reopenedOpenMissionId: string | undefined;
  const lifecycle: Lifecycle = scope === 'release' ? 'released' : 'archived';

  if (scope === 'release' && target.kind === 'missionInProgress' && target.openMissionId) {
    await reopenOpenMission(exec, target.openMissionId);
    reopenedOpenMissionId = target.openMissionId;
  }

  await setLifecycle(exec, target.kind, target.id, lifecycle);

  // Someone who joined for this one thing has nothing left holding them here.
  // Re-checked now rather than trusting the proposal: during the restime
  // window they may well have taken on something else, and then they stay.
  const membershipEnded = await endMembershipIfLastTie(exec, target);

  return {
    ...base,
    lifecycle,
    finnishedMissionId,
    hoursCredited,
    closedOfferIds,
    reopenedOpenMissionId,
    membershipEnded,
  };
}

async function endMembershipIfLastTie(
  exec: Exec,
  target: ArchiveTarget,
): Promise<ApplyResult['membershipEnded']> {
  try {
    const assessment = await assessMembership(exec, target, target.ownerId ?? '');
    if (!assessment.isLastTie) return undefined;

    const { removed, remainingMemberIds } = await endMembership(
      exec,
      assessment.projectId,
      assessment.userId,
    );
    if (!removed) return undefined;

    return {
      userId: assessment.userId,
      projectId: assessment.projectId,
      remainingMembers: remainingMemberIds.length,
    };
  } catch (e) {
    // The object is already archived; a failure here leaves a member on the
    // list, which is recoverable — losing the archive would not be.
    console.warn('[archive] membership check failed (non-fatal):', e);
    return undefined;
  }
}
