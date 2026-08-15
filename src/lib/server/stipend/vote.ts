/**
 * Signing a stipend proposal (docs/PLAN_STIPEND.md §5, super-principles).
 *
 * A vote belongs to a *round*: signing round 2 says nothing about round 1, and
 * only the standing round can mature. There is no "no" — a member who does not
 * accept the terms counters with different ones (`counterStipendTerms`), which
 * opens a new round and restarts the clock.
 */

import { gqlStr, run, type Exec } from '$lib/server/archive/gql.js';
import { votsFragment, type Vot } from './decision.js';
import {
  applyStandingStipend,
  fetchStipendDecision,
  signedIdsOn,
  signerIds,
  standingOrder,
  type AppliedStipend,
  type StipendDecision
} from './apply.js';

export interface SignOutcome {
  decisionId: string;
  kind: StipendDecision['kind'];
  order: number;
  consensus: boolean;
  signed: string[];
  awaiting: string[];
  applied: AppliedStipend | null;
}

export async function signStipend(
  exec: Exec,
  decisionId: string,
  userId: string
): Promise<SignOutcome> {
  const decision = await fetchStipendDecision(exec, decisionId);
  if (!decision) throw new Error(`Stipend decision ${decisionId} not found`);
  if (decision.archived) throw new Error('This proposal is already closed');

  const signers = signerIds(decision);
  if (signers.length > 0 && !signers.includes(String(userId))) {
    throw new Error(
      decision.kind === 'stipendPledge'
        ? 'Only the funder and the recipient may sign this stipend'
        : 'Only members of the rikma may sign a stipend program'
    );
  }

  const order = standingOrder(decision);
  const already = signedIdsOn(decision, order);
  if (already.includes(String(userId))) {
    throw new Error('You already signed the version on the table — waiting for the other side');
  }

  const vots: Vot[] = [
    ...decision.vots,
    { userId: String(userId), order, what: true, zman: new Date().toISOString() }
  ];
  await run(
    exec,
    `mutation { updateDecision(id: ${gqlStr(decisionId)}, data: { vots: [${votsFragment(vots)}] }) { data { id } } }`,
    'signStipend'
  );

  const signed = Array.from(new Set([...already, String(userId)]));
  const awaiting = signers.filter((id) => !signed.includes(id));

  if (awaiting.length > 0) {
    return { decisionId, kind: decision.kind, order, consensus: false, signed, awaiting, applied: null };
  }

  // Everyone who had to sign has signed — the version on the table takes effect.
  const applied = await applyStandingStipend(exec, { ...decision, vots });
  return { decisionId, kind: decision.kind, order, consensus: true, signed, awaiting: [], applied };
}
