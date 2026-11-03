import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionExecutionHandler } from '../types';

/**
 * PLAN_DEAL_PRICING_TRACKS P2 — the pricing track is a term like hours and price: a
 * counter may offer the other one, and one that changes only the track is still a
 * counter. While the switch is off the track is never read or written.
 */

const flag = vi.hoisted(() => ({ on: true }));
vi.mock('$lib/sheirut/pricingTracksFlag', () => ({ pricingTracksEnabled: () => flag.on }));

const { counterRatsonProposalConfig } = await import('./counterRatsonProposal');
const counter = counterRatsonProposalConfig.graphqlOperation as ActionExecutionHandler;

const WISHER = '10';
const PROVIDER = '20';

function world(tracks: { wish?: string | null; proposal?: string | null } = {}) {
  const db = { proposalTrack: tracks.proposal ?? null, calls: [] as string[] };
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      db.calls.push(qid);
      switch (qid) {
        case '105queryRatsonWithProposals':
          return {
            data: {
              ratson: { data: { id: '16', attributes: { users_permissions_users: { data: [{ id: WISHER }] } } } },
              ratsonProposals: {
                data: [
                  {
                    id: '77',
                    attributes: {
                      status_proposal: 'suggested',
                      kind: 'existing_project',
                      total_price: 600,
                      proposer_users: { data: [{ id: PROVIDER }] },
                      open_mission: { data: null },
                      covered_missions: [{ extracted_mission_idx: '55', hours: 4, price: 600 }],
                      covered_resources: [],
                      ratson_willingness_entry: []
                    }
                  }
                ]
              }
            }
          };
        case '469ratsonPricingTrack':
          return {
            data: {
              ratson: { data: { id: '16', attributes: { pricingTrack: tracks.wish ?? null } } },
              ratsonProposals: {
                data: [{ id: '77', attributes: { pricingTrack: db.proposalTrack, status_proposal: 'suggested' } }]
              }
            }
          };
        case '471setProposalPricingTrack':
          db.proposalTrack = vars.track;
          return { data: {} };
        default:
          return { data: {} };
      }
    })
  };
  return { db, strapi, notifier: { notify: vi.fn(async () => ({})) } };
}

type W = ReturnType<typeof world>;
const ctx = (userId: string) => ({ userId, jwt: 'jwt', fetch: (() => {}) as any }) as any;
const run = (w: W, p: Record<string, unknown>) =>
  counter(
    { proposalId: '77', ratsonId: '16', note: 'מחיר סגור מתאים לי יותר כאן', ...p },
    ctx(PROVIDER),
    { strapi: w.strapi, notifier: w.notifier } as any
  );

describe('counterRatsonProposal — the pricing track', () => {
  beforeEach(() => {
    flag.on = true;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('takes a counter that changes only the track, and puts it on the proposal', async () => {
    const w = world({ wish: 'atCost' });
    const out: any = await run(w, { pricingTrack: 'fixed' });
    expect(out.success).toBe(true);
    expect(w.db.proposalTrack).toBe('fixed');
  });

  it('a provider may offer a track on a wish that left it open', async () => {
    const w = world({ wish: null });
    await run(w, { pricingTrack: 'atCost' });
    expect(w.db.proposalTrack).toBe('atCost');
  });

  it('refuses the same track with the same numbers — nothing changed', async () => {
    const w = world({ wish: 'atCost', proposal: 'fixed' });
    await expect(run(w, { pricingTrack: 'fixed' })).rejects.toThrow(/A counter has to change/);
    expect(w.db.calls).not.toContain('471setProposalPricingTrack');
  });

  it('refuses a value that is not a track', async () => {
    const w = world();
    await expect(run(w, { pricingTrack: 'help' })).rejects.toThrow(/atCost or fixed/);
  });

  it('while the switch is off, neither reads nor writes a track', async () => {
    flag.on = false;
    const w = world({ wish: 'atCost' });
    await run(w, { price: 500 });
    expect(w.db.calls).not.toContain('469ratsonPricingTrack');
    expect(w.db.calls).not.toContain('471setProposalPricingTrack');
  });
});
