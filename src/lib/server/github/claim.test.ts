/**
 * claimGithubWork — nothing is filed unless GitHub and Strapi both agree the
 * work and the mission are the caller's, and it is filed through the same
 * `fileHours` path as a timer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { ADMINMONTHER: 'admin' } }));
vi.mock('./config.js', () => ({ githubAppConfig: () => ({ appId: '1', privateKey: 'k' }) }));

const getPull = vi.fn();
const listPullReviews = vi.fn();
vi.mock('./client.js', () => ({
  getPull: (...a: any[]) => getPull(...a),
  listPullReviews: (...a: any[]) => listPullReviews(...a)
}));

const fileHours = vi.fn(async () => ({ filed: 'approval', finiapruvalId: '900' }));
vi.mock('$lib/server/timers/fileHours.js', () => ({ fileHours: (...a: any[]) => (fileHours as any)(...a) }));

import { alreadyClaimed, claimGithubWork, ClaimError } from './claim.js';

const url = 'https://github.com/acme/widget/pull/21';
const ctx = { userId: '7', jwt: 'jwt', fetch: (() => {}) as any };
const input = { projectId: '3', missionId: '42', url, kind: 'pull' as const, hours: 5, note: 'late night' };

function strapi(overrides: Record<string, any> = {}) {
  const responses: Record<string, any> = {
    githubProjectRepos: {
      data: { projectRepos: { data: [{ attributes: { owner: 'acme', name: 'widget', installationId: '555', status: 'active' } }] } }
    },
    githubUserById: { data: { usersPermissionsUser: { data: { attributes: { githubId: '99' } } } } },
    githubProjectLinkedTimers: { data: { timers: { data: [] } } },
    '110getMissionForTimerSave': {
      data: {
        mesimabetahalich: {
          data: {
            id: '42',
            attributes: {
              name: 'Badge',
              perhour: 100,
              project: { data: { id: '3', attributes: { user_1s: { data: [{ id: '7' }, { id: '8' }] } } } },
              users_permissions_user: { data: { id: '7' } }
            }
          }
        }
      }
    },
    githubCreateClaimTimer: { data: { createTimer: { data: { id: '77' } } } },
    ...overrides
  };
  return { execute: vi.fn(async (qid: string) => responses[qid] ?? { data: {} }) };
}

const merged = { number: 21, title: 'Add badge', merged_at: '2026-09-10T12:00:00Z', user: { id: 99, login: 'dana' } };

async function codeOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return 'ok';
  } catch (e) {
    return e instanceof ClaimError ? e.code : `unexpected: ${e}`;
  }
}

describe('claimGithubWork', () => {
  beforeEach(() => {
    getPull.mockReset();
    listPullReviews.mockReset();
    fileHours.mockClear();
  });

  it('files the author’s merged PR as a saved, non-active timer and then through fileHours', async () => {
    getPull.mockResolvedValue(merged);
    const s = strapi();
    const result = await claimGithubWork(input, ctx, s);

    const create = s.execute.mock.calls.find((c) => c[0] === 'githubCreateClaimTimer')!;
    expect(create[1]).toMatchObject({ missionId: '42', userId: '7', projectId: '3', rate: 100, totalHours: 5, saveLinks: url });
    expect(create[1].saveText).toBe('PR widget#21 — Add badge\nlate night');
    expect(create[1].timers.at(-1).stop).toBe('2026-09-10T12:00:00.000Z');
    expect(create[1]).not.toHaveProperty('activeMesimabetahalich');

    expect(fileHours).toHaveBeenCalledWith(expect.objectContaining({ hours: 5, rate: 100, timerId: '77' }));
    expect(result).toMatchObject({ filed: 'approval', hours: 5 });
  });

  it('refuses a PR written by someone else', async () => {
    getPull.mockResolvedValue({ ...merged, user: { id: 5, login: 'other' } });
    expect(await codeOf(claimGithubWork(input, ctx, strapi()))).toBe('notYourWork');
    expect(fileHours).not.toHaveBeenCalled();
  });

  it('refuses an unmerged PR', async () => {
    getPull.mockResolvedValue({ ...merged, merged_at: null });
    expect(await codeOf(claimGithubWork(input, ctx, strapi()))).toBe('notMerged');
  });

  it('refuses a mission that is not the caller’s', async () => {
    getPull.mockResolvedValue(merged);
    const s = strapi({
      '110getMissionForTimerSave': {
        data: {
          mesimabetahalich: {
            data: { attributes: { project: { data: { id: '3' } }, users_permissions_user: { data: { id: '8' } } } }
          }
        }
      }
    });
    expect(await codeOf(claimGithubWork(input, ctx, s))).toBe('notYourMission');
  });

  it('refuses a repository that is not connected to this rikma', async () => {
    const s = strapi({ githubProjectRepos: { data: { projectRepos: { data: [] } } } });
    expect(await codeOf(claimGithubWork(input, ctx, s))).toBe('notConnected');
  });

  it('refuses a caller with no linked GitHub account', async () => {
    const s = strapi({ githubUserById: { data: { usersPermissionsUser: { data: { attributes: { githubId: null } } } } } });
    expect(await codeOf(claimGithubWork(input, ctx, s))).toBe('notLinked');
  });

  it('refuses hours outside the range before touching anything', async () => {
    const s = strapi();
    expect(await codeOf(claimGithubWork({ ...input, hours: 0 }, ctx, s))).toBe('invalidHours');
    expect(s.execute).not.toHaveBeenCalled();
  });

  it('counts a review only for a reviewer who approved or asked for changes', async () => {
    getPull.mockResolvedValue({ ...merged, user: { id: 5, login: 'author' } });
    listPullReviews.mockResolvedValue([{ state: 'APPROVED', user: { id: 99, login: 'dana' }, submitted_at: '2026-09-09T08:00:00Z' }]);
    expect(await codeOf(claimGithubWork({ ...input, kind: 'review' }, ctx, strapi()))).toBe('ok');

    listPullReviews.mockResolvedValue([{ state: 'COMMENTED', user: { id: 99, login: 'dana' }, submitted_at: '2026-09-09T08:00:00Z' }]);
    expect(await codeOf(claimGithubWork({ ...input, kind: 'review' }, ctx, strapi()))).toBe('notYourWork');
  });

  it('refuses the same work twice', async () => {
    getPull.mockResolvedValue(merged);
    const s = strapi({
      githubProjectLinkedTimers: {
        data: {
          timers: {
            data: [{ attributes: { saveText: 'PR widget#21 — Add badge', saveLinks: url, users_permissions_user: { data: { id: '7' } } } }]
          }
        }
      }
    });
    expect(await codeOf(claimGithubWork(input, ctx, s))).toBe('alreadyClaimed');
  });
});

describe('alreadyClaimed', () => {
  const timer = (userId: string, saveText: string, saveLinks = url) => ({
    attributes: { saveText, saveLinks, users_permissions_user: { data: { id: userId } } }
  });
  const pull = { owner: 'acme', repo: 'widget', number: 21 };

  it('a PR claim and a review claim of the same PR are different work', () => {
    const timers = [timer('7', 'Review widget#21')];
    expect(alreadyClaimed(timers, '7', 'review', pull)).toBe(true);
    expect(alreadyClaimed(timers, '7', 'pull', pull)).toBe(false);
  });

  it('another member’s claim, or an ordinary timer tagged with the PR, is not this claim', () => {
    expect(alreadyClaimed([timer('8', 'PR widget#21')], '7', 'pull', pull)).toBe(false);
    expect(alreadyClaimed([timer('7', 'fixed the tests')], '7', 'pull', pull)).toBe(false);
  });
});
