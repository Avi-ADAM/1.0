import { beforeEach, describe, expect, it, vi } from 'vitest';
import { counterRatsonProposalConfig } from './counterRatsonProposal';
import { acceptWishOfferConfig } from './acceptWishOffer';
import { acceptRatsonProposalConfig } from './acceptRatsonProposal';
import type { ActionExecutionHandler } from '../types';

/**
 * QA_CONCIERGE_E2E C-9 — "negotiate" on a wish proposal used to be a button that
 * said "soon". Provider and wisher now trade versions (hours + price, with the
 * reason) until one side approves what the other put on the table, and the agreed
 * numbers are written onto the slot before the provider is assigned to it.
 */

const WISHER = '10';
const PROVIDER = '20';
const RECIPE = '55';

type Entry = Record<string, any>;

/** An in-memory Strapi: one wish, one proposal, one BOM slot. */
function world(
  opts: {
    openedBy?: 'wisher' | 'provider';
    entries?: Entry[];
    hours?: number;
    price?: number;
    status?: string;
    twoSlots?: boolean;
  } = {}
) {
  const db = {
    status: opts.status ?? 'suggested',
    total: opts.price ?? 600,
    covered: [{ extracted_mission_idx: RECIPE, hours: opts.hours ?? 4, price: opts.price ?? 600 }] as any[],
    entries: (opts.entries ?? []) as Entry[],
    bom: { hoursPerUnit: 4, ratePerHour: 150 },
    pendm: { noofhours: 4, perhour: 150 } as Record<string, any>,
    assigned: null as string | null,
    chat: [] as string[],
    calls: [] as { qid: string; vars: any }[]
  };
  if (opts.twoSlots) db.covered.push({ extracted_mission_idx: '56', hours: 1, price: 100 });

  const asStrapiEntries = (input: any[]) =>
    input.map((e) => ({ ...e, user: e.user != null ? { data: { id: String(e.user) } } : null }));

  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      db.calls.push({ qid, vars });
      switch (qid) {
        case '105queryRatsonWithProposals':
          return {
            data: {
              ratson: {
                data: {
                  id: '16',
                  attributes: {
                    users_permissions_users: { data: [{ id: WISHER }] },
                    derivedComplexMatanot: { data: { id: '7' } },
                    chat_forum: { data: { id: '3' } }
                  }
                }
              },
              ratsonProposals: {
                data: [
                  {
                    id: '77',
                    attributes: {
                      status_proposal: db.status,
                      total_price: db.total,
                      proposer_users: { data: [{ id: PROVIDER }] },
                      open_mission: { data: opts.openedBy === 'provider' ? { id: '9' } : null },
                      covered_missions: db.covered,
                      covered_resources: [],
                      ratson_willingness_entry: db.entries
                    }
                  }
                ]
              }
            }
          };
        case '387counterRatsonProposal':
          if (vars.covered_missions) db.covered = vars.covered_missions;
          if (vars.total_price != null) db.total = vars.total_price;
          db.entries = asStrapiEntries(vars.ratson_willingness_entry);
          return { data: { updateRatsonProposal: { data: { id: '77' } } } };
        case '112commitWishWillingness':
          if (vars.status_proposal) db.status = vars.status_proposal;
          if (vars.total_price != null) db.total = vars.total_price;
          db.entries = asStrapiEntries(vars.ratson_willingness_entry);
          return { data: {} };
        case '168wishRecipeForMaterialize':
          return {
            data: {
              matanot: {
                data: {
                  attributes: {
                    matanot_recipe_missions: {
                      data: [{ id: RECIPE, attributes: { pendm: { data: { id: '8' } }, assignedMember: { data: null } } }]
                    },
                    matanot_recipe_resources: { data: [] }
                  }
                }
              }
            }
          };
        case '126updateMatanotRecipeMission':
          db.bom = { hoursPerUnit: vars.hoursPerUnit, ratePerHour: vars.ratePerHour };
          return { data: {} };
        case 'negoUpdatePendm':
          db.pendm = vars.data;
          return { data: {} };
        case '143assignRecipeMissionMember':
          db.assigned = vars.assignedMember;
          return { data: {} };
        case '1chatsend':
          db.chat.push(vars.mes);
          return { data: {} };
        default:
          return { data: {} };
      }
    })
  };
  const notifier = { notify: vi.fn(async () => ({})) };
  return { db, strapi, notifier };
}

type W = ReturnType<typeof world>;
const ctx = (userId: string) => ({ userId, jwt: 'jwt', fetch: (() => {}) as any }) as any;
const util = (w: W) => ({ strapi: w.strapi, notifier: w.notifier }) as any;
const counter = counterRatsonProposalConfig.graphqlOperation as ActionExecutionHandler;
const approve = acceptWishOfferConfig.graphqlOperation as ActionExecutionHandler;
const acceptProposal = acceptRatsonProposalConfig.graphqlOperation as ActionExecutionHandler;

const asCounter = (w: W, who: string, p: { hours?: number; price?: number; note?: string }) =>
  counter({ proposalId: '77', ratsonId: '16', note: 'התנאים האלה מתאימים לי יותר', ...p }, ctx(who), util(w));
const asApprove = (w: W, who: string) => approve({ proposalId: '77', ratsonId: '16' }, ctx(who), util(w));

const entry = (user: string, hours: number, amount: number, agree: boolean, note = '') => ({
  user: { data: { id: user } },
  agree,
  note,
  item_kind: 'covered_mission',
  item_idx: 0,
  submittedAt: '2026-10-02T10:00:00.000Z',
  willingHours: hours,
  willingAmount: amount
});

describe('counterRatsonProposal — not on these terms, but on these', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('the provider answers the wisher’s slot with other hours and price — and the reason', async () => {
    const w = world();
    const out: any = await asCounter(w, PROVIDER, { hours: 6, price: 680, note: 'השולחן דורש שעתיים נוספות' });

    expect(out.data).toMatchObject({ round: 1, version: { amount: 6, price: 680 }, signedBy: 'provider' });
    // the version on the table — the one both accept paths read — is rewritten, its slot kept
    expect(w.db.covered).toEqual([{ extracted_mission_idx: RECIPE, hours: 6, price: 680 }]);
    expect(w.db.total).toBe(680);
    // the log gets the counter, as "not that one, here is mine"
    const mine = w.db.entries.find((e) => e.user.data.id === PROVIDER)!;
    expect(mine).toMatchObject({ agree: false, willingHours: 6, willingAmount: 680, note: 'השולחן דורש שעתיים נוספות' });
  });

  it('tells the other side, with the terms and the reason', async () => {
    const w = world();
    await asCounter(w, PROVIDER, { hours: 6, price: 680, note: 'השולחן דורש שעתיים נוספות' });
    const [config, , result] = w.notifier.notify.mock.calls[0] as any;
    expect(result.recipientIds).toEqual([WISHER]);
    expect(config.templates.body.he).toContain('6');
    expect(config.templates.body.he).toContain('השולחן דורש שעתיים נוספות');
    expect(config.metadata.url).toBe('/concierge/16');
  });

  it('may change just the price', async () => {
    const w = world();
    await asCounter(w, PROVIDER, { price: 500, note: 'אני נותן הנחה על החומרים' });
    expect(w.db.covered[0]).toMatchObject({ hours: 4, price: 500 });
  });

  it('ping-pong: the wisher counters back, then the provider again — turn by turn', async () => {
    const w = world();
    await asCounter(w, PROVIDER, { hours: 6, price: 680, note: 'השולחן דורש שעתיים נוספות' });
    await expect(asCounter(w, PROVIDER, { hours: 7, note: 'ועוד שעה אחת בבקשה' })).rejects.toThrow(/already stand behind/);

    const back: any = await asCounter(w, WISHER, { hours: 5, price: 640, note: 'התקציב מאפשר חמש שעות' });
    expect(back.data.round).toBe(2);
    expect(w.db.covered[0]).toMatchObject({ hours: 5, price: 640 });
    // …and now it is the provider's move again
    const again: any = await asCounter(w, PROVIDER, { price: 660, note: 'נפגש באמצע, שש מאות ושישים' });
    expect(again.data.round).toBe(3);
    expect(w.db.entries).toHaveLength(3); // nothing was rewritten away
  });

  it('refuses a stranger, a counter that changes nothing, nonsense, and a bare number', async () => {
    const w = world();
    await expect(asCounter(w, '99', { price: 500 })).rejects.toThrow(/wisher or the provider/);
    await expect(asCounter(w, PROVIDER, { hours: 4, price: 600 })).rejects.toThrow(/change the hours or the price/);
    await expect(asCounter(w, PROVIDER, { price: -5 })).rejects.toThrow(/price must be/);
    await expect(asCounter(w, PROVIDER, { hours: 1e9 })).rejects.toThrow(/Hours must be/);
    await expect(asCounter(w, PROVIDER, { price: 500, note: 'לא' })).rejects.toThrow(/Say why/);
    expect(w.db.calls.some((c) => c.qid === '387counterRatsonProposal')).toBe(false);
  });

  it('is only for a proposal that is still open, and has one slot', async () => {
    await expect(asCounter(world({ status: 'accepted' }), PROVIDER, { price: 500 })).rejects.toThrow(/already 'accepted'/);
    await expect(asCounter(world({ twoSlots: true }), PROVIDER, { price: 500 })).rejects.toThrow(/single task or resource/);
  });
});

describe('acceptWishOffer — approving the version on the table', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('the provider approves the wisher’s own slot: assigned, accepted, signed', async () => {
    const w = world();
    const out: any = await asApprove(w, PROVIDER);
    expect(out.data.finalized).toBe(true);
    expect(w.db.assigned).toBe(PROVIDER);
    expect(w.db.status).toBe('accepted');
    expect(w.db.entries[0]).toMatchObject({ agree: true, willingHours: 4, willingAmount: 600 });
  });

  it('the wisher approves the provider’s counter: the slot carries the agreed numbers, and the PROVIDER is assigned', async () => {
    const w = world();
    await asCounter(w, PROVIDER, { hours: 6, price: 680, note: 'השולחן דורש שעתיים נוספות' });
    const out: any = await asApprove(w, WISHER);

    expect(out.data.finalized).toBe(true);
    // the BOM line (what the deal is priced from) and its spec (what is carried out)
    expect(w.db.bom.hoursPerUnit).toBe(6);
    expect(w.db.bom.ratePerHour).toBeCloseTo(680 / 6, 6);
    expect(w.db.pendm.noofhours).toBe(6);
    expect(w.db.pendm.perhour).toBeCloseTo(680 / 6, 6);
    // the invited provider holds the slot — not the wisher who pressed approve
    expect(w.db.assigned).toBe(PROVIDER);
    expect(w.db.status).toBe('accepted');
    expect(w.db.total).toBe(680);
    // the slot was written before anyone was assigned to it
    const order = w.db.calls.map((c) => c.qid);
    expect(order.indexOf('126updateMatanotRecipeMission')).toBeLessThan(order.indexOf('143assignRecipeMissionMember'));
    // …and the provider hears it
    const [, , result] = w.notifier.notify.mock.calls.at(-1) as any;
    expect(result.recipientIds).toEqual([PROVIDER]);
  });

  it('keeps the whole negotiation in the log — approving does not erase the counters', async () => {
    const w = world();
    await asCounter(w, PROVIDER, { hours: 6, price: 680, note: 'השולחן דורש שעתיים נוספות' });
    await asApprove(w, WISHER);
    expect(w.db.entries.map((e) => [e.user.data.id, e.agree])).toEqual([
      [PROVIDER, false],
      [WISHER, true]
    ]);
    expect(w.db.entries[0].note).toBe('השולחן דורש שעתיים נוספות');
  });

  it('only the side whose move it is may approve — nobody approves their own counter', async () => {
    const w = world();
    await asCounter(w, PROVIDER, { hours: 6, price: 680, note: 'השולחן דורש שעתיים נוספות' });
    await expect(asApprove(w, PROVIDER)).rejects.toThrow(/already stand behind/);
    expect(w.db.assigned).toBeNull();
    expect(w.db.status).toBe('suggested');
  });

  it('a stranger cannot approve, and an approved placement cannot be approved twice', async () => {
    await expect(asApprove(world(), '99')).rejects.toThrow(/wisher or the provider/);
    await expect(asApprove(world({ status: 'accepted' }), PROVIDER)).rejects.toThrow(/already approved/);
  });
});

describe('a volunteer from the community feed', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('cannot approve their own offer — the wisher closes it', async () => {
    const w = world({ openedBy: 'provider' });
    await expect(asApprove(w, PROVIDER)).rejects.toThrow(/already stand behind/);
  });

  it('approving the wisher’s counter only signs — the wisher closes the placement', async () => {
    const w = world({
      openedBy: 'provider',
      hours: 5,
      price: 640,
      entries: [entry(WISHER, 5, 640, false, 'התקציב מאפשר חמש שעות')]
    });
    const out: any = await asApprove(w, PROVIDER);

    expect(out.data.finalized).toBe(false);
    expect(w.db.assigned).toBeNull(); // building the slot is the wisher's authority
    expect(w.db.status).toBe('suggested');
    expect(w.db.entries.at(-1)).toMatchObject({ agree: true });
    const [, , result] = w.notifier.notify.mock.calls.at(-1) as any;
    expect(result.recipientIds).toEqual([WISHER]);
  });

  it('the wisher cannot approve a version she herself put on the table', async () => {
    const w = world({
      openedBy: 'provider',
      hours: 5,
      price: 640,
      entries: [entry(WISHER, 5, 640, false, 'התקציב מאפשר חמש שעות')]
    });
    await expect(acceptProposal({ proposalId: '77', ratsonId: '16' }, ctx(WISHER), util(w))).rejects.toThrow(
      /their turn to answer/
    );
  });
});

describe('acceptRatsonProposal — the shapes that are not its own', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('an invited provider’s counter is approved by the wisher through the same button', async () => {
    const w = world();
    await asCounter(w, PROVIDER, { hours: 6, price: 680, note: 'השולחן דורש שעתיים נוספות' });
    const out: any = await acceptProposal({ proposalId: '77', ratsonId: '16' }, ctx(WISHER), util(w));
    expect(out.data.finalized).toBe(true);
    expect(w.db.assigned).toBe(PROVIDER);
    expect(w.db.bom.hoursPerUnit).toBe(6);
  });

  it('a volunteer approving through it is just signing, as above', async () => {
    const w = world({
      openedBy: 'provider',
      hours: 5,
      price: 640,
      entries: [entry(WISHER, 5, 640, false, 'התקציב מאפשר חמש שעות')]
    });
    const out: any = await acceptProposal({ proposalId: '77', ratsonId: '16' }, ctx(PROVIDER), util(w));
    expect(out.data.finalized).toBe(false);
  });
});
