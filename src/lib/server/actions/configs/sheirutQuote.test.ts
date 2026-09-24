import { describe, it, expect, beforeEach } from 'vitest';
import {
  quoteSheirutpendConfig,
  acceptSheirutQuoteConfig,
  getSheirutpendQuoteConfig
} from './sheirutQuote';
import { addVoteConfig } from './addVote';
import type { ActionExecutionHandler } from '../types';

const CUSTOMER = '7';
const GROCER = '3';

/** An in-memory Strapi holding one product request — enough for the quote flow. */
function fakeStrapi(opts: { price: number | null; members?: string[] }) {
  const members = opts.members ?? [GROCER];
  const db: any = {
    req: { price: opts.price, quant: 1, total: opts.price, archived: false, appruved: false, sheirut: null, forum: null },
    negos: [] as any[],
    votes: [] as any[],
    clock: null as null | { id: string; date: string },
    chat: [] as string[],
    created: [] as any[]
  };
  let tick = 0;
  const node = () => ({
    id: '42',
    attributes: {
      ...db.req,
      users_permissions_user: { data: { id: CUSTOMER, attributes: { username: 'c' } } },
      project: {
        data: {
          id: '5',
          attributes: { projectName: 'מכולת', restime: 'feh', user_1s: { data: members.map((id) => ({ id })) } }
        }
      },
      forum: { data: db.req.forum ? { id: db.req.forum } : null },
      sheirut: { data: db.req.sheirut ? { id: db.req.sheirut, attributes: { isApruved: true } } : null },
      matanots: { data: [{ id: '9', attributes: { name: 'משלוח מכולת', pricingMode: 'quote' } }] },
      sheirutnegos: { data: db.negos },
      votes: { data: db.votes }
    }
  });
  const strapi = {
    async execute(qid: string, v: any = {}) {
      switch (qid) {
        case '360getSheirutpendQuote':
          return { data: { sheirutpend: { data: node() } } };
        case '361createSheirutnego':
          db.negos.push({
            id: String(db.negos.length + 1),
            attributes: {
              price: v.price,
              quant: v.quant,
              createdAt: new Date(Date.UTC(2026, 8, 24, 10, tick++)).toISOString(),
              users_permissions_user: { data: { id: v.userId } }
            }
          });
          return { data: { createSheirutnego: { data: { id: String(db.negos.length) } } } };
        case '73updateSheirutpend':
          Object.assign(db.req, v.data);
          return { data: { updateSheirutpend: { data: { id: '42' } } } };
        case '86addVoteToSheirutpend_v2':
          db.votes.push({ id: String(db.votes.length + 1), attributes: { what: v.what, order: v.order, users_permissions_user: { data: { id: v.user } } } });
          return { data: { createVote: { data: { id: '1' } } } };
        case '362getActiveTimegramaForSheirutpend':
          return { data: { timegramas: { data: db.clock ? [{ id: db.clock.id, attributes: { date: db.clock.date } }] : [] } } };
        case '297createTimegramaForSheirutpend':
          db.clock = { id: '600', date: v.date };
          return { data: { createTimegrama: { data: { id: '600' } } } };
        case 'mrResetTimegrama':
          db.clock = { id: v.id, date: v.date };
          return {};
        case '2forumCrBasic':
          return { data: { createForum: { data: { id: '50' } } } };
        case '2linkForumToSheirutpend':
          db.req.forum = v.forumId;
          return {};
        case '1chatsend':
          db.chat.push(v.mes);
          return {};
        // createSheirutFromPending
        case '72getSheirutpendById':
          return {
            data: {
              sheirutpend: {
                data: {
                  id: '42',
                  attributes: {
                    ...db.req,
                    users_permissions_user: { data: { id: CUSTOMER } },
                    matanots: node().attributes.matanots,
                    votes: { data: db.votes }
                  }
                }
              }
            }
          };
        case '87createSheirut':
          db.created.push(v.data);
          return { data: { createSheirut: { data: { id: '77' } } } };
        case '3projectJSONQue':
          return { data: { project: { data: { attributes: { user_1s: { data: members.map((id) => ({ id })) } } } } } };
        default:
          throw new Error(`unexpected qid ${qid}`);
      }
    }
  };
  return { db, strapi };
}

const ctx = (userId: string) => ({ userId, jwt: 'jwt', fetch: undefined as any, lang: 'he' }) as any;
const run = (cfg: any, params: any, userId: string, strapi: any) =>
  (cfg.graphqlOperation as ActionExecutionHandler)(params, ctx(userId), { strapi } as any);

describe('price quotes on a product request', () => {
  let env: ReturnType<typeof fakeStrapi>;

  describe('an open-price grocery order', () => {
    beforeEach(() => {
      env = fakeStrapi({ price: null });
    });

    it('cannot be approved before the shop names a price', async () => {
      await expect(
        run(addVoteConfig, { type: 'sheirutpend', id: '42', projectId: '5' }, GROCER, env.strapi)
      ).rejects.toThrow(/price first/i);
    });

    it('the shop quotes: a round, mirrored terms, its signature, a clock and a chat line', async () => {
      const out: any = await run(quoteSheirutpendConfig, { sheirutpendId: '42', price: 85, note: 'כולל משלוח' }, GROCER, env.strapi);
      expect(out.recipientIds).toEqual([CUSTOMER]);
      expect(env.db.req).toMatchObject({ price: 85, quant: 1, total: 85 });
      expect(env.db.negos).toHaveLength(1);
      expect(env.db.votes.map((v: any) => [v.attributes.users_permissions_user.data.id, v.attributes.order])).toEqual([[GROCER, 1]]);
      expect(env.db.clock).not.toBeNull();
      expect(env.db.chat[0]).toContain('85');
      expect(env.db.chat[0]).toContain('כולל משלוח');
    });

    it('the shop cannot close its own quote with an approve — it is hers to answer', async () => {
      await run(quoteSheirutpendConfig, { sheirutpendId: '42', price: 85 }, GROCER, env.strapi);
      await expect(
        run(addVoteConfig, { type: 'sheirutpend', id: '42', projectId: '5' }, GROCER, env.strapi)
      ).rejects.toThrow(/customer/i);
    });

    it('she accepts: a one-member shop has signed, so the deal is made at 85', async () => {
      await run(quoteSheirutpendConfig, { sheirutpendId: '42', price: 85 }, GROCER, env.strapi);
      const out: any = await run(acceptSheirutQuoteConfig, { sheirutpendId: '42' }, CUSTOMER, env.strapi);
      expect(out.data.settled).toBe(true);
      expect(env.db.created[0]).toMatchObject({ price: 85, total: 85, isApruved: true });
      expect(env.db.req).toMatchObject({ appruved: true, archived: true, sheirut: '77' });
    });

    it('she counters instead: the turn goes back to the shop, which can now approve her version', async () => {
      await run(quoteSheirutpendConfig, { sheirutpendId: '42', price: 85 }, GROCER, env.strapi);
      const out: any = await run(quoteSheirutpendConfig, { sheirutpendId: '42', price: 75 }, CUSTOMER, env.strapi);
      expect(out.recipientIds).toEqual([GROCER]);
      const read: any = await run(getSheirutpendQuoteConfig, { sheirutpendId: '42' }, GROCER, env.strapi);
      expect(read.data.state).toMatchObject({ order: 2, price: 75, turn: 'provider' });
      expect(read.data.side).toBe('provider');
      // The shop's approve signs round 2 and makes the Sheirut at her price.
      await run(addVoteConfig, { type: 'sheirutpend', id: '42', projectId: '5' }, GROCER, env.strapi);
      expect(env.db.created[0]).toMatchObject({ price: 75, total: 75 });
    });

    it('only the two sides may speak', async () => {
      await expect(
        run(quoteSheirutpendConfig, { sheirutpendId: '42', price: 1 }, '99', env.strapi)
      ).rejects.toThrow(/customer or a member/i);
      await expect(
        run(acceptSheirutQuoteConfig, { sheirutpendId: '42' }, GROCER, env.strapi)
      ).rejects.toThrow();
    });

    it('there is nothing to accept while the price is open', async () => {
      await expect(
        run(acceptSheirutQuoteConfig, { sheirutpendId: '42' }, CUSTOMER, env.strapi)
      ).rejects.toThrow(/no price/i);
    });
  });

  it('a rikma of several members still signs after she accepts', async () => {
    env = fakeStrapi({ price: null, members: [GROCER, '4'] });
    await run(quoteSheirutpendConfig, { sheirutpendId: '42', price: 85 }, GROCER, env.strapi);
    const out: any = await run(acceptSheirutQuoteConfig, { sheirutpendId: '42' }, CUSTOMER, env.strapi);
    expect(out.data.settled).toBe(false);
    expect(env.db.created).toHaveLength(0);
    // The second member's approve closes it, at the price she accepted.
    await run(addVoteConfig, { type: 'sheirutpend', id: '42', projectId: '5' }, '4', env.strapi);
    expect(env.db.created[0]).toMatchObject({ price: 85 });
  });

  it('a priced request from /gift is approved exactly as before', async () => {
    env = fakeStrapi({ price: 20 });
    await run(addVoteConfig, { type: 'sheirutpend', id: '42', projectId: '5' }, GROCER, env.strapi);
    expect(env.db.created[0]).toMatchObject({ price: 20 });
  });
});
