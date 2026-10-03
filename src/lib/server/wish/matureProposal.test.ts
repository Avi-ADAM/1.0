import { describe, expect, it, vi } from 'vitest';
import { matureWishProposal, type MatureDeps } from './matureProposal';

/**
 * QA_CONCIERGE_E2E C-9 — "silence is consent, at the pace of the wish". When the clock
 * of a wish proposal runs out, the version on the table is approved for the side that
 * stayed silent, through the same action they would have pressed.
 */

const WISHER = '10';
const PROVIDER = '20';
const NOW = new Date('2026-10-10T12:00:00.000Z');
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();

const entry = (user: string, hours: number, amount: number, at: string, agree = false) => ({
  user: { data: { id: user } },
  agree,
  note: 'התנאים האלה מתאימים לי',
  submittedAt: at,
  willingHours: hours,
  willingAmount: amount
});

interface Opts {
  kind?: string;
  openMission?: boolean;
  createdAt?: string;
  entries?: any[];
  restime?: string | null;
  proposalStatus?: string;
  wishStatus?: string;
  matanot?: boolean;
  needTaken?: boolean;
  noWish?: boolean;
}

function setup(o: Opts = {}) {
  const calls: { qid: string; vars: any }[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      switch (qid) {
        case '391ratsonOfProposal':
          return {
            data: { ratsonProposal: { data: { id: '77', attributes: { ratson: { data: o.noWish ? null : { id: '16' } } } } } }
          };
        case '105queryRatsonWithProposals':
          return {
            data: {
              ratson: {
                data: {
                  id: '16',
                  attributes: {
                    status_ratson: o.wishStatus ?? 'open',
                    users_permissions_users: { data: [{ id: WISHER }] }
                  }
                }
              },
              ratsonProposals: {
                data: [
                  {
                    id: '77',
                    attributes: {
                      kind: o.kind ?? (o.openMission ? 'custom_offer' : 'existing_project'),
                      status_proposal: o.proposalStatus ?? 'suggested',
                      createdAt: o.createdAt ?? hoursAgo(72),
                      total_price: 600,
                      proposer_users: { data: [{ id: PROVIDER }] },
                      open_mission: { data: o.openMission ? { id: '9' } : null },
                      matanot: { data: o.matanot ? { id: '4' } : null },
                      covered_missions: [{ extracted_mission_idx: '55', hours: 4, price: 600 }],
                      covered_resources: [],
                      ratson_willingness_entry: o.entries ?? []
                    }
                  }
                ]
              }
            }
          };
        case '388getRatsonRestime':
          return { data: { ratson: { data: { attributes: { restime: o.restime ?? null } } } } };
        case '392getOpenMissionArchived':
          return { data: { openMission: { data: { attributes: { archived: !!o.needTaken } } } } };
        default:
          return { data: {} };
      }
    })
  };
  const actions: { key: string; params: any; userId: string }[] = [];
  const closed: string[] = [];
  const armed: { proposalId: string; at: string }[] = [];
  const deps: MatureDeps = {
    strapi,
    jwt: 'admin',
    fetch: (() => {}) as any,
    now: () => NOW,
    runAction: vi.fn(async (key, params, userId) => {
      actions.push({ key, params, userId });
      return { success: true };
    }),
    closeClock: vi.fn(async (t) => {
      closed.push(t);
    }),
    armClock: vi.fn(async (proposalId, at) => {
      armed.push({ proposalId, at });
    })
  };
  return { deps, calls, actions, closed, armed };
}

/** The provider put other terms on the table 60 h ago — the two sides are talking. */
const providerCounter = () => [entry(PROVIDER, 6, 680, hoursAgo(60))];
/** The wisher did, 60 h ago. */
const wisherCounter = () => [entry(WISHER, 5, 640, hoursAgo(60))];

describe('first contact has no clock — silence only counts once the two sides are talking', () => {
  it('an invitation nobody answered, however old, is not approved for the invited provider', async () => {
    const w = setup(); // opened 72 h ago, 48 h pace, nobody answered
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('closed:first contact');
    expect(w.actions).toEqual([]);
    expect(w.closed).toEqual(['T1']); // a stray clock is closed, not left running
  });

  it('a volunteer’s offer the wisher never answered does not take on an obligation for her', async () => {
    const w = setup({ openMission: true });
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('closed:first contact');
    expect(w.actions).toEqual([]);
  });
});

describe('the silence of a wish proposal', () => {
  it('a wisher’s counter the invited provider ignored: approved for them', async () => {
    const w = setup({ entries: wisherCounter() });
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('matured');
    expect(w.actions).toEqual([
      { key: 'acceptWishOffer', params: { proposalId: '77', ratsonId: '16', viaSilence: true }, userId: PROVIDER }
    ]);
    expect(w.closed).toEqual(['T1']);
  });

  it('a provider’s counter the wisher ignored: approved for the wisher', async () => {
    const w = setup({ entries: providerCounter() });
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('matured');
    expect(w.actions).toEqual([
      { key: 'acceptWishOffer', params: { proposalId: '77', ratsonId: '16', viaSilence: true }, userId: WISHER }
    ]);
  });

  it('a volunteer’s counter the wisher ignored: her silence closes it — the slot is built', async () => {
    const w = setup({ openMission: true, entries: providerCounter() });
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('matured');
    expect(w.actions.map((a) => [a.key, a.userId])).toEqual([['acceptRatsonProposal', WISHER]]);
  });

  it('the wisher’s counter a volunteer ignored: they sign by silence, then it closes — nobody clicks twice', async () => {
    const w = setup({ openMission: true, entries: [entry(WISHER, 5, 640, hoursAgo(60))] });
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('matured');
    expect(w.actions.map((a) => [a.key, a.userId])).toEqual([
      ['acceptWishOffer', PROVIDER],
      ['acceptRatsonProposal', WISHER]
    ]);
    expect(w.actions.every((a) => a.params.viaSilence === true)).toBe(true);
  });
});

describe('not yet — the pace of the wish decides', () => {
  it('a clock that fired before the deadline is re-armed for the deadline, and this one closed', async () => {
    const w = setup({ entries: [entry(PROVIDER, 6, 680, hoursAgo(10))] });
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('rearmed');
    expect(w.actions).toEqual([]);
    expect(w.armed).toEqual([{ proposalId: '77', at: new Date(NOW.getTime() + 38 * 3600_000).toISOString() }]);
    expect(w.closed).toEqual(['T1']);
  });

  it('a counter since then restarts it: the deadline is the last signature plus the pace', async () => {
    const w = setup({ createdAt: hoursAgo(100), entries: [entry(PROVIDER, 6, 680, hoursAgo(5))] });
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('rearmed');
    expect(w.armed[0].at).toBe(new Date(NOW.getTime() + 43 * 3600_000).toISOString());
    expect(w.actions).toEqual([]);
  });

  it('a wish with its own, longer pace is not matured at 48 h', async () => {
    const w = setup({ restime: 'sevend', entries: [entry(PROVIDER, 6, 680, hoursAgo(72))] }); // 72 h in, a week to answer
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('rearmed');
    expect(w.actions).toEqual([]);
    expect(w.armed[0].at).toBe(new Date(NOW.getTime() + 96 * 3600_000).toISOString());
  });

  it('with no pace on the wish at all (before the field exists) it is the 48 h default', async () => {
    const w = setup({ restime: null, entries: [entry(PROVIDER, 6, 680, hoursAgo(72))] });
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('matured');
  });
});

describe('what silence never does', () => {
  it('builds a second slot for a need someone else already took — the offer lapses instead', async () => {
    const w = setup({ openMission: true, needTaken: true, entries: providerCounter() });
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('closed:the need was taken');
    expect(w.actions).toEqual([]);
    const lapsed = w.calls.find((c) => c.qid === '102updateRatsonProposal')!;
    expect(lapsed.vars).toEqual({ id: '77', status_proposal: 'expired' });
  });

  it('acts on a wish that ended, a proposal already answered, or one that is not negotiated here', async () => {
    for (const [o, why] of [
      [{ wishStatus: 'fulfilled' }, 'wish fulfilled'],
      [{ wishStatus: 'cancelled' }, 'wish cancelled'],
      [{ proposalStatus: 'accepted' }, 'proposal accepted'],
      [{ proposalStatus: 'rejected' }, 'proposal rejected'],
      [{ matanot: true }, 'not negotiated here'],
      [{ kind: 'custom_offer' }, 'not negotiated here'], // a plain self-offer
      [{ noWish: true }, 'no wish']
    ] as [Opts, string][]) {
      const w = setup(o);
      expect(await matureWishProposal('77', 'T1', w.deps), why).toBe(`closed:${why}`);
      expect(w.actions, why).toEqual([]);
      expect(w.closed, why).toEqual(['T1']); // a clock we will not act on is closed
    }
  });

  it('leaves the clock open when the approval itself fails — the next run tries again', async () => {
    const w = setup({ entries: providerCounter() });
    (w.deps.runAction as any).mockResolvedValueOnce({ success: false, error: { message: 'boom' } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('retry');
    expect(w.closed).toEqual([]);
  });

  it('stops at the first failing step — a volunteer who signed by silence is not closed over a failure', async () => {
    const w = setup({ openMission: true, entries: [entry(WISHER, 5, 640, hoursAgo(60))] });
    // the first step (the volunteer's silent signature) fails — and is still a call that was made
    w.deps.runAction = vi.fn(async (key, params, userId) => {
      w.actions.push({ key, params, userId });
      return { success: false };
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await matureWishProposal('77', 'T1', w.deps)).toBe('retry');
    expect(w.actions.map((a) => a.key)).toEqual(['acceptWishOffer']); // the close never ran
  });
});
