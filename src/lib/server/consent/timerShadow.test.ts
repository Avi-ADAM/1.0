// The timer half of the shadow comparison (A2 batch 2): the chain's declared
// sessions against Strapi's interval list, for timers opened on the chain.

import { describe, it, expect } from 'vitest';
import type { ConsentEvent } from '$lib/consent/event';
import { project } from '$lib/consent/projection';
import { freshTimerIds, closedIntervalsMs, compareTimers } from '$lib/consent/timerShadow';
import { validateShadowReport } from '$lib/consent/shadowTelemetry';
import { s2bShadowJobs } from '$lib/consent/specs/s2b';
import { deriveConsentEventFromAction } from '$lib/client/shadowSign';
import { parseTimerIds, timersQuery, timerTotalsFromRest, MAX_TIMER_IDS } from './timersExport';

const iso = (h: number, m = 0) => new Date(Date.UTC(2026, 9, 30, h, m)).toISOString();
let seq = 0;

/** Run a shadow job through derive → event, the way the browser signs it. */
function signed(jobs: ReturnType<(typeof s2bShadowJobs)[string]>, ts: number): ConsentEvent {
  const t = deriveConsentEventFromAction(jobs[0].spec, jobs[0].params)!;
  return {
    v: 1, id: `t${++seq}`, actor: '256', device: 'd', action: t.action, subject: t.subject,
    predicate: t.predicate, parents: [], ts, nonce: 'n', sig: 's'
  } as ConsentEvent;
}

describe('closedIntervalsMs', () => {
  it('sums closed intervals in exact ms and leaves a running one out', () => {
    expect(closedIntervalsMs([{ start: iso(9), stop: iso(10, 30) }, { start: iso(11) }])).toBe(90 * 60_000);
  });
  it('survives junk', () => {
    expect(closedIntervalsMs(null)).toBe(0);
    expect(closedIntervalsMs([{ start: 'x', stop: iso(9) }, { start: iso(10), stop: iso(9) }, null])).toBe(0);
  });
});

describe('a timer from start to compare', () => {
  const startJobs = s2bShadowJobs.timerStart(
    { missionId: 'M9', projectId: '45', timerId: '0', start: iso(9) },
    { createTimer: { data: { id: '71' } } }
  );
  const strapiIntervals = [{ start: iso(9), stop: iso(10) }, { start: iso(11), stop: iso(11, 15) }];
  const events = [
    signed(startJobs, Date.parse(iso(9))),
    signed(s2bShadowJobs.timerStop({ timerId: '71', projectId: '45', isActive: false, timers: strapiIntervals.slice(0, 1) }, {}), Date.parse(iso(10))),
    signed(s2bShadowJobs.timerStart({ projectId: '45', timerId: '71', newStart: iso(11) }, {}), Date.parse(iso(11))),
    signed(s2bShadowJobs.timerStop({ timerId: '71', projectId: '45', isActive: false, timers: strapiIntervals }, {}), Date.parse(iso(11, 15)))
  ];

  it('the chain and Strapi agree to the millisecond', () => {
    const state = project(events, '45');
    const fresh = freshTimerIds(events);
    expect([...fresh]).toEqual(['71']);
    const strapi = new Map([['71', closedIntervalsMs(strapiIntervals)]]);
    expect(compareTimers(state.timers, fresh, strapi)).toEqual({ compared: 1, mismatches: [] });
  });

  it('an edit the chain never saw (TimeEditor) is a timer mismatch', () => {
    const state = project(events, '45');
    const edited = new Map([['71', closedIntervalsMs(strapiIntervals) + 5 * 60_000]]);
    const r = compareTimers(state.timers, freshTimerIds(events), edited);
    expect(r.mismatches).toEqual([
      { kind: 'timer', member: '71', chain: String(75 * 60_000), strapi: String(80 * 60_000) }
    ]);
    // …and the server accepts it as a well-formed report line
    expect(validateShadowReport({ v: 1, pid: '45', events: 4, compared: 1, mismatches: r.mismatches })).not.toBeNull();
  });

  it('a resumed legacy timer is not compared — its first hours predate the chain', () => {
    const legacy = [signed(s2bShadowJobs.timerStart({ projectId: '45', timerId: '50', newStart: iso(9) }, {}), 1)];
    expect(freshTimerIds(legacy).size).toBe(0);
    expect(compareTimers(project(legacy, '45').timers, freshTimerIds(legacy), new Map([['50', 999]])).compared).toBe(0);
  });

  it('a timer Strapi did not answer for (another rikma) is not counted', () => {
    const state = project(events, '45');
    expect(compareTimers(state.timers, freshTimerIds(events), new Map()).compared).toBe(0);
  });
});

describe('timersExport', () => {
  it('parses ids: numeric, unique, capped', () => {
    expect(parseTimerIds('3, 1,x,3,,1e2')).toEqual(['3', '1']);
    expect(parseTimerIds(null)).toEqual([]);
    const many = Array.from({ length: 150 }, (_, i) => String(i + 1)).join(',');
    expect(parseTimerIds(many)).toHaveLength(MAX_TIMER_IDS);
  });

  it('asks for the named timers of one rikma only', () => {
    const q = timersQuery('45', ['71', '72']);
    expect(q.startsWith('/api/timers?')).toBe(true);
    expect(q).toContain('filters[project][id][$eq]=45');
    expect(q).toContain('filters[id][$in][0]=71');
    expect(q).toContain('filters[id][$in][1]=72');
    expect(q).toContain('populate[timers][fields][1]=stop');
  });

  it('reads totals from the v4 REST shape', () => {
    const body = {
      data: [
        { id: 71, attributes: { isActive: false, timers: [{ id: 1, start: iso(9), stop: iso(10) }] } },
        { id: 72, attributes: { isActive: true, timers: [{ id: 2, start: iso(9), stop: null }] } },
        { attributes: {} }
      ]
    };
    expect(timerTotalsFromRest(body)).toEqual([
      { id: '71', ms: 3_600_000 },
      { id: '72', ms: 0 }
    ]);
    expect(timerTotalsFromRest(null)).toEqual([]);
  });
});
