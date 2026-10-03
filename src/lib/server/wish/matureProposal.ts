/**
 * What happens when the silence clock of a wish proposal runs out (C-9).
 *
 * "Silence is consent, at the pace of the wish": the version standing on the table
 * when the clock runs out is the one that takes effect — approved on behalf of the
 * side that was silent, by the very action that side would have pressed, so there is
 * one path to a placement whoever it was that approved. The silent side is the one
 * whose move it was: the other side signed last.
 *
 * Only once the two sides are talking (`silenceApplies`: at least one counter). A
 * first-contact proposal — the invitation, the volunteer's offer — carries no clock.
 *
 *   invitation        → `acceptWishOffer`, as the silent party (the wisher approving
 *                       the provider's counter / the provider approving the wisher's);
 *   volunteer, silent wisher    → `acceptRatsonProposal` as the wisher, which builds
 *                       the slot and assigns the volunteer (the volunteer's counter);
 *   volunteer, silent provider  → the provider's approval of the wisher's counter,
 *                       then the wisher's own close — she already put those terms on
 *                       the table, and nobody has to click twice for a silence.
 *
 * Everything that is not a live, negotiated proposal closes its clock without acting
 * (the rule of the whole dispatcher: a clock we will not act on must be closed). A
 * maturation that *fails* leaves the clock open, so the next run tries again instead
 * of destroying the proposal.
 *
 * Dependencies are injected so the logic is testable without Strapi or the dispatcher.
 */

import { otherParty } from '$lib/wish/proposalRounds.js';
import { lastSignedAt, proposalDeadline, silenceApplies } from '$lib/wish/restime.js';
import { readWishRestime } from './clock.js';
import { loadWishProposal } from './proposal.js';

type Strapi = { execute: (qid: string, vars: any, jwt: string, fetch: any) => Promise<any> };

export type MatureOutcome = 'matured' | 'rearmed' | 'retry' | `closed:${string}`;

export interface MatureDeps {
  strapi: Strapi;
  jwt: string;
  fetch: any;
  /** Run an action as a user (the service identity acting for them). */
  runAction(key: string, params: Record<string, unknown>, userId: string): Promise<{ success: boolean; error?: any }>;
  closeClock(taid: string): Promise<void>;
  /** Arm a fresh clock at an exact moment (ISO). */
  armClock(proposalId: string, atISO: string): Promise<void>;
  now?: () => Date;
}

const ENDED_WISH = new Set(['fulfilled', 'cancelled', 'expired', 'draft']);
const OPEN_PROPOSAL = new Set(['suggested', 'viewed']);

export async function matureWishProposal(proposalId: string, taid: string, deps: MatureDeps): Promise<MatureOutcome> {
  const { strapi, jwt, fetch } = deps;
  const now = (deps.now ?? (() => new Date()))();
  const close = async (why: string): Promise<MatureOutcome> => {
    await deps.closeClock(taid);
    return `closed:${why}`;
  };

  // Which wish is it? (The clock knows only the proposal.)
  const head = await strapi.execute('391ratsonOfProposal', { id: String(proposalId) }, jwt, fetch);
  const ratsonId = head?.data?.ratsonProposal?.data?.attributes?.ratson?.data?.id;
  if (!ratsonId) return close('no wish');

  const p = await loadWishProposal(strapi, { userId: '0', jwt, fetch }, String(ratsonId), String(proposalId));

  const wishStatus = String(p.ratsonAttrs.status_ratson ?? 'open');
  if (ENDED_WISH.has(wishStatus)) return close(`wish ${wishStatus}`);
  const status = String(p.attrs.status_proposal ?? 'suggested');
  if (!OPEN_PROPOSAL.has(status)) return close(`proposal ${status}`);
  if (!p.path || !p.slot) return close('not negotiated here');
  // First contact has no clock: until someone counters, neither side has been talking
  // and silence binds nobody. (Nothing arms such a clock; this closes a stray one.)
  if (!silenceApplies(p.standing.round)) return close('first contact');

  // The clock that fired may be stale: a counter since then, or a longer pace chosen.
  // The deadline is always the last signature plus the wish's pace as it is now.
  const restime = await readWishRestime(strapi, { jwt, fetch }, String(ratsonId));
  const due = proposalDeadline(lastSignedAt(p.entries, p.attrs.createdAt), restime);
  if (due && now.getTime() < Date.parse(due)) {
    await deps.armClock(String(proposalId), due);
    await deps.closeClock(taid);
    return 'rearmed';
  }

  // A volunteer's need that someone else already took: this offer lapses, it does not
  // build a second slot for the same need.
  if (p.path === 'volunteer') {
    const omId = p.attrs.open_mission?.data?.id;
    if (omId) {
      const om = await strapi.execute('392getOpenMissionArchived', { id: String(omId) }, jwt, fetch);
      if (om?.data?.openMission?.data?.attributes?.archived === true) {
        await strapi.execute('102updateRatsonProposal', { id: String(proposalId), status_proposal: 'expired' }, jwt, fetch);
        return close('the need was taken');
      }
    }
  }

  const wisher = p.wisherIds[0];
  const provider = p.proposerIds[0];
  if (!wisher || !provider) return close('no parties');

  const silent = otherParty(p.standing.signedBy);
  const base = { proposalId: String(proposalId), ratsonId: String(ratsonId), viaSilence: true };
  const steps: [string, string][] =
    p.path === 'invite'
      ? [['acceptWishOffer', silent === 'wisher' ? wisher : provider]]
      : silent === 'wisher'
        ? [['acceptRatsonProposal', wisher]]
        : [
            ['acceptWishOffer', provider],
            ['acceptRatsonProposal', wisher]
          ];

  for (const [key, userId] of steps) {
    const out = await deps.runAction(key, base, userId);
    if (!out.success) {
      console.error(`[wish clock] ${key} for proposal ${proposalId} failed — leaving the clock open to retry:`, out.error);
      return 'retry';
    }
  }
  await deps.closeClock(taid);
  return 'matured';
}
