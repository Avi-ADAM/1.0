// Shared consent-event mapping for the addVote action (PLAN_action_migration_vs_p2p §6.3).
//
// Both the server-side ActionConfig (src/lib/server/actions/configs/addVote.ts)
// and the client-side shadow-sign caller import this spec, so the predicate
// shape stays exactly identical in both worlds. If the spec drifts we have one
// place to fix, not two.
//
// Poly-action: addVote handles 6 different vote types (tosplit, pend,
// sheirutpend, ask, decision, weFinnish). Each maps to its own ConsentEvent
// action name in the chain namespace.

import type { ConsentSpec } from '$lib/server/actions/types';

export const addVoteConsentSpec: ConsentSpec = {
  action: (params) => {
    const type = params.type as string | undefined;
    if (type === 'tosplit')     return 'tosplit.vote';
    if (type === 'pend')        return 'pendm.vote';
    if (type === 'sheirutpend') return 'sheirutpend.vote';
    if (type === 'ask')         return 'ask.vote';
    if (type === 'decision')    return 'decision.vote';
    if (type === 'weFinnish')   return 'mission.approve.vote';
    return null;
  },
  subjectType: (params) => String(params.type ?? 'unknown'),
  subjectIdParam: 'id',
  requireConsensus: true,
  restimeFrom: 'project',
  predicateFromParams: (params) => ({
    what: params.what ?? true,
    why: params.why,
    order: params.order ?? 0
  })
};
