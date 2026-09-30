import { describe, expect, it } from 'vitest';
import { notificationItems, summarizeRatsonNodes, summarizeWishes } from './summary.js';

const node = (id: string, status: string | null, proposals: string[] = [], fulfilled = false) => ({
  id,
  attributes: {
    name: `wish ${id}`,
    status_ratson: status,
    fulfilled,
    ratson_proposals: {
      data: proposals.map((s, i) => ({ id: `${id}-${i}`, attributes: { status_proposal: s } }))
    }
  }
});

describe('summarizeWishes', () => {
  it('is all zeros for a customer with nothing yet', () => {
    expect(summarizeWishes([])).toEqual({
      drafts: 0,
      ordered: 0,
      updates: 0,
      total: 0,
      onlyDraftId: null,
      updatesWishId: null
    });
  });

  it('counts drafts apart from sent wishes, and links a lone draft directly', () => {
    const s = summarizeRatsonNodes([node('1', 'draft'), node('2', 'open'), node('3', 'matching')]);
    expect(s.drafts).toBe(1);
    expect(s.ordered).toBe(2);
    expect(s.onlyDraftId).toBe('1');
  });

  it('does not link a draft when there are several', () => {
    const s = summarizeRatsonNodes([node('1', 'draft'), node('2', 'draft')]);
    expect(s.drafts).toBe(2);
    expect(s.onlyDraftId).toBeNull();
  });

  it('counts only offers still waiting for an answer as updates', () => {
    const s = summarizeRatsonNodes([
      node('1', 'negotiating', ['suggested', 'viewed', 'accepted', 'rejected'])
    ]);
    expect(s.updates).toBe(2);
    expect(s.updatesWishId).toBe('1');
  });

  it('ignores offers on a draft, a cancelled or an expired wish', () => {
    const s = summarizeRatsonNodes([
      node('1', 'draft', ['suggested']),
      node('2', 'cancelled', ['suggested']),
      node('3', 'expired', ['viewed'])
    ]);
    expect(s.updates).toBe(0);
  });

  it('keeps a fulfilled wish out of "ordered" but still shows its open offers', () => {
    const s = summarizeRatsonNodes([node('1', null, ['suggested'], true)]);
    expect(s.ordered).toBe(0);
    expect(s.updates).toBe(1);
  });

  it('reads a legacy row with no status as open', () => {
    expect(summarizeRatsonNodes([node('1', null)]).ordered).toBe(1);
  });

  it('points at the list, not one wish, when several have news', () => {
    const s = summarizeRatsonNodes([node('1', 'open', ['suggested']), node('2', 'open', ['viewed'])]);
    expect(s.updates).toBe(2);
    expect(s.updatesWishId).toBeNull();
  });
});

describe('notificationItems', () => {
  it('is empty when nothing waits for the customer', () => {
    expect(notificationItems([])).toEqual([]);
    expect(notificationItems([node('1', 'open'), node('2', 'open', ['accepted', 'rejected'])])).toEqual(
      []
    );
  });

  it('lists each wish with offers still waiting, with how many', () => {
    expect(
      notificationItems([
        node('1', 'negotiating', ['suggested', 'viewed', 'accepted']),
        node('2', 'open'),
        node('3', 'open', ['suggested'])
      ])
    ).toEqual([
      { id: '1', name: 'wish 1', count: 2 },
      { id: '3', name: 'wish 3', count: 1 }
    ]);
  });

  it('adds up to the same number the profile badge shows', () => {
    const nodes = [
      node('1', 'negotiating', ['suggested', 'viewed']),
      node('2', 'draft', ['suggested']),
      node('3', 'cancelled', ['suggested']),
      node('4', 'open', ['viewed'])
    ];
    const total = notificationItems(nodes).reduce((s, i) => s + i.count, 0);
    expect(total).toBe(summarizeRatsonNodes(nodes).updates);
  });
});
