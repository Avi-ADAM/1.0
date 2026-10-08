import { beforeEach, describe, expect, it, vi } from 'vitest';
import { termsPatch, updateWishTermsConfig } from './updateWishTerms';
import { termsDigest } from '$lib/server/wish/termsDigest';
import type { ActionExecutionHandler } from '../types';

/**
 * PLAN_DIRECT_OFFER §4.3 (decision 4) — changing a published wish's terms is part of
 * the negotiation: whoever signed under the old terms is asked again, as after a counter.
 */

const OWNER = '10';
const PROVIDER = '20';
const run = updateWishTermsConfig.graphqlOperation as ActionExecutionHandler;
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

const WISH = {
  name: 'אתר לסטודיו',
  desc: 'אתר לסטודיו',
  longDes: 'אתר תדמית עם גלריה',
  startDate: '2026-11-01T00:00:00.000Z',
  finnishDate: '2026-12-01T00:00:00.000Z',
  isOnline: true,
  lat: null,
  lng: null,
  radius: null,
  location_hint: null,
  location: []
};
const OLD = termsDigest(WISH);

function world(opts: { status?: string; stored?: string | null } = {}) {
  const calls: { qid: string; vars: any; jwt: unknown }[] = [];
  const entry = (user: string, agree: boolean, h: number, digest: string | null = OLD) => ({
    user: { data: { id: user } },
    agree,
    note: agree ? '' : 'השולחן דורש שעתיים נוספות',
    submittedAt: hoursAgo(h),
    willingHours: 6,
    willingAmount: 680,
    ...(digest ? { termsDigest: digest } : {})
  });
  const proposal = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    attributes: {
      kind: 'existing_project',
      status_proposal: 'suggested',
      createdAt: hoursAgo(300),
      proposer_users: { data: [{ id: PROVIDER }] },
      covered_missions: [{ extracted_mission_idx: '55', hours: 6, price: 680 }],
      covered_resources: [],
      matanot: { data: null },
      project: { data: null },
      open_mission: { data: null },
      ...over
    }
  });
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any, jwt?: unknown) => {
      calls.push({ qid, vars, jwt });
      if (qid === '105queryRatsonWithProposals') {
        return {
          data: {
            ratson: {
              data: {
                id: '16',
                attributes: {
                  ...WISH,
                  status_ratson: opts.status ?? 'open',
                  terms_digest: opts.stored === undefined ? null : opts.stored,
                  chat_forum: { data: { id: '77' } },
                  users_permissions_users: { data: [{ id: OWNER }] }
                }
              }
            },
            ratsonProposals: {
              data: [
                // the provider countered, the wisher approved nothing yet: they are talking
                proposal('1', { ratson_willingness_entry: [entry(PROVIDER, false, 24)] }),
                // the provider signed at first contact (approved the slot she authored)
                proposal('2', { ratson_willingness_entry: [entry(PROVIDER, true, 5)] }),
                // signed before the digests existed: never stale
                proposal('3', { ratson_willingness_entry: [entry(PROVIDER, false, 24, null)] }),
                // closed
                proposal('4', { status_proposal: 'accepted', ratson_willingness_entry: [entry(PROVIDER, true, 5)] }),
                // a product proposal: priced by quote elsewhere
                proposal('5', { matanot: { data: { id: '9' } }, ratson_willingness_entry: [entry(PROVIDER, true, 5)] })
              ]
            }
          }
        };
      }
      return { data: {} };
    })
  };
  return { calls, strapi };
}

const go = (w: ReturnType<typeof world>, params: Record<string, unknown>, userId = OWNER) =>
  run({ ratsonId: '16', ...params }, { userId, jwt: 'jwt', fetch: (() => {}) as any } as any, { strapi: w.strapi } as any);

describe('updateWishTerms — a new date is a new version', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('writes the terms and their digest, as the owner', async () => {
    const w = world();
    const out: any = await go(w, { finnishDate: '2026-12-15T00:00:00.000Z' });
    const write = w.calls.find((c) => c.qid === '431updateWishTerms')!;
    expect(write.jwt).toBe('jwt');
    expect(write.vars).toEqual({
      id: '16',
      data: { finnishDate: '2026-12-15T00:00:00.000Z', terms_digest: termsDigest({ ...WISH, finnishDate: '2026-12-15T00:00:00.000Z' }) }
    });
    expect(out.data).toMatchObject({ changed: true, termsDigest: write.vars.data.terms_digest });
  });

  it('reopens every open, negotiated proposal signed under the old terms — and only those', async () => {
    const w = world();
    const out: any = await go(w, { finnishDate: '2026-12-15T00:00:00.000Z' });
    expect(out.data.reopened).toBe(2); // 1 and 2; not 3 (no digest), 4 (closed), 5 (a product)
  });

  it('restarts the clock only where the two sides were already talking', async () => {
    const w = world();
    await go(w, { finnishDate: '2026-12-15T00:00:00.000Z' });
    const armed = w.calls.filter((c) => c.qid === '390createTimegramaForRatsonProposal').map((c) => c.vars.ratson_proposal);
    expect(armed).toEqual(['1']); // 2 is first contact: silence binds nobody yet
  });

  it('says so in the wish chat', async () => {
    const w = world();
    await go(w, { longDes: 'אתר תדמית עם גלריה ובלוג' });
    const msg = w.calls.find((c) => c.qid === '1chatsend');
    expect(msg?.vars).toMatchObject({ fid: '77', idL: OWNER });
  });

  it('an edit the terms do not see reopens nothing', async () => {
    const w = world();
    const out: any = await go(w, { longDes: '  אתר תדמית   עם גלריה ' });
    expect(out.data).toMatchObject({ changed: false, reopened: 0 });
    expect(w.calls.some((c) => c.qid === '390createTimegramaForRatsonProposal' || c.qid === '1chatsend')).toBe(false);
    expect(w.calls.some((c) => c.qid === '431updateWishTerms')).toBe(true); // the text itself is still saved
  });

  it('a second edit compares against the stored digest', async () => {
    const stored = termsDigest({ ...WISH, finnishDate: '2026-12-15T00:00:00.000Z' });
    const w = world({ stored });
    const out: any = await go(w, { finnishDate: '2026-12-15T00:00:00.000Z' });
    expect(out.data.changed).toBe(false);
  });

  it('is the owner’s alone, on a published wish that is still open', async () => {
    await expect(go(world(), { name: 'x' }, PROVIDER)).rejects.toThrow(/owner/);
    await expect(go(world({ status: 'draft' }), { name: 'x' })).rejects.toThrow(/composer/);
    await expect(go(world({ status: 'fulfilled' }), { name: 'x' })).rejects.toThrow(/closed/);
    await expect(go(world(), {})).rejects.toThrow(/Nothing to change/);
  });
});

describe('termsPatch', () => {
  it('keeps what was not sent, clears what was sent empty, and refuses an empty name', () => {
    expect(termsPatch({ startDate: '', isOnline: false, lat: 'x', location_hint: '' })).toEqual({
      startDate: null,
      isOnline: false,
      lat: null,
      location_hint: null
    });
    expect(termsPatch({ name: ' אתר ' })).toEqual({ name: 'אתר', desc: 'אתר' });
    expect(() => termsPatch({ name: '  ' })).toThrow();
  });
});
