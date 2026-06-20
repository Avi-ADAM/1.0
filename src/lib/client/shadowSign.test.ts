import { describe, it, expect } from 'vitest';
import { deriveConsentEventFromAction, shadowSignFromCookie } from './shadowSign';
import type { ConsentSpec } from '$lib/server/actions/types';

const tosplitVoteSpec: ConsentSpec = {
  action: 'tosplit.vote',
  subjectType: 'tosplit',
  subjectIdParam: 'tosplitId',
  requireConsensus: true,
  restimeFrom: 'project'
};

// The real spec from src/lib/server/actions/configs/addVote.ts — covered by
// "addVote poly-action dispatch" below.
const addVoteSpec: ConsentSpec = {
  action: (params: Record<string, unknown>) => {
    const type = params.type as string | undefined;
    if (type === 'tosplit')     return 'tosplit.vote';
    if (type === 'pend')        return 'pendm.vote';
    if (type === 'sheirutpend') return 'sheirutpend.vote';
    if (type === 'ask')         return 'ask.vote';
    if (type === 'decision')    return 'decision.vote';
    if (type === 'weFinnish')   return 'mission.approve.vote';
    return null;
  },
  subjectType: (params: Record<string, unknown>) => String(params.type ?? 'unknown'),
  subjectIdParam: 'id',
  requireConsensus: true,
  restimeFrom: 'project',
  predicateFromParams: (params) => ({
    what: params.what ?? true,
    why: params.why,
    order: params.order ?? 0
  })
};

describe('deriveConsentEventFromAction — pure mapping', () => {
  it('extracts subject id from the named param', () => {
    const ev = deriveConsentEventFromAction(tosplitVoteSpec, {
      tosplitId: 'ts-42',
      what: true,
      why: 'looks fair'
    });
    expect(ev.subject).toEqual({ type: 'tosplit', id: 'ts-42' });
    expect(ev.action).toBe('tosplit.vote');
  });

  it('drops the subject id from predicate (no duplication)', () => {
    const ev = deriveConsentEventFromAction(tosplitVoteSpec, {
      tosplitId: 'ts-42',
      what: true
    });
    expect(ev.predicate).not.toHaveProperty('tosplitId');
    expect(ev.predicate?.what).toBe(true);
  });

  it('drops userId from predicate (actor is from session, not payload)', () => {
    const ev = deriveConsentEventFromAction(tosplitVoteSpec, {
      tosplitId: 'ts-42',
      userId: 'spoofed-user',
      what: true
    });
    expect(ev.predicate).not.toHaveProperty('userId');
  });

  it('coerces non-string subject ids to string', () => {
    const ev = deriveConsentEventFromAction(tosplitVoteSpec, {
      tosplitId: 42,
      what: true
    });
    expect(ev.subject.id).toBe('42');
  });

  it('throws on missing subject id', () => {
    expect(() => deriveConsentEventFromAction(tosplitVoteSpec, { what: true })).toThrow(
      /missing subject id/
    );
  });

  it('throws on null subject id', () => {
    expect(() =>
      deriveConsentEventFromAction(tosplitVoteSpec, { tosplitId: null, what: true })
    ).toThrow();
  });

  it('honors a custom predicateFromParams', () => {
    const spec: ConsentSpec = {
      ...tosplitVoteSpec,
      predicateFromParams: (p) => ({ vote: p.what, reason: p.why })
    };
    const ev = deriveConsentEventFromAction(spec, {
      tosplitId: 'ts-7',
      what: false,
      why: 'unfair split'
    });
    expect(ev.predicate).toEqual({ vote: false, reason: 'unfair split' });
  });

  it('honors a custom parentsFromParams', () => {
    const spec: ConsentSpec = {
      ...tosplitVoteSpec,
      parentsFromParams: (p) => [String(p.proposalEventId)]
    };
    const ev = deriveConsentEventFromAction(spec, {
      tosplitId: 'ts-7',
      what: true,
      proposalEventId: 'ev-create-123'
    });
    expect(ev.parents).toEqual(['ev-create-123']);
  });

  it('defaults parents to empty array', () => {
    const ev = deriveConsentEventFromAction(tosplitVoteSpec, {
      tosplitId: 'ts-7',
      what: true
    });
    expect(ev.parents).toEqual([]);
  });

  it('handles the typical addVote (tosplit) params end-to-end', () => {
    // What the existing addVote action actually accepts for tosplit branches
    // (per src/lib/server/actions/configs/addVote.ts).
    const ev = deriveConsentEventFromAction(tosplitVoteSpec, {
      tosplitId: 'ts-42',
      type: 'tosplit',
      what: true,
      why: 'agreed',
      order: 0
    });
    expect(ev!.action).toBe('tosplit.vote');
    expect(ev!.subject).toEqual({ type: 'tosplit', id: 'ts-42' });
    expect(ev!.predicate).toEqual({
      type: 'tosplit',
      what: true,
      why: 'agreed',
      order: 0
    });
  });
});

describe('addVoteConsentSpec — imported from shared specs module', () => {
  it('routes the 6 vote branches identically to the duplicated inline spec', async () => {
    // This regression test exists to catch silent drift if someone edits the
    // shared spec but forgets to update tests, or vice versa.
    const { addVoteConsentSpec } = await import('$lib/consent/specs/addVote');
    const branches: Array<[string, string]> = [
      ['tosplit',     'tosplit.vote'],
      ['pend',        'pendm.vote'],
      ['sheirutpend', 'sheirutpend.vote'],
      ['ask',         'ask.vote'],
      ['decision',    'decision.vote'],
      ['weFinnish',   'mission.approve.vote']
    ];
    for (const [type, expected] of branches) {
      const ev = deriveConsentEventFromAction(addVoteConsentSpec, {
        type, id: 'x', what: true, projectId: 'p'
      });
      expect(ev!.action).toBe(expected);
      expect(ev!.subject).toEqual({ type, id: 'x' });
    }
  });

  it('returns null for an unrecognised vote type (shadow-skip)', async () => {
    const { addVoteConsentSpec } = await import('$lib/consent/specs/addVote');
    const ev = deriveConsentEventFromAction(addVoteConsentSpec, {
      type: 'tournament', id: 'x', projectId: 'p'
    });
    expect(ev).toBeNull();
  });
});

describe('deriveConsentEventFromAction — addVote poly-action dispatch', () => {
  it('routes type=tosplit → tosplit.vote', () => {
    const ev = deriveConsentEventFromAction(addVoteSpec, {
      type: 'tosplit', id: 'ts-1', what: true, projectId: 'p-1'
    });
    expect(ev!.action).toBe('tosplit.vote');
    expect(ev!.subject).toEqual({ type: 'tosplit', id: 'ts-1' });
  });

  it('routes type=pend → pendm.vote', () => {
    const ev = deriveConsentEventFromAction(addVoteSpec, {
      type: 'pend', id: 'pm-1', what: true, projectId: 'p-1'
    });
    expect(ev!.action).toBe('pendm.vote');
  });

  it('routes type=weFinnish → mission.approve.vote', () => {
    const ev = deriveConsentEventFromAction(addVoteSpec, {
      type: 'weFinnish', id: 'fm-1', what: true, projectId: 'p-1'
    });
    expect(ev!.action).toBe('mission.approve.vote');
  });

  it('skips (returns null) for unknown type', () => {
    const ev = deriveConsentEventFromAction(addVoteSpec, {
      type: 'unsupported-type', id: 'x', projectId: 'p-1'
    });
    expect(ev).toBeNull();
  });

  it('predicate keeps what / why / order; drops projectId, type, id', () => {
    const ev = deriveConsentEventFromAction(addVoteSpec, {
      type: 'tosplit', id: 'ts-1', what: false, why: 'split unfair',
      order: 2, projectId: 'p-1'
    });
    expect(ev!.predicate).toEqual({ what: false, why: 'split unfair', order: 2 });
  });

  it('defaults what=true when omitted (matches handler default)', () => {
    const ev = deriveConsentEventFromAction(addVoteSpec, {
      type: 'tosplit', id: 'ts-1', projectId: 'p-1'
    });
    expect(ev!.predicate?.what).toBe(true);
  });

  it('defaults order=0 when omitted', () => {
    const ev = deriveConsentEventFromAction(addVoteSpec, {
      type: 'tosplit', id: 'ts-1', what: true, projectId: 'p-1'
    });
    expect(ev!.predicate?.order).toBe(0);
  });
});

describe('shadowSignFromCookie — convenience for call sites', () => {
  // The test environment doesn't expose `browser` from $app/environment as
  // true, so the helper returns the SSR branch. This guarantees a callable
  // function that never throws even when called outside a browser context —
  // which is exactly the contract: callers can fire it after their action
  // without worrying about environment.
  it('returns a non-throwing result outside the browser', async () => {
    const spec: ConsentSpec = {
      action: 'tosplit.vote',
      subjectType: 'tosplit',
      subjectIdParam: 'id'
    };
    const res = await shadowSignFromCookie(spec, { id: 'x' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      // either 'not_browser' (SSR) or 'no_cookie_id' is acceptable —
      // the contract is just "never throws, always resolves".
      expect(['not_browser', 'no_cookie_id']).toContain(res.reason);
    }
  });

  it('never throws even when the spec misroutes the params', async () => {
    const spec: ConsentSpec = {
      action: 'tosplit.vote',
      subjectType: 'tosplit',
      subjectIdParam: 'missingParam'  // params won't have this
    };
    const res = await shadowSignFromCookie(spec, { other: 'x' });
    expect(res.ok).toBe(false);
  });
});
