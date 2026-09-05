/**
 * One dial for the entity-level guards in `/api/send` (ownership, vote
 * integrity).
 *
 * Same three settings and the same reasoning as `AUTHZ_MODE`: `enforce` is the
 * default, `log` is the rollback lever that keeps the diagnostics without the
 * blocking, and `off` outside development is a mistake rather than a
 * configuration — a stray line in a `.env` looks exactly like a working deploy,
 * so it is refused instead of silently serving unguarded.
 *
 * Individual entities opt into blocking via `enforce` in `ownership.js`; this
 * is the switch above that, not instead of it.
 */

import { env } from '$env/dynamic/private';

/** @typedef {'off' | 'log' | 'enforce'} GuardMode */

let shadowWarned = false;

/** @returns {GuardMode} */
export function getGuardMode() {
  const raw = env.SEND_GUARD_MODE;
  const mode = raw === 'log' || raw === 'off' ? raw : 'enforce';
  if (import.meta.env.DEV || mode === 'enforce') return mode;
  if (mode === 'off') {
    throw new Error(
      'SEND_GUARD_MODE=off disables the /api/send entity-level guards entirely ' +
        'and is refused outside development. Unset it (the default is ' +
        '`enforce`), or set SEND_GUARD_MODE=log for shadow logging.'
    );
  }
  if (!shadowWarned) {
    shadowWarned = true;
    console.warn(
      '[send-guards] SEND_GUARD_MODE=log — ownership and vote-integrity denials ' +
        'are logged, not blocked.'
    );
  }
  return mode;
}
