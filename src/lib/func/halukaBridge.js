// Bridge glue for the haluka (profit-split) card: turns the split's per-member
// figures into negotiable terms and opens a structured mediation discussion in
// the consensus app. A haluka dispute is "who gets how much": per member the
// fair share ("מגיע", from hervachti) vs. the outcome of the proposed transfers
// ("בפועל", from the stored halukas). The signed decision comes back through
// fetchBridgeResolution (see negoBridge.js) — the card's vote stays the formal
// approval channel.

import { openNegoBridge } from './negoBridge.js';

/**
 * Compute the per-member fair vs. actual amounts from the two sources the
 * haluka card itself reads (see lev/cards/haluka.svelte `ulist`):
 *  • hervach (hervachti) → each member's fair profit share (`amount`).
 *  • halukot → the actual transfers (usersend → userrecive → amount).
 * "actual" = fair + given − received.
 *
 * @param {any[]} hervach
 * @param {any[]} halukot
 * @param {(uid: string) => string | null | undefined} [usernameFor] optional
 *   fallback resolver (e.g. from the project store) for missing usernames
 * @returns {{ uid: string, username: string, fair: number, actual: number }[]}
 */
export function halukaMemberRows(hervach, halukot, usernameFor = () => null) {
  const rows = new Map();

  for (const item of Array.isArray(hervach) ? hervach : []) {
    const user =
      item?.users_permissions_user?.data || item?.users_permissions_user;
    if (!user) continue;
    const uid = String(user.id ?? user);
    const username =
      user.attributes?.username || user.username || usernameFor(uid) || uid;
    rows.set(uid, { uid, username, fair: item?.amount || 0, given: 0, received: 0 });
  }

  for (const h of Array.isArray(halukot) ? halukot : []) {
    const a = h?.attributes || h || {};
    const fromId = String(a.usersend?.data?.id ?? a.usersend?.id ?? '');
    const toId = String(a.userrecive?.data?.id ?? a.userrecive?.id ?? '');
    const amount = a.amount || 0;
    if (amount <= 0.001) continue;
    const giver = rows.get(fromId);
    const receiver = rows.get(toId);
    if (giver) giver.given += amount;
    if (receiver) receiver.received += amount;
  }

  return Array.from(rows.values()).map((r) => ({
    uid: r.uid,
    username: r.username,
    fair: r.fair,
    actual: r.fair + r.given - r.received
  }));
}

/**
 * Open the consensus mediation discussion for a split. One number term per
 * member: original = fair share, proposed = actual outcome. Labels double as
 * issue titles and must stay stable across the negotiation — values are
 * matched back by key (`m:<uid>`).
 *
 * @param {{ tosplitId: string|number, title?: string, projectName?: string,
 *   rows: { uid: string, username: string, fair: number, actual: number }[] }} args
 */
export function openHalukaDiscussion({ tosplitId, title, projectName, rows }) {
  if (!tosplitId || !rows?.length) return;
  const round2 = (n) => Math.round(n * 100) / 100;
  openNegoBridge({
    sourceType: 'tosplit',
    sourceId: tosplitId,
    title: title || projectName,
    projectName,
    fields: rows.map((r) => ({
      key: `m:${r.uid}`,
      label: `החלק של ${r.username}`,
      kind: 'number',
      original: round2(r.fair),
      proposed: round2(r.actual)
    }))
  });
}
