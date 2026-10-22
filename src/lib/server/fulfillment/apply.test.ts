/**
 * The engine's server half, the parts that are not `planFulfillment`
 * (PLAN_SHOP_OPERATIONS A2): which steps of an order are done, the routing
 * state, the open-mission link — and acts that follow a status that moved
 * elsewhere, so a chain never waits for a stale card.
 */
import { describe, it, expect, vi } from 'vitest';
import { doneStepsOf, openMissionHref, routingStateOf, settleEffectActs } from './apply';

describe('doneStepsOf', () => {
  it('a step is done for the order when all of its acts are', () => {
    expect(
      doneStepsOf([
        { externalId: 'order:57:pi_1:step:3', naasa: true },
        { externalId: 'order:57:pi_1:step:4:line:1', naasa: true },
        { externalId: 'order:57:pi_1:step:4:line:2', naasa: false },
        { externalId: null, naasa: true }
      ])
    ).toEqual(['3']);
  });
});

describe('routingStateOf', () => {
  it('counts open acts per holder and remembers each step’s last assignee', () => {
    const act = (id: number, step: string, uid: string | null, naasa = false) => ({
      id,
      attributes: { naasa, my: { data: uid ? [{ id: uid }] : [] }, fulfillment_step: { data: { id: step } } }
    });
    // Newest first, as the qid sorts.
    const state = routingStateOf([act(9, '3', '7'), act(8, '3', '8', true), act(7, '4', '8'), act(6, '3', '8')]);
    expect(state.load.get('7')).toBe(1);
    expect(state.load.get('8')).toBe(2);
    expect(state.lastAssignee.get('3')).toBe('7');
    expect(state.lastAssignee.get('4')).toBe('8');
  });
});

describe('openMissionHref', () => {
  it('opens the mission form named for the role, linked back to the act', () => {
    const href = openMissionHref('57', 'משלוחן', '300');
    expect(href.startsWith('moach/57/create?')).toBe(true);
    const q = new URLSearchParams(href.split('?')[1]);
    expect(q.get('action')).toBe('createmission');
    expect(q.get('name')).toBe('משלוחן');
    expect(q.get('roles')).toBe('משלוחן');
    expect(q.get('fromAct')).toBe('300');
  });
});

describe('settleEffectActs', () => {
  const act = (id: string, effect: string, per = 'order', naasa = false) => ({
    id,
    attributes: { naasa, externalId: `order:57:pi_1:step:${id}`, fulfillment_step: { data: { id: `s${id}`, attributes: { effect, per } } } }
  });

  function setup(acts: any[] | Error) {
    const calls: string[] = [];
    const strapi = {
      execute: vi.fn(async (qid: string) => {
        calls.push(qid);
        if (qid === 'fulfillmentOrderEffectActs') {
          if (acts instanceof Error) throw acts;
          return { data: { acts: { data: acts } } };
        }
        // The chain: no steps deployed here, so the engine stops at once.
        if (qid === 'fulfillmentSteps') throw new Error('not deployed');
        throw new Error(`unexpected qid ${qid}`);
      })
    };
    const runAction = vi.fn(async () => ({ success: true }));
    return { strapi, runAction, calls };
  }

  const input = (t: ReturnType<typeof setup>, status: 'shipped' | 'fulfilled') => ({
    projectId: '57',
    orderId: '900',
    status,
    context: { userId: '7' } as any,
    strapi: t.strapi,
    runAction: t.runAction
  });

  it('shipped closes the order acts that were there to ship it — and runs the chain', async () => {
    const t = setup([act('1', 'markShipped'), act('2', 'markFulfilled'), act('3', 'none'), act('4', 'markShipped', 'line'), act('5', 'markShipped', 'order', true)]);
    const out = await settleEffectActs(input(t, 'shipped'));
    expect(out.done).toEqual(['1']);
    expect(t.runAction).toHaveBeenCalledTimes(1);
    expect(t.runAction).toHaveBeenCalledWith('updateTask', { id: '1', projectId: '57', naasa: true }, expect.anything());
    expect(t.calls).toContain('fulfillmentSteps');
  });

  it('a delivered order is past its shipping too', async () => {
    const t = setup([act('1', 'markShipped'), act('2', 'markFulfilled')]);
    expect((await settleEffectActs(input(t, 'fulfilled'))).done).toEqual(['1', '2']);
  });

  it('nothing to close, or nothing deployed: no writes, no chain', async () => {
    const none = setup([act('3', 'none')]);
    expect((await settleEffectActs(input(none, 'shipped'))).done).toEqual([]);
    expect(none.calls).not.toContain('fulfillmentSteps');
    const old = setup(new Error('Cannot query field "fulfillment_step"'));
    expect((await settleEffectActs(input(old, 'shipped'))).done).toEqual([]);
    expect(old.runAction).not.toHaveBeenCalled();
  });

  it('an act that cannot be closed stays open — its card still completes it', async () => {
    const t = setup([act('1', 'markShipped'), act('2', 'markShipped')]);
    t.runAction.mockResolvedValueOnce({ success: false } as any);
    expect((await settleEffectActs(input(t, 'shipped'))).done).toEqual(['2']);
  });
});
