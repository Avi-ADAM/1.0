import { describe, expect, it, vi } from 'vitest';
import { dismissNoticeConfig, restoreNoticeConfig, saveNoticePrefsConfig } from './noticePrefs';
import { readNoticePrefs } from '$lib/server/notices/prefs';
import { applyDismissals, wishNotice } from '$lib/notices';
import { withNoticeUpdates } from '$lib/concierge/summary.js';
import type { ActionExecutionHandler } from '../types';

const call = (cfg: any, params: any, w: ReturnType<typeof world>, userId = '261') =>
  (cfg.graphqlOperation as ActionExecutionHandler)(params, { userId, jwt: 'j' } as any, { strapi: w.strapi } as any);

/** The caller's rows as qid 423 returns them. */
function world({ dismissals = [] as { id: string; noticeKey: string }[], pref = null as any } = {}) {
  const calls: { qid: string; vars: any }[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      if (qid === '423myNoticePrefs') {
        return {
          data: {
            noticeDismissals: { data: dismissals.map((d) => ({ id: d.id, attributes: { noticeKey: d.noticeKey, until: null } })) },
            noticePrefs: { data: pref ? [{ id: pref.id, attributes: pref }] : [] }
          }
        };
      }
      return { data: {} };
    })
  };
  return { strapi, calls, of: (qid: string) => calls.filter((c) => c.qid === qid) };
}

describe('dismissNotice — hiding is about her view only', () => {
  it('writes one row for the caller, with the notice key', async () => {
    const w = world();
    await call(dismissNoticeConfig, { noticeKey: 'wish:71:v1' }, w);
    expect(w.of('424createNoticeDismissal')[0].vars.data).toEqual({
      noticeKey: 'wish:71:v1',
      until: null,
      users_permissions_user: '261'
    });
    // Read as the caller, never as someone named in the params.
    expect(w.of('423myNoticePrefs')[0].vars).toEqual({ idL: '261' });
  });

  it('hiding twice is hiding once', async () => {
    const w = world({ dismissals: [{ id: '1', noticeKey: 'wish:71:v1' }] });
    await call(dismissNoticeConfig, { noticeKey: 'wish:71:v1' }, w);
    expect(w.of('424createNoticeDismissal')).toHaveLength(0);
  });

  it('accepts the keys notices make, figures with decimals included — and nothing else', async () => {
    await expect(call(dismissNoticeConfig, { noticeKey: 'deal:due:8:amount300.5' }, world())).resolves.toBeTruthy();
    await expect(call(dismissNoticeConfig, { noticeKey: 'DROP TABLE' }, world())).rejects.toThrow(/not a notice key/);
  });
});

describe('restoreNotice', () => {
  it('deletes only the caller’s rows for that key', async () => {
    const w = world({ dismissals: [{ id: '1', noticeKey: 'wish:71:v1' }, { id: '2', noticeKey: 'wish:72:v0' }] });
    await call(restoreNoticeConfig, { noticeKey: 'wish:71:v1' }, w);
    expect(w.of('425deleteNoticeDismissal').map((c) => c.vars.id)).toEqual(['1']);
  });
});

describe('saveNoticePrefs', () => {
  it('creates her row the first time, and keeps only well-formed values', async () => {
    const w = world();
    await call(saveNoticePrefsConfig, { milon: { hachla: false, fiap: true, 'x y': true, pend: 'no' }, mutedProjects: ['5', 'abc', 5] }, w);
    expect(w.of('426createNoticePref')[0].vars.data).toEqual({
      milon: { hachla: false, fiap: true },
      mutedProjects: ['5'],
      users_permissions_user: '261'
    });
  });

  it('updates the row she already has', async () => {
    const w = world({ pref: { id: '9', milon: {} } });
    await call(saveNoticePrefsConfig, { milon: { hachla: true } }, w);
    expect(w.of('427updateNoticePref')[0].vars).toEqual({ id: '9', data: { milon: { hachla: true } } });
    expect(w.of('426createNoticePref')).toHaveLength(0);
  });
});

// ── reading them back ─────────────────────────────────────────────────────

const NOW = Date.parse('2026-10-05T10:00:00.000Z');
const offer = wishNotice(
  {
    viewer: 'wisher',
    wish: { id: '7', name: 'Kitchen' },
    proposal: {
      id: '71',
      status: 'suggested',
      proposerName: 'Avi',
      itemName: 'Plumbing',
      itemKind: 'mission',
      negotiation: { round: 1, yourTurn: true, amount: 8, price: 520, deadlineAt: null }
    }
  },
  NOW
)!;

describe('applyDismissals', () => {
  it('marks what she hid; a passed "until" no longer hides; a new round is a new notice', () => {
    const later = new Date(NOW + 3600_000).toISOString();
    const earlier = new Date(NOW - 3600_000).toISOString();
    expect(applyDismissals([offer], [{ noticeKey: 'wish:71:v1', until: null }], NOW)[0].hidden).toBe(true);
    expect(applyDismissals([offer], [{ noticeKey: 'wish:71:v1', until: later }], NOW)[0].hidden).toBe(true);
    expect(applyDismissals([offer], [{ noticeKey: 'wish:71:v1', until: earlier }], NOW)[0].hidden).toBeUndefined();
    expect(applyDismissals([offer], [{ noticeKey: 'wish:71:v0', until: null }], NOW)[0].hidden).toBeUndefined();
  });
});

describe('readNoticePrefs', () => {
  it('reads qid 423 through the proxy shape', () => {
    const prefs = readNoticePrefs({
      noticeDismissals: { data: [{ id: '1', attributes: { noticeKey: 'wish:71:v1', until: null } }] },
      noticePrefs: { data: [{ id: '9', attributes: { milon: { hachla: false }, mutedProjects: [5], lastSeenAt: null } }] }
    });
    expect(prefs).toEqual({
      dismissals: [{ noticeKey: 'wish:71:v1', until: null }],
      milon: { hachla: false },
      mutedProjects: ['5'],
      lastSeenAt: null
    });
  });
});

describe('withNoticeUpdates — the profile badge counts what the bell shows', () => {
  const summary = { drafts: 1, ordered: 2, updates: 3, total: 6, onlyDraftId: '4', updatesWishId: null };

  it('counts the visible wish notices, and links to the one wish when there is one', () => {
    const hidden = { ...offer, key: 'wish:72:v0', subject: 'proposal:72', hidden: true };
    expect(withNoticeUpdates(summary, [offer, hidden])).toEqual({ ...summary, updates: 1, total: 4, updatesWishId: '7' });
  });

  it('keeps the old count when the notices could not be read', () => {
    expect(withNoticeUpdates(summary, null)).toBe(summary);
  });
});
