import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/deal/offerDeal.js', () => ({
  loadOfferDeal: vi.fn(async () => null),
  notifyDealClients: vi.fn(async () => undefined)
}));
vi.mock('$lib/server/fulfillment/roleRules', () => ({ acceptShownRoleRules: vi.fn(async () => []) }));
vi.mock('$lib/server/shifts/mode.js', () => ({ shiftsEnabled: () => false }));

const { applyToMissionConfig, findStandingAsk } = await import('./applyToMission');

/**
 * One standing candidacy per person per opening: user 270 held Asks 183 and 184
 * on open mission 302, same terms, both open, and the members' updates counted
 * the candidate twice. A second call now returns the Ask already on the table.
 */

const APPLICANT = '270';
const OWNER = '271';

function world(standing: { id: string; archived?: boolean | null; lapsedAt?: string | null }[] = []) {
  const asks = [...standing];
  const calls: string[] = [];
  let nextId = 183;
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push(qid);
      switch (qid) {
        case '128getProjectMembersAndRestime':
          return { data: { project: { data: { attributes: { restime: 'feh', user_1s: { data: [{ id: OWNER }, { id: '272' }] } } } } } };
        case '80usersPermissionsUserWithAskeds':
          return { data: { usersPermissionsUser: { data: { attributes: { askeds: { data: [] } } } } } };
        case 'standingAskByUserAndMission':
          expect(vars).toEqual({ uid: APPLICANT, omId: '302' });
          return { data: { asks: { data: asks.map((a) => ({ id: a.id, attributes: { archived: a.archived ?? false, lapsedAt: a.lapsedAt ?? null } })) } } };
        case '81.5createAsk': {
          const id = String(nextId++);
          asks.push({ id });
          return { data: { createAsk: { data: { id } } } };
        }
        default:
          return { data: {} };
      }
    })
  };
  return { strapi, calls };
}

const run = (w: ReturnType<typeof world>) =>
  (applyToMissionConfig.graphqlOperation as any)(
    { openMissionId: '302', projectId: '105' },
    { userId: APPLICANT, jwt: 'jwt', fetch: vi.fn() },
    { strapi: w.strapi, notifier: {} }
  );

describe('applyToMission — one standing candidacy per opening', () => {
  it('the second call returns the existing Ask and creates nothing', async () => {
    const w = world();
    const first = await run(w);
    expect(first.data.askId).toBe('183');
    expect(first.data.alreadyApplied).toBeUndefined();

    const second = await run(w);
    expect(second.data).toMatchObject({
      askId: '183',
      alreadyApplied: true,
      voteUrl: '/moach/105/votes/ask/183'
    });
    expect(second.data.message).toMatch(/Already applied/);
    expect(w.calls.filter((q) => q === '81.5createAsk')).toHaveLength(1);
    expect(w.calls.filter((q) => q === '81updateAskeds')).toHaveLength(1);
    expect(w.calls.filter((q) => q === '82createTimegramaForAsk')).toHaveLength(0);
  });

  it('a lapsed or archived Ask does not block a new candidacy', async () => {
    const w = world([
      { id: '90', lapsedAt: '2026-11-01T00:00:00Z' },
      { id: '91', archived: true }
    ]);
    const out = await run(w);
    expect(out.data.alreadyApplied).toBeUndefined();
    expect(out.data.askId).toBe('183');
  });

  it('a repeat call notifies nobody; a real one does', () => {
    const when = applyToMissionConfig.notification!.when!;
    expect(when({}, { data: { askId: '183', alreadyApplied: true } })).toBe(false);
    expect(when({}, { data: { askId: '183' } })).toBe(true);
  });

  it('findStandingAsk is null when there is no open Ask', async () => {
    expect(await findStandingAsk(world().strapi, { userId: APPLICANT }, '302')).toBeNull();
  });
});
