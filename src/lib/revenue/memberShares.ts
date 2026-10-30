/**
 * Each partner's share of the rikma's value — the `buildBase()` step of
 * `prPr/whowhat.svelte`, the arithmetic every split runs on.
 *
 * Value comes from three places: finished missions (approved hours × rate),
 * received resources (rikmash), and confirmed stipend payments, which credit
 * the funder and debit the recipient (PLAN_STIPEND §5 — only `confirmed` rows
 * ever reach here, the qid filters them). `splitPreview` and the split page
 * both read it, so the share a partner sees is the share the split will use.
 */

type Rel = { data?: { id?: string | number | null } | null } | null | undefined;

export type ShareUser = { id: string | number; attributes: { username: string } };
export type ShareContribution = { attributes: { total?: number | null; users_permissions_user?: Rel } };
export type ShareStipend = {
  attributes?: { funder?: Rel; recipient?: Rel; equityCredit?: number | string | null; equityDebit?: number | string | null };
};

export type MemberShare = {
  uid: string | number;
  username: string;
  /** The value this member brought, in the rikma's currency. */
  total: number;
  /** Percent of the rikma's value. */
  p: number;
};

export type MemberSharesResult = {
  /** The rikma's whole value — every contribution, members' or not. */
  net: number;
  /** One row per current member, in the order of `users`. */
  rows: MemberShare[];
  /**
   * Value whose owner is not a current member (someone who left, a stipend
   * funder from outside). It still counts in `net`, so the members' shares sum
   * to less than 100% by exactly this much.
   */
  others: number;
};

const idOf = (r: Rel) => r?.data?.id;

export function memberShares(input: {
  users: readonly ShareUser[];
  fmiData?: readonly ShareContribution[];
  rikmashes?: readonly ShareContribution[];
  stipendPayments?: readonly ShareStipend[];
}): MemberSharesResult {
  const { users, fmiData = [], rikmashes = [], stipendPayments = [] } = input;

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

  let net = 0;
  for (const f of fmiData) net += f.attributes.total ?? 0;
  for (const r of rikmashes) net += r.attributes.total ?? 0;
  for (const p of stipendPayments) {
    const a = p?.attributes ?? {};
    net += (Number(a.equityCredit) || 0) - (Number(a.equityDebit) || 0);
  }

  const rows = users.map((u) => {
    const total = dictid[u.id] || 0;
    const p = net > 0 ? (100 * total) / net : 0;
    return { uid: u.id, username: u.attributes.username, total, p };
  });
  const membersTotal = rows.reduce((t, r) => t + r.total, 0);
  const others = net > 0 ? Math.max(0, net - membersTotal) : 0;

  return { net, rows, others };
}
