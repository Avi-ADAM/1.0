/**
 * A wish proposal, read the way every action that negotiates one needs it: who the
 * two parties are, which slot it covers, the version on the table and whose move it
 * is (QA_CONCIERGE_E2E C-9). The rules themselves are `$lib/wish/proposalRounds`.
 */

import {
  partyOf,
  proposalPath,
  standing,
  type ProposalPath,
  type Party,
  type ProposalRef,
  type Standing,
  type Version,
  type WillingnessEntry
} from '$lib/wish/proposalRounds.js';
import { termsDigest } from './termsDigest.js';
import { ActionError } from '../actions/errors.js';

type Strapi = { execute: (qid: string, vars: any, jwt: string, fetch: any) => Promise<any> };
type Ctx = { userId: string; jwt: string; fetch: any };

export type SlotKind = 'mission' | 'resource';

export interface WishProposal {
  ratsonId: string;
  ratsonAttrs: any;
  proposalId: string;
  /** The proposal's attributes, as qid 105 returns them. */
  attrs: any;
  wisherIds: string[];
  proposerIds: string[];
  /** Which negotiable shape this is — null for a proposal that is not negotiated here. */
  path: ProposalPath | null;
  ref: ProposalRef;
  /** The one slot it covers — null when it covers none or several (not negotiable here). */
  slot: { kind: SlotKind; idx: string | null } | null;
  /** The version on the table: the slot's `covered_*`. */
  version: Version;
  entries: WillingnessEntry[];
  standing: Standing;
  /**
   * The digest of the wish's terms that a signature made now stands behind
   * (PLAN_DIRECT_OFFER §4.3) — stamp it on every entry this action writes.
   */
  signDigest: string;
}

/**
 * The digest a signature records: the wish's stored one, or — while nobody has
 * edited its terms since digests began — the digest of the terms as they stand.
 * `ratsonAttrs` must be qid 105's, which carries every field the digest is made of.
 */
export function signDigestOf(ratsonAttrs: any): string {
  return ratsonAttrs?.terms_digest || termsDigest(ratsonAttrs ?? {});
}

/** The wish's terms now, for `standing`: only a stored digest can make a signature stale. */
export const wishDigestOf = (ratsonAttrs: any): string | null => ratsonAttrs?.terms_digest || null;

/** What the proposal currently says: hours (or quantity) and price of its one slot. */
export function coveredVersion(attrs: any): { slot: WishProposal['slot']; version: Version } {
  const missions: any[] = attrs?.covered_missions ?? [];
  const resources: any[] = attrs?.covered_resources ?? [];
  const total = typeof attrs?.total_price === 'number' ? attrs.total_price : null;

  if (missions.length === 1 && resources.length === 0) {
    const m = missions[0];
    return {
      slot: { kind: 'mission', idx: m.extracted_mission_idx != null ? String(m.extracted_mission_idx) : null },
      version: {
        amount: typeof m.hours === 'number' ? m.hours : null,
        price: typeof m.price === 'number' ? m.price : total
      }
    };
  }
  if (resources.length === 1 && missions.length === 0) {
    const r = resources[0];
    return {
      slot: { kind: 'resource', idx: r.extracted_resource_idx != null ? String(r.extracted_resource_idx) : null },
      version: {
        amount: typeof r.quantity === 'number' ? r.quantity : null,
        price: typeof r.price === 'number' ? r.price : total
      }
    };
  }
  return { slot: null, version: { amount: null, price: total } };
}

/** Load one proposal of a wish with its parties and negotiation state. */
export async function loadWishProposal(
  strapi: Strapi,
  context: Ctx,
  ratsonId: string,
  proposalId: string
): Promise<WishProposal> {
  const res = await strapi.execute('105queryRatsonWithProposals', { id: ratsonId }, context.jwt, context.fetch);
  const ratNode = res?.data?.ratson?.data;
  if (!ratNode) throw new Error(`Ratson ${ratsonId} not found`);
  const node = (res?.data?.ratsonProposals?.data ?? []).find((p: any) => String(p.id) === String(proposalId));
  if (!node) throw new Error(`Proposal ${proposalId} not found on this wish`);

  const ratsonAttrs = ratNode.attributes ?? {};
  const attrs = node.attributes ?? {};
  const wisherIds = (ratsonAttrs.users_permissions_users?.data ?? []).map((u: any) => String(u.id));
  const proposerIds = (attrs.proposer_users?.data ?? []).map((u: any) => String(u.id));
  // A volunteer from the community feed opened the proposal on the published need
  // (`open_mission`); an invited provider was put there by the wisher, who authored
  // the slot. That decides who has implicitly signed the first version.
  const path = proposalPath({
    kind: attrs.kind,
    hasMatanot: !!attrs.matanot?.data?.id,
    hasProject: !!attrs.project?.data?.id,
    hasOpenMission: !!attrs.open_mission?.data?.id
  });
  const openedBy: Party = path === 'volunteer' ? 'provider' : 'wisher';
  const ref: ProposalRef = { wisherIds, proposerIds, openedBy };

  const { slot, version } = coveredVersion(attrs);
  const entries: WillingnessEntry[] = attrs.ratson_willingness_entry ?? [];

  return {
    ratsonId: String(ratsonId),
    ratsonAttrs,
    proposalId: String(proposalId),
    attrs,
    wisherIds,
    proposerIds,
    path,
    ref,
    slot,
    version,
    entries,
    standing: standing(ref, entries, version, wishDigestOf(ratsonAttrs)),
    signDigest: signDigestOf(ratsonAttrs)
  };
}

/**
 * An approval made from a notice (`expectRound` set) is pinned to the round it was
 * shown at — but a change of the wish's terms is not a round. When the terms changed
 * since the last signature, such an approval must also name the terms it saw
 * (`expectTerms`), or it is refused like a moved round: nobody signs a deadline they
 * were never shown. From the wish page itself (no `expectRound`) nothing changes.
 */
export function assertTermsSeen(params: { expectRound?: unknown; expectTerms?: unknown }, p: WishProposal): void {
  const fromNotice = params.expectRound !== undefined && params.expectRound !== null && params.expectRound !== '';
  if (!fromNotice || !p.standing.termsChanged) return;
  if (params.expectTerms && String(params.expectTerms) === wishDigestOf(p.ratsonAttrs)) return;
  throw new ActionError(
    'ROUND_MOVED',
    'The wish changed since you signed — open it to see the new terms',
    { termsChanged: true }
  );
}

/** Which party the caller is in this proposal — or throw. */
export function requireParty(p: WishProposal, userId: string | number): Party {
  const party = partyOf(p.ref, userId);
  if (!party) throw new Error('Only the wisher or the provider of this proposal may negotiate it');
  return party;
}

/** The component input for an existing log entry, so a rewrite keeps every earlier row. */
export function entryInput(e: WillingnessEntry) {
  const u: any = e.user;
  const user = u == null ? undefined : typeof u === 'object' ? (u.data?.id ?? u.id) : u;
  return {
    ...(user != null ? { user: String(user) } : {}),
    ...(e.item_kind ? { item_kind: e.item_kind } : {}),
    ...(e.item_idx != null ? { item_idx: e.item_idx } : {}),
    ...(typeof e.agree === 'boolean' ? { agree: e.agree } : {}),
    ...(e.note ? { note: e.note } : {}),
    ...(e.submittedAt ? { submittedAt: e.submittedAt } : {}),
    ...(typeof e.willingHours === 'number' ? { willingHours: e.willingHours } : {}),
    ...(typeof e.willingAmount === 'number' ? { willingAmount: e.willingAmount } : {}),
    // Every write rewrites the whole log: drop this and each new signature would
    // erase the terms the earlier ones were made under.
    ...(e.termsDigest ? { termsDigest: e.termsDigest } : {})
  };
}
