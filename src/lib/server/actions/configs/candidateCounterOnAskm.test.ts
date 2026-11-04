import { describe, expect, it, vi } from 'vitest';

/** A candidate round speaks for the candidate — nobody else may add one. */

vi.mock('../../nego/timegrama.js', () => ({ cancelCandidacyTimegrama: vi.fn(async () => {}) }));
vi.mock('$lib/server/deal/offerDeal.js', () => ({ notifyDealClientsOfCounter: vi.fn(async () => {}) }));

import { candidateCounterOnAskmConfig } from './candidateCounterOnAskm';
import type { ActionExecutionHandler } from '../types';

const counter = candidateCounterOnAskmConfig.graphqlOperation as ActionExecutionHandler;

function world(taker = '9') {
  const qids: string[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string) => {
      qids.push(qid);
      if (qid === 'getAskmForFinalize') {
        return { data: { askm: { data: { id: '40', attributes: { archived: false, users_permissions_user: { data: { id: taker } } } } } } };
      }
      return { data: {} };
    })
  };
  return { strapi, qids };
}

const ctx = (userId: string) => ({ userId, jwt: 'j' }) as any;

describe('candidateCounterOnAskm', () => {
  it('lets the candidate add a round', async () => {
    const w = world();
    const res: any = await counter(
      { askmId: '40', projectId: '5', ordern: 0, newValues: { price: 100 } },
      ctx('9'),
      { strapi: w.strapi, notifier: null } as any
    );
    expect(res.data.ordern).toBe(1);
    expect(w.qids).toContain('negoCreateNegoMashRound');
  });

  it('refuses anyone else', async () => {
    const w = world();
    await expect(
      counter({ askmId: '40', projectId: '5', ordern: 0, newValues: {} }, ctx('2'), { strapi: w.strapi, notifier: null } as any)
    ).rejects.toThrow(/Only the candidate/);
    expect(w.qids).not.toContain('negoCreateNegoMashRound');
  });
});
