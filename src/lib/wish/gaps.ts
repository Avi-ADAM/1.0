/**
 * The parts of a wish nobody has taken yet, at the moment it is closed (QA C-19).
 *
 * Closing opens the rikma and the deal with the parts that have a provider. The rest —
 * the "gaps" — can go on: each becomes an open mission / open resource in the new rikma
 * and an unassigned line of the deal's product, so whoever takes it later is co-signed
 * by the customer (`$lib/server/deal/offerDeal`).
 *
 * A part of the plan (an extracted mission / resource of the wish) is taken when:
 *   - an accepted proposal covers it — by the extracted component's id or its index, the
 *     two keys proposals have used (see `buildTotalLines` on the wish page); or
 *   - an assigned line of the product carries its name. An invitation proposal points at
 *     the BOM line it created, not at the extracted part, so the name is the only bridge
 *     from that line back to the plan.
 *
 * Pure: `materializeWish` and its tests share it.
 */

export type GapKind = 'mission' | 'resource';

export interface WishGap {
  kind: GapKind;
  /** The extracted component's id — what a published need stores as `extractedKey`. */
  key: string;
  /** Position in `extracted_missions` / `extracted_resources`. */
  idx: number;
  name: string;
  isMust: boolean;
  /** Missions: estimated hours. Resources: estimated quantity. */
  amount: number;
  notes: string;
}

export interface WishGapsInput {
  extractedMissions?: any[] | null;
  extractedResources?: any[] | null;
  /** Proposals as qid 105 returns them (`{ id, attributes }`). */
  proposals?: any[] | null;
  /** The product's BOM lines as qid 168 returns them. */
  recipeMissions?: any[] | null;
  recipeResources?: any[] | null;
}

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

function takenNames(lines: any[] | null | undefined, specKey: 'pendm' | 'pmash'): Set<string> {
  const out = new Set<string>();
  for (const l of lines ?? []) {
    const a = l?.attributes ?? {};
    if (!a.assignedMember?.data?.id) continue;
    for (const n of [a[specKey]?.data?.attributes?.name, a.notes]) if (norm(n)) out.add(norm(n));
  }
  return out;
}

function coveredKeys(proposals: any[] | null | undefined, kind: GapKind): Set<string> {
  const out = new Set<string>();
  for (const p of proposals ?? []) {
    const a = p?.attributes ?? p ?? {};
    if ((a.status_proposal ?? a.status) !== 'accepted') continue;
    const list = kind === 'mission' ? a.covered_missions : a.covered_resources;
    for (const c of list ?? []) {
      const k = kind === 'mission' ? c?.extracted_mission_idx : c?.extracted_resource_idx;
      if (k != null && String(k) !== '') out.add(String(k));
    }
  }
  return out;
}

export function wishGaps(input: WishGapsInput): WishGap[] {
  const gaps: WishGap[] = [];
  const pass = (items: any[] | null | undefined, kind: GapKind) => {
    const covered = coveredKeys(input.proposals, kind);
    const names = kind === 'mission'
      ? takenNames(input.recipeMissions, 'pendm')
      : takenNames(input.recipeResources, 'pmash');
    (items ?? []).forEach((item, idx) => {
      const key = item?.id != null ? String(item.id) : '';
      if ((key && covered.has(key)) || covered.has(String(idx))) return;
      if (names.has(norm(item?.name))) return;
      gaps.push({
        kind,
        key,
        idx,
        name: String(item?.name ?? '').trim(),
        isMust: item?.importance === 'must',
        amount: Number(kind === 'mission' ? item?.hoursEst : item?.quantityEst) || (kind === 'mission' ? 0 : 1),
        notes: String(item?.notes ?? '')
      });
    });
  };
  pass(input.extractedMissions, 'mission');
  pass(input.extractedResources, 'resource');
  return gaps.filter((g) => g.name !== '');
}
