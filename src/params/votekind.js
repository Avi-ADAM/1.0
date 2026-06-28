/**
 * Route param matcher for the votable entity types.
 *
 * Restricts the `[kind]` segment to the things a project member votes on:
 *   - `pmash`  → a pending resource proposal
 *   - `pendm`  → a pending mission proposal
 *   - `ask`    → a candidate's join request to an open mission
 *   - `askm`   → a candidate/self resource-join request (open mashaabim / pmash)
 *
 * Kept deliberately route-agnostic so that if we ever extract a standalone
 * vote page outside /moach (e.g. a public `/vote/[kind]/[id]`), it can reuse
 * this matcher unchanged.
 *
 * @param {string} param
 * @returns {boolean}
 */
export function match(param) {
  return (
    param === 'pmash' ||
    param === 'pendm' ||
    param === 'ask' ||
    param === 'askm' ||
    param === 'tosplit' ||
    param === 'decision'
  );
}
