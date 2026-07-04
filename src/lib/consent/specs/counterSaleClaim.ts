// Consent-event mapping for the counterSaleClaim action
// (PLAN_sale_holder_consent). A precision round is a `proposal.counter` event
// on the saleClaim Decision — already a first-class action name in ACTIONS and
// event.ts (Delta 'round.advance').
//
// Signed AFTER the action returns, so the client injects the resulting `order`
// (the new round number) into the params before signing.

import type { ConsentSpec } from '$lib/server/actions/types';

export const proposalCounterConsentSpec: ConsentSpec = {
  action: 'proposal.counter',
  subjectType: 'decision',
  subjectIdParam: 'decisionId',
  requireConsensus: false,
  restimeFrom: 'project',
  predicateFromParams: (params) => ({
    order: params.order,
    newValues: params.newValues,
    why: params.why
  })
};
