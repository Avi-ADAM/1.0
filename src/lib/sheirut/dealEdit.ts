/**
 * More hours on a part of a wish deal — the customer signs (QA_CONCIERGE_E2E C-14).
 *
 * The deal is billed by the hours its rikma approves, up to the price the customer agreed
 * per part (`./dealDue`). A provider who sees the part needs more than that asks for it the
 * way any member does in any rikma: an `editObject` proposal on the mission, new hours
 * and/or a new rate, negotiated in rounds. What is particular to a deal is one more signer:
 *
 *   - a version that **raises** the part above what the customer agreed needs **her**
 *     signature on that version — it is her money, and silence is not her yes (the same
 *     rule as a stipend's funder and as the customer's co-signature on a gap offer, C-19);
 *   - she negotiates like a member: approve the version on the table, or put her own
 *     (other hours, another rate) — which resets the rikma's clock, because the members
 *     have not agreed to her version yet;
 *   - the members keep their own rule: their silence matures at the rikma's pace. Once
 *     their clock ran out on a version, her signature on it is the last one missing;
 *   - a version that does not raise the part (fewer hours, a lower rate) only lowers her
 *     ceiling — it needs nobody but the rikma.
 *
 * Pure: the vote path, the silence path and the deal page read the same rules.
 */

/** The terms a round may change — null means "as the mission stands". */
export interface EditTerms {
  hm?: number | null;
  price?: number | null;
}

/** The part as it stands: what she agreed for it and the mission's own terms. */
export interface DealPart {
  /** The price she agreed for this part — the ceiling. */
  cap: number;
  /** The mission's hours / rate now. */
  missionHours?: number | null;
  missionRate?: number | null;
}

const EPS = 0.005;

function nonNeg(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** What the part would be worth under these terms: hours × rate, unchanged fields kept. */
export function editedValue(round: EditTerms, part: DealPart): number {
  const hours = round.hm != null && Number.isFinite(Number(round.hm)) ? nonNeg(round.hm) : nonNeg(part.missionHours);
  const rate = round.price != null && Number.isFinite(Number(round.price)) ? nonNeg(round.price) : nonNeg(part.missionRate);
  return Math.round(hours * rate * 100) / 100;
}

/** Does this version cost the customer more than she agreed? Then she signs it. */
export function raisesPart(round: EditTerms, part: DealPart): boolean {
  return editedValue(round, part) > nonNeg(part.cap) + EPS;
}

/** How much more than she agreed (0 when it does not raise). */
export function raiseBy(round: EditTerms, part: DealPart): number {
  return Math.max(0, Math.round((editedValue(round, part) - nonNeg(part.cap)) * 100) / 100);
}

export interface RoundVote {
  userId: string;
  order: number;
  what: boolean;
}

/** The customers who have not signed this round yet. */
export function clientsPendingOn(votes: RoundVote[], order: number, clientIds: string[]): string[] {
  const signed = new Set(votes.filter((v) => v.what && Number(v.order) === order).map((v) => String(v.userId)));
  return [...new Set(clientIds.map(String))].filter((c) => !signed.has(c));
}

/**
 * The members' silence matured: the clock of the version on the table ran out. (A counter
 * resets the clock, so this always refers to the standing version.)
 */
export function clockRanOut(timegramaDate: string | null | undefined, now: Date = new Date()): boolean {
  if (!timegramaDate) return false;
  const t = Date.parse(timegramaDate);
  return Number.isFinite(t) && t <= now.getTime();
}

// ── the deal page's view of the open requests (qid 400) ────────────────────

/** A deal line as `./dealDue` builds it — only what the view needs. */
export interface EditLine extends DealPart {
  missionId?: string | null;
  name: string;
  providerName?: string | null;
  agreedHours?: number;
}

export interface DealEditRound {
  order: number;
  hm: number | null;
  price: number | null;
  value: number;
  why: string | null;
  proposedById: string | null;
  proposedByName: string | null;
  zman: string | null;
}

export interface DealEditView {
  decisionId: string;
  missionId: string;
  missionName: string;
  providerName: string | null;
  /** The part as agreed now. */
  cap: number;
  agreedHours: number;
  missionHours: number;
  missionRate: number;
  /** The version on the table, and every version before it, oldest first. */
  standing: DealEditRound;
  rounds: DealEditRound[];
  /** How much the version on the table raises the part (0 when it does not). */
  raise: number;
  /** The version raises the part, so the customers sign it. */
  needsCustomer: boolean;
  /** Customers who have not signed the version on the table. */
  customersPending: string[];
  /** Members who have not signed it — moot once their clock ran out. */
  membersPending: string[];
  deadline: string | null;
  membersMatured: boolean;
  /** The viewer already signed the version on the table. */
  viewerSigned: boolean;
}

const numOrNull = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Read qid 400's answer into one view per open request on the deal's missions. Only
 * versions that keep the part (an edit) are listed; a proposal to remove a part is the
 * rikma's own business until it is countered into an edit.
 */
export function readDealEdits(
  res: any,
  lines: EditLine[],
  clientIds: string[],
  viewerId: string,
  now: Date = new Date()
): DealEditView[] {
  const nodes: any[] = (res?.data ?? res)?.decisions?.data ?? [];
  const out: DealEditView[] = [];

  for (const node of nodes) {
    const a = node?.attributes ?? {};
    const missionId = a.archMesimabetahalich?.data?.id != null ? String(a.archMesimabetahalich.data.id) : null;
    const line = missionId ? lines.find((l) => l.missionId === missionId) : undefined;
    if (!line || !missionId) continue;

    const part: DealPart = { cap: line.cap, missionHours: line.missionHours, missionRate: line.missionRate };
    const rounds: DealEditRound[] = (a.negoarch ?? [])
      .map((r: any) => {
        const terms = { hm: numOrNull(r.hm), price: numOrNull(r.price) };
        return {
          order: Number(r.ordern ?? 1),
          hm: terms.hm,
          price: terms.price,
          value: editedValue(terms, part),
          why: r.why ?? null,
          proposedById: r.proposedBy?.data?.id != null ? String(r.proposedBy.data.id) : null,
          proposedByName: r.proposedBy?.data?.attributes?.username ?? null,
          zman: r.zman ?? null,
          mode: r.mode ?? 'archive'
        };
      })
      .sort((x: DealEditRound, y: DealEditRound) => x.order - y.order);
    if (rounds.length === 0) continue;
    const top = rounds[rounds.length - 1] as DealEditRound & { mode?: string };
    if (top.mode !== 'keep') continue;
    const standing: DealEditRound = { ...top };
    delete (standing as any).mode;

    const votes: RoundVote[] = (a.vots ?? []).map((v: any) => ({
      userId: String(v.users_permissions_user?.data?.id ?? ''),
      order: Number(v.order ?? 1),
      what: v.what !== false
    }));
    const signed = new Set(votes.filter((v) => v.what && v.order === standing.order).map((v) => v.userId));
    const members: string[] = (a.projects?.data?.[0]?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id));
    const deadline = a.timegrama?.data?.attributes?.date ?? null;
    const needsCustomer = raisesPart(standing, part);

    out.push({
      decisionId: String(node.id),
      missionId,
      missionName: line.name,
      providerName: line.providerName ?? null,
      cap: line.cap,
      agreedHours: Number(line.agreedHours) || 0,
      missionHours: Number(line.missionHours) || 0,
      missionRate: Number(line.missionRate) || 0,
      standing,
      rounds: rounds.map(({ mode: _m, ...r }: any) => r),
      raise: raiseBy(standing, part),
      needsCustomer,
      customersPending: needsCustomer ? clientsPendingOn(votes, standing.order, clientIds) : [],
      membersPending: members.filter((m) => !signed.has(m)),
      deadline,
      membersMatured: clockRanOut(deadline, now),
      viewerSigned: signed.has(String(viewerId))
    });
  }
  return out;
}
