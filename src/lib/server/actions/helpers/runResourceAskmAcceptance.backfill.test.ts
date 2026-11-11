import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/recurring/settleBackfill', () => ({
  settleBackfill: vi.fn(async (_s: unknown, _c: unknown, input: { cycles: unknown[] }) => input.cycles.length),
  votsFromRequest: vi.fn(() => [])
}));

import { settleBackfill } from '$lib/server/recurring/settleBackfill';
import { activateRecurringEngine } from './runResourceAskmAcceptance';

const context = { jwt: 'j', fetch: vi.fn() } as any;
const args = { projectId: '7', resourceName: 'Rent', maapId: '40', openMashaabimId: '55' };

function strapiWith(backfill: unknown) {
  return {
    execute: vi.fn(async (qid: string) => {
      if (qid === 'mrGetPmashRecurringTerms') return { data: { pmashes: { data: [] } } };
      if (qid === 'mrGetOpenMashaabimRecurringTerms') {
        return {
          data: {
            openMashaabim: {
              data: {
                id: '55',
                attributes: { recurring: true, kindOf: 'monthly', price: 100, sqadualed: '2026-01-15T10:00:00.000Z', backfill }
              }
            }
          }
        };
      }
      if (qid === 'mrCreateMashabetahalich') return { data: { createMashabetahalich: { data: { id: '30' } } } };
      return { data: {} };
    })
  } as any;
}

const offered = { cycles: [{ key: '2026-02', amount: 100 }], forUser: '258' };

describe('past cycles of a resource offered to another member', () => {
  beforeEach(() => {
    vi.mocked(settleBackfill).mockClear();
  });

  it('books them for the member they were entered for', async () => {
    await activateRecurringEngine(strapiWith(offered), context, { ...args, acceptedUserId: '258' });
    expect(settleBackfill).toHaveBeenCalledTimes(1);
    const input = vi.mocked(settleBackfill).mock.calls[0][2];
    expect(input.cycles.map((c) => c.key)).toEqual(['2026-02']);
    expect(input.mashAttrs.users_permissions_user).toEqual({ data: { id: '258' } });
  });

  it('never hands them to somebody else who took the resource', async () => {
    await activateRecurringEngine(strapiWith(offered), context, { ...args, acceptedUserId: '261' });
    expect(settleBackfill).not.toHaveBeenCalled();
  });

  it('ignores a table that names nobody', async () => {
    await activateRecurringEngine(strapiWith({ cycles: offered.cycles }), context, { ...args, acceptedUserId: '258' });
    expect(settleBackfill).not.toHaveBeenCalled();
  });
});
