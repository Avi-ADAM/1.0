import { describe, it, expect } from 'vitest';
import {
  buildCosignRequests,
  judgeCosignRequest,
  normalizeVia,
  COSIGN_MAX_SKEW_MS,
  COSIGN_MAX_SESSION_MS,
  type CosignRequest
} from './cosign';
import { deriveConsentEventFromAction } from '$lib/client/shadowSign';
import { timeTickConsentSpec, s2bShadowJobs } from './specs/s2b';

const NOW = Date.parse('2026-10-30T10:00:00.000Z');
const iso = (ms: number) => new Date(ms).toISOString();

const startParams = {
  missionId: '41',
  projectId: '7',
  userId: '256',
  timerId: '0',
  isActive: true,
  start: iso(NOW),
  timers: [{ start: iso(NOW) }]
};
const startResult = { createTimer: { data: { id: '900' } } };

const stopParams = {
  timerId: '900',
  projectId: '7',
  userId: '256',
  isActive: false,
  timers: [{ start: iso(NOW - 3_600_000), stop: iso(NOW) }]
};

describe('buildCosignRequests', () => {
  it('turns a fresh start into one request on the new timer', () => {
    const [req, ...rest] = buildCosignRequests('timerStart', startParams, startResult, {
      userId: '256',
      via: 'telegram'
    });
    expect(rest).toEqual([]);
    expect(req).toEqual({
      v: 1,
      action: 'time.tick',
      actor: '256',
      projectId: '7',
      via: 'telegram',
      params: { timerId: '900', op: 'start', order: NOW, fresh: true, missionId: '41' }
    });
  });

  it('turns a stop into a request carrying the closed session', () => {
    const [req] = buildCosignRequests('timerStop', stopParams, null, { userId: '256', via: 'mcp' });
    expect(req.params).toEqual({ timerId: '900', op: 'stop', order: NOW, sessionMs: 3_600_000 });
  });

  it('asks nothing for actions outside the clock, manual timers or edits', () => {
    const opts = { userId: '256', via: 'telegram' as const };
    expect(buildCosignRequests('createMission', {}, { missionId: '1' }, opts)).toEqual([]);
    expect(buildCosignRequests('timerStart', { ...startParams, manual: true }, startResult, opts)).toEqual([]);
    expect(buildCosignRequests('timerStop', { ...stopParams, isActive: true }, null, opts)).toEqual([]);
  });
});

describe('judgeCosignRequest', () => {
  const req = (over: Partial<CosignRequest> = {}, params: Record<string, unknown> = {}): CosignRequest =>
    ({
      v: 1,
      action: 'time.tick',
      actor: '256',
      projectId: '7',
      via: 'telegram',
      ...over,
      params: { timerId: '900', op: 'stop', order: NOW, sessionMs: 3_600_000, ...params }
    }) as CosignRequest;
  const ctx = { deviceUserId: '256', now: NOW + 5_000 };

  it('signs exactly what a tab would have signed, plus via', () => {
    const j = judgeCosignRequest(req(), ctx);
    expect(j.ok).toBe(true);
    const tab = deriveConsentEventFromAction(timeTickConsentSpec, s2bShadowJobs.timerStop(stopParams, {})[0].params);
    expect(j.spaceId).toBe('project:7');
    expect(j.partial?.subject).toEqual(tab!.subject);
    expect(j.partial?.predicate).toEqual({ ...tab!.predicate, via: 'telegram' });
  });

  it('refuses another member, an unknown channel, and actions beyond the clock', () => {
    expect(judgeCosignRequest(req({ actor: '258' }), ctx).reason).toBe('not_this_member');
    expect(judgeCosignRequest(req({ via: 'cron' as never }), ctx).reason).toBe('unknown_via');
    expect(judgeCosignRequest(req({ action: 'mission.approve' as never }), ctx).reason).toBe('action_not_cosignable');
    expect(judgeCosignRequest(null, ctx).reason).toBe('bad_request');
  });

  it('refuses a tick far from its own clock, either way', () => {
    expect(judgeCosignRequest(req({}, { order: NOW - COSIGN_MAX_SKEW_MS - 10_000 }), ctx).reason).toBe('stale');
    expect(judgeCosignRequest(req({}, { order: NOW + COSIGN_MAX_SKEW_MS + 10_000 }), ctx).reason).toBe('stale');
  });

  it('bounds the session it attests to', () => {
    expect(judgeCosignRequest(req({}, { sessionMs: COSIGN_MAX_SESSION_MS + 1 }), ctx).reason).toBe('bad_session');
    expect(judgeCosignRequest(req({}, { sessionMs: -1 }), ctx).reason).toBe('bad_session');
    expect(judgeCosignRequest(req({}, { op: 'start' }), ctx).reason).toBe('bad_session');
  });

  it('refuses ids that are not plain ids', () => {
    expect(judgeCosignRequest(req({ projectId: '7/../x' }), ctx).reason).toBe('bad_project');
    expect(judgeCosignRequest(req({}, { timerId: '' }), ctx).reason).toBe('bad_timer');
    expect(judgeCosignRequest(req({}, { op: 'pause' }), ctx).reason).toBe('bad_op');
  });

  it('round-trips what the server builds', () => {
    for (const r of [
      ...buildCosignRequests('timerStart', startParams, startResult, { userId: '256', via: 'assistant' }),
      ...buildCosignRequests('timerStop', stopParams, null, { userId: '256', via: 'mcp' })
    ]) {
      expect(judgeCosignRequest(r, ctx).ok).toBe(true);
    }
  });
});

describe('normalizeVia', () => {
  it('knows only the channels it co-signs', () => {
    expect(normalizeVia('telegram')).toBe('telegram');
    expect(normalizeVia('Telegram')).toBe(null);
    expect(normalizeVia(undefined)).toBe(null);
  });
});
