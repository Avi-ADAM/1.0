import { describe, it, expect } from 'vitest';
import { proposeObjectArchiveConfig } from './proposeObjectArchive.js';

const handler = proposeObjectArchiveConfig.graphqlOperation as any;

interface MissionShape {
  lifecycle?: string | null;
  hours?: number;
  members?: string[];
  ownerId?: string;
  openDecisions?: string[];
  updatedAt?: string;
  finnishedMissions?: string[];
  /** Other ties the owner has to the rikma; 0 means this is their last one. */
  otherTies?: number;
}

/**
 * A Strapi stand-in: answers the target read, records every mutation.
 * `sent` is the assertion surface — what the rikma would actually see happen.
 */
function fakeStrapi(mission: MissionShape = {}) {
  const sent: string[] = [];
  const {
    lifecycle = null,
    hours = 0,
    members = ['1', '2'],
    ownerId = '1',
    openDecisions = [],
    updatedAt = '2026-01-01T00:00:00.000Z',
    finnishedMissions = [],
    otherTies = 0,
  } = mission;

  const node = {
    id: '10',
    attributes: {
      name: 'עיצוב לוגו',
      lifecycle,
      dormancyDays: null,
      updatedAt,
      howmanyhoursalready: hours,
      hoursassinged: 20,
      perhour: 50,
      users_permissions_user: { data: { id: ownerId } },
      activeTimer: { data: null },
      finnished_missions: { data: finnishedMissions.map((id) => ({ id })) },
      mission: { data: { id: '44' } },
      open_missions: { data: [{ id: '33' }] },
      project: {
        data: {
          id: '5',
          attributes: {
            restime: 'sth',
            dormancyDays: null,
            user_1s: { data: members.map((id) => ({ id })) },
          },
        },
      },
      archive_decisions: { data: openDecisions.map((id) => ({ id })) },
    },
  };

  const fetch = async (_url: string, init: any) => {
    const query = JSON.parse(init.body).query as string;
    sent.push(query);
    let data: any = {};
    if (query.includes('mesimabetahalich(id:')) data = { mesimabetahalich: { data: node } };
    else if (query.includes('openMission(id:')) data = { openMission: { data: null } };
    else if (query.includes('createDecision')) data = { createDecision: { data: { id: '500' } } };
    else if (query.includes('createTimegrama')) data = { createTimegrama: { data: { id: '600' } } };
    else if (query.includes('createFinnishedMission'))
      data = { createFinnishedMission: { data: { id: '900' } } };
    else if (query.includes('otherMissions:')) {
      const meta = (n: number) => ({ meta: { pagination: { total: n } } });
      data = {
        otherMissions: meta(otherTies),
        otherResources: meta(0),
        finnishedMissions: meta(0),
        sales: meta(0),
        halukas: meta(0),
        openAsks: meta(0),
        openAskms: meta(0),
      };
    } else if (query.includes('project(id:'))
      data = {
        project: {
          data: { id: '5', attributes: { user_1s: { data: members.map((id) => ({ id })) } } },
        },
      };
    return { json: async () => ({ data }) };
  };

  return { fetch, sent, matching: (t: string) => sent.filter((q) => q.includes(t)) };
}

const ctx = (strapi: ReturnType<typeof fakeStrapi>, userId = '1') => ({
  userId,
  jwt: 'jwt',
  lang: 'he',
  fetch: strapi.fetch as unknown as typeof fetch,
});

const params = (over: Record<string, unknown> = {}) => ({
  targetKind: 'missionInProgress',
  targetId: '10',
  ...over,
});

describe('proposeObjectArchive — guards', () => {
  it('rejects an unknown target kind before touching anything', async () => {
    const s = fakeStrapi();
    await expect(
      handler(params({ targetKind: 'nonsense' }), ctx(s), {}),
    ).rejects.toThrow(/Unknown targetKind/);
    expect(s.sent).toHaveLength(0);
  });

  it('refuses a second proposal while one is open — respond to that one instead', async () => {
    const s = fakeStrapi({ openDecisions: ['77'] });
    await expect(handler(params(), ctx(s), {})).rejects.toThrow(/already an open proposal/);
  });

  it('refuses an object that is already archived', async () => {
    const s = fakeStrapi({ lifecycle: 'archived' });
    await expect(handler(params(), ctx(s), {})).rejects.toThrow(/already archived/);
  });

  it('refuses a non-member of the rikma', async () => {
    const s = fakeStrapi({ members: ['2', '3'] });
    await expect(handler(params(), ctx(s, '9'), {})).rejects.toThrow(/member of the rikma/);
  });

  it('demands a reason once hours have accrued', async () => {
    const s = fakeStrapi({ hours: 12 });
    await expect(handler(params(), ctx(s), {})).rejects.toThrow(/say why/);
  });

  it('demands an hours outcome once hours have accrued', async () => {
    const s = fakeStrapi({ hours: 12 });
    await expect(
      handler(params({ why: 'שינוי כיוון' }), ctx(s), {}),
    ).rejects.toThrow(/hoursOutcome/);
  });

  it('does not demand a reason when nothing accrued', async () => {
    const s = fakeStrapi({ hours: 0, members: ['1'] });
    const res = await handler(params(), ctx(s), {});
    expect(res.data.immediate).toBe(true);
  });

  it('lets only the person carrying the commitment release it', async () => {
    const s = fakeStrapi({ ownerId: '2' });
    await expect(
      handler(params({ scope: 'release' }), ctx(s, '1'), {}),
    ).rejects.toThrow(/carrying the commitment/);
  });

  it('rejects transfer with no destination', async () => {
    const s = fakeStrapi({ hours: 5 });
    await expect(
      handler(params({ why: 'נעצר', hoursOutcome: 'transfer' }), ctx(s), {}),
    ).rejects.toThrow(/transferToId/);
  });
});

describe('proposeObjectArchive — the immediate paths', () => {
  it('a rikma of one has nobody to ask, so it just applies', async () => {
    const s = fakeStrapi({ members: ['1'], hours: 0 });
    const res = await handler(params(), ctx(s), {});

    expect(res.data.immediate).toBe(true);
    expect(res.data.decisionId).toBeNull();
    expect(res.data.lifecycle).toBe('archived');
    expect(s.matching('createDecision')).toHaveLength(0);
  });

  it('a rikma of one still settles the hours it agreed to credit', async () => {
    const s = fakeStrapi({ members: ['1'], hours: 6 });
    const res = await handler(
      params({ why: 'הסתיים בפועל', hoursOutcome: 'credit' }),
      ctx(s),
      {},
    );
    expect(res.data.hoursCredited).toBe(6);
    expect(s.matching('createFinnishedMission')[0]).toContain('noofhours: 6');
  });

  it('releasing my own dormant commitment is sovereign — no vote, need reopened', async () => {
    const s = fakeStrapi({ hours: 0, ownerId: '1', members: ['1', '2'] });
    const res = await handler(params({ scope: 'release' }), ctx(s), {});

    expect(res.data.immediate).toBe(true);
    expect(res.data.lifecycle).toBe('released');
    expect(res.data.reopenedOpenMissionId).toBe('33');
    expect(s.matching('createDecision')).toHaveLength(0);
  });

  it('but releasing one that carries hours goes to the rikma', async () => {
    const s = fakeStrapi({ hours: 9, ownerId: '1', members: ['1', '2'] });
    const res = await handler(
      params({ scope: 'release', why: 'לא הספקתי', hoursOutcome: 'credit' }),
      ctx(s),
      {},
    );
    expect(res.data.immediate).toBe(false);
    expect(res.data.decisionId).toBe('500');
  });
});

describe('proposeObjectArchive — opening the proposal', () => {
  it('opens the Decision with round 1, the proposer’s signature and a clock', async () => {
    const s = fakeStrapi({ hours: 0, members: ['1', '2'] });
    const res = await handler(params({ why: 'כבר לא רלוונטי' }), ctx(s), {});

    expect(res.data.immediate).toBe(false);
    expect(res.data.decisionId).toBe('500');
    expect(res.data.timegramaId).toBe('600');

    const [decision] = s.matching('createDecision');
    expect(decision).toContain('kind: archiveObject');
    expect(decision).toContain('targetKind: missionInProgress');
    expect(decision).toContain('archMesimabetahalich: "10"');
    expect(decision).toContain('mode: archive');
    expect(decision).toContain('ordern: 1');
    // Proposing is agreeing: the proposal is signed by its author at round 1.
    expect(decision).toContain('order: 1');
    expect(decision).toContain('what: true');

    const [timegrama] = s.matching('createTimegrama');
    expect(timegrama).toContain('whatami: "decision"');
    expect(timegrama).toContain('decision: "500"');
  });

  it('marks the object as under discussion without removing it', async () => {
    const s = fakeStrapi({ hours: 0, members: ['1', '2'] });
    await handler(params({ why: 'כבר לא רלוונטי' }), ctx(s), {});
    const proposed = s.matching('lifecycle: archiveProposed');
    expect(proposed).toHaveLength(1);
    expect(s.matching('lifecycle: archived')).toHaveLength(0);
  });

  it('carries the reason onto the decision so members know what they are deciding', async () => {
    const s = fakeStrapi({ hours: 4, members: ['1', '2'] });
    await handler(
      params({ why: 'הלקוח ביטל', hoursOutcome: 'credit', hoursToCredit: 4 }),
      ctx(s),
      {},
    );
    const [decision] = s.matching('createDecision');
    expect(decision).toContain('הלקוח ביטל');
    expect(decision).toContain('hoursOutcome: credit');
    expect(decision).toContain('hoursToCredit: 4');
  });
});

describe('proposeObjectArchive — when this also ends a membership', () => {
  it('says so in the result, so the caller can warn before anyone signs', async () => {
    const s = fakeStrapi({ hours: 0, members: ['1', '2'], ownerId: '2', otherTies: 0 });
    const res = await handler(params({ why: 'הצורך התבטל' }), ctx(s, '1'), {});

    expect(res.data.endsMembership).toBe(true);
    expect(res.data.membershipUserId).toBe('2');
  });

  it('records it on the Decision, so the card can state it too', async () => {
    const s = fakeStrapi({ hours: 0, members: ['1', '2'], ownerId: '2', otherTies: 0 });
    await handler(params({ why: 'הצורך התבטל' }), ctx(s, '1'), {});

    const [decision] = s.matching('createDecision');
    expect(decision).toContain('archEndsMembership: true');
    expect(decision).toContain('archMember: "2"');
  });

  it('does not claim it when the member has other ties to the rikma', async () => {
    const s = fakeStrapi({ hours: 0, members: ['1', '2'], ownerId: '2', otherTies: 1 });
    const res = await handler(params({ why: 'הצורך התבטל' }), ctx(s, '1'), {});

    expect(res.data.endsMembership).toBe(false);
    expect(s.matching('archEndsMembership')).toHaveLength(0);
  });

  it('does not claim it when hours accrued — that member has a stake', async () => {
    const s = fakeStrapi({ hours: 3, members: ['1', '2'], ownerId: '2', otherTies: 0 });
    const res = await handler(
      params({ why: 'נעצר', hoursOutcome: 'credit' }),
      ctx(s, '1'),
      {},
    );
    expect(res.data.endsMembership).toBe(false);
  });

  it('leaving on my own is still my call — released immediately, membership ends', async () => {
    const s = fakeStrapi({ hours: 0, members: ['1', '2'], ownerId: '1', otherTies: 0 });
    const res = await handler(params({ scope: 'release' }), ctx(s, '1'), {});

    expect(res.data.immediate).toBe(true);
    expect(res.data.membershipEnded?.userId).toBe('1');
    expect(s.matching('updateProject')[0]).toContain('user_1s: ["2"]');
  });
});
