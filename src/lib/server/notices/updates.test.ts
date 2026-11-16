import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * getMyUpdates' engine: the same lists the pages show, worded on the server in
 * the reader's language, through the right door.
 */

const { send, reads, wish, deal, prefs } = vi.hoisted(() => ({
  send: vi.fn(),
  reads: vi.fn(),
  wish: vi.fn(),
  deal: vi.fn(),
  prefs: vi.fn()
}));
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: send }));
vi.mock('$lib/server/sendViaProxy.js', () => ({ sendViaProxy: vi.fn() }));
vi.mock('$lib/server/digest/collect', () => ({ startDigestReads: reads }));
vi.mock('$lib/server/concierge/notices', () => ({ loadWishNotices: wish }));
vi.mock('$lib/server/deal/dealNotices', () => ({ loadDealNotices: deal }));
vi.mock('./prefs', () => ({
  loadNoticePrefsChecked: async (...a: any[]) => {
    const p = await prefs(...a);
    return p === null ? { prefs: { dismissals: [], milon: null, mutedProjects: [], lastSeenAt: null }, ok: false } : { prefs: p, ok: true };
  }
}));

import { userRead } from './door';
import { serverTranslator, noticeLocale } from './translate';
import { loadMyUpdates, toUpdateRows } from './updates';
import { hubFeedNotice } from '$lib/notices/hub';
import { wishNotice } from '$lib/notices';

const NOW = Date.parse('2026-10-06T10:00:00.000Z');

const feedItem = (over: Record<string, unknown> = {}) => ({
  id: '11',
  type: 'pends',
  title: 'Logo',
  projectId: '5',
  projectName: 'Gefen',
  urgent: false,
  deadline: null,
  createdAt: '2026-10-01T08:00:00.000Z',
  ...over
});

const offer = wishNotice(
  {
    viewer: 'wisher',
    wish: { id: '7', name: 'Kitchen' },
    proposal: {
      id: '70',
      status: 'suggested',
      proposerName: 'Avi',
      itemName: 'Plumbing',
      itemKind: 'mission',
      negotiation: { round: 1, yourTurn: true, amount: 6, price: 400, deadlineAt: '2026-10-07T12:00:00.000Z' }
    }
  },
  NOW
)!;

const rel = (id: string | null, attributes: any = {}) => ({ data: id == null ? null : { id, attributes } });
/** Qid 461/462: one rikma ("Studio", 104) with these asks. */
const asksRaw = (asks: any[]) => ({
  data: { usersPermissionsUser: { data: { id: '271', attributes: { projects_1s: { data: [
    { id: '104', attributes: { projectName: 'Studio', asks: { data: asks } } }
  ] } } } } }
});
/** Dan (270) offers to take "Edit the videos", 20 h × 100; he signed round 0 himself. */
const danAsk = (over: Record<string, unknown> = {}) => ({
  id: '182',
  attributes: {
    createdAt: '2026-10-06T09:00:00.000Z',
    users_permissions_user: rel('270', { username: 'Dan' }),
    timegrama: rel('9', { date: '2026-10-08T09:00:00.000Z', done: false }),
    vots: [{ what: true, order: 0, users_permissions_user: rel('270') }],
    open_mission: rel('301', { name: 'Edit the videos', noofhours: 20, perhour: 100 }),
    negopendmissions: { data: [] },
    ...over
  }
});

const emptyWork = { missions: { active: 0, running: 0, notStarted: 0, dormantSoon: [] }, tasks: { open: 0, overdue: 0, dueSoon: 0, items: [] } };

function world({ feed = [feedItem()], wishList = [offer] as any, dealList = [] as any, hubError = undefined as string | undefined } = {}) {
  reads.mockReturnValue({
    since: '2026-10-05T10:00:00.000Z',
    hub: Promise.resolve({ value: { feed }, error: hubError }),
    work: Promise.resolve({ value: emptyWork }),
    suggestions: Promise.resolve({ value: { count: 2, fresh: 1, top: [] } }),
    whatsNew: Promise.resolve({ value: { total: 3, byKind: { missions: 2, resources: 1, products: 0, sales: 0 }, since: 'x' } })
  });
  wish.mockResolvedValue(wishList);
  deal.mockResolvedValue(dealList);
  prefs.mockResolvedValue({ dismissals: [], milon: null, mutedProjects: [], lastSeenAt: null });
  // No mission candidacy waits, unless a test says so.
  send.mockResolvedValue(asksRaw([]));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('the door', () => {
  it('a page or the site chat reads its own session ($idL)', async () => {
    send.mockResolvedValue({ data: {} });
    await userRead('session', '261', '421myWishNotices', fetch);
    expect(send).toHaveBeenCalledWith({ idL: '261' }, '421myWishNotices', 0, 0, false, fetch);
  });

  it('an MCP key reads the $uid twin on the service token — there is no session to bind', async () => {
    send.mockResolvedValue({ data: {} });
    await userRead('service', '261', '421myWishNotices', fetch);
    expect(send).toHaveBeenCalledWith({ uid: '261' }, '428myWishNoticesFor', 0, 0, true, fetch);
  });

  it('refuses a user read with no twin rather than run it as nobody', async () => {
    await expect(userRead('service', '261', '999nothing', fetch)).rejects.toThrow(/no service twin/);
  });
});

describe('the server translator', () => {
  it('words a notice in the reader’s language, from the same JSON the pages read', () => {
    const he = serverTranslator('he')('notices.ui.expand');
    const en = serverTranslator('en')('notices.ui.expand');
    expect(he).toBe('הרחבה');
    expect(en).toBe('Open');
  });

  it('fills {{name}}, falls back to Hebrew, and never shows a key', () => {
    expect(serverTranslator('en')('lev.list.fact.hours', { value: 6 })).toBe('6 hours');
    expect(serverTranslator('xx')('notices.ui.expand')).toBe('הרחבה');
    expect(serverTranslator('en')('notices.does.not.exist')).toBe('');
    expect(noticeLocale('ru-RU')).toBe('ru');
  });
});

describe('toUpdateRows', () => {
  it('one plain sentence per item, its figures worded, an absolute link to answer it', () => {
    const [row] = toUpdateRows([offer], 'en');
    expect(row.sentence).toBe('Counter-offer from Avi on "Plumbing" in the wish "Kitchen"');
    expect(row.sentence).not.toMatch(/[⁨⁩]/);
    expect(row.figures).toEqual(['6 hours', 'Price 400']);
    expect(row.silenceApproves).toBe(true);
    expect(row.link).toBe('https://1lev1.com/concierge/7#proposal-70');
    expect(row.projectId).toBeNull();
  });

  it('a rikma vote from the hub feed names its kind, its title and its rikma', () => {
    const [row] = toUpdateRows([hubFeedNotice(feedItem() as any)], 'he');
    expect(row.sentence).toBe('הצעה למשימה חדשה: "Logo" ברקמה "Gefen"');
    expect(row.projectId).toBe('5');
    expect(row.link).toBe('https://1lev1.com/lev?focus=pends&project=5');
  });
});

describe('loadMyUpdates', () => {
  it('everything that waits, merged, and the day’s summary beside it', async () => {
    world();
    const out = await loadMyUpdates('261', fetch, { door: 'service', lang: 'en', now: NOW });
    expect(reads).toHaveBeenCalledWith('261', expect.objectContaining({ door: 'service' }));
    expect(wish).toHaveBeenCalledWith('261', fetch, expect.any(Promise), 'service');
    expect(out.waiting.map((r) => r.where?.kind)).toEqual(['wish', 'rikma']);
    expect(out.totalWaiting).toBe(2);
    expect(out.whatsNew.total).toBe(3);
    expect(out.suggestions).toEqual({ count: 2, fresh: 1 });
    expect(out.unavailable).toEqual([]);
  });

  it('"what is happening in rikma X": by name, case-insensitive — wishes and deals are not a rikma', async () => {
    world({ feed: [feedItem(), feedItem({ id: '12', projectId: '6', projectName: 'Other' })] });
    const out = await loadMyUpdates('261', fetch, { door: 'session', lang: 'en', rikma: 'gef', now: NOW });
    expect(out.waiting.map((r) => r.projectId)).toEqual(['5']);
  });

  it('says what could not be read instead of calling it empty', async () => {
    world({ wishList: null, hubError: 'boom' });
    const out = await loadMyUpdates('261', fetch, { door: 'service', lang: 'he', now: NOW });
    expect(out.unavailable).toEqual(['rikmaVotes', 'wishes']);
  });

  it('a mission candidacy waits for the members: who, what, the figures, the silence clock, its vote page', async () => {
    world({ feed: [], wishList: [] });
    send.mockResolvedValue(asksRaw([danAsk()]));
    const out = await loadMyUpdates('271', fetch, { door: 'service', lang: 'en', now: NOW });
    expect(send).toHaveBeenCalledWith({ uid: '271' }, '462hubAsksFor', 0, 0, true, fetch);
    expect(out.unavailable).toEqual([]);
    expect(out.waiting).toHaveLength(1);
    const [row] = out.waiting;
    expect(row.sentence).toContain('Dan');
    expect(row.sentence).toContain('Edit the videos');
    expect(row.figures).toEqual(['20 hours', expect.stringContaining('100')]);
    expect(row.silenceApproves).toBe(true);
    expect(row.deadline).toBe('2026-10-08T09:00:00.000Z');
    expect(row.projectId).toBe('104');
    expect(row.link).toBe('https://1lev1.com/moach/104/votes/ask/182');
  });

  it('not the candidate’s own ask, not one she signed in the standing round, not one whose clock ran out', async () => {
    world({ feed: [], wishList: [] });
    send.mockResolvedValue(
      asksRaw([
        danAsk(),
        danAsk({ vots: [{ what: true, order: 0, users_permissions_user: rel('270') }, { what: true, order: 0, users_permissions_user: rel('271') }] }),
        danAsk({ timegrama: rel('9', { date: '2026-10-08T09:00:00.000Z', done: true }) })
      ])
    );
    expect((await loadMyUpdates('270', fetch, { door: 'service', lang: 'en', now: NOW })).waiting).toHaveLength(0);
    expect((await loadMyUpdates('271', fetch, { door: 'service', lang: 'en', now: NOW })).waiting).toHaveLength(1);
  });

  it('a counter opens a new round she has to answer, even after she signed the first', async () => {
    world({ feed: [], wishList: [] });
    send.mockResolvedValue(
      asksRaw([
        danAsk({
          vots: [{ what: true, order: 0, users_permissions_user: rel('271') }, { what: true, order: 1, users_permissions_user: rel('270') }],
          negopendmissions: { data: [{ attributes: { name: 'Edit the videos', noofhours: 15, perhour: 120 } }] }
        })
      ])
    );
    const out = await loadMyUpdates('271', fetch, { door: 'service', lang: 'en', now: NOW });
    expect(out.waiting).toHaveLength(1);
    expect(out.waiting[0].figures[0]).toBe('15 hours');
  });

  it('when the candidacies or her hidden list cannot be read, it says so — the rest still loads', async () => {
    world();
    send.mockResolvedValue({ errors: [{ message: 'Forbidden access' }], data: null });
    prefs.mockResolvedValue(null);
    const out = await loadMyUpdates('271', fetch, { door: 'service', lang: 'en', now: NOW });
    expect(out.unavailable).toEqual(['missionApplications', 'hiddenNotices']);
    expect(out.waiting.length).toBeGreaterThan(0);
  });

  it('leaves out what she hid, and counts it', async () => {
    world();
    prefs.mockResolvedValue({ dismissals: [{ noticeKey: 'lev:pends:11:v0', until: null }], milon: null, mutedProjects: [], lastSeenAt: null });
    const out = await loadMyUpdates('261', fetch, { door: 'service', lang: 'en', now: NOW });
    expect(out.waiting).toHaveLength(1);
    expect(out.hiddenCount).toBe(1);
  });
});
