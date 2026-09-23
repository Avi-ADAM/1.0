/**
 * The agreed shift commitment of a mission in progress, for screens that
 * offer to change it (docs/PLAN_SHIFTS.md §3.8).
 *
 * Only a mission staffed in shifts has one: its OpenMission carries
 * `isshift`. For any other mission this returns null, and the edit drawer
 * shows no commitment fields — a commitment on a mission with no shifts
 * would be a term that governs nothing.
 */

export interface ShiftCommitment {
  min: number | null;
  max: number | null;
}

const num = (v: unknown): number | null =>
  v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v);

/** `attrs` is a Mesimabetahalich's attributes with `open_missions { data { attributes { isshift } } }`. */
export function commitmentOf(attrs: any): ShiftCommitment | null {
  const staffed = (attrs?.open_missions?.data ?? []).some((om: any) => om?.attributes?.isshift === true);
  if (!staffed) return null;
  return { min: num(attrs?.shiftsMin), max: num(attrs?.shiftsMax) };
}
