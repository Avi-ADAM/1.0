/**
 * THE id order for every tie-break and "lowest event id wins" rule in the
 * consent/space layers: plain UTF-16 code-unit comparison. Never
 * `localeCompare` — its order depends on the runtime's locale/ICU and
 * disagrees with `<` on b64url ids ('-', '_', case; even 'aa' under Danish
 * collation), so two replicas (or two functions in one replica) could fold
 * or pick differently. Invariant 7.
 *
 * A leaf module on purpose: projection.ts sits under everything, and must not
 * pull the E2E key layer in just to sort.
 */
export function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
