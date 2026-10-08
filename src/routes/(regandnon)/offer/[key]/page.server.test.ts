import { describe, expect, it, vi } from 'vitest';

/**
 * /offer/<key> (PLAN_DIRECT_OFFER P4): a view behind a signature. A bad link reads the
 * same as no offer at all, and the provider's own notes never reach the page.
 */

const SECRET = Buffer.alloc(32, 9);
vi.mock('$lib/server/oauth/secret.js', async () => {
  const real: any = await vi.importActual('$lib/server/oauth/secret.js');
  return { ...real, directOfferLinkKey: () => SECRET, directOfferEmailKey: () => SECRET };
});

const reads: any[] = [];
let answer: any = null;
vi.mock('$lib/server/sendViaProxy.js', () => ({
  sendViaProxy: vi.fn(async (_f: unknown, qid: string, vars: unknown, opts: unknown) => {
    reads.push({ qid, vars, opts });
    if (answer instanceof Error) throw answer;
    return answer;
  })
}));
vi.mock('$lib/server/actionViaProxy.js', () => ({ actionViaProxy: vi.fn() }));

const { load } = await import('./+page.server');
const { mintOfferKey } = await import('$lib/server/offer/offerKey');

const LINK_AT = '2026-10-07T08:00:00.000Z';
const offer = (over: Record<string, unknown> = {}) => ({
  ratson: {
    data: {
      id: '40',
      attributes: {
        name: 'אתר לסטודיו',
        longDes: '<p>אתר תדמית</p>',
        isOnline: true,
        status_ratson: 'draft',
        offer_recipient_hint: 'דנה — לקוחה קשה, לא לתת הנחה',
        offer_email_lock: 'e1:secret',
        offer_link_at: LINK_AT,
        claimed_at: null,
        offered_by: { data: { id: '256', attributes: { username: 'ברוך' } } },
        users_permissions_users: { data: [] },
        derivedComplexMatanot: { data: { id: '9', attributes: { matanot_recipe_missions: { data: [{ id: '55', attributes: { notes: 'עיצוב', hoursPerUnit: 10, ratePerHour: 120 } }] } } } },
        ...over
      }
    }
  }
});

const run = (key: string, uid: string | false = false) =>
  load({ params: { key }, locals: { uid } as any, fetch: (() => {}) as any } as any) as Promise<any>;

describe('/offer/[key] load', () => {
  it('an open offer: what she needs to decide — and none of the provider’s notes', async () => {
    answer = offer();
    const out = await run(mintOfferKey('40', LINK_AT));
    expect(out.state).toBe('open');
    expect(out.offer).toMatchObject({ name: 'אתר לסטודיו', total: 1200, provider: { id: '256', name: 'ברוך' } });
    expect(out.emailLocked).toBe(true);
    const shown = JSON.stringify(out);
    expect(shown).not.toContain('לקוחה קשה');
    expect(shown).not.toContain('e1:secret');
    expect(reads.at(-1)).toMatchObject({ qid: '433directOfferById', vars: { id: '40' }, opts: { isSer: true } });
  });

  it('a forged, old or revoked link reads like no offer at all', async () => {
    answer = offer();
    expect((await run('40.' + 'A'.repeat(43))).state).toBe('invalid');
    expect((await run(mintOfferKey('40', '2026-10-01T00:00:00.000Z'))).state).toBe('invalid');
    answer = offer({ offer_link_at: null });
    expect((await run(mintOfferKey('40', LINK_AT))).state).toBe('invalid');
    // a key that names no wish is not even looked up
    const before = reads.length;
    expect((await run('not-a-key')).state).toBe('invalid');
    expect(reads.length).toBe(before);
  });

  it('the one who took it goes to her wish; anyone else learns only that it is taken', async () => {
    answer = offer({ claimed_at: '2026-10-07T10:00:00.000Z', users_permissions_users: { data: [{ id: '261' }] } });
    await expect(run(mintOfferKey('40', LINK_AT), '261')).rejects.toMatchObject({ status: 303, location: '/concierge/40' });
    const other = await run(mintOfferKey('40', LINK_AT), '300');
    expect(other.state).toBe('taken');
    expect(other.offer).toBeUndefined();
  });

  it('the provider sees it as she will — and is told it is theirs', async () => {
    answer = offer();
    const out = await run(mintOfferKey('40', LINK_AT), '256');
    expect(out).toMatchObject({ state: 'open', own: true, signedIn: true });
  });

  it('a failed read is said, not a crash', async () => {
    answer = new Error('network');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await run(mintOfferKey('40', LINK_AT))).state).toBe('unavailable');
  });
});
