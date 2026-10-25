import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/utils/projectHelpers.js', () => ({
  createProjectInfo: () => ({ noof: 3, projectName: 'הרקמה', src2: '' }),
  createUserInfo: () => ({ username: 'דנה', src: '', uid: '9' }),
  getProjectMembers: () => [],
  getProjectUsers: () => [],
  getProjectRestime: () => 'feh'
}));

const P = await import('./levProcessors');
const { WHEN_KINDS } = await import('$lib/components/lev/cards/cardKinds.js');

/**
 * PLAN_LEV_TIMESTAMPS T2: every kind whose source already carries `createdAt`
 * says when it reached me, and none of them invents a date it does not have.
 */

const AT = '2026-10-06T11:30:00.000Z';

// The smallest raw record each processor accepts. The processors spread raw
// data over their own fields, so `createdAt` here is exactly what the
// extractor hands over.
const raw = (extra: Record<string, unknown> = {}) => ({
  id: '1',
  projectId: '5',
  myid: '2',
  users: [],
  vots: [],
  diun: [],
  chat: [],
  name: 'x',
  ...extra
});

const cases: [string, (createdAt?: string) => any[]][] = [
  ['pends', (c) => P.processPends([raw({ createdAt: c })] as any, [])],
  ['askedcoin', (c) => P.processAsked([raw({ createdAt: c })] as any, [])],
  ['askedm', (c) => P.processAskedResources([raw({ createdAt: c })] as any, [])],
  ['pmashes', (c) => P.processPmashes([raw({ createdAt: c })] as any, [])],
  ['wegets', (c) => P.processWegets([raw({ createdAt: c })] as any, [])],
  ['hachla', (c) => P.processDecisions([raw({ createdAt: c, kind: 'pic' })] as any, [])],
  [
    'archObject',
    (c) => P.processDecisions([raw({ createdAt: c, kind: 'archiveObject', archive: null })] as any, [])
  ],
  [
    'stipend',
    (c) => P.processDecisions([raw({ createdAt: c, kind: 'stipendPledge', stipend: null })] as any, [])
  ],
  [
    'promotion',
    (c) => P.processDecisions([raw({ createdAt: c, kind: 'promotion', promo: null })] as any, [])
  ],
  ['sheirutp', (c) => P.processProductRequests([raw({ createdAt: c })] as any, [])],
  ['wishoffer', (c) => P.processWishOffers([raw({ createdAt: c })] as any, [])]
];

describe('itemWhen', () => {
  it('normalises a date to ISO', () => {
    expect(P.itemWhen(AT)).toEqual({ at: AT });
    expect(P.itemWhen(Date.parse(AT))).toEqual({ at: AT });
  });

  it('never invents one', () => {
    for (const bad of [undefined, null, '', 'garbage', {}, NaN]) {
      expect(P.itemWhen(bad)).toBeUndefined();
    }
  });
});

describe('processors set `when` from createdAt', () => {
  it('covers exactly the kinds cardKinds has sentences for', () => {
    expect(cases.map(([ani]) => ani).sort()).toEqual([...WHEN_KINDS].sort());
  });

  for (const [ani, run] of cases) {
    it(ani, () => {
      const [item] = run(AT);
      expect(item.ani).toBe(ani);
      expect(item.when).toEqual({ at: AT });

      const [bare] = run(undefined);
      expect(bare.when).toBeUndefined();
    });
  }
});
