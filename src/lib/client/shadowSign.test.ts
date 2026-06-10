import { describe, it, expect } from 'vitest';
import { deriveConsentEventFromAction } from './shadowSign';
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
