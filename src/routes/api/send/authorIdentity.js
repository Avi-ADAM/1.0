// Author stamping for the consensus create qids.
//
// A position, argument or clause records who wrote it in `authorExternalId`
// (+ `authorType`), and the consensus UI recognizes the owner by that value —
// it is what lets an author edit their own clauses. So it must come from
// something this server verified, never from the request body:
//   • service path (charter/guest via the consensus proxy): `__identity`,
//     which the proxy builds from its own SSO cookies;
//   • JWT path (registered users): the signed session — `locals.uid` /
//     `locals.un` — and authorType 'registered'.
// Client-sent author fields are dropped on both paths first, so a caller can
// neither claim someone else nor keep a stale value the server did not set.

/** qids where the server stamps the author before sending to Strapi */
export const IDENTITY_INJECT_QIDS = new Set(['41CreatePosition', 'CreateArgument', 'CreateClause']);

/** Variables that say who wrote the row. `author` is the Strapi user relation on positions. */
const AUTHOR_VARS = ['author', 'authorEmail', 'authorExternalId', 'authorType', 'authorName'];

/** Does the qid's GraphQL declare `$name`? Undeclared variables are not sent. */
function declares(query, name) {
	return new RegExp(`\\$${name}\\b`).test(query);
}

/**
 * Overwrite the author variables of a consensus create in place.
 *
 * @param {{
 *   queId: string,
 *   query: string,
 *   variablesObject: Record<string, any>,
 *   isSer: boolean,
 *   identity: { externalId?: string|null, type?: string|null, email?: string|null, name?: string|null } | null,
 *   callerId?: string|number,
 *   username?: string
 * }} ctx
 */
export function stampAuthor({ queId, query, variablesObject, isSer, identity, callerId, username }) {
	if (!IDENTITY_INJECT_QIDS.has(queId)) return;

	for (const key of AUTHOR_VARS) delete variablesObject[key];

	/** @type {Record<string, any>} */
	const stamp = {};
	if (isSer) {
		if (identity?.email) stamp.authorEmail = identity.email;
		if (identity?.externalId) stamp.authorExternalId = String(identity.externalId);
		if (identity?.type) stamp.authorType = identity.type;
		if (identity?.name) stamp.authorName = identity.name;
	} else if (callerId) {
		// The consensus site keys registered users by their 1lev1 user id, so
		// this is the value its owner check compares against. No authorEmail:
		// the only email on the request is the `email` cookie, which the client
		// writes — the `author` relation already links the verified account.
		stamp.author = String(callerId);
		stamp.authorExternalId = String(callerId);
		stamp.authorType = 'registered';
		if (username) stamp.authorName = username;
	}

	for (const [key, value] of Object.entries(stamp)) {
		if (declares(query, key)) variablesObject[key] = value;
	}
}
