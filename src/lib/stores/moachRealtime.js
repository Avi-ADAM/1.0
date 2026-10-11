/**
 * The dependency key the moach layout load declares — the moach realtime
 * adapter invalidates it to re-read `base` (`$lib/realtime/adapters/moach.ts`).
 *
 * The notification-type mapping that lived here (`VOTE_TYPES`,
 * `sectionsForNotification`) was the interim router of R0; the scopes the
 * actions declare replaced it (PLAN_REALTIME_MIGRATION R6).
 */
export const moachBaseKey = (/** @type {string | number} */ pid) => `app:moach:${pid}`;
