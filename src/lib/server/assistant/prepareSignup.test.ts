import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
  env: { OAUTH_SECRET: 'test-secret-that-is-definitely-long-enough-0123456789' }
}));

import { prepareSignup, MAX_PUBLIC_ROWS } from './prepareSignup.js';
import { openSignupToken } from './signupToken.js';
import { loadByShareKey } from './session.js';

function fakeStrapi() {
  const rows = new Map<string, any>();
  let n = 0;
  const calls: string[] = [];
  return {
    rows,
    calls,
    async execute(qid: string, vars: any) {
      calls.push(qid);
      if (qid === '363createAssistantSession') {
        const id = String(++n);
        rows.set(id, { ...vars.data });
        return { data: { createAssistantSession: { data: { id, attributes: { ...vars.data, user: { data: null } } } } } };
      }
      if (qid === '364getAssistantSession') {
        const a = rows.get(vars.id);
        return { data: { assistantSession: { data: a ? { id: vars.id, attributes: a } : null } } };
      }
      if (qid === '365updateAssistantSession') {
        rows.set(vars.id, { ...rows.get(vars.id), ...vars.data });
        return { data: { updateAssistantSession: { data: { id: vars.id, attributes: rows.get(vars.id) } } } };
      }
      throw new Error('unexpected ' + qid);
    }
  };
}

const now = new Date('2026-09-25T10:00:00Z');

describe('prepareSignup', () => {
  it('saves a pending, ownerless session and returns one signup link (and a preview for a drafted rikma)', async () => {
    const strapi = fakeStrapi();
    const r = await prepareSignup(
      {
        name: 'דנה',
        email: 'Dana@X.co',
        countries: ['Israel', 'Narnia'],
        intent: 'business',
        blueprint: { fields: { track: 'business', name: 'השקד' }, products: [{ name: 'סדנה', price: 180 }] }
      },
      { strapi, now }
    );

    const row = strapi.rows.get('1');
    expect(row).toMatchObject({ kind: 'rikma', status: 'pending', startedVia: 'agent', claimEmail: 'dana@x.co' });
    expect(row.user).toBeUndefined();
    expect(row.claimExpiresAt).toBe('2026-10-09T10:00:00.000Z');
    expect(row.state.items.map((i: any) => i.label)).toEqual(['סדנה']);
    expect(row.shareKey).toBeNull();
    expect(row.shareExpiresAt).toBe('2026-10-25T10:00:00.000Z');

    // The preview link opens this very row — loaded by id, held to its signature.
    expect(r.previewUrl).toMatch(/^https:\/\/www\.1lev1\.com\/preview\/rikma\/1\.[A-Za-z0-9_-]{43}$/);
    const found = await loadByShareKey(strapi, r.previewUrl!.split('/').pop()!, now);
    expect(found?.id).toBe('1');
    const token = r.signupUrl.replace('https://www.1lev1.com/hascama?agent=', '');
    expect(openSignupToken(token, now.getTime())).toMatchObject({
      sid: '1',
      name: 'דנה',
      email: 'dana@x.co',
      countryIds: [104],
      intent: 'business'
    });
  });

  it('an order keeps the words for the wish; join keeps the about text; neither has a preview', async () => {
    const strapi = fakeStrapi();
    const order = await prepareSignup({ name: 'a', email: 'a@b.co', intent: 'order', wishText: 'עוגת יום הולדת ל-20' }, { strapi, now });
    expect(strapi.rows.get('1')).toMatchObject({ kind: 'wish', sourceText: 'עוגת יום הולדת ל-20' });
    expect(order.previewUrl).toBeUndefined();
    await prepareSignup({ name: 'a', email: 'a@b.co', intent: 'join', aboutText: 'מעצבת UX' }, { strapi, now });
    expect(strapi.rows.get('2')).toMatchObject({ kind: 'profile', sourceText: 'מעצבת UX' });
  });

  it('refuses a bad email, a bad blueprint, and more rows than a public call may carry', async () => {
    const strapi = fakeStrapi();
    await expect(prepareSignup({ name: 'a', email: 'nope', intent: 'join' }, { strapi, now })).rejects.toThrow(/email/);
    await expect(
      prepareSignup({ name: 'a', email: 'a@b.co', intent: 'idea', blueprint: { fields: { track: 'x' } } }, { strapi, now })
    ).rejects.toThrow(/blueprint/);
    const many = Array.from({ length: 30 }, (_, i) => ({ name: `p${i}` }));
    await expect(
      prepareSignup(
        { name: 'a', email: 'a@b.co', intent: 'idea', blueprint: { fields: { track: 'idea', name: 'x' }, products: many, missions: many, resources: [{ name: 'r' }] } },
        { strapi, now }
      )
    ).rejects.toThrow(String(MAX_PUBLIC_ROWS));
    expect(strapi.calls).toEqual([]);
  });
});
