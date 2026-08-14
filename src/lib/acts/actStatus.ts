/**
 * Act (task) status derivation — pure, so the table, the mobile cards and the
 * tests all read one definition of "what state is this ticket in".
 *
 * The Strapi `Act` carries the lifecycle as four loose booleans plus three
 * relations, and every consumer used to re-derive the combination inline:
 * `row.naasa && !row.valiIshur`, `row.isAssigned && !row.myIshur && row.my…`.
 * That is how the old grid ended up with an assignee cell that had to be told
 * `isPending`, `pendingValidation` and `isCompleted` separately — three props
 * for one enum.
 *
 * See `src/generated/STRAPI_SCHEMA_REFERENCE.md` (`Act`) for the field list.
 */

/** The lanes a ticket can sit in, ordered from "nothing yet" to "done". */
export const ACT_STATUSES = [
  'unassigned',
  'published',
  'pendingApproval',
  'inProgress',
  'pendingValidation',
  'completed'
] as const;

export type ActStatus = (typeof ACT_STATUSES)[number];

/** Minimal shape this module reads. Rows come from `reformatArray` in the table. */
export interface ActRowLike {
  id?: string | number;
  isAssigned?: boolean | null;
  myIshur?: boolean | null;
  naasa?: boolean | null;
  valiIshur?: boolean | null;
  status?: number | null;
  my?: { data?: Array<{ id?: string | number }> | null } | null;
  vali?: { data?: { id?: string | number } | null } | null;
  pendm?: { data?: { id?: string | number } | null } | null;
  open_mission?: { data?: { id?: string | number } | null } | null;
  mesimabetahaliches?: { data?: Array<{ id?: string | number }> | null } | null;
  tafkidims?: { data?: Array<any> | null } | null;
}

/** The act has a person on it. */
export function hasAssignee(row: ActRowLike | null | undefined): boolean {
  return (row?.my?.data?.length ?? 0) > 0;
}

/**
 * The act is attached to something that will produce a doer — a mission in
 * progress, an open mission, or a mission proposal awaiting a vote — but no
 * individual has taken it yet.
 */
export function hasMissionLink(row: ActRowLike | null | undefined): boolean {
  return Boolean(
    row?.pendm?.data?.id ||
      row?.open_mission?.data?.id ||
      (row?.mesimabetahaliches?.data?.length ?? 0) > 0
  );
}

/**
 * An act nobody is doing and nothing is going to produce a doer for. This is
 * the "ממתינה להשמה" lane — the only one that offers "take it" and
 * "publish as a mission".
 */
export function isAwaitingPlacement(row: ActRowLike | null | undefined): boolean {
  return !hasAssignee(row) && !hasMissionLink(row);
}

/**
 * Which lane the ticket sits in.
 *
 * Checked most-advanced-first: `naasa` (the doer says it is done) outranks the
 * assignment booleans, because a completed act still carries `isAssigned` and
 * `myIshur` from earlier in its life.
 */
export function getActStatus(row: ActRowLike | null | undefined): ActStatus {
  if (!row) return 'unassigned';

  if (row.naasa) return row.valiIshur ? 'completed' : 'pendingValidation';

  // `isAssigned === false` is the domain's own "nobody in particular owns
  // this" — it is what an act opened to roles carries, and what handing an act
  // back sets. It outranks a lingering `my` relation: only an explicit `false`
  // counts, so legacy rows (null/undefined) keep reading off the relation.
  if (row.isAssigned !== false && hasAssignee(row)) {
    // `myIshur` is the assignee accepting the assignment. Until then the row
    // is a request, not work in progress — someone else may still take it.
    return row.myIshur ? 'inProgress' : 'pendingApproval';
  }

  return hasMissionLink(row) ? 'published' : 'unassigned';
}

/** Progress percentage to display, clamped and forced to agree with the lane. */
export function getActProgress(row: ActRowLike | null | undefined): number {
  const status = getActStatus(row);
  if (status === 'completed' || status === 'pendingValidation') return 100;
  if (status === 'unassigned' || status === 'published') return 0;
  const raw = Number(row?.status ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Quick actions this viewer may take on this row, in display order.
 *
 * - `approve`   — the assignee accepting the assignment (`myIshur`).
 * - `decline`   — the assignee handing it back. Not a veto: it releases the
 *                 act to the unplaced pool, where anyone can take it or turn
 *                 it into a mission. Nothing is closed off, which is what the
 *                 rikma's "no absolute no" asks for.
 * - `progress`  — the doer moving `status` (0–100) while work is under way.
 * - `done`      — the doer reporting the work finished (`naasa`), which hands
 *                 it to the creator to validate.
 * - `validate`  — the creator confirming the work is done (`valiIshur`).
 * - `take`      — "I'll do it": opens the mission picker, since an act has to
 *                 hang off one of the taker's own missions-in-progress for the
 *                 hours it accrues to count. It does not assign on its own.
 * - `publish`   — turn an unplaced act into a mission the rikma can staff.
 *
 * `viewerId` is compared as a string: `page.data.uid` and Strapi ids disagree
 * on number-vs-string depending on the query, and `1 !== '1'` silently hid the
 * approve button for everyone.
 */
export type ActQuickAction =
  | 'approve'
  | 'decline'
  | 'progress'
  | 'done'
  | 'validate'
  | 'take'
  | 'publish';

export function getQuickActions(
  row: ActRowLike | null | undefined,
  viewerId: string | number | null | undefined
): ActQuickAction[] {
  if (!row) return [];
  const me = String(viewerId ?? '');
  if (!me) return [];

  const status = getActStatus(row);
  const isAssignee = (row.my?.data ?? []).some((u) => String(u?.id ?? '') === me);
  const isValidator = String(row.vali?.data?.id ?? '') === me;

  const actions: ActQuickAction[] = [];

  if (status === 'pendingApproval' && isAssignee) {
    actions.push('approve');
    actions.push('decline');
  }
  if (status === 'inProgress' && isAssignee) {
    actions.push('progress');
    actions.push('done');
  }
  if (status === 'pendingValidation' && isValidator) actions.push('validate');
  if (status === 'unassigned') {
    actions.push('take');
    actions.push('publish');
  }
  return actions;
}
