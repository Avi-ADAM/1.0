import { describe, expect, it, vi } from 'vitest';
import { armValidationClock, closeValidationClocks, matureActValidation } from './validationClock';

function fakeRun(answers: Record<string, any>) {
  const calls: Array<[string, Record<string, unknown>]> = [];
  const run = vi.fn(async (qid: string, vars: Record<string, unknown>) => {
    calls.push([qid, vars]);
    const a = answers[qid];
    return typeof a === 'function' ? a(vars) : a;
  });
  return { run, calls };
}

const state = (attrs: Record<string, any> | null) => ({ data: { act: { data: attrs ? { id: '141', attributes: attrs } : null } } });

const doneAct = {
  shem: 'Bug',
  naasa: true,
  valiIshur: false,
  project: { data: { id: '103' } },
  my: { data: [{ id: '270' }] },
  vali: { data: { id: '271' } },
  fulfillment_step: { data: null }
};

describe('armValidationClock', () => {
  it('closes the old clocks, then opens one due restime from now', async () => {
    const { run, calls } = fakeRun({
      agentActOpenClocks: { data: { timegramas: { data: [{ id: '9' }] } } },
      agentClockClose: {},
      agentActClockCreate: { data: { createTimegrama: { data: { id: '10' } } } }
    });
    const now = Date.parse('2026-11-21T12:00:00Z');
    const out = await armValidationClock(run, '141', 'feh', now);
    expect(out).toEqual({ clockId: '10', dueAt: '2026-11-23T12:00:00.000Z' });
    expect(calls.map((c) => c[0])).toEqual(['agentActOpenClocks', 'agentClockClose', 'agentActClockCreate']);
    expect(calls[1][1]).toEqual({ id: '9' });
  });
});

describe('closeValidationClocks', () => {
  it('closes nothing when nothing is open', async () => {
    const { run } = fakeRun({ agentActOpenClocks: { data: { timegramas: { data: [] } } } });
    expect(await closeValidationClocks(run, '141')).toBe(0);
  });
});

describe('matureActValidation', () => {
  it('validates as the validator and tells both sides', async () => {
    const { run } = fakeRun({ agentActValidationState: state(doneAct) });
    const runAction = vi.fn(async () => ({ success: true }));
    const tell = vi.fn(async () => {});
    expect(await matureActValidation({ run, actId: '141', runAction, tell })).toBe('validated');
    expect(runAction).toHaveBeenCalledWith('updateTask', { id: '141', projectId: '103', valiIshur: true }, '271');
    const notices = (tell.mock.calls[0] as any)[0];
    expect(notices.map((n: any) => n.to)).toEqual([{ userIds: ['270'] }, { userIds: ['271'] }]);
  });

  it('hands an automatic act back to its reminder', async () => {
    const { run } = fakeRun({ agentActValidationState: state({ ...doneAct, fulfillment_step: { data: { id: '5' } } }) });
    const runAction = vi.fn();
    expect(await matureActValidation({ run, actId: '141', runAction, tell: vi.fn() })).toBe('reminder');
    expect(runAction).not.toHaveBeenCalled();
  });

  it('is stale after a "not yet" or once validated, and writes nothing', async () => {
    for (const attrs of [{ ...doneAct, naasa: false }, { ...doneAct, valiIshur: true }, null]) {
      const { run } = fakeRun({ agentActValidationState: state(attrs) });
      const runAction = vi.fn();
      expect(await matureActValidation({ run, actId: '141', runAction, tell: vi.fn() })).toBe('stale');
      expect(runAction).not.toHaveBeenCalled();
    }
  });

  it('leaves the clock for the next run when the write fails', async () => {
    const { run } = fakeRun({ agentActValidationState: state(doneAct) });
    const tell = vi.fn();
    const out = await matureActValidation({ run, actId: '141', runAction: async () => ({ success: false }), tell });
    expect(out).toBe('failed');
    expect(tell).not.toHaveBeenCalled();
  });
});
