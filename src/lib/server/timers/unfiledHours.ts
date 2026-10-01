/**
 * How many of a mission's hours are not yet on their way to the rikma.
 *
 * A timer save files its own hours the moment it is saved (`fileHours`): a row
 * on the mission for a rikma of one, a `Finiapruval` for everyone else. Handing
 * the mission in (`completeMission`) used to file the mission's whole running
 * total *again*, so a member who saved a timer and then finished the task got
 * the same hours approved — and credited — twice (QA_CONCIERGE_E2E C-13).
 *
 * Completion now carries only the delta. The common case is zero: a completion
 * is the claim "this is done", and the hours were already filed as they were
 * worked. A mission whose hours were only ever counted on the mission itself
 * (nothing filed yet) still carries them all, exactly as before.
 *
 * Filed = every finnished-mission row of the mission + every approval that is
 * still open. A closed approval already turned into a row, so counting it too
 * would take the same hours off twice.
 */

type Hours = { attributes?: { noofhours?: number | null; archived?: boolean | null } | null };

export interface MissionFiling {
  finnished_missions?: { data?: Hours[] | null } | null;
  finiapruvals?: { data?: Hours[] | null } | null;
}

const sum = (rows: Hours[]) => rows.reduce((s, r) => s + (Number(r.attributes?.noofhours) || 0), 0);

/** Float noise (0.119 − 0.119 = 1e-17) must not become a phantom approval. */
const clean = (n: number) => Math.round(n * 1e6) / 1e6;

export function hoursAlreadyFiled(mission: MissionFiling | null | undefined): number {
  const rows = mission?.finnished_missions?.data ?? [];
  const open = (mission?.finiapruvals?.data ?? []).filter((f) => f.attributes?.archived !== true);
  return clean(sum(rows) + sum(open));
}

export function hoursStillToFile(
  claimedTotal: number,
  mission: MissionFiling | null | undefined
): number {
  const total = Number(claimedTotal) || 0;
  return Math.max(0, clean(total - hoursAlreadyFiled(mission)));
}
