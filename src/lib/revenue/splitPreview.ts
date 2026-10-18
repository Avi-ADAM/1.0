/**
 * "Who transfers to whom, if we split now" — the preview the main sales page
 * shows before anyone opens the split screen (canvas "DesktopOverview").
 *
 * It is a read-only port of the arithmetic in `prPr/whowhat.svelte`
 * (`cal` → `buildBase` → `distribute`, the peer path; the collective site
 * share is off there, `COLLECTIVE_SITE_SHARE = false`). The split screen stays
 * the only place a proposal is built and sent; this never feeds an action. If
 * you change the math there, change it here too — the test pins the two
 * against the same worked example.
 */

type Rel = { data?: { id?: string | number | null } | null } | null | undefined;

export type PreviewUser = { id: string | number; attributes: { username: string } };
export type PreviewContribution = { attributes: { total?: number | null; users_permissions_user?: Rel } };
export type PreviewStipend = {
  attributes?: { funder?: Rel; recipient?: Rel; equityCredit?: number | string | null; equityDebit?: number | string | null };
};
export type PreviewSale = { attributes: { in: number | string | null; splited?: boolean | null; users_permissions_user?: Rel } };

export type PreviewTransfer = { toId: string | number; toName: string; amount: number };
export type PreviewRow = {
  uid: string | number;
  username: string;
  /** Percent of the rikma's value. */
  p: number;
  /** Unsplit money this member holds. */
  ihave: number;
  /** Their fair share of what is being split. */
  x: number;
  /** Surplus to hand on. */
  noten: number;
  /** Deficit to receive. */
  meca: number;
  le: PreviewTransfer[];
};

const idOf = (r: Rel) => r?.data?.id;

export function splitPreview(input: {
  users: readonly PreviewUser[];
  fmiData?: readonly PreviewContribution[];
  rikmashes?: readonly PreviewContribution[];
  stipendPayments?: readonly PreviewStipend[];
  sales: readonly PreviewSale[];
}): { revach: number; rows: PreviewRow[] } {
  const { users, fmiData = [], rikmashes = [], stipendPayments = [], sales } = input;
  const unsplit = sales.filter((s) => !s.attributes.splited);
  // whowhat's `allin`: every unsplit sale, whoever holds it.
  const revach = unsplit.reduce((t, s) => t + Number(s.attributes.in ?? 0), 0);

  // cal(): what each member holds.
  const dictidi: Record<string, number> = {};
  for (const u of users) {
    for (const s of unsplit) {
      if (idOf(s.attributes.users_permissions_user) === u.id) {
        dictidi[u.id] = (dictidi[u.id] ?? 0) + Number(s.attributes.in ?? 0);
      }
    }
    if (!(u.id in dictidi)) dictidi[u.id] = 0;
  }

  // buildBase(): each member's contribution and the rikma's total.
  const dictid: Record<string, number> = {};
  for (const u of users) {
    for (const f of fmiData) {
      if (idOf(f.attributes.users_permissions_user) === u.id) dictid[u.id] = (dictid[u.id] ?? 0) + (f.attributes.total ?? 0);
    }
    for (const r of rikmashes) {
      if (idOf(r.attributes.users_permissions_user) === u.id) dictid[u.id] = (dictid[u.id] ?? 0) + (r.attributes.total ?? 0);
    }
  }
  for (const p of stipendPayments) {
    const a = p?.attributes ?? {};
    const funderId = idOf(a.funder);
    const recipientId = idOf(a.recipient);
    const credit = Number(a.equityCredit) || 0;
    const debit = Number(a.equityDebit) || 0;
    if (funderId != null && credit !== 0) dictid[funderId] = (dictid[funderId] || 0) + credit;
    if (recipientId != null && debit !== 0) dictid[recipientId] = (dictid[recipientId] || 0) - debit;
  }
  let net: number | undefined;
  for (const f of fmiData) net = (net ?? 0) + (f.attributes.total ?? 0);
  for (const r of rikmashes) net = (net ?? 0) + (r.attributes.total ?? 0);
  for (const p of stipendPayments) {
    const a = p?.attributes ?? {};
    const d = (Number(a.equityCredit) || 0) - (Number(a.equityDebit) || 0);
    if (d !== 0) net = (net || 0) + d;
  }

  const rows: PreviewRow[] = users.map((u) => {
    const total = dictid[u.id] || 0;
    const p = net && net > 0 ? (100 * total) / net : 0;
    return { uid: u.id, username: u.attributes.username, p, ihave: dictidi[u.id] || 0, x: 0, noten: 0, meca: 0, le: [] };
  });

  // distribute(): fair share → surplus / deficit → greedy matching.
  for (const r of rows) {
    r.x = revach > 0 ? (r.p / 100) * revach : 0;
    const surplus = r.ihave - r.x;
    if (surplus < -0.000001) {
      r.meca = -surplus;
      r.noten = 0;
    } else if (surplus > 0.000001) {
      r.noten = surplus;
      r.meca = 0;
    }
  }
  const recv = rows
    .map((u, idx) => ({ idx, need: u.meca }))
    .filter((r) => r.need > 0.01)
    .sort((a, b) => b.need - a.need);
  const givers = rows
    .map((u, idx) => ({ idx, give: u.noten }))
    .filter((g) => g.give > 0.01)
    .sort((a, b) => b.give - a.give);
  for (const g of givers) {
    let remaining = g.give;
    for (const r of recv) {
      if (remaining <= 0.01 || r.need <= 0.01) continue;
      if (g.idx === r.idx) continue;
      const amount = Math.min(remaining, r.need);
      if (amount <= 0.01) continue;
      rows[g.idx].le.push({ toId: rows[r.idx].uid, toName: rows[r.idx].username, amount });
      remaining -= amount;
      r.need -= amount;
    }
  }
  return { revach, rows };
}
