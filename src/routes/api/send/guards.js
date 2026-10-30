// Entity-level guards for /api/send — the qid-specific ownership/visibility
// rules that the static qidsAccess manifest cannot express.
//
// These were previously inlined in +server.js as a growing chain of `if`s.
// Centralizing them here keeps the handler readable, makes each guard unit
// testable, and lets us answer "which guards apply to this qid" declaratively.
//
// Three kinds:
//   • PRE guards  — hand-written, per qid. Run AFTER the idempotent-vote
//     handler and BEFORE the GraphQL fetch; they throw error() to block.
//   • Generic guards — ownership.js and voteIntegrity.js, which apply to every
//     mutation that writes to an existing row. Four hand-written guards never
//     could have covered the 114 of those (PLAN_PROXY_SECURITY.md §14.2), so
//     these derive what they need from each qid's own GraphQL instead.
//   • POST filters — run AFTER the fetch on the downstream response. They
//     return a replacement `data` object to override what the client sees,
//     or undefined to leave the response untouched.

import { error } from '@sveltejs/kit';
import { targetsOf, componentListsOf } from './qidTargets.js';
import { enforceOwnership, OWNERSHIP, buildOwnershipQuery, collectPrincipals } from './ownership.js';
import { enforceVoteIntegrity } from './voteIntegrity.js';

/**
 * What each qid writes, read out of the qid's own GraphQL. Memoized on first
 * use: parsing the document on every request would be silly, and parsing all
 * ~490 up front would tax the qids nobody calls.
 * @type {Map<string, { targets: ReturnType<typeof targetsOf>, componentLists: ReturnType<typeof componentListsOf> }>}
 */
const WRITE_SHAPES = new Map();

/** @param {string} queId @param {string} query */
function writeShape(queId, query) {
  let shape = WRITE_SHAPES.get(queId);
  if (!shape) {
    shape = { targets: targetsOf(query), componentLists: componentListsOf(query) };
    WRITE_SHAPES.set(queId, shape);
  }
  return shape;
}

/**
 * @typedef {Object} SendGuardContext
 * @property {string} queId
 * @property {boolean} isSer
 * @property {Record<string, any>} keyValueObject  raw client `arg` (incl. support/body/issueId)
 * @property {Record<string, any>} variablesObject resolved GraphQL variables (incl. id)
 * @property {{ externalId?: string, [k: string]: any } | null} identity  server __identity
 * @property {string} [callerId]     the verified caller (locals.uid), never a cookie
 * @property {string} [query]        the qid's GraphQL — target/component derivation
 * @property {string} bearer1        Authorization header value ('Bearer …')
 * @property {string} ep             Strapi GraphQL endpoint
 * @property {typeof globalThis.fetch} [fetch]  injectable for tests
 */

/**
 * Throw unless `callerId` is a member of `pid`.
 *
 * A project id in the variables proves nothing about who is asking, so every
 * partnership-internal read has to look the membership up. Shared by the
 * resource calendar and the shared library so the two cannot drift apart.
 *
 * @param {SendGuardContext} ctx
 * @param {string} label   qid name, for the 400 when the project id is missing
 * @param {string} denial  the 403 message
 * @param {string} [variable]  the qid's project-id variable (`pid`, `id`, `projectId`)
 */
async function requireProjectMember(ctx, label, denial, variable = 'pid') {
  const { callerId, variablesObject, bearer1, ep, fetch: injected } = ctx;
  if (!callerId) throw error(401, 'Unauthorized: No caller id');
  const pid = variablesObject[variable];
  if (!pid) throw error(400, `Missing ${variable} for ${label}`);

  const doFetch = injected || fetch;
  let data;
  try {
    const res = await doFetch(ep, {
      method: 'POST',
      body: JSON.stringify({
        query: `query ProjectMembers($id: ID!) { project(id: $id) { data { attributes { user_1s { data { id } } } } } }`,
        variables: { id: String(pid) }
      }),
      headers: { 'Content-Type': 'application/json', Authorization: bearer1 }
    });
    data = await res.json();
  } catch (e) {
    throw error(500, `Failed to fetch project members for ${label}: ${e.message}`);
  }

  const members = data?.data?.project?.data?.attributes?.user_1s?.data ?? [];
  if (!members.some((m) => String(m.id) === String(callerId))) {
    throw error(403, denial);
  }
}

/**
 * A partnership-internal read: on the JWT path the caller must be a member of
 * the rikma the qid names. Service calls (server loads, the MCP bridge) have
 * already been authorized for the member they act for and pass.
 *
 * @param {string} label     qid name
 * @param {string} denial    the 403 message
 * @param {string} [variable] the qid's project-id variable
 * @returns {(ctx: SendGuardContext) => Promise<void>}
 */
function membersOnly(label, denial, variable = 'pid') {
  return async (ctx) => {
    if (ctx.isSer) return;
    await requireProjectMember(ctx, label, denial, variable);
  };
}

/**
 * A self-only read: on the JWT path the user-id variable must be the verified
 * caller. Service calls legitimately read on a member's behalf and pass.
 *
 * @param {string} variable  the qid's user-id variable (`uid`, `id`, …)
 * @param {string} denial    the 403 message
 * @returns {(ctx: SendGuardContext) => void}
 */
function pinToCaller(variable, denial) {
  return ({ isSer, callerId, variablesObject }) => {
    if (isSer) return;
    if (!callerId) throw error(401, 'Unauthorized: No caller id');
    if (String(variablesObject[variable]) !== String(callerId)) throw error(403, denial);
  };
}

/**
 * The rows a consensus-bridge `sourceType` can name. One negotiation card
 * serves both a pending proposal and an open listing (negoPend under pmas and
 * under the open-resource pages; negoM under pandingMesima and under the
 * open-mission pages), so a type maps to every entity its `sourceId` may be.
 */
const BRIDGE_SOURCES = {
  pmash: ['pmash', 'openMashaabim'],
  mission: ['pendm', 'openMission'],
  tosplit: ['tosplit']
};

/**
 * Throw unless the caller is a party to the main-app object a bridged
 * negotiation mediates: named on the row or a member of its rikma, by the
 * same ownership rules the generic write guard uses.
 *
 * @param {SendGuardContext} ctx
 * @param {unknown} sourceType
 * @param {unknown} sourceId
 */
async function requireBridgeSourceParty(ctx, sourceType, sourceId) {
  const { callerId, bearer1, ep, fetch: injected } = ctx;
  if (!callerId) throw error(401, 'Unauthorized: No caller id');
  const entities = BRIDGE_SOURCES[/** @type {keyof typeof BRIDGE_SOURCES} */ (String(sourceType))];
  if (!entities || sourceId == null || sourceId === '') {
    throw error(403, 'Forbidden: Unknown negotiation source');
  }

  const doFetch = injected || fetch;
  for (const field of entities) {
    const rule = OWNERSHIP[field];
    let body;
    try {
      const res = await doFetch(ep, {
        method: 'POST',
        body: JSON.stringify({ query: buildOwnershipQuery(field, rule), variables: { id: String(sourceId) } }),
        headers: { 'Content-Type': 'application/json', Authorization: bearer1 }
      });
      body = await res.json();
    } catch (e) {
      throw error(503, `Could not verify the negotiation source: ${e.message}`);
    }
    const row = body?.data?.[field]?.data;
    if (row && collectPrincipals(row.attributes, row.id, rule).has(String(callerId))) return;
  }
  throw error(403, 'Forbidden: Not a party to this negotiation source');
}

/**
 * Read a negotiation's bridge source. A missing row or an unbridged
 * negotiation comes back with no sourceType.
 *
 * @param {SendGuardContext} ctx
 * @param {unknown} id
 * @returns {Promise<{ sourceType?: string, sourceId?: string } | null>}
 */
async function readNegotiationSource(ctx, id) {
  const { bearer1, ep, fetch: injected } = ctx;
  const doFetch = injected || fetch;
  let body;
  try {
    const res = await doFetch(ep, {
      method: 'POST',
      body: JSON.stringify({
        query: `query NegotiationSource($id: ID!) { negotiation(id: $id) { data { attributes { sourceType sourceId } } } }`,
        variables: { id: String(id) }
      }),
      headers: { 'Content-Type': 'application/json', Authorization: bearer1 }
    });
    body = await res.json();
  } catch (e) {
    throw error(503, `Could not read the negotiation source: ${e.message}`);
  }
  return body?.data?.negotiation?.data?.attributes ?? null;
}

/**
 * Issues and clauses of a bridged negotiation carry the terms of a main-app
 * proposal, so only a party to its source may read or add them. A discussion
 * that was not bridged keeps its existing rules.
 * @param {SendGuardContext} ctx
 */
async function bridgedNegotiationContent(ctx) {
  if (ctx.isSer) return;
  const id = ctx.variablesObject.negotiationId;
  if (!id) throw error(400, 'Missing negotiationId');
  const source = await readNegotiationSource(ctx, id);
  if (!source?.sourceType || !source?.sourceId) return;
  await requireBridgeSourceParty(ctx, source.sourceType, source.sourceId);
}

/**
 * A bridge lookup by `(sourceType, sourceId)`: only a party to the source
 * object may find its discussion or read its signed resolution.
 * @param {SendGuardContext} ctx
 */
async function bridgeSourceRead(ctx) {
  if (ctx.isSer) return;
  await requireBridgeSourceParty(ctx, ctx.variablesObject.sourceType, ctx.variablesObject.sourceId);
}

/** @type {Record<string, (ctx: SendGuardContext) => void | Promise<void>>} */
const PRE_GUARDS = {
  // Co-member lookup is self-only on the JWT path. The qid takes `uid` from the
  // client and returns that account's projects plus every co-member's username,
  // so an unpinned uid would let any logged-in user enumerate someone else's
  // collaborators — the exact exposure this qid exists to avoid. Service calls
  // legitimately read on another user's behalf and are left alone.
  '170getMyCoMembers': ({ isSer, callerId, variablesObject }) => {
    if (isSer) return;
    if (!callerId) throw error(401, 'Unauthorized: No caller id');
    if (String(variablesObject.uid) !== String(callerId)) {
      throw error(403, 'Forbidden: Can only read your own co-members');
    }
  },

  // A member's income history is their whole financial life on the site — every
  // payout, from which rikma, when. The qid takes `uid` from the client, so
  // without this an unpinned uid would hand any logged-in user someone else's
  // earnings. Same shape as the co-members guard above, same reason.
  '307myIncomeHistory': ({ isSer, callerId, variablesObject }) => {
    if (isSer) return;
    if (!callerId) throw error(401, 'Unauthorized: No caller id');
    if (String(variablesObject.uid) !== String(callerId)) {
      throw error(403, 'Forbidden: Can only read your own income history');
    }
  },

  // A member's personal resources include the `rikma`-scoped ones — what they
  // own and are willing to lend to partnerships, which they never published to
  // anyone. The qid takes `uid` from the client, so without this any logged-in
  // user could read another account's private inventory. (The public subset is
  // already served by 268getUserStorefront, which filters to offerScope
  // customers/both — that one stays open on purpose.)
  '308myResourcesViaUser': ({ isSer, callerId, variablesObject }) => {
    if (isSer) return;
    if (!callerId) throw error(401, 'Unauthorized: No caller id');
    if (String(variablesObject.uid) !== String(callerId)) {
      throw error(403, 'Forbidden: Can only read your own resources');
    }
  },

  // The same reasoning for the occupancy calendar, and one more: it names the
  // rikma or customer holding each resource and until when. Who rented your
  // projector is nobody else's business, so `uid` is pinned to the caller.
  '309myResourceOccupancy': ({ isSer, callerId, variablesObject }) => {
    if (isSer) return;
    if (!callerId) throw error(401, 'Unauthorized: No caller id');
    if (String(variablesObject.uid) !== String(callerId)) {
      throw error(403, 'Forbidden: Can only read your own resource calendar');
    }
  },

  // The places a member belongs to, for the consensus site's local map. Their
  // countries and their agreement signature are theirs alone, so `uid` is
  // pinned to the caller — and there is no service path to leave open.
  'ConsensusMyPlaces': ({ isSer, callerId, variablesObject }) => {
    if (isSer) throw error(403, 'Forbidden: ConsensusMyPlaces runs on the caller session only');
    if (!callerId) throw error(401, 'Unauthorized: No caller id');
    if (String(variablesObject.uid) !== String(callerId)) {
      throw error(403, 'Forbidden: Can only read your own places');
    }
  },

  // A member's missions in progress, with every timer and interval — what they
  // work on, in which rikma, and when. The qid takes `id` from the client; every
  // JWT caller (the timers store, the chat's timer editor, the internal bot)
  // asks for its own, and the bots that act for a member use the service path.
  '8getMissionsOnProgress': pinToCaller('id', 'Forbidden: Can only read your own missions in progress'),

  // Which rikmot a member belongs to. Every JWT caller (the moach index, the
  // internal bot's findUserProjects) asks for itself, so `uid` is pinned.
  '64getUserProjectList': pinToCaller('uid', 'Forbidden: Can only list your own rikmot'),

  // The sales center: products across the member's rikmot, their co-members and
  // open sale claims. Only ever read for the signed-in seller.
  'saleCenterUserProducts': pinToCaller('uid', 'Forbidden: Can only read your own sales center'),

  // Editing a position (UpdatePosition without support:true) is registered-user
  // only. Votes (support:true) are handled earlier by the idempotent-vote path
  // and never reach here, so any service call at this point is a direct edit.
  '42UpdatePosition': ({ isSer, keyValueObject }) => {
    if (isSer && keyValueObject.support !== true) {
      throw error(403, 'Forbidden: Service accounts cannot edit positions directly');
    }
  },

  // The rikma's resource calendar names which member supplies each resource and
  // which customers the rikma has committed weeks to. That is partnership-
  // internal, so it is members-only — and membership has to be looked up,
  // because a project id alone proves nothing about the caller.
  '310projectResourceOccupancy': membersOnly(
    '310projectResourceOccupancy',
    'Forbidden: Only members can read the rikma’s resource calendar'
  ),

  // The rikma's shared library (docs/inprogress/PLAN_RIKMA_SHARED_INFO.md §5): contracts,
  // scans, internal links. Partnership-internal by definition, so members-only
  // on the same lookup as the calendar above.
  '325projectSpaceDocs': membersOnly(
    '325projectSpaceDocs',
    'Forbidden: Only members can read the rikma’s shared library'
  ),

  // The rikma's books: every sale and who holds the money, the open profit
  // splits with each member's haluka, finished missions with their private
  // notes (hearotMeyuchadot), received resources and stipend payments. The
  // moach pages that read it are members-only (the layout 403s), but the qid
  // took any pid from any logged-in user, so the page gate protected nothing.
  'getProjectFinancials': membersOnly(
    'getProjectFinancials',
    'Forbidden: Only members can read the rikma’s financials'
  ),

  // One member's contribution total — the numerator of the stipend card's "my
  // share". Read by members voting on a stipend; nobody else's business.
  'getMemberValueTotal': membersOnly(
    'getMemberValueTotal',
    'Forbidden: Only members can read a member’s share'
  ),

  // The other moach reads that carry the same books: missions with their rates,
  // totals and private notes (getProjectMissions, the chains and processes
  // pages), and the process lifecycle, which also pulls sales and open splits.
  // Every caller is a moach page or a service call. getProjectValueSummary is
  // deliberately NOT here: it is aggregates only, and the lev suggestion cards
  // show it to the non-member a mission is suggested to (the equity preview).
  'getProjectMissions': membersOnly(
    'getProjectMissions',
    'Forbidden: Only members can read the rikma’s missions'
  ),
  'processLifecycleData': membersOnly(
    'processLifecycleData',
    'Forbidden: Only members can read the rikma’s processes'
  ),
  'chainDetailProjectData': membersOnly(
    'chainDetailProjectData',
    'Forbidden: Only members can read the rikma’s chains'
  ),
  '306moachChainsExtra': membersOnly(
    '306moachChainsExtra',
    'Forbidden: Only members can read the rikma’s chains',
    'id'
  ),
  '102projectProcessesQuery': membersOnly(
    '102projectProcessesQuery',
    'Forbidden: Only members can read the rikma’s processes',
    'projectId'
  ),

  // UpdateClause ownership — every edit is the clause author's, on both paths:
  //   • body/issueId: registered (JWT) owner only — block the service path.
  //   • service path (stanceValue/confirmedByAuthor): matched via
  //     __identity.externalId.
  //   • JWT path: matched via the verified caller (locals.uid), which is what
  //     authorIdentity.js stamps into authorExternalId on create. A clause
  //     written before that stamp has no author and so is nobody's to edit.
  'UpdateClause': async ({ isSer, keyValueObject, variablesObject, identity, callerId, bearer1, ep, fetch: injected }) => {
    if (isSer && (keyValueObject.body != null || keyValueObject.issueId != null)) {
      throw error(403, 'Forbidden: Service accounts cannot edit clause body or issueId');
    }
    const clauseId = variablesObject.id;
    if (!clauseId) throw error(400, 'Missing id for UpdateClause');
    let ownerExternalId;
    if (isSer) {
      ownerExternalId = identity?.externalId;
      if (!ownerExternalId) throw error(403, 'Forbidden: Missing __identity.externalId for UpdateClause');
    } else {
      ownerExternalId = callerId;
      if (!ownerExternalId) throw error(401, 'Unauthorized: No caller id');
    }

    const doFetch = injected || fetch;
    let fetchData;
    try {
      const fetchRes = await doFetch(ep, {
        method: 'POST',
        body: JSON.stringify({
          // `clauseId` is client data: interpolated into the document, a quote
          // in it would close the argument and the rest would parse as query.
          query: `query ClauseAuthor($id: ID!) { clause(id: $id) { data { attributes { authorExternalId } } } }`,
          variables: { id: clauseId }
        }),
        headers: { 'Content-Type': 'application/json', Authorization: bearer1 }
      });
      fetchData = await fetchRes.json();
    } catch (e) {
      throw error(500, `Failed to fetch clause for ownership check: ${e.message}`);
    }
    const clauseAuthor = fetchData.data?.clause?.data?.attributes?.authorExternalId;
    if (clauseAuthor == null || String(clauseAuthor) !== String(ownerExternalId)) {
      throw error(403, 'Forbidden: Not the clause author');
    }
  },

  // Consensus bridge (consensus1lev1 docs/main-repo-bridge-spec.md and
  // main-repo-return-spec.md). Called from the consensus repo on the caller's
  // own JWT, so membership is checked here, against the source object.
  'GetNegotiationBySource': bridgeSourceRead,
  'GetNegotiationResolutionBySource': bridgeSourceRead,

  // The terms of a bridged discussion (issues and clauses) follow the same
  // membership. UpdateClause keeps its author check below.
  'ListIssues': bridgedNegotiationContent,
  'ListClauses': bridgedNegotiationContent,
  'CreateIssue': bridgedNegotiationContent,
  'CreateClause': bridgedNegotiationContent,

  // Signing the bridge decision. The negotiation's own source decides who may
  // sign — never the client's `resolution` blob, which must name that same
  // source, since the source card reads it back by (sourceType, sourceId).
  '43SetNegotiationResolution': async (ctx) => {
    if (ctx.isSer) return;
    const { variablesObject } = ctx;
    const id = variablesObject.id;
    if (!id) throw error(400, 'Missing id for 43SetNegotiationResolution');

    const source = await readNegotiationSource(ctx, id);
    if (!source?.sourceType || !source?.sourceId) {
      throw error(403, 'Forbidden: Only a bridged negotiation carries a resolution');
    }

    let resolution = variablesObject.resolution;
    if (typeof resolution === 'string') {
      try {
        resolution = JSON.parse(resolution);
      } catch {
        throw error(400, 'Malformed resolution');
      }
    }
    if (
      resolution != null &&
      (String(resolution.sourceType) !== String(source.sourceType) ||
        String(resolution.sourceId) !== String(source.sourceId))
    ) {
      throw error(400, 'Resolution does not match the negotiation source');
    }

    await requireBridgeSourceParty(ctx, source.sourceType, source.sourceId);
  }
};

/** @type {Record<string, (ctx: { isSer: boolean, newd: any }) => any>} */
const POST_FILTERS = {
  // §5 bridge spec: never hand a private (bridge) discussion to the service
  // path (guest/charter). Registered users read it through the JWT path, where
  // Strapi enforces visibility. Only the read-by-id qid needs guarding here.
  '39GetNegotiation': ({ isSer, newd }) => {
    if (isSer) {
      const vis = newd?.data?.negotiation?.data?.attributes?.visibility;
      if (vis === 'private') return { negotiation: { data: null } };
    }
    return undefined;
  }
};

/**
 * Run the pre-execution guard registered for this qid, if any.
 * Throws a SvelteKit error() to block; resolves silently to allow.
 * @param {SendGuardContext} ctx
 */
export async function runSendGuards(ctx) {
  const guard = PRE_GUARDS[ctx.queId];
  if (guard) await guard(ctx);

  // Generic entity-level guards. Ownership runs first: "is this row any of your
  // business" is the cheaper and more fundamental question, and the vote check
  // reads the same row assuming it has already been answered.
  if (!ctx.query) return;
  const { targets, componentLists } = writeShape(ctx.queId, ctx.query);
  if (targets.length === 0) return;

  await enforceOwnership({ ...ctx, targets });
  await enforceVoteIntegrity({ ...ctx, targets, componentLists });
}

/**
 * Apply the post-execution response filter for this qid, if any.
 * @param {{ queId: string, isSer: boolean, newd: any }} ctx
 * @returns {any} replacement `data` object, or undefined to leave unchanged.
 */
export function filterSendResponse({ queId, isSer, newd }) {
  const filter = POST_FILTERS[queId];
  return filter ? filter({ isSer, newd }) : undefined;
}
