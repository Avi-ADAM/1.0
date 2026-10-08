import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * publishWishNeedToCommunity — a need goes out with the skills it was matched on,
 * or not at all.
 *
 * On 2026-10-07 the skill lookup failed on a flaky link to Strapi, the action only
 * warned, and open mission 286 ("בניית שולחן עץ") went out with none of its five
 * skills — so nobody was ever matched to it. Names the catalogue did not hold were
 * dropped as well, with nothing said to the wisher.
 */

const matchMission = vi.fn(async (..._a: any[]) => ({ created: 3 }));
const matchResource = vi.fn(async (..._a: any[]) => ({ created: 0 }));
vi.mock('$lib/server/matching/engine', () => ({
  matchOpenMissionToUsers: (...a: any[]) => matchMission(...a),
  matchOpenMashaabimToUsers: (...a: any[]) => matchResource(...a)
}));

const resolveSpec = vi.fn();
vi.mock('$lib/server/mission/resolveMissionSpec.js', () => ({
  resolveMissionSpec: (...a: any[]) => resolveSpec(...a)
}));

import { publishWishNeedToCommunityConfig } from './publishWishNeedToCommunity';
import { ActionError } from '../errors';
import type { ActionExecutionHandler } from '../types';

const run = publishWishNeedToCommunityConfig.graphqlOperation as ActionExecutionHandler;
const OWNER = '10';

/** The catalogue: exact names the 172 lookup knows. */
const CATALOGUE: Record<string, string> = { נגרות: '5', ליטוש: '9', מדידות: '12' };

type Opts = {
  /** How many 172 lookups fail before one succeeds (Infinity = never). */
  lookupFailures?: number;
  /** The lookup answers without a skills list at all. */
  lookupNoList?: boolean;
  published?: { missions?: any[]; resources?: any[] };
  publishedCheckFailures?: number;
};

function world(opts: Opts = {}) {
  const calls: { qid: string; vars: any }[] = [];
  let lookups = 0;
  let checks = 0;
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      switch (qid) {
        case '105queryRatsonWithProposals':
          return {
            data: {
              ratson: {
                data: {
                  id: '18',
                  attributes: { users_permissions_users: { data: [{ id: OWNER }] }, chat_forum: { data: null } }
                }
              }
            }
          };
        case '416wishPublishedNeeds':
          if (checks++ < (opts.publishedCheckFailures ?? 0)) throw new Error('fetch failed');
          return {
            data: {
              openMissions: { data: opts.published?.missions ?? [] },
              openMashaabims: { data: opts.published?.resources ?? [] }
            }
          };
        case '172resolveSkillsByName':
          if (lookups++ < (opts.lookupFailures ?? 0)) throw new Error('fetch failed');
          if (opts.lookupNoList) return { data: null };
          return {
            data: {
              skills: {
                data: (vars.names as string[])
                  .filter((n) => CATALOGUE[n])
                  .map((n) => ({ id: CATALOGUE[n], attributes: { skillName: n } }))
              }
            }
          };
        case '169crWishOpenMission':
          return { data: { createOpenMission: { data: { id: '286' } } } };
        case '170crWishOpenMashaabim':
          return { data: { createOpenMashaabim: { data: { id: '77' } } } };
        default:
          return { data: {} };
      }
    })
  };
  return { calls, strapi, qids: () => calls.map((c) => c.qid) };
}

const ctx = { userId: OWNER, jwt: 'jwt', fetch: (() => {}) as any, lang: 'he' } as any;

/** Run the action with the retry back-off elapsed instantly. */
async function go(w: ReturnType<typeof world>, params: Record<string, unknown>) {
  const p = run({ ratsonId: '18', name: 'בניית שולחן עץ', ...params }, ctx, { strapi: w.strapi } as any);
  // Swallow here so a rejection is not "unhandled" while the timers run; the
  // caller still awaits the original promise.
  p.catch(() => {});
  await vi.runAllTimersAsync();
  return p as Promise<any>;
}

const created = (w: ReturnType<typeof world>) => w.calls.find((c) => c.qid === '169crWishOpenMission');

/** resolveMissionSpec's answer for the names the catalogue did not hold. */
function specAnswer(resolved: { id: string; name: string; created?: true }[], unresolved: string[] = []) {
  return {
    skills: { ids: resolved.map((r) => r.id), resolved, suggestions: [], newlyCreated: [], unresolved },
    roles: { ids: [], resolved: [], suggestions: [], newlyCreated: [], unresolved: [] },
    workways: { ids: [], resolved: [], suggestions: [], newlyCreated: [], unresolved: [] },
    vallues: { ids: [], resolved: [], suggestions: [], newlyCreated: [], unresolved: [] }
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  matchMission.mockClear();
  matchResource.mockClear();
  resolveSpec.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('publishWishNeedToCommunity — mission skills', () => {
  it('retries a failed skill lookup and publishes with the skills it found', async () => {
    const w = world({ lookupFailures: 2 });
    const out = await go(w, { kind: 'mission', skillNames: ['נגרות', 'ליטוש'] });

    expect(w.qids().filter((q) => q === '172resolveSkillsByName')).toHaveLength(3);
    expect(created(w)!.vars.skills).toEqual(['5', '9']);
    expect(out.data).toMatchObject({
      openMissionId: '286',
      skillsMatched: 2,
      skills: [
        { id: '5', name: 'נגרות' },
        { id: '9', name: 'ליטוש' }
      ],
      skillsMissing: [],
      usersMatched: 3
    });
    expect(matchMission).toHaveBeenCalledOnce();
  });

  it('a lookup that keeps failing publishes nothing: SKILLS_UNAVAILABLE, so the client can retry', async () => {
    const w = world({ lookupFailures: Infinity });
    const err = await go(w, { kind: 'mission', skillNames: ['נגרות'] }).catch((e) => e);

    expect(err).toBeInstanceOf(ActionError);
    expect(err.code).toBe('SKILLS_UNAVAILABLE');
    expect(created(w)).toBeUndefined();
    expect(matchMission).not.toHaveBeenCalled();
  });

  it('a lookup that answers without a list is a failure, not "none of these exist"', async () => {
    const w = world({ lookupNoList: true });
    const err = await go(w, { kind: 'mission', skillNames: ['נגרות'] }).catch((e) => e);

    expect(err.code).toBe('SKILLS_UNAVAILABLE');
    expect(resolveSpec).not.toHaveBeenCalled();
    expect(created(w)).toBeUndefined();
  });

  it('creates the names the catalogue lacks (default-locale path) and reports them as new', async () => {
    resolveSpec.mockResolvedValue(
      specAnswer([
        { id: '40', name: 'עבודת עץ' }, // a different spelling the vector match caught
        { id: '41', name: 'הרכבת רהיטים', created: true }
      ])
    );
    const w = world();
    const out = await go(w, {
      kind: 'mission',
      skillNames: ['נגרות', 'עיבוד עץ', 'מדידות', 'ליטוש', 'הרכבת רהיטים']
    });

    // Only the names the exact lookup missed go to the resolver, in the wisher's language.
    expect(resolveSpec).toHaveBeenCalledOnce();
    expect(resolveSpec.mock.calls[0][0]).toEqual({
      name: 'בניית שולחן עץ',
      skills: ['עיבוד עץ', 'הרכבת רהיטים'],
      lang: 'he'
    });
    expect(created(w)!.vars.skills).toEqual(['5', '12', '9', '40', '41']);
    expect(out.data.skills).toContainEqual({ id: '41', name: 'הרכבת רהיטים', created: true });
    expect(out.data.skills).toContainEqual({ id: '40', name: 'עבודת עץ' });
    expect(out.data.skillsMissing).toEqual([]);
  });

  it('publishes with what it could attach and names what it could not', async () => {
    resolveSpec.mockResolvedValue(specAnswer([], ['הרכבת רהיטים']));
    const w = world();
    const out = await go(w, { kind: 'mission', skillNames: ['נגרות', 'הרכבת רהיטים'] });

    expect(created(w)!.vars.skills).toEqual(['5']);
    expect(out.data.skillsMissing).toEqual(['הרכבת רהיטים']);
  });

  it('a resolver crash counts its names as missing rather than failing the publish', async () => {
    resolveSpec.mockRejectedValue(new Error('pinecone down'));
    const w = world();
    const out = await go(w, { kind: 'mission', skillNames: ['ליטוש', 'הרכבת רהיטים'] });

    expect(created(w)!.vars.skills).toEqual(['9']);
    expect(out.data.skillsMissing).toEqual(['הרכבת רהיטים']);
  });

  it('never publishes a mission left with no skill at all: SKILLS_NOT_ATTACHED', async () => {
    resolveSpec.mockResolvedValue(specAnswer([], ['הרכבת רהיטים']));
    const w = world();
    const err = await go(w, { kind: 'mission', skillNames: ['הרכבת רהיטים'] }).catch((e) => e);

    expect(err).toBeInstanceOf(ActionError);
    expect(err.code).toBe('SKILLS_NOT_ATTACHED');
    expect(err.details).toEqual({ skills: ['הרכבת רהיטים'] });
    expect(created(w)).toBeUndefined();
  });

  it('ids the form already resolved are kept, and alone need no lookup', async () => {
    const w = world();
    const out = await go(w, { kind: 'mission', skillIds: ['5', 'x', '9'], roleIds: ['3'] });

    expect(w.qids()).not.toContain('172resolveSkillsByName');
    expect(created(w)!.vars.skills).toEqual(['5', '9']);
    expect(created(w)!.vars.tafkidims).toEqual(['3']);
    expect(out.data.skillsMatched).toBe(2);
  });

  it('dedupes names and ids: the chips and the form ids overlap', async () => {
    const w = world();
    await go(w, { kind: 'mission', skillNames: ['נגרות', ' נגרות ', ''], skillIds: ['5'] });

    expect(w.calls.find((c) => c.qid === '172resolveSkillsByName')!.vars).toEqual({ names: ['נגרות'] });
    expect(created(w)!.vars.skills).toEqual(['5']);
  });

  it('an already-published need answers with the existing row and resolves nothing', async () => {
    const w = world({ published: { missions: [{ id: '286', attributes: { name: 'בניית שולחן עץ' } }] } });
    const out = await go(w, { kind: 'mission', skillNames: ['נגרות'] });

    expect(out.data).toMatchObject({ alreadyPublished: true, openMissionId: '286' });
    expect(w.qids()).not.toContain('172resolveSkillsByName');
    expect(created(w)).toBeUndefined();
  });

  it('retries the already-published check too, so a blip does not open a duplicate', async () => {
    const w = world({
      publishedCheckFailures: 1,
      published: { missions: [{ id: '286', attributes: { name: 'בניית שולחן עץ' } }] }
    });
    const out = await go(w, { kind: 'mission', skillNames: ['נגרות'] });

    expect(out.data.alreadyPublished).toBe(true);
    expect(created(w)).toBeUndefined();
  });
});

describe('publishWishNeedToCommunity — resource', () => {
  it('reports the catalogue template it is matched on and how many were told', async () => {
    const w = world();
    const out = await go(w, { kind: 'resource', name: 'עץ אלון', mashaabimTemplateId: '33' });

    expect(w.calls.find((c) => c.qid === '170crWishOpenMashaabim')!.vars.mashaabim).toBe('33');
    expect(out.data).toMatchObject({ openMashaabimId: '77', templateId: '33', usersMatched: 0 });
    expect(w.qids()).not.toContain('172resolveSkillsByName');
  });

  it('says so when there is no template — nobody holding it will be told', async () => {
    const w = world();
    const out = await go(w, { kind: 'resource', name: 'עץ אלון' });

    expect(out.data.templateId).toBeNull();
    expect(matchResource).toHaveBeenCalledOnce();
  });
});
