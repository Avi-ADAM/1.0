/**
 * Route param matcher for the votable entity types.
 *
 * Restricts the `[kind]` segment to the two things a project member votes on:
 *   - `pmash`  → a pending resource proposal
 *   - `pendm`  → a pending mission proposal
 *
 * Kept deliberately route-agnostic so that if we ever extract a standalone
 * vote page outside /moach (e.g. a public `/vote/[kind]/[id]`), it can reuse
 * this matcher unchanged.
 *
 * @param {string} param
 * @returns {boolean}
 */
export function match(param) {
  return param === 'pmash' || param === 'pendm';
}
