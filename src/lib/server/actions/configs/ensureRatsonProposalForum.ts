/**
 * Ensure Ratson-Proposal Forum — concierge volunteer coordination chat.
 *
 * A community volunteer applies to a wish's published need (applyToMission →
 * ratson_proposal). Before the owner accepts, both sides may want to coordinate
 * (timing, scope, questions). This action lazily creates a **project-less
 * forum** linked to the proposal (`ratson_proposal.forum`) and returns its id,
 * so the lev `wishoffer` card can open the standard forum chat panel.
 *
 * Access to the resulting forum is granted to the wish owner(s) and the
 * proposer(s) via the `wishoffer` kind in forumAccess.ts.
 *
 * Authorized for the wish owner OR a proposer on the proposal.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { ratsonId, proposalId, forumId } = params as {
    ratsonId: string;
    proposalId: string;
    forumId?: string | null;
  };

  if (!ratsonId) throw new Error('ratsonId is required');
  if (!proposalId) throw new Error('proposalId is required');

  // ── 1. Load ratson + its proposals (owners, proposers, existing forum) ────
  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );

  const ratNode = ratRes?.data?.ratson?.data;
  if (!ratNode) throw new Error(`Ratson ${ratsonId} not found`);

  const proposals = ratRes?.data?.ratsonProposals?.data ?? [];
  const proposal = proposals.find((p: any) => String(p.id) === String(proposalId));
  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found under ratson ${ratsonId}`);
  }
  const pa = proposal.attributes ?? {};

  // ── 2. Authorize: wish owner or proposer only ─────────────────────────────
  const ownerIds = (ratNode.attributes?.users_permissions_users?.data ?? []).map((u: any) =>
    String(u.id)
  );
  const proposerIds = (pa.proposer_users?.data ?? []).map((u: any) => String(u.id));
  const participantIds = new Set<string>([...ownerIds, ...proposerIds]);
  if (!participantIds.has(String(context.userId))) {
    throw new Error('Only the wish owner or a proposer may open this chat');
  }

  // ── 3. Return the existing forum if already linked ────────────────────────
  const existingForumId = forumId || pa.forum?.data?.id || null;
  if (existingForumId) {
    return {
      success: true,
      forumId: String(existingForumId),
      created: false,
      ratsonId: String(ratsonId),
      proposalId: String(proposalId)
    };
  }

  // ── 4. Create a project-less forum and link it to the proposal ────────────
  const publishedAt = new Date().toISOString();
  const createRes = await strapi.execute(
    '2forumCrBasic',
    { pid: null, da: publishedAt },
    context.jwt,
    context.fetch
  );
  if (createRes?.errors) {
    console.error('Failed to create forum:', createRes.errors);
    throw new Error('Failed to create forum');
  }
  const newForumId = createRes?.data?.createForum?.data?.id;
  if (!newForumId) throw new Error('Failed to create forum');

  const linkRes = await strapi.execute(
    '102updateRatsonProposal',
    { id: proposalId, forum: newForumId },
    context.jwt,
    context.fetch
  );
  if (linkRes?.errors) {
    console.error('Failed to link forum to ratson proposal:', linkRes.errors);
    throw new Error('Failed to link forum to ratson proposal');
  }

  return {
    success: true,
    forumId: String(newForumId),
    created: true,
    ratsonId: String(ratsonId),
    proposalId: String(proposalId)
  };
};

export const ensureRatsonProposalForumConfig: ActionConfig = {
  key: 'ensureRatsonProposalForum',
  description:
    'Ensure a coordination forum exists for a concierge ratson_proposal (wish owner ↔ community volunteer) and return its forumId. Owner or proposer only.',
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    proposalId: { type: 'string', required: true },
    forumId: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to open this chat' }],
  updateStrategy: { type: 'none' }
};
