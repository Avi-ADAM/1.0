/**
 * Which moach cache sections a socket notification touches.
 *
 * Interim mapping for REALTIME_TRACKING R0/B4: the moach layout used to pass
 * `metadata.type` straight to `moachStore.invalidate`, but most types
 * (`sheirutUpdate`, `ratsonProposal`, …) are not sections, so nothing happened
 * at all. R2 replaces this with scopes declared by the actions themselves.
 */

/** The sections `moachStore` caches per rikma. */
export const MOACH_SECTIONS = /** @type {const} */ (['base', 'missions', 'financials']);

/** Vote kinds — a consensus can create a mission/resource or change the rikma's details. */
export const VOTE_TYPES = ['pendmVote', 'pmashVote', 'maapVote', 'decisionVote', 'voteUpdate'];

/**
 * @param {string | null | undefined} type `metadata.type` (or `data.type`) of the notification
 * @returns {Array<'base' | 'missions' | 'financials'>}
 */
export function sectionsForNotification(type) {
  if (type && VOTE_TYPES.includes(type)) return ['base', 'missions', 'financials'];
  if (type && /** @type {readonly string[]} */ (MOACH_SECTIONS).includes(type)) {
    return [/** @type {'base' | 'missions' | 'financials'} */ (type)];
  }
  return ['base', 'missions'];
}

/**
 * The rikma a notification belongs to, or null when it does not say.
 * @param {any} notification
 * @returns {string | null}
 */
export function notificationProjectId(notification) {
  const pid = notification?.actionParams?.projectId ?? notification?.data?.projectId;
  return pid == null || pid === '' ? null : String(pid);
}

/** The dependency key the moach layout load declares — invalidated to re-read `base`. */
export const moachBaseKey = (/** @type {string | number} */ pid) => `app:moach:${pid}`;
