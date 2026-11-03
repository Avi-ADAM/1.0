import { afterEach, describe, expect, it, vi } from 'vitest';
import { answerDealReceipt, deliverDeal, loadReceipt, matureDealReceipt } from './receipt';

// The track is read only while the switch is on (P6 lives on fixed-price deals only).
const flag = vi.hoisted(() => ({ on: true }));
vi.mock('$lib/sheirut/pricingTracksFlag', () => ({ pricingTracksEnabled: () => flag.on }));
afterEach(() => {
  flag.on = true;
});

/**
 * Deal 8 on `track`, rikma 91 (members 1, 2), customer 9, and its open receipt Decision
 * 50 with `vots` (none when null), clock 60 (`done`).
 */
function world(opts: { track?: string; vots?: any[] | null; accepted?: boolean; done?: boolean } = {}) {
  const calls: Array<{ qid: string; vars: any }> = [];
  const run = vi.fn(async (qid: string, vars: any) => {
    calls.push({ qid, vars });
    if (qid === '472sheirutPricingTracks') {
      return { data: { sheiruts: { data: [{ id: '8', attributes: { pricingTrack: opts.track ?? 'fixed' } }] } } };
    }
    if (qid === '473dealReceipt') {
      const decision =
        opts.vots == null
          ? []
          : [
              {
                id: '50',
                attributes: {
                  archived: false,
                  vots: opts.vots,
                  timegrama: { data: { id: '60', attributes: { date: '2026-11-05T10:00:00.000Z', done: opts.done ?? false } } }
                }
              }
            ];
      return {
        data: {
          sheirut: {
            data: {
              id: '8',
              attributes: {
                productExepted: opts.accepted ?? false,
                users_permissions_users: { data: [{ id: '9', attributes: { username: 'Noa' } }] },
                project: { data: { id: '91', attributes: { restime: 'feh', user_1s: { data: [{ id: '1' }, { id: '2' }] } } } },
                receipt_decisions: { data: decision }
              }
            }
          }
        }
      };
    }
    if (qid === '474createDealReceipt') return { data: { createDecision: { data: { id: '50' } } } };
    if (qid === '477dealReceiptDecision') {
      return { data: { decision: { data: { id: '50', attributes: { kind: 'dealReceipt', archived: false, receiptDeal: { data: { id: '8' } } } } } } };
    }
    return { data: { ok: true } };
  });
  return { run, calls, qids: () => calls.map((c) => c.qid) };
}

const delivered = [
  { what: true, order: 1, why: 'done', zman: '2026-11-03T10:00:00.000Z', users_permissions_user: { data: { id: '1' } } },
  { what: null, order: 1, users_permissions_user: { data: { id: '9' } } }
];

describe('loadReceipt', () => {
  it('an at-cost deal has no receipt step — and is never read', async () => {
    const w = world({ track: 'atCost' });
    expect(await loadReceipt(w.run, '8')).toBeNull();
    expect(w.qids()).toEqual(['472sheirutPricingTracks']);
  });

  it('with the switch off, every deal is at-cost', async () => {
    flag.on = false;
    const w = world();
    expect(await loadReceipt(w.run, '8')).toBeNull();
    expect(w.calls).toEqual([]);
  });
});

describe('deliverDeal', () => {
  it('a member opens a round asking the customer, with a clock on the rikma’s restime', async () => {
    const w = world();
    const out = await deliverDeal(w.run, { sheirutId: '8', userId: '1', why: 'the files', now: new Date('2026-11-03T10:00:00Z') });
    expect(out.decisionId).toBe('50');
    const create = w.calls.find((c) => c.qid === '474createDealReceipt')!.vars.data;
    expect(create).toMatchObject({ kind: 'dealReceipt', receiptDeal: '8', archived: false });
    expect(create.vots).toEqual([
      expect.objectContaining({ what: true, order: 1, users_permissions_user: '1', why: 'the files' }),
      expect.objectContaining({ what: null, order: 1, users_permissions_user: '9' })
    ]);
    expect(w.qids()).toContain('476dealReceiptClock');
  });

  it('only a member, and not twice while it waits', async () => {
    await expect(deliverDeal(world().run, { sheirutId: '8', userId: '9' })).rejects.toThrow(/member of the rikma/);
    await expect(deliverDeal(world({ vots: delivered }).run, { sheirutId: '8', userId: '1' })).rejects.toThrow(/already waits/);
  });

  it('after her defects, delivering again restarts the stopped clock', async () => {
    const w = world({
      vots: [...delivered, { what: true, order: 2, why: 'colours', zman: '2026-11-04T10:00:00.000Z', users_permissions_user: { data: { id: '9' } } }],
      done: true
    });
    await deliverDeal(w.run, { sheirutId: '8', userId: '2' });
    expect(w.qids()).toContain('mrResetTimegrama');
    expect(w.qids()).not.toContain('476dealReceiptClock');
  });
});

describe('answerDealReceipt', () => {
  it('accepting the delivery: received, the Decision closes, the clock stops', async () => {
    const w = world({ vots: delivered });
    expect((await answerDealReceipt(w.run, { sheirutId: '8', userId: '9', answer: 'accept' })).received).toBe(true);
    expect(w.calls.find((c) => c.qid === '213updateSheirut')!.vars).toEqual({ id: '8', data: { productExepted: true, iGotIt: true } });
    expect(w.calls.some((c) => c.qid === '475updateDealReceipt' && c.vars.data.archived === true)).toBe(true);
    expect(w.calls.some((c) => c.qid === 'mrSetTimegramaDone' && c.vars.done === true)).toBe(true);
  });

  it('defects need her words, open a round, stop the clock — and receive nothing', async () => {
    await expect(answerDealReceipt(world({ vots: delivered }).run, { sheirutId: '8', userId: '9', answer: 'defects', why: ' ' })).rejects.toThrow(
      /what is still missing/
    );
    const w = world({ vots: delivered });
    expect((await answerDealReceipt(w.run, { sheirutId: '8', userId: '9', answer: 'defects', why: 'colours' })).received).toBe(false);
    expect(w.qids()).not.toContain('213updateSheirut');
    const vots = w.calls.find((c) => c.qid === '475updateDealReceipt')!.vars.data.vots;
    expect(vots.at(-2)).toMatchObject({ what: true, order: 2, users_permissions_user: '9', why: 'colours' });
    expect(w.calls.some((c) => c.qid === 'mrSetTimegramaDone' && c.vars.done === true)).toBe(true);
  });

  it('she may confirm her own receipt before anyone delivered', async () => {
    const w = world();
    expect((await answerDealReceipt(w.run, { sheirutId: '8', userId: '9', answer: 'accept' })).received).toBe(true);
  });

  it('only the customer answers', async () => {
    await expect(answerDealReceipt(world({ vots: delivered }).run, { sheirutId: '8', userId: '1', answer: 'accept' })).rejects.toThrow(
      /Only the customer/
    );
  });
});

describe('matureDealReceipt', () => {
  it('a delivery nobody answered is received', async () => {
    const w = world({ vots: delivered });
    expect((await matureDealReceipt(w.run, '50')).outcome).toBe('received');
    expect(w.qids()).toContain('213updateSheirut');
  });

  it('a list of defects on the table matures nothing', async () => {
    const w = world({
      vots: [...delivered, { what: true, order: 2, why: 'colours', zman: '2026-11-04T10:00:00.000Z', users_permissions_user: { data: { id: '9' } } }]
    });
    expect((await matureDealReceipt(w.run, '50')).outcome).toBe('waiting');
    expect(w.qids()).not.toContain('213updateSheirut');
  });
});
