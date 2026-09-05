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
import { enforceOwnership } from './ownership.js';
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
  '310projectResourceOccupancy': async ({ isSer, callerId, variablesObject, bearer1, ep, fetch: injected }) => {
    if (isSer) return;
    if (!callerId) throw error(401, 'Unauthorized: No caller id');
    const pid = variablesObject.pid;
    if (!pid) throw error(400, 'Missing pid for 310projectResourceOccupancy');

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
      throw error(500, `Failed to fetch project members for occupancy check: ${e.message}`);
    }

    const members = data?.data?.project?.data?.attributes?.user_1s?.data ?? [];
    if (!members.some((m) => String(m.id) === String(callerId))) {
      throw error(403, 'Forbidden: Only members can read the rikma’s resource calendar');
    }
  },

  // UpdateClause ownership:
  //   • body/issueId: registered (JWT) owner only — block the service path.
  //   • other fields (stanceValue/confirmedByAuthor): service path allowed,
  //     but only for the clause's own author (matched via __identity.externalId).
  'UpdateClause': async ({ isSer, keyValueObject, variablesObject, identity, bearer1, ep, fetch: injected }) => {
    if (isSer && (keyValueObject.body != null || keyValueObject.issueId != null)) {
      throw error(403, 'Forbidden: Service accounts cannot edit clause body or issueId');
    }
    if (isSer) {
      const clauseId = variablesObject.id;
      if (!clauseId) throw error(400, 'Missing id for UpdateClause');
      const ownerExternalId = identity?.externalId;
      if (!ownerExternalId) throw error(403, 'Forbidden: Missing __identity.externalId for UpdateClause');

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
      if (clauseAuthor !== ownerExternalId) {
        throw error(403, 'Forbidden: Not the clause author');
      }
    }
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
