import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
  env: { OAUTH_SECRET: 'test-secret-that-is-definitely-long-enough-0123456789' }
}));

import { prepareSignup } from './prepareSignup.js';
import { maskEmail, receivePreparedRikma } from './receive.js';
import { HANDOFF_TOKEN_TTL_MS } from './signupToken.js';

/** Sessions plus three accounts: 9 is Dana (the recipient), 7 the marketer, 8 someone else. */
function fakeStrapi() {
  const rows = new Map<string, any>();
  const emails: Record<string, string> = { '9': 'Dana@x.co', '7': 'marketer@y.co', '8': 'other@z.co' };
  let n = 0;
  return {
    rows,
    async execute(qid: string, vars: any) {
      if (qid === '363createAssistantSession') {
        const id = String(++n);
        rows.set(id, { ...vars.data });
        return { data: { createAssistantSession: { data: { id, attributes: { ...vars.data, user: { data: null } } } } } };
      }
      if (qid === '364getAssistantSession') {
        const a = rows.get(vars.id);
        const user = a?.user ? { data: { id: String(a.user) } } : { data: null };
        return { data: { assistantSession: { data: a ? { id: vars.id, attributes: { ...a, user } } : null } } };
      }
      if (qid === '365updateAssistantSession') {
        rows.set(vars.id, { ...rows.get(vars.id), ...vars.data });
        const a = rows.get(vars.id);
        const user = a?.user ? { data: { id: String(a.user) } } : { data: null };
        return { data: { updateAssistantSession: { data: { id: vars.id, attributes: { ...a, user } } } } };
      }
      if (qid === '436accountEmail') {
        return { data: { usersPermissionsUser: { data: { id: vars.id, attributes: { email: emails[vars.id] } } } } };
      }
      throw new Error('unexpected ' + qid);
    }
  };
}

const now = new Date('2026-10-12T10:00:00Z');
const blueprint = { fields: { track: 'business', name: 'השקד' }, products: [{ name: 'סדנה', price: 180 }] };

async function prepared(strapi: ReturnType<typeof fakeStrapi>) {
  const r = await prepareSignup(
    { name: 'דנה', email: 'dana@x.co', intent: 'business', blueprint },
    { strapi, now },
    { tokenTtlMs: HANDOFF_TOKEN_TTL_MS, receive: true }
  );
  expect(r.signupUrl).toBeUndefined();
  expect(r.receiveUrl).toMatch(/^https:\/\/www\.1lev1\.com\/assistant\/receive\/[\w-]+\.[\w-]+\.[\w-]+$/);
  expect(r.expiresAt).toBe('2026-10-26T10:00:00.000Z');
  return r.receiveUrl!.split('/').pop()!;
}

describe('a rikma prepared for someone who already has an account', () => {
  it('hands the draft to the account with that email, and only once', async () => {
    const strapi = fakeStrapi();
    const t = await prepared(strapi);

    const r = await receivePreparedRikma(t, '9', { strapi, now });
    expect(r).toEqual({ ok: true, sessionId: '1', landing: '/moach/import/1' });
    expect(strapi.rows.get('1')).toMatchObject({ user: '9', status: 'active' });

    // Opened again by the same person: straight back to the review screen.
    expect(await receivePreparedRikma(t, '9', { strapi, now })).toMatchObject({ ok: true, landing: '/moach/import/1' });
    // Forwarded on afterwards: nothing left to take.
    expect(await receivePreparedRikma(t, '8', { strapi, now })).toEqual({ ok: false, reason: 'taken' });
  });

  it('gives nothing to another account - not the one who prepared it either', async () => {
    const strapi = fakeStrapi();
    const t = await prepared(strapi);
    for (const uid of ['7', '8']) {
      expect(await receivePreparedRikma(t, uid, { strapi, now })).toEqual({ ok: false, reason: 'otherAccount', email: 'd***@x.co' });
    }
    expect(strapi.rows.get('1')).toMatchObject({ status: 'pending' });
    expect(strapi.rows.get('1').user).toBeUndefined();
  });

  it('lives 14 days, and a broken link is just "expired"', async () => {
    const strapi = fakeStrapi();
    const t = await prepared(strapi);
    const later = new Date(now.getTime() + HANDOFF_TOKEN_TTL_MS);
    expect(await receivePreparedRikma(t, '9', { strapi, now: later })).toEqual({ ok: false, reason: 'expired' });
    expect(await receivePreparedRikma('nope', '9', { strapi, now })).toEqual({ ok: false, reason: 'expired' });
  });

  it('is only for a drafted rikma', async () => {
    const strapi = fakeStrapi();
    await expect(
      prepareSignup({ name: 'דנה', email: 'dana@x.co', intent: 'order', wishText: 'עוגה' }, { strapi, now }, { receive: true })
    ).rejects.toThrow(/Only a drafted rikma/);
    await expect(
      prepareSignup({ name: 'דנה', email: 'dana@x.co', intent: 'business' }, { strapi, now }, { receive: true })
    ).rejects.toThrow(/Only a drafted rikma/);
    expect(strapi.rows.size).toBe(0);
  });

  it('masks an address to its first letter and domain', () => {
    expect(maskEmail('dana@x.co')).toBe('d***@x.co');
    expect(maskEmail('broken')).toBe('***');
  });
});
