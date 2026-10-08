/**
 * timerSave — what a save is allowed to overwrite on the timer it closes.
 *
 * The save is the only write that touches every field of a timer at once, and
 * three of them (the acts, the links, the files) belong to the member rather
 * than to the save: a caller that says nothing about them must leave them
 * alone. The acts got this wrong for a long time — `tasks: params.tasks || []`
 * sent an empty relation on every save that carried no list, and an empty
 * relation *replaces*, so saving from the bot silently unlinked every act the
 * member had attached from the dialog beforehand.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/archive/gql.js', () => ({
  run: vi.fn(async () => ({
    timer: {
      data: {
        attributes: {
          rate: 100,
          saved: false,
          totalHours: 2,
          timers: [{ start: '2026-09-01T08:00:00.000Z', stop: '2026-09-01T10:00:00.000Z' }],
          saveFiles: { data: [] }
        }
      }
    }
  }))
}));
vi.mock('$lib/server/archive/exec.js', () => ({ execFromContext: () => vi.fn() }));
vi.mock('$lib/server/archive/dormancyClock.js', () => ({ touchDormancy: vi.fn(async () => null) }));

import { timerSaveConfig } from './timerSave.js';
import { run } from '$lib/server/archive/gql.js';

const handler = timerSaveConfig.graphqlOperation as (
  params: Record<string, any>,
  context: any,
  util: any
) => Promise<any>;

const context = { userId: '7', jwt: 'jwt', fetch: (() => {}) as any };

/** A one-member mission, so the save writes a FinnishedMission and no vote. */
const missionResponse = {
  data: {
    mesimabetahalich: {
      data: {
        id: '42',
        attributes: {
          name: 'Ship the timer card',
          howmanyhoursalready: 5,
          totalHoursSaved: 12,
          perhour: 100,
          project: { data: { id: '3', attributes: { user_1s: { data: [{ id: '7' }] }, restime: 'feh' } } },
          users_permissions_user: { data: { id: '7' } },
          mission: { data: { id: '9' } },
          finnished_missions: { data: [] }
        }
      }
    }
  }
};

function fakeStrapi() {
  const execute = vi.fn(async (qid: string) => {
    if (qid === '110getMissionForTimerSave') return missionResponse;
    return { data: {} };
  });
  return { execute };
}

/** The variables the save sent to the timer write. */
function timerWriteVars(strapi: { execute: ReturnType<typeof vi.fn> }) {
  const call = strapi.execute.mock.calls.find((c) => c[0] === '34UpdateTimer');
  expect(call, 'the save never wrote the timer').toBeTruthy();
  return call![1] as Record<string, any>;
}

const baseParams = {
  missionId: '42',
  projectId: '3',
  userId: '7',
  timerId: '55',
  sessionHoursTotal: 2
};

describe('timerSave — the acts these hours are attributed to', () => {
  let strapi: ReturnType<typeof fakeStrapi>;

  beforeEach(() => {
    strapi = fakeStrapi();
  });

  it('leaves the timer’s acts alone when the caller sends no list', async () => {
    await handler({ ...baseParams }, context, { strapi });
    expect(timerWriteVars(strapi)).not.toHaveProperty('tasks');
  });

  it('files the acts the caller did send', async () => {
    await handler({ ...baseParams, tasks: ['5', 6] }, context, { strapi });
    expect(timerWriteVars(strapi).tasks).toEqual(['5', '6']);
  });

  it('treats an empty list as "unlink them all", not as silence', async () => {
    await handler({ ...baseParams, tasks: [] }, context, { strapi });
    expect(timerWriteVars(strapi).tasks).toEqual([]);
  });
});

describe('timerSave — the note and the evidence follow the same rule', () => {
  it('sends neither links nor files when the caller mentions neither', async () => {
    const strapi = fakeStrapi();
    await handler({ ...baseParams }, context, { strapi });
    const vars = timerWriteVars(strapi);
    expect(vars).not.toHaveProperty('saveLinks');
    expect(vars).not.toHaveProperty('saveFiles');
  });

  it('carries the note and the normalized links onto the timer', async () => {
    const strapi = fakeStrapi();
    await handler(
      { ...baseParams, saveText: '  closed the card  ', saveLinks: ['1lev1.com/pr/1'] },
      context,
      { strapi }
    );
    const vars = timerWriteVars(strapi);
    expect(vars.saveText).toBe('closed the card');
    expect(vars.saveLinks).toBe('https://1lev1.com/pr/1');
  });
});

/** Every qid the save sent that writes something. */
function writes(strapi: { execute: ReturnType<typeof vi.fn> }) {
  return strapi.execute.mock.calls.map((c) => c[0]).filter((qid: string) => qid !== '110getMissionForTimerSave');
}

describe('timerSave — the same hours are never filed twice', () => {
  it('refuses a timer that is already saved, and writes nothing', async () => {
    vi.mocked(run).mockResolvedValueOnce({
      timer: { data: { attributes: { rate: 100, saved: true, totalHours: 2, timers: [], saveFiles: { data: [] } } } }
    });
    const strapi = fakeStrapi();
    const res = await handler({ ...baseParams }, context, { strapi });
    expect(res).toMatchObject({ success: true, alreadySaved: true });
    expect(writes(strapi)).toEqual([]);
  });

  it('refuses to save blind when the timer cannot be read (a retry under a flaky Strapi)', async () => {
    vi.mocked(run).mockRejectedValueOnce(new Error('ETIMEDOUT'));
    const strapi = fakeStrapi();
    await expect(handler({ ...baseParams }, context, { strapi })).rejects.toThrow(/nothing was saved/);
    expect(strapi.execute).not.toHaveBeenCalled();
  });

  it('refuses a second save of the same timer while the first is still filing', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const slow = fakeStrapi();
    slow.execute.mockImplementation(async (qid: string) => {
      if (qid === '34UpdateTimer') await gate;
      if (qid === '110getMissionForTimerSave') return missionResponse;
      return { data: {} };
    });
    const first = handler({ ...baseParams }, context, { strapi: slow });

    const retry = fakeStrapi();
    await expect(handler({ ...baseParams }, context, { strapi: retry })).rejects.toThrow(/already being saved/);
    expect(retry.execute).not.toHaveBeenCalled();

    release();
    await expect(first).resolves.toMatchObject({ success: true });
    // …and once it is done, the timer is free again (the next save reads `saved`).
    await expect(handler({ ...baseParams }, context, { strapi: fakeStrapi() })).resolves.toMatchObject({ success: true });
  });

  it('says where the hours went', async () => {
    const res = await handler({ ...baseParams }, context, { strapi: fakeStrapi() });
    expect(res).toMatchObject({ success: true, missionId: '42', filed: 'finnishedMission' });
  });
});
