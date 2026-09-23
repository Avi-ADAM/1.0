/**
 * The roster engine end to end, against an in-memory Strapi.
 *
 * The store is replaced by a small in-memory model; everything else — the
 * pattern, the settings, the draft, the balance — is the real code. The test
 * walks one weekly cycle through its whole life, then checks the properties
 * the engine promises: idempotent at every step, and shadow mode writes
 * nothing that binds anyone.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

interface Row {
  [k: string]: any;
}
const db = {
  seq: 1,
  shifts: [] as Row[],
  periods: [] as Row[],
  declarations: [] as Row[],
  assignments: [] as Row[],
  plan: {} as Row,
  commitments: [] as Row[],
  timegramas: [] as Row[],
  recruited: [] as string[]
};
const id = () => String(db.seq++);
const inRange = (iso: string, from: string, to: string) => iso >= from && iso < to;
const shiftOf = (sid: string) => db.shifts.find((s) => s.id === sid)!;

vi.mock('./store.js', () => ({
  loadProjectTiming: async () => ({}),
  syncShifts: async (_e: unknown, plan: Row, instances: Row[]) => {
    let created = 0;
    for (const inst of instances) {
      if (db.shifts.some((s) => s.slotKey === inst.slotKey)) continue;
      db.shifts.push({ id: id(), slotKey: inst.slotKey, start: inst.start, end: inst.end, need: inst.need, state: 'open', planId: plan.id, periodId: null, tafkidimId: null });
      created++;
    }
    return { created, reopened: 0, cancelled: 0 };
  },
  ensurePeriod: async (_e: unknown, plan: Row, w: Row) => {
    const found = db.periods.find((p) => p.periodKey === w.periodKey);
    if (found) return { period: { ...found }, created: false };
    const p = { id: id(), planId: plan.id, periodKey: w.periodKey, start: w.start, end: w.end, closesAt: w.closesAt, state: 'open', seed: null, holes: 0, quotaSnapshot: null, timegramaId: null, draftedAt: null, closedAt: null };
    db.periods.push(p);
    return { period: { ...p }, created: true };
  },
  loadWindow: async (_e: unknown, _ids: string[], from: string, to: string) => {
    const shifts = db.shifts.filter((s) => inRange(s.start, from, to)).map((s) => ({ ...s }));
    const ids = new Set(shifts.map((s) => s.id));
    return {
      shifts,
      declarations: db.declarations.filter((d) => ids.has(d.shiftId)).map((d) => ({ ...d })),
      assignments: db.assignments.filter((a) => ids.has(a.shiftId)).map((a) => ({ ...a }))
    };
  },
  attachShifts: async (_e: unknown, periodId: string, ids: string[]) => {
    for (const sid of ids) shiftOf(sid).periodId = periodId;
  },
  loadCommitments: async () => db.commitments.map((c) => ({ ...c })),
  createAssignment: async (_e: unknown, a: Row) => {
    const row = { id: id(), ...a, periodId: a.periodId };
    db.assignments.push(row);
    return row;
  },
  updateAssignment: async (_e: unknown, aid: string, data: Row) => Object.assign(db.assignments.find((a) => a.id === aid)!, data),
  setShift: async (_e: unknown, sid: string, data: Row) => Object.assign(shiftOf(sid), data),
  updatePeriod: async (_e: unknown, pid: string, data: Row) => Object.assign(db.periods.find((p) => p.id === pid)!, data),
  updatePlan: async (_e: unknown, _pid: string, data: Row) => Object.assign(db.plan, data),
  loadPeriod: async (_e: unknown, pid: string) => ({ ...db.periods.find((p) => p.id === pid) }),
  loadPeriods: async () => db.periods.filter((p) => p.state === 'closed').map((p) => ({ ...p })),
  loadPlan: async () => ({ plan: { ...db.plan }, project: {} }),
  recruitOneMore: async (_e: unknown, omId: string) => {
    db.recruited.push(omId);
    return { howMeny: 3 };
  },
  markPeriodReopened: async (_e: unknown, period: Row, at: string) => {
    Object.assign(db.periods.find((p) => p.id === period.id)!, { quotaSnapshot: { ...(period.quotaSnapshot ?? {}), reopenedAt: at } });
  }
}));
vi.mock('$lib/server/matching/engine', () => ({ matchOpenMissionToUsers: async () => ({}) }));
vi.mock('$lib/server/actions/index.js', () => ({ strapiClient: {} }));
vi.mock('./exec.js', () => ({
  run: async (_e: unknown, _q: string, label: string, vars: Row) => {
    if (label === 'createTimegrama') db.timegramas.push(vars.data);
    return {};
  }
}));

import { matureRosterPeriod, tickPlan } from './engine';

// Cycle of Sunday 4 Oct 2026 (Jerusalem): starts 3 Oct 21:00Z.
// Draft 48h before (1 Oct 21:00Z), objections close 24h later (2 Oct 21:00Z).
const CYCLE_KEY = 'plan|2026-10-03T21:00:00.000Z';
const T = {
  declaring: new Date('2026-09-20T09:00:00Z'),
  draft: new Date('2026-10-02T09:00:00Z'),
  closed: new Date('2026-10-03T09:00:00Z')
};

function reset(mode: 'on' | 'shadow' = 'on') {
  db.seq = 1;
  db.shifts = [];
  db.periods = [];
  db.declarations = [];
  db.assignments = [];
  db.timegramas = [];
  db.recruited = [];
  db.plan = {
    id: 'plan',
    projectId: 'p1',
    openMissionId: 'om1',
    name: 'Front desk',
    pattern: { version: 1, days: [{ dow: 0, windows: [{ start: '11:00', end: '15:00', need: 1 }] }, { dow: 1, windows: [{ start: '11:00', end: '15:00', need: 1 }] }] },
    timezone: 'Asia/Jerusalem',
    status: 'active',
    lifecycle: null,
    archived: false,
    balanceCache: null,
    cycleDays: null, horizonDays: null, closeOffsetHours: null, draftWindowHours: null, declareOpenDays: null,
    maxBackups: null, minRestHours: null, carryDecay: null, fairness: 'commitments'
  };
  db.commitments = [
    { userId: 'ron', mesimabetahalichId: 'mb-ron', min: null, max: null, tafkidimIds: [] },
    { userId: 'dana', mesimabetahalichId: 'mb-dana', min: null, max: null, tafkidimIds: [] }
  ];
  return { exec: (async () => ({})) as any, mode };
}

const cyclePeriod = () => db.periods.find((p) => p.periodKey === CYCLE_KEY)!;
const cycleShifts = () => db.shifts.filter((s) => s.start >= '2026-10-03T21:00:00.000Z' && s.start < '2026-10-10T21:00:00.000Z');

function declareAll() {
  const [sun, mon] = cycleShifts();
  db.declarations.push(
    { shiftId: sun.id, userId: 'ron', stance: 'can', declaredAt: '2026-09-21T00:00:00Z', prefRank: null },
    { shiftId: mon.id, userId: 'ron', stance: 'can', declaredAt: '2026-09-21T00:00:00Z', prefRank: null },
    { shiftId: sun.id, userId: 'dana', stance: 'want', declaredAt: '2026-09-22T00:00:00Z', prefRank: null }
  );
}

describe('the life of one cycle (SHIFTS=on)', () => {
  let ctx: ReturnType<typeof reset>;
  beforeEach(() => {
    ctx = reset('on');
  });

  it('opens the cycle for declarations and materializes its shifts', async () => {
    const r = await tickPlan({ ...ctx, now: T.declaring }, db.plan as any);
    expect(r.errors).toEqual([]);
    expect(cyclePeriod().state).toBe('open');
    expect(cycleShifts()).toHaveLength(2);
    expect(db.assignments).toEqual([]);
  });

  it('publishes the draft at draftAt, once, with a closing clock', async () => {
    await tickPlan({ ...ctx, now: T.declaring }, db.plan as any);
    declareAll();
    const r = await tickPlan({ ...ctx, now: T.draft }, db.plan as any);
    expect(r.errors).toEqual([]);
    const p = cyclePeriod();
    expect(p.state).toBe('draft');
    expect(p.seed).toBe(CYCLE_KEY);
    expect(p.quotaSnapshot.quotas).toEqual({ ron: 1, dana: 1 });
    const [sun, mon] = cycleShifts();
    const primary = (sid: string) => db.assignments.find((a) => a.shiftId === sid && a.rank === 1)!;
    // Monday only Ron can do; Sunday goes to Dana (wants it, and Ron's quota is spent on Monday).
    expect(primary(mon.id)).toMatchObject({ userId: 'ron', state: 'draft', source: 'auto', mesimabetahalichId: 'mb-ron' });
    expect(primary(sun.id)).toMatchObject({ userId: 'dana' });
    expect(db.assignments.find((a) => a.shiftId === sun.id && a.rank === 2)).toMatchObject({ userId: 'ron', reason: 'backup' });
    expect(db.timegramas).toEqual([{ date: p.closesAt, whatami: 'roster_period', roster_period: p.id }]);

    // The next hourly run changes nothing.
    const before = db.assignments.length;
    await tickPlan({ ...ctx, now: T.draft }, db.plan as any);
    expect(db.assignments.length).toBe(before);
  });

  it('closes the roster at closesAt: confirmed, rostered, balance moved', async () => {
    await tickPlan({ ...ctx, now: T.declaring }, db.plan as any);
    declareAll();
    await tickPlan({ ...ctx, now: T.draft }, db.plan as any);
    const r = await tickPlan({ ...ctx, now: T.closed }, db.plan as any);
    expect(r.closed).toEqual([{ periodId: cyclePeriod().id, holes: 0 }]);
    expect(cyclePeriod().state).toBe('closed');
    expect(db.assignments.every((a) => a.state === 'confirmed')).toBe(true);
    expect(cycleShifts().every((s) => s.state === 'rostered')).toBe(true);
    // Both took exactly their quota: the balance is even.
    expect(db.plan.balanceCache).toEqual({ ron: 0, dana: 0 });
  });

  it('the timegrama and the cron can both reach the close — it happens once', async () => {
    await tickPlan({ ...ctx, now: T.declaring }, db.plan as any);
    declareAll();
    await tickPlan({ ...ctx, now: T.draft }, db.plan as any);
    expect(await matureRosterPeriod(cyclePeriod().id, { ...ctx, now: T.closed })).toBe('closed');
    expect(await matureRosterPeriod(cyclePeriod().id, { ...ctx, now: T.closed })).toBe('already');
    const r = await tickPlan({ ...ctx, now: T.closed }, db.plan as any);
    expect(r.closed).toEqual([]);
  });

  it('counts the holes a cycle closes with', async () => {
    await tickPlan({ ...ctx, now: T.declaring }, db.plan as any);
    // Nobody declares for Monday.
    const [sun] = cycleShifts();
    db.declarations.push({ shiftId: sun.id, userId: 'dana', stance: 'can', declaredAt: '2026-09-22T00:00:00Z' });
    await tickPlan({ ...ctx, now: T.draft }, db.plan as any);
    expect(cyclePeriod().holes).toBe(1);
    await tickPlan({ ...ctx, now: T.closed }, db.plan as any);
    expect(cyclePeriod().holes).toBe(1);
    // Silence is consent: nobody took the hole, so the mission recruits one more.
    expect(db.recruited).toEqual(['om1']);
    expect(cyclePeriod().quotaSnapshot.reopenedAt).toBeTruthy();
  });

  it('does not recruit twice when a member already opened the mission this cycle', async () => {
    await tickPlan({ ...ctx, now: T.declaring }, db.plan as any);
    await tickPlan({ ...ctx, now: T.draft }, db.plan as any);
    cyclePeriod().quotaSnapshot = { ...cyclePeriod().quotaSnapshot, reopenedAt: '2026-10-02T10:00:00Z' };
    await tickPlan({ ...ctx, now: T.closed }, db.plan as any);
    expect(db.recruited).toEqual([]);
  });

  it('does not recruit when the cycle closes fully covered', async () => {
    await tickPlan({ ...ctx, now: T.declaring }, db.plan as any);
    declareAll();
    await tickPlan({ ...ctx, now: T.draft }, db.plan as any);
    await tickPlan({ ...ctx, now: T.closed }, db.plan as any);
    expect(db.recruited).toEqual([]);
  });

  it('does not roster a cycle that was already running when first seen', async () => {
    // A plan created on Tuesday 6 Oct: that week is not rostered after the fact.
    await tickPlan({ ...ctx, now: new Date('2026-10-06T09:00:00Z') }, db.plan as any);
    expect(cyclePeriod().state).toBe('cancelled');
    expect(db.assignments).toEqual([]);
  });

  it('skips a paused or mission-less plan', async () => {
    expect((await tickPlan({ ...ctx, now: T.draft }, { ...db.plan, status: 'paused' } as any)).skipped).toBe('inactive');
    expect((await tickPlan({ ...ctx, now: T.draft }, { ...db.plan, openMissionId: null } as any)).skipped).toBe('no mission');
  });
});

describe('SHIFTS=shadow', () => {
  it('computes and keeps the roster for inspection, but writes nothing that binds', async () => {
    const ctx = reset('shadow');
    await tickPlan({ ...ctx, now: T.declaring }, db.plan as any);
    declareAll();
    await tickPlan({ ...ctx, now: T.draft }, db.plan as any);
    const p = cyclePeriod();
    expect(p.state).toBe('draft');
    expect(db.assignments).toEqual([]);
    expect(db.timegramas).toEqual([]);
    expect(p.quotaSnapshot.shadow.filter((a: Row) => a.rank === 1)).toHaveLength(2);

    await tickPlan({ ...ctx, now: T.closed }, db.plan as any);
    expect(cyclePeriod().state).toBe('closed');
    expect(cyclePeriod().holes).toBe(0);
    expect(db.plan.balanceCache).toBeNull();
    expect(cycleShifts().every((s) => s.state === 'open')).toBe(true);
  });
});
