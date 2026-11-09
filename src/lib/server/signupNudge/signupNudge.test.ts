import { describe, expect, it, vi } from 'vitest';
import { buildNudgeMail } from './mail';
import { runSignupNudge, type Run } from './cron';
import { mintLink, openLink } from './token';
import { normalizeLang, normalizeSource } from './source';

const KEY = Buffer.alloc(32, 7);
const NOW = Date.parse('2026-11-09T12:00:00Z');

describe('signed links', () => {
  it('opens a live link of its own purpose', () => {
    expect(openLink(mintLink('838', 'continue', NOW, KEY), 'continue', NOW, KEY)).toBe('838');
  });

  it('never opens a signup with a removal link', () => {
    expect(openLink(mintLink('838', 'stop', NOW, KEY), 'continue', NOW, KEY)).toBeNull();
  });

  it('refuses a changed id, a foreign key and an expired link', () => {
    const token = mintLink('838', 'continue', NOW, KEY);
    expect(openLink(token.replace('838', '839'), 'continue', NOW, KEY)).toBeNull();
    expect(openLink(token, 'continue', NOW, Buffer.alloc(32, 8))).toBeNull();
    expect(openLink(token, 'continue', NOW + 31 * 864e5, KEY)).toBeNull();
  });

  it.each([[undefined], [''], ['1.2'], ['a.b.c']])('refuses %s', (bad) => {
    expect(openLink(bad, 'continue', NOW, KEY)).toBeNull();
  });
});

describe('source and language', () => {
  it('accepts only the known values', () => {
    expect(normalizeSource('main')).toBe('main');
    expect(normalizeSource('admin')).toBeNull();
    expect(normalizeLang('ru')).toBe('ru');
    expect(normalizeLang('ja')).toBeNull();
  });
});

describe('the mail', () => {
  const input = { name: '<b>Noa</b>', continueUrl: 'https://x/c', stopUrl: 'https://x/s' };

  it('falls back to Hebrew, right to left', () => {
    const m = buildNudgeMail({ ...input, lang: null });
    expect(m.subject).toBe('תודה שהסכמת על האמנה');
    expect(m.html).toContain('dir="rtl"');
  });

  it('escapes the name and carries both links', () => {
    const m = buildNudgeMail({ ...input, lang: 'en' });
    expect(m.html).not.toContain('<b>Noa');
    expect(m.html).toContain('https://x/c');
    expect(m.html).toContain('https://x/s');
    expect(m.text).toContain('https://x/s');
  });
});

describe('runSignupNudge', () => {
  const row = (id: string) => ({ id, attributes: { name: 'Noa', email: `${id}@b.co`, signupLang: 'en' } });
  const mint = ((id: string, purpose: string) => `${purpose}-${id}`) as typeof mintLink;

  function fixtures(rows: unknown[], over: Partial<Record<string, (v: any) => unknown>> = {}) {
    const calls: string[] = [];
    const run: Run = async (qid, vars) => {
      calls.push(qid);
      if (over[qid]) return over[qid]!(vars);
      if (qid === 'chezinsAwaitingNudge') return { data: { chezins: { data: rows } } };
      if (qid === 'chezinEmailHasAccount') return { data: { usersPermissionsUsers: { data: [] } } };
      if (qid === 'chezinClaimNudge') return { data: { updateChezin: { data: { id: vars.id } } } };
      return {};
    };
    const send = vi.fn(async () => ({ ok: true }));
    return { run, send, calls };
  }
  const go = (f: ReturnType<typeof fixtures>, dry = false) =>
    runSignupNudge({ run: f.run, send: f.send, origin: 'https://www', dry, now: new Date(NOW), mint });

  it('claims first, then mails with both signed links', async () => {
    const f = fixtures([row('838')]);
    const report = await go(f);
    expect(report.sent).toBe(1);
    expect(f.calls.indexOf('chezinClaimNudge')).toBeGreaterThan(-1);
    const [to, mail] = f.send.mock.calls[0] as unknown as [string, { html: string }];
    expect(to).toBe('838@b.co');
    expect(mail.html).toContain('/signup?c=continue-838');
    expect(mail.html).toContain('/signup/stop-mail?t=stop-838');
  });

  it('a dry run lists ids and neither claims nor mails', async () => {
    const f = fixtures([row('838')]);
    const report = await go(f, true);
    expect(report.wouldSend).toEqual(['838']);
    expect(f.calls).not.toContain('chezinClaimNudge');
    expect(f.send).not.toHaveBeenCalled();
  });

  it('does not mail an address that already has an account, and claims it', async () => {
    const f = fixtures([row('838')], {
      chezinEmailHasAccount: () => ({ data: { usersPermissionsUsers: { data: [{ id: '5' }] } } })
    });
    const report = await go(f);
    expect(report.hasAccount).toBe(1);
    expect(f.calls).toContain('chezinClaimNudge');
    expect(f.send).not.toHaveBeenCalled();
  });

  it('sends nothing when the claim fails or the account check is unsure', async () => {
    const noClaim = fixtures([row('838')], { chezinClaimNudge: () => ({ errors: [{}] }) });
    expect((await go(noClaim)).failed).toBe(1);
    expect(noClaim.send).not.toHaveBeenCalled();

    const unsure = fixtures([row('838')], { chezinEmailHasAccount: () => ({ errors: [{}] }) });
    expect((await go(unsure)).failed).toBe(1);
    expect(unsure.send).not.toHaveBeenCalled();
  });

  it('stands down on a Strapi without the fields', async () => {
    const f = fixtures([], { chezinsAwaitingNudge: () => ({ errors: [{ message: 'unknown field' }] }) });
    expect((await go(f)).skipped).toBe(true);
  });

  it('asks only for the agreed window', async () => {
    const seen: Record<string, unknown>[] = [];
    const f = fixtures([], { chezinsAwaitingNudge: (v) => (seen.push(v), { data: { chezins: { data: [] } } }) });
    await go(f);
    expect(seen[0].before).toBe('2026-11-09T11:00:00.000Z');
    expect(seen[0].after).toBe('2026-10-26T12:00:00.000Z');
  });
});
