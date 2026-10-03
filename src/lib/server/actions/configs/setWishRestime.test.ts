import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setWishRestimeConfig } from './setWishRestime';
import type { ActionExecutionHandler } from '../types';

/**
 * QA_CONCIERGE_E2E C-9 — the advanced, per-wish setting of the pace: how long the other
 * side of a proposal has to answer before silence answers for them. 48 h by default;
 * the owner can choose another of the four a rikma offers.
 */

const OWNER = '10';
const run = setWishRestimeConfig.graphqlOperation as ActionExecutionHandler;

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

function world(opts: { writeFails?: boolean } = {}) {
  const calls: { qid: string; vars: any }[] = [];
  // The provider (20) put other terms on the table `h` hours ago — the two sides are talking.
  const talking = (h: number) => [
    {
      user: { data: { id: '20' } },
      agree: false,
      note: 'השולחן דורש שעתיים נוספות',
      submittedAt: hoursAgo(h),
      willingHours: 6,
      willingAmount: 680
    }
  ];
  const proposal = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    attributes: {
      kind: 'existing_project',
      status_proposal: 'suggested',
      createdAt: hoursAgo(300),
      proposer_users: { data: [{ id: '20' }] },
      covered_missions: [{ extracted_mission_idx: '55', hours: 6, price: 680 }],
      covered_resources: [],
      ratson_willingness_entry: talking(24),
      matanot: { data: null },
      project: { data: null },
      open_mission: { data: null },
      ...over
    }
  });
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      if (qid === '105queryRatsonWithProposals') {
        return {
          data: {
            ratson: { data: { id: '16', attributes: { users_permissions_users: { data: [{ id: OWNER }] } } } },
            ratsonProposals: {
              data: [
                proposal('1'), // an invitation being negotiated: the provider countered 24 h ago
                proposal('2', { ratson_willingness_entry: talking(200) }), // overdue even at a week
                proposal('3', { status_proposal: 'accepted' }), // answered
                proposal('4', { matanot: { data: { id: '9' } } }), // priced by quote, not on this clock
                proposal('5', { kind: 'custom_offer' }), // a plain self-offer
                proposal('6', { ratson_willingness_entry: [] }) // first contact: nobody countered, no clock
              ]
            }
          }
        };
      }
      if (qid === '389setRatsonRestime') return opts.writeFails ? { errors: [{ message: 'Unknown type' }] } : { data: {} };
      return { data: {} };
    })
  };
  return { calls, strapi };
}

const go = (w: ReturnType<typeof world>, params: Record<string, unknown>, userId = OWNER) =>
  run(params, { userId, jwt: 'jwt', fetch: (() => {}) as any } as any, { strapi: w.strapi } as any);

describe('setWishRestime — the pace of one wish', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('writes the owner’s choice onto the wish', async () => {
    const w = world();
    const out: any = await go(w, { ratsonId: '16', restime: 'sevend' });
    expect(out.data).toMatchObject({ ratsonId: '16', restime: 'sevend' });
    expect(w.calls.find((c) => c.qid === '389setRatsonRestime')!.vars).toEqual({ id: '16', restime: 'sevend' });
  });

  it('running clocks follow the new pace — for the proposals that are on this clock, and only those', async () => {
    const w = world();
    const out: any = await go(w, { ratsonId: '16', restime: 'sevend' });
    const armed = w.calls.filter((c) => c.qid === '390createTimegramaForRatsonProposal').map((c) => c.vars.ratson_proposal);
    // not the accepted one, the product one, the self-offer — nor the one nobody has countered yet
    expect(armed.sort()).toEqual(['1', '2']);
    expect(out.data.rearmed).toBe(2);

    // proposal 1 was last signed 24 h ago: a week from then, i.e. 144 h from now
    const one = w.calls.find((c) => c.qid === '390createTimegramaForRatsonProposal' && c.vars.ratson_proposal === '1')!;
    const fromNow = Date.parse(one.vars.date) - Date.now();
    expect(fromNow).toBeGreaterThan(143.9 * 3600_000);
    expect(fromNow).toBeLessThan(144.1 * 3600_000);
  });

  it('a shortened pace that is already overdue is due now — never in the past', async () => {
    const w = world();
    await go(w, { ratsonId: '16', restime: 'feh' });
    const two = w.calls.find((c) => c.qid === '390createTimegramaForRatsonProposal' && c.vars.ratson_proposal === '2')!;
    expect(Date.parse(two.vars.date)).toBeGreaterThanOrEqual(Date.now() - 1000);
  });

  it('is the owner’s alone, and only to one of the four values', async () => {
    const w = world();
    await expect(go(w, { ratsonId: '16', restime: 'sevend' }, '99')).rejects.toThrow(/owner/);
    await expect(go(w, { ratsonId: '16', restime: 'weekly' })).rejects.toThrow(/restime must be one of/);
    expect(w.calls.some((c) => c.qid === '389setRatsonRestime')).toBe(false);
  });

  it('says so when the setting could not be saved (1.0b not deployed) — it is not silent', async () => {
    const w = world({ writeFails: true });
    await expect(go(w, { ratsonId: '16', restime: 'sevend' })).rejects.toThrow(/Could not set the pace/);
    expect(w.calls.some((c) => c.qid === '390createTimegramaForRatsonProposal')).toBe(false);
  });
});
