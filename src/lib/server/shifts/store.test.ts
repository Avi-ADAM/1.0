/**
 * The shift store against a recording fake transport.
 *
 * The collections are not deployed yet, so these tests are what stands
 * between a typo in a GraphQL document and a 400 in production: every
 * document the store sends must parse, and every variable it declares must be
 * used (Strapi rejects an unused one). The logic tests pin the three decisions
 * the store does make — create vs. update, when `declaredAt` resets, and what
 * a sync may and may not touch.
 */
import { describe, it, expect, vi } from 'vitest';
import { parse } from 'graphql';

vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$lib/server/strapiUrl.js', () => ({ STRAPI_URL: 'http://strapi', STRAPI_GRAPHQL: 'http://strapi/graphql' }));

import {
  activatePlanForPendm,
  commitmentForAsk,
  ensurePeriod,
  loadPeriods,
  loadWindow,
  setAskCommitment,
  syncShifts,
  upsertDeclaration
} from './store';
import type { ShiftExec } from './exec';

interface Call {
  query: string;
  variables?: Record<string, any>;
}

/** A fake Strapi: answers each document by the first matching responder. */
function fake(responders: Array<[RegExp, (v: any) => any]>) {
  const calls: Call[] = [];
  const exec: ShiftExec = async (query, variables) => {
    calls.push({ query, variables });
    const hit = responders.find(([re]) => re.test(query));
    return { data: hit ? hit[1](variables) : {} };
  };
  return { exec, calls };
}

function assertWellFormed(calls: Call[]) {
  for (const c of calls) {
    expect(() => parse(c.query)).not.toThrow();
    const declared = [...c.query.matchAll(/\$(\w+)\s*:/g)].map((m) => m[1]);
    for (const name of declared) {
      const uses = c.query.split(`$${name}`).length - 1;
      expect(uses, `$${name} declared but never used`).toBeGreaterThan(1);
    }
  }
}

const declNode = (id: string, stance: string, declaredAt = '2026-09-01T00:00:00.000Z') => ({
  id,
  attributes: { stance, declaredAt, prefRank: null, shift: { data: { id: '5' } }, users_permissions_user: { data: { id: '7' } } }
});

describe('upsertDeclaration', () => {
  it('creates the first statement with its unique key and the declaration time', async () => {
    const { exec, calls } = fake([
      [/query/, () => ({ shiftAvailabilities: { data: [] } })],
      [/createShiftAvailability/, (v) => ({ createShiftAvailability: { data: declNode('1', v.data.stance, v.data.declaredAt) } })]
    ]);
    const out = await upsertDeclaration(exec, { shiftId: '5', planId: '2', projectId: '3', userId: '7', stance: 'can', now: new Date('2026-09-10T00:00:00Z') });
    const create = calls.find((c) => /createShiftAvailability/.test(c.query))!;
    expect(create.variables!.data).toMatchObject({
      declKey: '5|7',
      stance: 'can',
      declaredAt: '2026-09-10T00:00:00.000Z',
      shift: '5',
      shift_plan: '2',
      project: '3',
      users_permissions_user: '7'
    });
    expect(out.stance).toBe('can');
    assertWellFormed(calls);
  });

  it('resets declaredAt when the stance changes — an early cannot must not win "declared first"', async () => {
    const { exec, calls } = fake([
      [/query/, () => ({ shiftAvailabilities: { data: [declNode('9', 'cannot')] } })],
      [/updateShiftAvailability/, (v) => ({ updateShiftAvailability: { data: declNode('9', v.data.stance, v.data.declaredAt) } })]
    ]);
    await upsertDeclaration(exec, { shiftId: '5', planId: '2', projectId: '3', userId: '7', stance: 'want', now: new Date('2026-09-10T00:00:00Z') });
    const update = calls.find((c) => /updateShiftAvailability/.test(c.query))!;
    expect(update.variables).toMatchObject({ id: '9', data: { stance: 'want', declaredAt: '2026-09-10T00:00:00.000Z' } });
    assertWellFormed(calls);
  });

  it('keeps declaredAt when only the preference rank changes', async () => {
    const { exec, calls } = fake([
      [/query/, () => ({ shiftAvailabilities: { data: [declNode('9', 'want')] } })],
      [/updateShiftAvailability/, (v) => ({ updateShiftAvailability: { data: declNode('9', v.data.stance) } })]
    ]);
    await upsertDeclaration(exec, { shiftId: '5', planId: '2', projectId: '3', userId: '7', stance: 'want', prefRank: 1 });
    const update = calls.find((c) => /updateShiftAvailability/.test(c.query))!;
    expect(update.variables!.data).toEqual({ stance: 'want', prefRank: 1 });
  });
});

describe('syncShifts', () => {
  const inst = (key: string, need = 1) => ({
    slotKey: key,
    start: '2026-10-04T08:00:00.000Z',
    end: '2026-10-04T12:00:00.000Z',
    need,
    tafkidimId: null,
    localDate: '2026-10-04'
  });
  const row = (id: string, key: string, state: string, need = 1) => ({
    id,
    attributes: { slotKey: key, start: '2026-10-04T08:00:00.000Z', end: '2026-10-04T12:00:00.000Z', need, state }
  });

  it('creates what is missing, reopens what came back, cancels only open rows that left', async () => {
    const { exec, calls } = fake([
      [
        /query/,
        () => ({
          shifts: {
            data: [row('1', 'k-back', 'cancelled'), row('2', 'k-gone', 'open'), row('3', 'k-rostered-gone', 'rostered'), row('4', 'k-same', 'open')]
          }
        })
      ]
    ]);
    const r = await syncShifts(exec, { id: '9', projectId: '3' }, [inst('k-new'), inst('k-back'), inst('k-same')], 'a', 'b');
    expect(r).toEqual({ created: 1, reopened: 1, cancelled: 1 });
    const muts = calls.filter((c) => /mutation/.test(c.query));
    expect(muts.find((c) => /createShift/.test(c.query))!.variables!.data).toMatchObject({ slotKey: 'k-new', state: 'open', shift_plan: '9' });
    expect(muts.find((c) => c.variables?.id === '1')!.variables!.data).toMatchObject({ state: 'open' });
    expect(muts.find((c) => c.variables?.id === '2')!.variables!.data).toEqual({ state: 'cancelled' });
    // A rostered shift is never cancelled by a sync — people were told they are coming.
    expect(muts.some((c) => c.variables?.id === '3')).toBe(false);
    assertWellFormed(calls);
  });

  it('updates the size of an open shift the approved pattern changed', async () => {
    const { exec, calls } = fake([[/query/, () => ({ shifts: { data: [row('4', 'k', 'open', 1)] } })]]);
    await syncShifts(exec, { id: '9', projectId: '3' }, [inst('k', 3)], 'a', 'b');
    expect(calls.find((c) => c.variables?.id === '4')!.variables!.data).toMatchObject({ need: 3 });
  });
});

describe('document shape', () => {
  it('loadWindow, loadPeriods (with and without filters) and ensurePeriod send well-formed documents', async () => {
    const { exec, calls } = fake([
      [/rosterPeriods\(filters: \{ periodKey/, () => ({ rosterPeriods: { data: [] } })],
      [/createRosterPeriod/, (v) => ({ createRosterPeriod: { data: { id: '1', attributes: { ...v.data } } } })]
    ]);
    await loadWindow(exec, ['1'], '2026-10-01T00:00:00Z', '2026-10-08T00:00:00Z');
    await loadPeriods(exec, '1');
    await loadPeriods(exec, '1', { states: ['closed'], before: '2026-10-01T00:00:00Z' });
    const { created } = await ensurePeriod(exec, { id: '1', projectId: '3' }, {
      periodKey: '1|x',
      start: '2026-10-04T00:00:00Z',
      end: '2026-10-11T00:00:00Z',
      declareFrom: '2026-09-13T00:00:00Z',
      draftAt: '2026-10-02T00:00:00Z',
      closesAt: '2026-10-03T00:00:00Z'
    });
    expect(created).toBe(true);
    assertWellFormed(calls);
  });
});


describe('the shift commitment (PLAN_SHIFTS §3.8)', () => {
  it('writes the stated commitment on the request, cleaned', async () => {
    const { exec, calls } = fake([]);
    const v = await setAskCommitment(exec, '42', { min: 3, max: 2 });
    // "At least 3, at most 2" cannot be kept; it reads as 3–3.
    expect(v).toEqual({ min: 3, max: 3 });
    expect(calls[0].variables).toEqual({ id: '42', data: { shiftsMin: 3, shiftsMax: 3 } });
    assertWellFormed(calls);
  });

  it('takes the latest negotiation round that states one over the original request', async () => {
    const { exec, calls } = fake([
      [
        /query/,
        () => ({
          ask: {
            data: {
              id: '42',
              attributes: {
                shiftsMin: 1,
                shiftsMax: 2,
                negopendmissions: {
                  data: [
                    { id: '3', attributes: { ordern: 3, shiftsMin: null, shiftsMax: null } },
                    { id: '2', attributes: { ordern: 2, shiftsMin: 2, shiftsMax: 5 } }
                  ]
                }
              }
            }
          }
        })
      ]
    ]);
    expect(await commitmentForAsk(exec, '42')).toEqual({ min: 2, max: 5 });
    assertWellFormed(calls);
  });

  it('falls back to the request, and to nothing when neither says anything', async () => {
    const reqOnly = fake([[/query/, () => ({ ask: { data: { id: '1', attributes: { shiftsMin: null, shiftsMax: 4, negopendmissions: { data: [] } } } } })]]);
    expect(await commitmentForAsk(reqOnly.exec, '1')).toEqual({ min: null, max: 4 });
    const none = fake([[/query/, () => ({ ask: { data: { id: '1', attributes: { negopendmissions: { data: [] } } } } })]]);
    expect(await commitmentForAsk(none.exec, '1')).toBeNull();
  });

  it('activates the plan that waited on a proposal, on the mission it became', async () => {
    const { exec, calls } = fake([[/shiftPlans\(filters: \{ pendm/, () => ({ shiftPlans: { data: [{ id: '7' }] } })]]);
    expect(await activatePlanForPendm(exec, '55', '99')).toEqual(['7']);
    const update = calls.find((c) => /updateShiftPlan/.test(c.query))!;
    expect(update.variables).toEqual({ id: '7', data: { open_mission: '99', status: 'active' } });
    assertWellFormed(calls);
  });
});
