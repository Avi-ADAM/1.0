// Entity-level guards for /api/send — the qid-specific ownership/visibility
// rules that the static qidsAccess manifest cannot express.
//
// These were previously inlined in +server.js as a growing chain of `if`s.
// Centralizing them here keeps the handler readable, makes each guard unit
// testable, and lets us answer "which guards apply to this qid" declaratively.
// Behaviour is preserved 1:1 — same conditions, same status codes, same
// messages, evaluated at the same point in the request lifecycle.
//
// Two kinds:
//   • PRE guards  — run AFTER the idempotent-vote handler and BEFORE the
//     GraphQL fetch. They throw a SvelteKit error() to block the request.
//   • POST filters — run AFTER the fetch on the downstream response. They
//     return a replacement `data` object to override what the client sees,
//     or undefined to leave the response untouched.

import { error } from '@sveltejs/kit';

/**
 * @typedef {Object} SendGuardContext
 * @property {string} queId
 * @property {boolean} isSer
 * @property {Record<string, any>} keyValueObject  raw client `arg` (incl. support/body/issueId)
 * @property {Record<string, any>} variablesObject resolved GraphQL variables (incl. id)
 * @property {{ externalId?: string, [k: string]: any } | null} identity  server __identity
 * @property {string} bearer1        Authorization header value ('Bearer …')
 * @property {string} ep             Strapi GraphQL endpoint
 * @property {typeof globalThis.fetch} [fetch]  injectable for tests
 */

/** @type {Record<string, (ctx: SendGuardContext) => void | Promise<void>>} */
const PRE_GUARDS = {
  // Editing a position (UpdatePosition without support:true) is registered-user
  // only. Votes (support:true) are handled earlier by the idempotent-vote path
  // and never reach here, so any service call at this point is a direct edit.
  '42UpdatePosition': ({ isSer, keyValueObject }) => {
    if (isSer && keyValueObject.support !== true) {
      throw error(403, 'Forbidden: Service accounts cannot edit positions directly');
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
          body: JSON.stringify({ query: `query { clause(id: "${clauseId}") { data { attributes { authorExternalId } } } }` }),
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
