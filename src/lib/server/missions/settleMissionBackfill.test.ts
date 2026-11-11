import { describe, expect, it, vi } from 'vitest';
import { missionBackfillCycles } from '$lib/recurring/missionBackfill';
import { settleMissionBackfill, settleOpenMissionBackfill } from './settleMissionBackfill';

const now = new Date(2026, 10, 11);
const anchor = new Date(2026, 0, 1).toISOString();
const table = {
  cycles: [
    { key: '2026-01', amount: 10 },
    { key: '2026-02', amount: 5 }
  ]
};
const target = {
  missionId: '30',
  projectId: '7',
  templateId: '4',
  name: 'Bookkeeping',
  userId: '256',
  rate: 100,
  plannedHours: 20,
  now
};

function runner(openMission: Record<string, unknown> | null = null) {
  return vi.fn(async (qid: string) => {
    if (qid === 'getOpenMissionBackfill') return { data: { openMission: { data: { attributes: openMission } } } };
    return { data: { createFinnishedMission: { data: { id: '900' } } } };
  });
}

const offer = {
  backfill: table,
  iskvua: true,
  isRishon: true,
  sqadualed: anchor,
  rishon: { data: { id: '256' } }
};

describe('settleMissionBackfill', () => {
  it('books the hours once and files every month, in one request', async () => {
    const run = runner();
    const cycles = missionBackfillCycles(table, { anchor, now });
    await expect(settleMissionBackfill(run, { ...target, cycles })).resolves.toBe(2);

    expect(run).toHaveBeenCalledTimes(1);
    const [qid, vars] = run.mock.calls[0] as unknown as [string, any];
    expect(qid).toBe('settleMissionBackfill');
    expect(vars).toMatchObject({ id: '30', totalHoursSaved: 15 });
    expect(vars.data).toMatchObject({ noofhours: 15, perhour: 100, total: 1500, mesimabetahalich: '30', mission: '4', users_permissions_user: '256' });
    expect(vars.monter).toEqual([
      { monthStart: '2026-01-01', hours: 20, isDone: true, hoursDone: 10 },
      { monthStart: '2026-02-01', hours: 20, isDone: true, hoursDone: 5 }
    ]);
  });

  it('writes nothing when no month qualifies', async () => {
    const run = runner();
    await expect(settleMissionBackfill(run, { ...target, cycles: [] })).resolves.toBe(0);
    expect(run).not.toHaveBeenCalled();
  });

  it('says so when the row was not created', async () => {
    const run = vi.fn(async () => ({ data: {} }));
    const cycles = missionBackfillCycles(table, { anchor, now });
    await expect(settleMissionBackfill(run, { ...target, cycles })).rejects.toThrow(/past months/);
  });
});

describe('settleOpenMissionBackfill', () => {
  const input = { ...target, openMissionId: '55' };

  it('books the table of the proposer own offer', async () => {
    const run = runner(offer);
    await expect(settleOpenMissionBackfill(run, input)).resolves.toBe(2);
    expect(run.mock.calls[1][0]).toBe('settleMissionBackfill');
  });

  it('measures the months against the agreed start, not the proposed one', async () => {
    const run = runner(offer);
    await expect(
      settleOpenMissionBackfill(run, { ...input, start: new Date(2026, 1, 1).toISOString() })
    ).resolves.toBe(1);
  });

  it('never hands the table to somebody else who took the mission', async () => {
    const run = runner({ ...offer, rishon: { data: { id: '258' } } });
    await expect(settleOpenMissionBackfill(run, input)).resolves.toBe(0);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('ignores an offer with no table or one that is no longer assigned', async () => {
    await expect(settleOpenMissionBackfill(runner({ ...offer, backfill: null }), input)).resolves.toBe(0);
    await expect(settleOpenMissionBackfill(runner({ ...offer, isRishon: false }), input)).resolves.toBe(0);
  });

  it('leaves the acceptance standing when the write fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const run = vi.fn(async (qid: string) => {
      if (qid === 'getOpenMissionBackfill') return { data: { openMission: { data: { attributes: offer } } } };
      throw new Error('strapi down');
    });
    await expect(settleOpenMissionBackfill(run, input)).resolves.toBe(0);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
