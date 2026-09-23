/**
 * A customer's concierge at a glance: what they started, what is on its way,
 * and what changed and is waiting for them.
 *
 * Shared by the profile badge (/me) and the concierge hub, so the numbers a
 * customer sees on the profile are the numbers they find one click later.
 *
 *  - drafts   — `status_ratson: 'draft'`: written, not sent.
 *  - ordered  — sent and being put together: open / matching / negotiating.
 *               A fulfilled wish has become a deal and lives on /deals.
 *  - updates  — offers on a sent wish still waiting for the customer's answer
 *               (`suggested` or `viewed` — the two states accept/reject take).
 */

export const ORDERED_STATUSES = new Set(['open', 'matching', 'negotiating']);
export const AWAITING_ANSWER = new Set(['suggested', 'viewed']);

/**
 * @typedef {{
 *   id: string,
 *   status: string,
 *   pendingProposals: number
 * }} WishSummaryRow
 *
 * @typedef {{
 *   drafts: number,
 *   ordered: number,
 *   updates: number,
 *   total: number,
 *   onlyDraftId: string | null,
 *   updatesWishId: string | null
 * }} ConciergeSummary
 */

/**
 * Status of a Ratson as the UI reads it — a legacy row with no status is
 * open unless it is marked fulfilled.
 *
 * @param {{ status_ratson?: string | null, fulfilled?: boolean | null }} a
 */
export function ratsonStatus(a) {
  return a?.status_ratson || (a?.fulfilled ? 'fulfilled' : 'open');
}

/**
 * Offers on this wish still waiting for the owner.
 *
 * @param {any} attributes a Ratson's attributes with `ratson_proposals`
 */
export function pendingProposalCount(attributes) {
  const list = attributes?.ratson_proposals?.data ?? [];
  return list.filter((p) =>
    AWAITING_ANSWER.has(p?.attributes?.status_proposal ?? '')
  ).length;
}

/**
 * @param {WishSummaryRow[]} rows
 * @returns {ConciergeSummary}
 */
export function summarizeWishes(rows) {
  let drafts = 0;
  let ordered = 0;
  let updates = 0;
  /** @type {string | null} */
  let lastDraft = null;
  /** @type {string[]} */
  const withUpdates = [];

  for (const r of rows ?? []) {
    if (r.status === 'draft') {
      drafts++;
      lastDraft = r.id;
      continue;
    }
    if (ORDERED_STATUSES.has(r.status)) ordered++;
    if (r.pendingProposals > 0 && r.status !== 'cancelled' && r.status !== 'expired') {
      updates += r.pendingProposals;
      withUpdates.push(r.id);
    }
  }

  return {
    drafts,
    ordered,
    updates,
    total: drafts + ordered + updates,
    // One draft or one wish with news: link straight to it, not to a list.
    onlyDraftId: drafts === 1 ? lastDraft : null,
    updatesWishId: withUpdates.length === 1 ? withUpdates[0] : null
  };
}

/**
 * From the raw `106listMyRatsons` nodes.
 *
 * @param {any[]} nodes
 */
export function summarizeRatsonNodes(nodes) {
  return summarizeWishes(
    (nodes ?? []).map((n) => ({
      id: String(n.id),
      status: ratsonStatus(n.attributes),
      pendingProposals: pendingProposalCount(n.attributes)
    }))
  );
}
