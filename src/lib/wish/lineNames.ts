/**
 * Which part of a wish's plan a BOM line is — by name, the only bridge there is.
 *
 * An invitation proposal (`requestWishMission` / `requestWishResource`, and every part
 * of a direct offer, PLAN_DIRECT_OFFER P3) points at the product line it created, not
 * at the extracted part of the plan; the line carries the part's name in `notes` (and
 * its spec's name). `$lib/wish/gaps` crosses the same bridge to know what is taken.
 * The wish page crosses it to put the proposal on the row it answers — before this, an
 * invitation was on no row at all.
 *
 * Keys are `m:<lineId>` / `r:<lineId>`; values are normalised names.
 */

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

/** Qid 168's product (`matanot.data.attributes`) → line id → the names it answers to. */
export function lineNames(product: any): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const add = (prefix: 'm' | 'r', lines: any[] | undefined, spec: 'pendm' | 'pmash') => {
    for (const l of lines ?? []) {
      if (l?.id == null) continue;
      const a = l.attributes ?? {};
      const names = [a.notes, a[spec]?.data?.attributes?.name].map(norm).filter(Boolean);
      if (names.length) out[`${prefix}:${l.id}`] = [...new Set(names)];
    }
  };
  add('m', product?.matanot_recipe_missions?.data, 'pendm');
  add('r', product?.matanot_recipe_resources?.data, 'pmash');
  return out;
}

/** Does a proposal's covered key point at a line that is this part of the plan? */
export function lineIsPart(names: Record<string, string[]> | null | undefined, kind: 'm' | 'r', coveredKey: unknown, partName: unknown): boolean {
  if (!names || coveredKey == null || coveredKey === '') return false;
  const want = norm(partName);
  return !!want && (names[`${kind}:${coveredKey}`] ?? []).includes(want);
}
