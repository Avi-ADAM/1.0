import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
  env: { OAUTH_SECRET: 'test-secret-that-is-definitely-long-enough-0123456789' }
}));

import { prepareSignup, MAX_PUBLIC_ROWS } from './prepareSignup.js';
import { openStudio, saveStudioOps } from './studio.js';
import { HANDOFF_TOKEN_TTL_MS } from './signupToken.js';
import { loadByShareKey } from './session.js';
import { blueprintToRikmaView } from '$lib/assistant/rikmaView.js';

function fakeStrapi() {
  const rows = new Map<string, any>();
  let n = 0;
  return {
    rows,
    async execute(qid: string, vars: any) {
      if (qid === '363createAssistantSession') {
        const id = String(++n);
        const stored = { ...vars.data, user: { data: null }, project: { data: null }, chezin: { data: null } };
        rows.set(id, stored);
        return { data: { createAssistantSession: { data: { id, attributes: stored } } } };
      }
      if (qid === '364getAssistantSession') {
        const a = rows.get(vars.id);
        return { data: { assistantSession: { data: a ? { id: vars.id, attributes: a } : null } } };
      }
      if (qid === '365updateAssistantSession') {
        const prev = rows.get(vars.id) ?? {};
        const next = {
          ...prev,
          ...vars.data,
          user: vars.data.user ? { data: { id: String(vars.data.user) } } : prev.user,
          project: vars.data.project ? { data: { id: String(vars.data.project) } } : prev.project,
          chezin: vars.data.chezin ? { data: { id: String(vars.data.chezin) } } : prev.chezin
        };
        rows.set(vars.id, next);
        return { data: { updateAssistantSession: { data: { id: vars.id, attributes: next } } } };
      }
      throw new Error('unexpected ' + qid);
    }
  };
}

const now = new Date('2026-10-22T10:00:00Z');

describe('behind-the-scenes studio & two-link flow', () => {
  it('returns both previewUrl (public rikma) and manageUrl (behind the scenes), and studio edits immediately update the public preview', async () => {
    const strapi = fakeStrapi();
    const prepared = await prepareSignup(
      {
        name: 'נועה',
        email: 'noa@example.com',
        intent: 'business',
        blueprint: {
          fields: { track: 'business', name: 'סטודיו קרמיקה', currency: 'ILS' },
          products: [{ name: 'סדנת אובניים', price: 240 }],
          missions: [{ name: 'הנחיית סדנה', hours: 10, ratePerHour: 150, holder: 'me' }]
        }
      },
      { strapi, now },
      { tokenTtlMs: HANDOFF_TOKEN_TTL_MS, receive: false }
    );

    expect(prepared.previewUrl).toMatch(/^https:\/\/www\.1lev1\.com\/preview\/rikma\/1\.[A-Za-z0-9_-]{43}$/);
    expect(prepared.manageUrl).toMatch(/^https:\/\/www\.1lev1\.com\/preview\/rikma\/studio\//);
    expect(prepared.signupUrl).toMatch(/^https:\/\/www\.1lev1\.com\/hascama\?agent=/);

    const token = decodeURIComponent(prepared.manageUrl!.split('/studio/')[1]);
    const opened = await openStudio(token, { strapi, now });
    expect(opened).toMatchObject({
      ok: true,
      mode: 'pending',
      recipientName: 'נועה',
      hasAccount: false,
      signedWaitingEmail: false,
      previewUrl: prepared.previewUrl
    });
    if (!opened.ok || opened.mode !== 'pending') throw new Error('expected pending');
    expect(opened.nextPath).toContain('/hascama?agent=');

    // Edit hours (+5 → 15h) and add a new mission in behind-the-scenes without logging in
    const saved = await saveStudioOps(
      token,
      opened.session.version,
      [
        { op: 'setSpec', key: 'i2', spec: { hours: 15 } },
        { op: 'add', group: 'rikmaMissions', label: 'שיווק וצילום', spec: { holder: 'open', hours: 8, ratePerHour: 120 } }
      ],
      { strapi, now }
    );
    expect(saved).toMatchObject({ ok: true, applied: 2, conflict: false, version: 2 });

    // Public preview link immediately reflects both the updated hours and the new mission
    const shareKey = prepared.previewUrl!.split('/').pop()!;
    const sharedRow = await loadByShareKey(strapi, shareKey, now);
    const view = blueprintToRikmaView(sharedRow!.state);
    expect(view.missions.map((m) => [m.label, m.hours, m.ratePerHour])).toEqual([
      ['הנחיית סדנה', 15, 150],
      ['שיווק וצילום', 8, 120]
    ]);
  });

  it('points an existing-account handoff to /assistant/receive/<token> and blocks studio writes once claimed or created', async () => {
    const strapi = fakeStrapi();
    const prepared = await prepareSignup(
      {
        name: 'יוסי',
        email: 'yossi@example.com',
        intent: 'partnership',
        blueprint: {
          fields: { track: 'partnership', name: 'קואופרטיב לחם' },
          products: [{ name: 'לחם מחמצת', price: 28 }]
        }
      },
      { strapi, now },
      { tokenTtlMs: HANDOFF_TOKEN_TTL_MS, receive: true }
    );

    const token = decodeURIComponent(prepared.manageUrl!.split('/studio/')[1]);
    const pending = await openStudio(token, { strapi, now });
    if (!pending.ok || pending.mode !== 'pending') throw new Error('expected pending');
    expect(pending.hasAccount).toBe(true);
    expect(pending.nextPath).toBe(`/assistant/receive/${encodeURIComponent(token)}`);

    // Simulate claim by user 99
    await strapi.execute('365updateAssistantSession', { id: '1', data: { user: '99', status: 'active' } });
    const afterClaim = await openStudio(token, { strapi, now });
    expect(afterClaim).toEqual({
      ok: true,
      mode: 'claimed',
      sessionId: '1',
      reviewPath: '/moach/import/1',
      previewUrl: prepared.previewUrl
    });

    const writeBlocked = await saveStudioOps(
      token,
      1,
      [{ op: 'setField', field: 'name', value: 'ניסיון שינוי חיצוני' }],
      { strapi, now }
    );
    expect(writeBlocked).toMatchObject({ ok: false, reason: 'claimed' });

    // Simulate creation into real project 501
    await strapi.execute('365updateAssistantSession', { id: '1', data: { project: '501', status: 'applied' } });
    expect(await openStudio(token, { strapi, now })).toEqual({
      ok: true,
      mode: 'created',
      projectId: '501'
    });
  });

  it('enforces version conflict detection and MAX_PUBLIC_ROWS cap in studio writes', async () => {
    const strapi = fakeStrapi();
    const prepared = await prepareSignup(
      {
        name: 'דן',
        email: 'dan@example.com',
        intent: 'idea',
        blueprint: { fields: { track: 'idea', name: 'מיזם שכונתי' } }
      },
      { strapi, now }
    );
    // Even an initially empty rikma blueprint gets both links!
    expect(prepared.previewUrl).toBeTruthy();
    expect(prepared.manageUrl).toBeTruthy();

    const token = decodeURIComponent(prepared.manageUrl!.split('/studio/')[1]);
    // Adding rows across saves up to MAX_PUBLIC_ROWS works, exceeding MAX_PUBLIC_ROWS is refused
    const firstBatch = Array.from({ length: 35 }, (_, i) => ({
      op: 'add',
      group: 'rikmaMissions',
      label: `משימה א ${i}`
    }));
    const okBatch = await saveStudioOps(token, 1, firstBatch, { strapi, now });
    expect(okBatch).toMatchObject({ ok: true, version: 2 });

    const overflowBatch = Array.from({ length: MAX_PUBLIC_ROWS - 35 + 1 }, (_, i) => ({
      op: 'add',
      group: 'rikmaMissions',
      label: `משימה ב ${i}`
    }));
    const capped = await saveStudioOps(token, 2, overflowBatch, { strapi, now });
    expect(capped).toMatchObject({ ok: false, reason: 'tooManyRows' });

    // Stale version reports conflict without overwriting
    const stale = await saveStudioOps(token, 1, [{ op: 'add', group: 'rikmaMissions', label: 'מיושנת' }], { strapi, now });
    expect(stale).toMatchObject({ ok: true, conflict: true, version: 2 });
  });
});
