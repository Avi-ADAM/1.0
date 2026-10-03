import { describe, expect, it, vi } from 'vitest';
import { hideRatsonProposalConfig } from './hideRatsonProposal';
import type { ActionExecutionHandler } from '../types';

/**
 * QA_CONCIERGE_E2E C-10 — "hide" instead of "reject". A first-contact proposal can be
 * hidden from the wisher's own views (nothing is decided, the provider is not told); one
 * that is being negotiated cannot — there the answer is a counter, never a flat no.
 */

const OWNER = '10';
const PROVIDER = '20';
const run = hideRatsonProposalConfig.graphqlOperation as ActionExecutionHandler;

const counter = {
  user: { data: { id: PROVIDER } },
  agree: false,
  note: 'השולחן דורש שעתיים נוספות',
  submittedAt: '2026-10-02T09:00:00.000Z',
  willingHours: 6,
  willingAmount: 680
};

function world(proposal: Record<string, unknown> = {}, opts: { writeFails?: boolean } = {}) {
  const calls: { qid: string; vars: any }[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      if (qid === '105queryRatsonWithProposals') {
        return {
          data: {
            ratson: { data: { id: '16', attributes: { users_permissions_users: { data: [{ id: OWNER }] } } } },
            ratsonProposals: {
              data: [
                {
                  id: '77',
                  attributes: {
                    kind: 'existing_project',
                    status_proposal: 'suggested',
                    createdAt: '2026-10-01T10:00:00.000Z',
                    proposer_users: { data: [{ id: PROVIDER }] },
                    covered_missions: [{ extracted_mission_idx: '55', hours: 4, price: 600 }],
                    covered_resources: [],
                    ratson_willingness_entry: [],
                    matanot: { data: null },
                    project: { data: null },
                    open_mission: { data: null },
                    ...proposal
                  }
                }
              ]
            }
          }
        };
      }
      if (qid === '393hideRatsonProposal') {
        return opts.writeFails ? { errors: [{ message: 'Unknown field hidden_by_wisher' }] } : { data: {} };
      }
      return { data: {} };
    })
  };
  return { calls, strapi };
}

const go = (w: ReturnType<typeof world>, userId = OWNER) =>
  run({ proposalId: '77', ratsonId: '16' }, { userId, jwt: 'jwt', fetch: (() => {}) as any } as any, { strapi: w.strapi } as any);

const hid = (w: ReturnType<typeof world>) => w.calls.some((c) => c.qid === '393hideRatsonProposal');

describe('hideRatsonProposal — hide, not reject', () => {
  it('hides a first-contact proposal and decides nothing: only the flag is written', async () => {
    const w = world();
    const out: any = await go(w);
    expect(out.data).toEqual({ proposalId: '77', ratsonId: '16', hidden: true });
    expect(w.calls.find((c) => c.qid === '393hideRatsonProposal')!.vars).toEqual({ id: '77', hidden: true });
    // no status change, no "rejected" — the provider is told nothing
    expect(w.calls.some((c) => c.qid === '102updateRatsonProposal')).toBe(false);
  });

  it('hides a volunteer’s offer nobody has answered', async () => {
    const w = world({ kind: 'custom_offer', open_mission: { data: { id: '9' } } });
    await go(w);
    expect(hid(w)).toBe(true);
  });

  it('hides what is already closed — it is only clutter now', async () => {
    for (const status of ['rejected', 'expired']) {
      const w = world({ status_proposal: status });
      await go(w);
      expect(hid(w), status).toBe(true);
    }
  });

  it('will not hide a proposal being negotiated — the answer to terms you cannot take is a counter', async () => {
    const w = world({ ratson_willingness_entry: [counter] });
    await expect(go(w)).rejects.toThrow(/being negotiated/);
    expect(hid(w)).toBe(false);
  });

  it('will not hide an accepted proposal — a placement stands', async () => {
    const w = world({ status_proposal: 'accepted' });
    await expect(go(w)).rejects.toThrow(/cannot be hidden/);
    expect(hid(w)).toBe(false);
  });

  it('is the wish owner’s alone', async () => {
    const w = world();
    await expect(go(w, PROVIDER)).rejects.toThrow(/owner/);
    await expect(go(w, '99')).rejects.toThrow(/owner/);
    expect(hid(w)).toBe(false);
  });

  it('says so when it could not be saved (1.0b not deployed) — never pretends it hid it', async () => {
    const w = world({}, { writeFails: true });
    await expect(go(w)).rejects.toThrow(/Could not hide/);
  });
});
