/**
 * Writes that moved off /api/send into actions (PLAN_REALTIME_MIGRATION B9):
 * the checks they gained on the way.
 */
import { describe, it, expect } from 'vitest';
import { ensureMissionForumConfig } from './ensureMissionForum';
import { linkTelegramConfig } from './linkTelegram';

function strapi(responses: Record<string, any>) {
  const calls: Array<[string, any]> = [];
  return {
    calls,
    execute: async (qid: string, vars: any) => {
      calls.push([qid, vars]);
      return responses[qid] ?? { data: {} };
    }
  };
}
const ctx = { userId: '5', jwt: 'j', fetch: () => {} };
const run = (config: any, params: any, s: any) => config.graphqlOperation(params, ctx, { strapi: s });

describe('ensureMissionForum', () => {
  const mission = (projectId: string) => ({
    '110getMissionForTimerSave': { data: { mesimabetahalich: { data: { id: '3', attributes: { project: { data: { id: projectId } } } } } } },
    '2forumCr': { data: { createForum: { data: { id: '44' } } } }
  });

  it("opens the forum on the mission, in the mission's own rikma", async () => {
    const s = strapi(mission('7'));
    const res = await run(ensureMissionForumConfig, { missionId: '3', projectId: '7' }, s);
    expect(res.data.forumId).toBe('44');
    expect(s.calls.find(([q]) => q === '2forumCr')?.[1]).toMatchObject({ pid: '7', mbId: ['3'] });
  });

  it("refuses a mission of another rikma — a member can't hang a forum on it", async () => {
    const s = strapi(mission('8'));
    await expect(run(ensureMissionForumConfig, { missionId: '3', projectId: '7' }, s)).rejects.toThrow(/does not belong/);
    expect(s.calls.some(([q]) => q === '2forumCr')).toBe(false);
  });

  it('requires membership of the rikma', () => {
    expect(ensureMissionForumConfig.authRules?.some((r: any) => r.type === 'projectMember')).toBe(true);
  });
});

describe('linkTelegram', () => {
  it("writes the caller's own row, whatever the client sends", async () => {
    const s = strapi({});
    await run(linkTelegramConfig, { telegramId: '123456', uid: '999' }, s);
    expect(s.calls[0]).toEqual(['6addTelegram', { uid: '5', telegramId: '123456' }]);
  });

  it('accepts only a numeric Telegram id', async () => {
    const s = strapi({});
    await expect(run(linkTelegramConfig, { telegramId: '12; drop' }, s)).rejects.toThrow(/Invalid/);
    expect(s.calls).toHaveLength(0);
  });
});
