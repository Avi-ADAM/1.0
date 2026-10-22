/**
 * getFulfillmentWork's rule cards (PLAN_SHOP_OPERATIONS §2.3): a rule that
 * lands on me waits for my answer — and so does my own rule once someone it
 * lands on countered it, because the counter's round asks me back.
 */
import { describe, expect, it } from 'vitest';
import { getFulfillmentWorkConfig } from './fulfillment';

const rel = (id: string | null, attributes: Record<string, unknown> = {}) => ({ data: id ? { id, attributes } : null });

function step(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    attributes: {
      name: `rule ${id}`,
      target: 'member',
      member: rel('7', { username: 'יוסי' }),
      consentState: 'proposed',
      consentedBy: { data: [] },
      archived: false,
      per: 'order',
      effect: 'markShipped',
      when: { event: 'order.paid' },
      proposedBy: rel('1', { username: 'דנה' }),
      project: rel('57', { projectName: 'הרקמה' }),
      ...over
    }
  };
}

const vote = (uid: string, username: string, what: boolean | null, order: number, zman: string | null, why: string | null = null) => ({
  what,
  order,
  why,
  zman,
  ide: Number(uid),
  users_permissions_user: rel(uid, { username })
});

function strapiWith(steps: any[], decisions: any[]) {
  return {
    async execute(qid: string) {
      switch (qid) {
        case 'fulfillmentMyActs':
          return { data: { acts: { data: [] } } };
        case 'fulfillmentMyRuleSteps':
          return { data: { fulfillmentSteps: { data: steps } } };
        case 'fulfillmentMyMissions':
          return { data: { mesimabetahaliches: { data: [] } } };
        case 'fulfillmentRuleDeadlines':
          return { data: { decisions: { data: decisions } } };
        default:
          throw new Error(`unexpected qid ${qid}`);
      }
    }
  };
}

const decision = (stepId: string, vots: any[]) => ({
  id: `d${stepId}`,
  attributes: {
    fulfillmentStep: rel(stepId),
    timegrama: rel('t', { date: '2026-10-25T09:00:00.000Z', done: false }),
    vots
  }
});

const work = async (uid: string, steps: any[], decisions: any[]) => {
  const handler = getFulfillmentWorkConfig.graphqlOperation as (...args: any[]) => Promise<unknown>;
  const res = await handler({}, { userId: uid }, { strapi: strapiWith(steps, decisions) });
  return (res as any).data.proposals as any[];
};

describe('rule cards — getFulfillmentWork', () => {
  const R1 = '2026-10-20T10:00:00.000Z';
  const R2 = '2026-10-21T10:00:00.000Z';

  it('the author gets a card once the member it lands on countered — who and why', async () => {
    const votes = [vote('1', 'דנה', true, 1, R1), vote('7', 'יוסי', null, 1, null), vote('7', 'יוסי', true, 2, R2, 'רק עד 10 ביום'), vote('1', 'דנה', null, 2, null)];
    const [card, ...rest] = await work('1', [step('5')], [decision('5', votes)]);
    expect(rest).toEqual([]);
    expect(card).toMatchObject({ stepId: '5', counter: { byName: 'יוסי', why: 'רק עד 10 ביום' }, deadline: '2026-10-25T09:00:00.000Z' });
  });

  it('no card for my own rule while nobody countered it, or once I answered', async () => {
    const proposed = [vote('1', 'דנה', true, 1, R1), vote('7', 'יוסי', null, 1, null)];
    expect(await work('1', [step('5')], [decision('5', proposed)])).toEqual([]);
    const answered = [...proposed, vote('7', 'יוסי', true, 2, R2), vote('1', 'דנה', true, 2, R2)];
    expect(await work('1', [step('5')], [decision('5', answered)])).toEqual([]);
  });

  it('the member it lands on still gets the ordinary card, with no counter', async () => {
    const votes = [vote('1', 'דנה', true, 1, R1), vote('7', 'יוסי', null, 1, null)];
    const [card] = await work('7', [step('5')], [decision('5', votes)]);
    expect(card).toMatchObject({ stepId: '5', proposedByName: 'דנה' });
    expect(card.counter).toBeUndefined();
  });
});
