import { describe, expect, it } from 'vitest';
import { checkSignupRecipient, mailboxOf } from './signupRecipient';

function strapiWith(own: string | null, existing: { id: string }[] | null, opts: { throws?: boolean } = {}) {
  const calls: { qid: string; vars: Record<string, any> }[] = [];
  return {
    calls,
    strapi: {
      execute: async (qid: string, vars: Record<string, any>) => {
        calls.push({ qid, vars });
        if (opts.throws) throw new Error('down');
        if (qid === '436accountEmail') {
          return { data: { usersPermissionsUser: { data: own ? { id: vars.id, attributes: { email: own } } : null } } };
        }
        if (qid === '171findUserByExact') {
          return { data: { usersPermissionsUsers: existing === null ? null : { data: existing } } };
        }
        throw new Error(`unexpected ${qid}`);
      }
    }
  };
}

describe('mailboxOf', () => {
  it('lower-cases and drops a +tag', () => {
    expect(mailboxOf(' Dana+Shop@Gmail.com ')).toBe('dana@gmail.com');
    expect(mailboxOf('dana@x.co')).toBe('dana@x.co');
  });
});

describe('checkSignupRecipient', () => {
  it('lets a new person through', async () => {
    const s = strapiWith('marketer@x.co', []);
    expect(await checkSignupRecipient('customer@y.co', '7', { strapi: s.strapi })).toEqual({ ok: true, hasAccount: false });
    expect(s.calls.map((c) => c.qid)).toEqual(['436accountEmail', '171findUserByExact']);
  });

  it("refuses the caller's own email, even with a different case or a +tag", async () => {
    for (const email of ['marketer@x.co', 'Marketer@X.co', 'marketer+biz@x.co']) {
      const r = await checkSignupRecipient(email, '7', { strapi: strapiWith('marketer@x.co', []).strapi });
      expect(r, email).toMatchObject({ ok: false, reason: 'self' });
    }
  });

  it('lets another member through, marked as having an account', async () => {
    const r = await checkSignupRecipient('customer@y.co', '7', { strapi: strapiWith('marketer@x.co', [{ id: '9' }]).strapi });
    expect(r).toEqual({ ok: true, hasAccount: true });
  });

  it('reads an account found under the email that is the caller as self', async () => {
    const r = await checkSignupRecipient('alias@x.co', '7', { strapi: strapiWith('marketer@x.co', [{ id: '7' }]).strapi });
    expect(r).toMatchObject({ ok: false, reason: 'self' });
  });

  it('refuses when it cannot check - never lets the call through blind', async () => {
    expect(await checkSignupRecipient('c@y.co', '7', { strapi: strapiWith(null, []).strapi })).toMatchObject({ ok: false, reason: 'unverified' });
    expect(await checkSignupRecipient('c@y.co', '7', { strapi: strapiWith('m@x.co', null).strapi })).toMatchObject({ ok: false, reason: 'unverified' });
    expect(await checkSignupRecipient('c@y.co', '7', { strapi: strapiWith('m@x.co', [], { throws: true }).strapi })).toMatchObject({ ok: false, reason: 'unverified' });
  });
});
