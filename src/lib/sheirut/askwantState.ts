/**
 * Where a request to receive a service stands, for the requester's page
 * (`/askwant/[id]`, TIMEGRAMA_REMINDERS R3). Pure, so the page and its test
 * read the same rule as `renewSheirutJoin`, which only renews a `lapsed` one.
 *
 * - `approved`    — answered: the askwant is archived (it became a Want).
 * - `unavailable` — the service is not offered now (unpublished or archived).
 * - `waiting`     — its clock is still running; the rikma may yet answer.
 * - `lapsed`      — the clock ran out with no member's yes. Not a refusal —
 *                   the requester can ask again.
 */
export type AskwantState = 'approved' | 'unavailable' | 'waiting' | 'lapsed';

export function askwantState(attrs: any): AskwantState {
  if (attrs?.archived === true) return 'approved';
  const s = attrs?.sheirut?.data?.attributes;
  if (!s || s.isApruved !== true || s.archived === true) return 'unavailable';
  const clock = attrs?.timegrama?.data;
  if (clock && clock.attributes?.done !== true) return 'waiting';
  return 'lapsed';
}
