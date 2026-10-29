// A member's balance in ONE rikma, from its splits (decided 2026-10-30,
// PLAN_DISTRIBUTED_EXECUTION A2). The rules mirror applyTosplitApproval and
// confirmHaluka — the only two places Strapi moves hervachti for a split.

import { describe, it, expect } from 'vitest';
import { rikmaSplitBalances, type SplitRow } from '$lib/consent/rikmaBalances';
import { splitRowsFromRest, tosplitsQuery, fetchRikmaSplitRows } from './rikmaBalancesExport';
import { hervachDeltasFrom } from '$lib/server/haluka/applyTosplitApproval';

const split = (o: Partial<SplitRow>): SplitRow => ({
  finished: true,
  entries: [],
  halukasConfirmed: [],
  ...o
});

describe('rikmaSplitBalances — the two Strapi rules', () => {
  it('approval pays everyone who is neither giver nor receiver', () => {
    const b = rikmaSplitBalances([
      split({
        entries: [
          { member: '256', amount: 100.5 },
          { member: '258', amount: 40, noten: true },
          { member: '261', amount: 60, mekabel: true }
        ],
        halukasConfirmed: [false]
      })
    ]);
    expect(Object.fromEntries(b)).toEqual({ '256': 10050n });
  });

  it('the last confirmed transfer pays the giver and the receiver', () => {
    const entries = [
      { member: '256', amount: 100 },
      { member: '258', amount: -40, noten: true },
      { member: '261', amount: 40, mekabel: true }
    ];
    const b = rikmaSplitBalances([split({ entries, halukasConfirmed: [true, true] })]);
    expect(Object.fromEntries(b)).toEqual({ '256': 10000n, '258': -4000n, '261': 4000n });
    // one transfer still open: the transfer side waits
    const partial = rikmaSplitBalances([split({ entries, halukasConfirmed: [true, false] })]);
    expect(Object.fromEntries(partial)).toEqual({ '256': 10000n });
  });

  it('a proposal not yet approved pays nothing', () => {
    const b = rikmaSplitBalances([split({ finished: false, entries: [{ member: '256', amount: 50 }] })]);
    expect(b.size).toBe(0);
  });

  it('a split with no transfers never pays a transfer side (there is none)', () => {
    const b = rikmaSplitBalances([
      split({ entries: [{ member: '256', amount: 30, noten: true }], halukasConfirmed: [] })
    ]);
    expect(b.size).toBe(0);
  });

  it('sums splits per member, in agorot, without float drift', () => {
    const many = Array.from({ length: 10 }, () => split({ entries: [{ member: '256', amount: 0.1 }] }));
    expect(rikmaSplitBalances(many).get('256')).toBe(100n); // 10 × 0.1 ₪, not 0.9999…
  });

  it('ignores empty members, null amounts and zero', () => {
    const b = rikmaSplitBalances([
      split({ entries: [{ member: '', amount: 5 }, { member: '256', amount: null }, { member: '258', amount: 0 }] })
    ]);
    expect(b.size).toBe(0);
  });

  it('agrees with hervachDeltasFrom on who is paid at approval', () => {
    const hervachti = [
      { users_permissions_user: { data: { id: 1 } }, amount: 10 },
      { users_permissions_user: { data: { id: 2 } }, amount: 20, noten: true },
      { users_permissions_user: { data: { id: 3 } }, amount: 30, mekabel: true }
    ];
    const approvalPaid = hervachDeltasFrom(hervachti).map((d) => d.userId);
    const b = rikmaSplitBalances([
      split({
        entries: hervachti.map((h) => ({ member: String(h.users_permissions_user.data.id), amount: h.amount, noten: h.noten, mekabel: h.mekabel })),
        halukasConfirmed: [false]
      })
    ]);
    expect([...b.keys()]).toEqual(approvalPaid);
  });
});

describe('one member, two rikmas — why the global hervachti was the wrong yardstick', () => {
  it("each rikma's export holds only that rikma's money", () => {
    const rikmaA = [split({ entries: [{ member: '256', amount: 100 }] })];
    const rikmaB = [split({ entries: [{ member: '256', amount: 250 }] })];
    expect(rikmaSplitBalances(rikmaA).get('256')).toBe(10000n);
    expect(rikmaSplitBalances(rikmaB).get('256')).toBe(25000n);
    // User.hervachti in Strapi would read 350 for both — a mismatch in each.
  });
});

describe('splitRowsFromRest — the Strapi v4 REST shape', () => {
  const body = {
    data: [
      {
        id: 7,
        attributes: {
          finished: true,
          hervachti: [
            { id: 1, amount: 100, noten: null, mekabel: null, users_permissions_user: { data: { id: 256, attributes: { username: 'a' } } } },
            { id: 2, amount: -40, noten: true, mekabel: false, users_permissions_user: { data: { id: 258 } } },
            null,
            { id: 3, amount: 5, users_permissions_user: { data: null } }
          ],
          halukas: { data: [{ id: 11, attributes: { confirmed: true } }, { id: 12, attributes: { confirmed: null } }] }
        }
      },
      { id: 8, attributes: { finished: null } }
    ],
    meta: { pagination: { page: 1, pageCount: 1 } }
  };

  it('maps entries and transfer confirmations', () => {
    expect(splitRowsFromRest(body)).toEqual([
      {
        finished: true,
        entries: [
          { member: '256', amount: 100, noten: null, mekabel: null },
          { member: '258', amount: -40, noten: true, mekabel: false },
          { member: '', amount: 5, noten: null, mekabel: null }
        ],
        halukasConfirmed: [true, false]
      },
      { finished: null, entries: [], halukasConfirmed: [] }
    ]);
  });

  it('survives an empty or broken body', () => {
    expect(splitRowsFromRest(null)).toEqual([]);
    expect(splitRowsFromRest({})).toEqual([]);
  });

  it('asks for exactly one rikma, paged', () => {
    const q = tosplitsQuery('45', 2);
    expect(q).toContain('filters[project][id][$eq]=45');
    expect(q).toContain('pagination[page]=2');
    expect(q).toContain('populate[halukas][fields][0]=confirmed');
  });

  it('walks every page', async () => {
    const pages: string[] = [];
    const get = async (path: string) => {
      pages.push(path);
      const page = Number(/pagination\[page\]=(\d+)/.exec(path)?.[1]);
      return { data: [{ id: page, attributes: { finished: true } }], meta: { pagination: { page, pageCount: 3 } } };
    };
    const rows = await fetchRikmaSplitRows('45', get);
    expect(rows).toHaveLength(3);
    expect(pages).toHaveLength(3);
    expect(pages[0].startsWith('/api/tosplits?')).toBe(true);
  });
});
