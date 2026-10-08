import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionExecutionHandler } from '../types';

/**
 * PLAN_DIRECT_OFFER P3–P4 — a provider writes a wish for a customer; she takes it from
 * a signed link and it becomes hers, with the provider's parts as versions she answers.
 */

// The link and the email lock with a fixed secret, so the test can mint real keys.
const SECRET = Buffer.alloc(32, 9);
vi.mock('$lib/server/oauth/secret.js', async () => {
  const real: any = await vi.importActual('$lib/server/oauth/secret.js');
  return { ...real, directOfferLinkKey: () => SECRET, directOfferEmailKey: () => SECRET };
});

const { draftDirectOfferConfig } = await import('./draftDirectOffer');
const { claimDirectOfferConfig, issueDirectOfferLinkConfig, revokeDirectOfferLinkConfig, updateDirectOfferConfig } = await import('./directOffer');
const { mintOfferKey, emailLock } = await import('$lib/server/offer/offerKey');
const { termsDigest } = await import('$lib/server/wish/termsDigest');

const PROVIDER = '256';
const CUSTOMER = '261';
const run = (cfg: { graphqlOperation: unknown }) => cfg.graphqlOperation as ActionExecutionHandler;

// ── draftDirectOffer ─────────────────────────────────────────────────────────

function draftWorld() {
  const calls: { qid: string; vars: any }[] = [];
  let n = 100;
  const created = (key: string) => ({ data: { [key]: { data: { id: String(++n) } } } });
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      switch (qid) {
        case '432createDirectOffer': return created('createRatson');
        case '91createPartof': return created('createPartof');
        case '2forumCrBasic': return created('createForum');
        case '139createWishMatanot': return created('createMatanot');
        case '137createPendmForRecipe': return created('createPendm');
        case '125createMatanotRecipeMission': return created('createMatanotRecipeMission');
        case '138createPmashForRecipe': return created('createPmash');
        case '128createMatanotRecipeResource': return created('createMatanotRecipeResource');
        case '101createRatsonProposal': return created('createRatsonProposal');
        default: return { data: {} };
      }
    })
  };
  return { calls, strapi };
}

const draft = (w: ReturnType<typeof draftWorld>, params: Record<string, unknown>) =>
  run(draftDirectOfferConfig)(params, { userId: PROVIDER, jwt: 'jwt', fetch: (() => {}) as any } as any, { strapi: w.strapi } as any);

const OFFER = {
  recipientHint: 'דנה, אתר לסטודיו',
  name: 'אתר לסטודיו',
  longDes: '<p>אתר תדמית</p>',
  startDate: '2026-11-01T00:00:00.000Z',
  isOnline: true,
  missions: [{ name: 'עיצוב', hours: 10, ratePerHour: 120 }],
  resources: [{ name: 'אחסון', quantity: 1, unitPrice: 300 }]
};

describe('draftDirectOffer', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}));

  it('writes a wish with no owner yet, the provider as its author, and the terms’ digest', async () => {
    const w = draftWorld();
    const out: any = await draft(w, { ...OFFER, recipientEmail: 'Dana@Example.com' });
    const data = w.calls.find((c) => c.qid === '432createDirectOffer')!.vars.data;
    expect(data).toMatchObject({
      name: 'אתר לסטודיו',
      status_ratson: 'draft',
      users_permissions_users: [],
      offered_by: PROVIDER,
      offer_recipient_hint: 'דנה, אתר לסטודיו',
      terms_digest: termsDigest(data),
      extracted_missions: [{ name: 'עיצוב', hoursEst: 10, importance: 'must', notes: '' }],
      extracted_resources: [{ name: 'אחסון', quantityEst: 1, importance: 'must', notes: '' }]
    });
    // the address itself is never stored
    expect(data.offer_email_lock).toBe(emailLock('dana@example.com'));
    expect(JSON.stringify(data)).not.toContain('Example.com');
    expect(out.data).toMatchObject({ total: 1500, slots: 2 });
  });

  it('each part is a BOM line named as the part, with an invitation the provider already signed', async () => {
    const w = draftWorld();
    await draft(w, OFFER);
    const digest = w.calls.find((c) => c.qid === '432createDirectOffer')!.vars.data.terms_digest;

    const line = w.calls.find((c) => c.qid === '125createMatanotRecipeMission')!.vars;
    expect(line).toMatchObject({ notes: 'עיצוב', hoursPerUnit: 10, ratePerHour: 120 });

    const proposals = w.calls.filter((c) => c.qid === '101createRatsonProposal').map((c) => c.vars);
    expect(proposals.map((p) => [p.kind, p.proposer_users])).toEqual([
      ['existing_project', [PROVIDER]],
      ['partial', [PROVIDER]]
    ]);
    expect(proposals[0].covered_missions[0]).toMatchObject({ hours: 10, price: 1200 });

    const signed = w.calls.filter((c) => c.qid === '387counterRatsonProposal').map((c) => c.vars.ratson_willingness_entry[0]);
    expect(signed).toEqual([
      expect.objectContaining({ user: PROVIDER, agree: true, willingHours: 10, willingAmount: 1200, termsDigest: digest }),
      expect.objectContaining({ user: PROVIDER, agree: true, willingHours: 1, willingAmount: 300, termsDigest: digest })
    ]);
  });

  it('links the product and the conversation to the wish', async () => {
    const w = draftWorld();
    await draft(w, OFFER);
    const link = w.calls.find((c) => c.qid === '434updateDirectOffer')!.vars.data;
    expect(Object.keys(link).sort()).toEqual(['chat_forum', 'derivedComplexMatanot', 'process']);
  });

  it('refuses before writing anything', async () => {
    for (const bad of [
      { ...OFFER, recipientHint: ' ' },
      { ...OFFER, name: '' },
      { ...OFFER, recipientEmail: 'not-an-email' },
      { ...OFFER, missions: [], resources: [] },
      { ...OFFER, missions: [{ name: 'עיצוב', hours: 0, ratePerHour: 1 }] }
    ]) {
      const w = draftWorld();
      await expect(draft(w, bad)).rejects.toThrow();
      expect(w.calls).toHaveLength(0);
    }
  });
});

// ── the link, the claim, the edits ───────────────────────────────────────────

const LINK_AT = '2026-10-07T08:00:00.000Z';

function offerWorld(over: Record<string, unknown> = {}, email = 'dana@example.com') {
  const calls: { qid: string; vars: any; jwt: unknown }[] = [];
  const attrs = {
    name: 'אתר לסטודיו',
    longDes: '<p>אתר תדמית</p>',
    isOnline: true,
    status_ratson: 'draft',
    fulfilled: false,
    terms_digest: 't1:old',
    offer_recipient_hint: 'דנה',
    offer_email_lock: null,
    offer_link_at: LINK_AT,
    offer_expires_at: null,
    claimed_at: null,
    offered_by: { data: { id: PROVIDER, attributes: { username: 'ברוך' } } },
    users_permissions_users: { data: [] },
    chat_forum: { data: { id: '77' } },
    derivedComplexMatanot: { data: { id: '9', attributes: { matanot_recipe_missions: { data: [] }, matanot_recipe_resources: { data: [] } } } },
    ...over
  };
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any, jwt?: unknown) => {
      calls.push({ qid, vars, jwt });
      if (qid === '433directOfferById') return { data: { ratson: { data: { id: '40', attributes: attrs } }, ratsonProposals: { data: [] } } };
      if (qid === '436accountEmail') return { data: { usersPermissionsUser: { data: { id: vars.id, attributes: { email } } } } };
      if (qid === '105queryRatsonWithProposals') {
        return {
          data: {
            ratson: { data: { id: '40', attributes: attrs } },
            ratsonProposals: {
              data: [{ id: '5', attributes: { ratson_willingness_entry: [{ user: { data: { id: PROVIDER } }, agree: true, willingHours: 10, willingAmount: 1200, termsDigest: 't1:old' }] } }]
            }
          }
        };
      }
      return { data: {} };
    })
  };
  const notifier = { notify: vi.fn(async () => {}) };
  return { calls, strapi, notifier };
}

const as = (w: ReturnType<typeof offerWorld>, cfg: any, params: Record<string, unknown>, userId: string) =>
  run(cfg)(params, { userId, jwt: 'jwt', fetch: (() => {}) as any } as any, { strapi: w.strapi, notifier: w.notifier } as any);

describe('the link', () => {
  it('only the provider issues it, and a new one replaces the old', async () => {
    const w = offerWorld();
    const out: any = await as(w, issueDirectOfferLinkConfig, { ratsonId: '40' }, PROVIDER);
    const at = w.calls.find((c) => c.qid === '434updateDirectOffer')!.vars.data.offer_link_at;
    expect(Date.parse(at)).toBeGreaterThan(Date.parse(LINK_AT));
    expect(out.data.path).toBe(`/offer/${mintOfferKey('40', at)}`);
    await expect(as(offerWorld(), issueDirectOfferLinkConfig, { ratsonId: '40' }, CUSTOMER)).rejects.toThrow(/provider/);
  });

  it('revoking clears it', async () => {
    const w = offerWorld();
    await as(w, revokeDirectOfferLinkConfig, { ratsonId: '40' }, PROVIDER);
    expect(w.calls.find((c) => c.qid === '434updateDirectOffer')!.vars.data).toEqual({ offer_link_at: null });
  });
});

describe('claimDirectOffer — she takes it', () => {
  const key = () => mintOfferKey('40', LINK_AT);

  it('becomes hers: owner, taken, being negotiated — and the provider is told', async () => {
    const w = offerWorld();
    const out: any = await as(w, claimDirectOfferConfig, { key: key() }, CUSTOMER);
    const write = w.calls.find((c) => c.qid === '434updateDirectOffer')!;
    expect(write.vars.data).toMatchObject({ users_permissions_users: [CUSTOMER], status_ratson: 'negotiating' });
    expect(write.vars.data.claimed_at).toBeTruthy();
    expect(out.data.path).toBe('/concierge/40');
    expect(w.calls.some((c) => c.qid === '1chatsend' && c.vars.fid === '77')).toBe(true);
    expect(w.notifier.notify).toHaveBeenCalledTimes(1);
    expect((w.notifier.notify.mock.calls[0] as any[])[2].recipientIds).toEqual([PROVIDER]);
  });

  it('a forged, old or revoked link takes nothing', async () => {
    for (const [k, over] of [
      ['40.' + 'A'.repeat(43), {}],
      [key(), { offer_link_at: '2026-10-07T09:00:00.000Z' }],
      [key(), { offer_link_at: null }],
      ['nonsense', {}]
    ] as const) {
      const w = offerWorld(over);
      await expect(as(w, claimDirectOfferConfig, { key: k }, CUSTOMER)).rejects.toThrow(/link/i);
      expect(w.calls.some((c) => c.qid === '434updateDirectOffer')).toBe(false);
    }
  });

  it('not the provider, not twice', async () => {
    await expect(as(offerWorld(), claimDirectOfferConfig, { key: key() }, PROVIDER)).rejects.toThrow(/your own/);
    const taken = offerWorld({ claimed_at: '2026-10-07T10:00:00.000Z', users_permissions_users: { data: [{ id: '300' }] } });
    await expect(as(taken, claimDirectOfferConfig, { key: key() }, CUSTOMER)).rejects.toThrow(/already taken/);
  });

  it('a locked offer is checked against the account’s real email, read by its signed id', async () => {
    const locked = { offer_email_lock: emailLock('dana@example.com') };
    const ok = offerWorld(locked, 'Dana@example.com');
    await as(ok, claimDirectOfferConfig, { key: key() }, CUSTOMER);
    const read = ok.calls.find((c) => c.qid === '436accountEmail')!;
    expect(read.vars).toEqual({ id: CUSTOMER });
    expect(read.jwt).toBeUndefined(); // the service token: nobody's cookie decides it

    const other = offerWorld(locked, 'someone@else.com');
    await expect(as(other, claimDirectOfferConfig, { key: key() }, CUSTOMER)).rejects.toThrow(/another email/);
    expect(other.calls.some((c) => c.qid === '434updateDirectOffer')).toBe(false);
  });
});

describe('updateDirectOffer — the provider’s own, until it is taken', () => {
  it('a change of terms keeps the provider’s signatures on the new terms (nobody else signed yet)', async () => {
    const w = offerWorld();
    await as(w, updateDirectOfferConfig, { ratsonId: '40', finnishDate: '2026-12-01T00:00:00.000Z' }, PROVIDER);
    const written = w.calls.find((c) => c.qid === '434updateDirectOffer')!.vars.data;
    expect(written.finnishDate).toBe('2026-12-01T00:00:00.000Z');
    const resigned = w.calls.find((c) => c.qid === '387counterRatsonProposal')!.vars.ratson_willingness_entry[0];
    expect(resigned.termsDigest).toBe(written.terms_digest);
    expect(resigned.termsDigest).not.toBe('t1:old');
  });

  it('who it is for, and the lock — set, or removed', async () => {
    const w = offerWorld();
    await as(w, updateDirectOfferConfig, { ratsonId: '40', recipientHint: 'דנה כהן', recipientEmail: '' }, PROVIDER);
    expect(w.calls.find((c) => c.qid === '434updateDirectOffer')!.vars.data).toMatchObject({ offer_recipient_hint: 'דנה כהן', offer_email_lock: null });
    expect(w.calls.some((c) => c.qid === '387counterRatsonProposal')).toBe(false);
  });

  it('nobody else, and not after she took it', async () => {
    await expect(as(offerWorld(), updateDirectOfferConfig, { ratsonId: '40', name: 'x' }, CUSTOMER)).rejects.toThrow(/provider/);
    const taken = offerWorld({ claimed_at: '2026-10-07T10:00:00.000Z' });
    await expect(as(taken, updateDirectOfferConfig, { ratsonId: '40', name: 'x' }, PROVIDER)).rejects.toThrow(/taken/);
  });
});
