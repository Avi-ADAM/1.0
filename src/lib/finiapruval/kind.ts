/**
 * What a `Finiapruval` is asking the rikma to sign.
 *
 * The same model carries two different claims:
 *  - **hours** — "approve the hours I logged" (a timer save, a month of a
 *    recurring mission, the hours flushed by a rate change). The mission keeps
 *    running; approving it banks the hours on a FinnishedMission row.
 *  - **finish** — "this mission is done" (`completeMission`). Approving it closes
 *    the mission for good: `mesimabetahalich.finnished = true`.
 *
 * Getting this wrong in the finish direction ends a running mission, so every
 * signal an hours approval has ever carried counts:
 *  - `isTimerSave` — set on every hours approval since 2026-05-07 (140.2);
 *  - `iskvua` + `month` — how a recurring mission's month asked for approval
 *    before that, and what the old maturation copied onto the row;
 *  - `timer` — the timer the hours were saved from.
 * A finish approval (`104createFiniapruval`) sets none of them.
 *
 * Pure on purpose: `closeFiniapruval`, the timegrama that matures a silent
 * approval, the in-progress board and the votes page all read it from here.
 */

export interface FiniapruvalKindAttrs {
  isTimerSave?: boolean | null;
  iskvua?: boolean | null;
  month?: string | null;
  timer?: { data?: { id?: string | number | null } | null } | null;
}

/** True when the approval is for logged hours, not for finishing the mission. */
export function isHoursApproval(attrs: FiniapruvalKindAttrs | null | undefined): boolean {
  if (!attrs) return false;
  return (
    attrs.isTimerSave === true ||
    attrs.iskvua === true ||
    !!attrs.month ||
    attrs.timer?.data?.id != null
  );
}

/** True when approving it closes the mission (`finnished`). */
export function isFinishApproval(attrs: FiniapruvalKindAttrs | null | undefined): boolean {
  return !!attrs && !isHoursApproval(attrs);
}
