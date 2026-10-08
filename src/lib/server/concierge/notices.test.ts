import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: vi.fn() }));

import { sendToSer } from '$lib/send/sendToSer.js';
import { loadWishNotices, toWishNoticeInputs } from './notices';
import { wishNotices } from '$lib/notices';

/** A proposal node as qid 421 returns it. Wish 7 is Noa's (20); Avi (9) proposes. */
function node(over: { id?: string; attrs?: Record<string, any>; wish?: Record<string, any> } = {}) {
  return {
    id: over.id ?? '70',
    attributes: {
      kind: 'custom_offer',
      status_proposal: 'suggested',
      total_price: null,
      createdAt: '2026-10-01T08:00:00.000Z',
      proposer_users: { data: [{ id: '9', attributes: { username: 'Avi' } }] },
      project: { data: null },
      matanot: { data: null },
      // A volunteer on a published need: the proposal opened by the provider.
      open_mission: { data: { id: '300', attributes: { name: 'Plumbing (published)' } } },
      covered_missions: [{ id: '1', extracted_mission_idx: '1', hours: 6, price: 400 }],
      covered_resources: [],
      ratson_willingness_entry: [],
      ratson: {
        data: {
          id: '7',
          attributes: {
            name: 'Kitchen',
            status_ratson: 'open',
            users_permissions_users: { data: [{ id: '20', attributes: { username: 'Noa' } }] },
            extracted_missions: [
              { id: 'a', name: 'Tiles' },
              { id: 'b', name: 'Plumbing' }
            ],
            extracted_resources: [],
            ...over.wish
          }
        }
      },
      ...over.attrs
    }
  };
}

const none = new Map<string, unknown>();
const noneHidden = new Set<string>();

describe('toWishNoticeInputs', () => {
  it('reads who, which need, and the terms on the table — as the wish page would', () => {
    const [input] = toWishNoticeInputs([node()], 'wisher', none, noneHidden);
    expect(input.wish).toEqual({ id: '7', name: 'Kitchen' });
    expect(input.proposal).toMatchObject({
      id: '70',
      proposerName: 'Avi',
      wisherName: 'Noa',
      // The slot's index is a position here: extracted_missions[1].
      itemName: 'Plumbing',
      itemKind: 'mission'
    });
    expect(input.proposal.negotiation).toMatchObject({ round: 0, yourTurn: true, amount: 6, price: 400 });
  });

  it('names the need by its id when the slot carries one', () => {
    const [input] = toWishNoticeInputs(
      [node({ attrs: { covered_missions: [{ id: '1', extracted_mission_idx: 'a', hours: 2, price: 100 }] } })],
      'wisher',
      none,
      noneHidden
    );
    expect(input.proposal.itemName).toBe('Tiles');
  });

  it('a volunteer offer waits for the wisher, not for the volunteer', () => {
    expect(wishNotices(toWishNoticeInputs([node()], 'wisher', none, noneHidden))).toHaveLength(1);
    expect(wishNotices(toWishNoticeInputs([node()], 'provider', none, noneHidden))).toHaveLength(0);
  });

  it('after the wisher counters, it is the volunteer’s move', () => {
    const countered = node({
      attrs: {
        ratson_willingness_entry: [
          { id: '1', user: { data: { id: '20' } }, agree: false, note: 'Can it be 5?', willingHours: 5, willingAmount: 350, submittedAt: '2026-10-02T08:00:00.000Z' }
        ]
      }
    });
    expect(wishNotices(toWishNoticeInputs([countered], 'wisher', none, noneHidden))).toHaveLength(0);
    const [n] = wishNotices(toWishNoticeInputs([countered], 'provider', none, noneHidden));
    expect(n.kind).toBe('wishCounter');
    expect(n.detail).toEqual({ text: 'Can it be 5?' });
  });

  it('leaves out what the wisher hid, and wishes with nothing to answer on', () => {
    expect(toWishNoticeInputs([node()], 'wisher', none, new Set(['70']))).toHaveLength(0);
    // Hidden from her — not from the provider who made it.
    expect(toWishNoticeInputs([node()], 'provider', none, new Set(['70']))).toHaveLength(1);
    expect(toWishNoticeInputs([node({ wish: { status_ratson: 'cancelled' } })], 'wisher', none, noneHidden)).toHaveLength(0);
  });
});

describe('loadWishNotices', () => {
  it('says "could not tell" (null) when the read fails — never "nothing waits" ([])', async () => {
    vi.mocked(sendToSer).mockImplementation(async () => {
      throw new Error('down');
    });
    expect(await loadWishNotices('20', fetch)).toBeNull();
  });

  it('a guest has nothing waiting', async () => {
    expect(await loadWishNotices(null, fetch)).toEqual([]);
  });

  it('keeps the rows when only the pace or the hidden list cannot be read', async () => {
    vi.mocked(sendToSer).mockImplementation(async (_vars: any, qid: string) => {
      if (qid === '421myWishNotices') return { data: { asWisher: { data: [node()] }, asProvider: { data: [] } } };
      throw new Error(`${qid} unavailable`);
    });
    const list = await loadWishNotices('20', fetch);
    expect(list?.map((n) => n.kind)).toEqual(['wishOffer']);
  });
});

describe('toWishNoticeInputs — a direct offer nobody took yet (PLAN_DIRECT_OFFER)', () => {
  it('rings no bell: the provider’s own signed parts are not an invitation to anyone', () => {
    const offer = node({ wish: { users_permissions_users: { data: [] } } });
    expect(toWishNoticeInputs([offer], 'provider', none, noneHidden)).toEqual([]);
    // once she took it, it is an ordinary wish proposal again
    expect(toWishNoticeInputs([node()], 'provider', none, noneHidden)).toHaveLength(1);
  });
});

