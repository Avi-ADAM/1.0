import { error } from '@sveltejs/kit';

/**
 * Telling "the backend did not answer" apart from "the answer is: nothing".
 *
 * `sendToSer` does not throw on a 5xx — it hands back whatever JSON /api/send
 * wrote. When Strapi timed out or refused the connection that is kit's error
 * body `{ message }`, or `{ errors }` with no `data`. A loader that reads
 * `res?.data?.project?.data ?? null` then sees an empty slot and reports 404,
 * so a member reloading their own rikma page was told it does not exist while
 * the backend was merely slow (2026-10-07, /moach/92/progress).
 *
 * A real "not found" always arrives as a reply that *has* `data` — GraphQL
 * answers a missing id with `{ data: { project: { data: null } } }`.
 */

/**
 * @param {unknown} res - what `sendToSer` returned
 * @returns {boolean} true when the reply carries no answer at all
 */
export function hasNoAnswer(res) {
  return !res || typeof res !== 'object' || /** @type {any} */ (res).data == null;
}

/**
 * Throw the "try again" error for a reply with no answer. 503, never 404: the
 * page exists, the server behind it just did not say so in time.
 *
 * @returns {never}
 */
export function backendUnavailable() {
  throw error(503, { message: 'The server did not answer in time', code: 'unreachable' });
}
