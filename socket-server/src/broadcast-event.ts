/**
 * Which socket event a `/broadcast` emits.
 *
 * `notification` (the default, and all a request without `event` ever meant)
 * carries a message for people. `rt:changed` carries "these scopes changed"
 * for screens (docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.3) — kept apart so a
 * client's toast handler never sees an invalidation and the other way round.
 *
 * Closed list: the endpoint is internal, but an event name is a capability on
 * every connected socket, so nothing else is emitted however the body is
 * written.
 */

export const BROADCAST_EVENTS = ['notification', 'rt:changed'] as const;
export type BroadcastEvent = (typeof BROADCAST_EVENTS)[number];

/** The event for a request body's `event`, or null when it names none we emit. */
export function resolveBroadcastEvent(raw: unknown): BroadcastEvent | null {
  if (raw === undefined || raw === null || raw === '') return 'notification';
  return (BROADCAST_EVENTS as readonly unknown[]).includes(raw) ? (raw as BroadcastEvent) : null;
}
