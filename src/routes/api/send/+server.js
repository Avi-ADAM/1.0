// Secure endpoint that uses HttpOnly cookies for authentication.
// Proxy to Strapi GraphQL — qids map names to safe, pre-vetted queries.
import { qids } from './qids.js'
import { validateAllQids, validateQuery } from './qidsValidator.js'
import { json, error } from '@sveltejs/kit'
import { ADMINMONTHER, CONSENSUS_PUBLIC_TOKEN, CONSENSUS_PROXY_SECRET, STRAPI_URL } from '$env/static/private'
const ep = STRAPI_URL + "/graphql"
import { createHash } from 'node:crypto'
import { isInternalRequest } from '$lib/server/internalSecret.js'
import { resolveServicePrincipal, resolveCookiePrincipal } from '$lib/server/authz/principal.js'
import { applyAuthz } from '$lib/server/authz/authorize.js'

function normalizeSecret(value, name) {
	let normalized = String(value ?? '').replace(/\s+/g, '');
	if (name && normalized.startsWith(`${name}=`)) {
		normalized = normalized.slice(name.length + 1);
	}
	return normalized;
}

function fingerprintSecret(value) {
	const normalized = normalizeSecret(value);

	return {
		present: normalized.length > 0,
		length: normalized.length,
		sha12: normalized ? createHash('sha256').update(normalized).digest('hex').slice(0, 12) : null
	};
}

function getServiceToken(isConsensusQid) {
	return isConsensusQid
		? normalizeSecret(CONSENSUS_PUBLIC_TOKEN, 'CONSENSUS_PUBLIC_TOKEN')
		: normalizeSecret(ADMINMONTHER, 'ADMINMONTHER');
}

// ── Consensus qid registry ─────────────────────────────────────────────────
/** qids that belong to the consensus feature */
const CONSENSUS_QIDS = new Set([
	'39GetNegotiation', '40CreateNegotiation', '41CreatePosition', '42UpdatePosition',
	'GetNegotiationByToken', 'ListLocalNegotiations',
	'ListArguments', 'CreateArgument', 'UpdateArgument', 'ListPlaces',
	'ListIssues', 'ListClauses', 'CreateIssue', 'CreateClause', 'UpdateClause'
]);

/** qids where server injects __identity → author fields before sending to Strapi */
const IDENTITY_INJECT_QIDS = new Set(['41CreatePosition', 'CreateArgument', 'CreateClause']);

/** qids where arg.support === true triggers server-side idempotent vote (read-then-write) */
const VOTE_QIDS = new Set(['42UpdatePosition', 'UpdateArgument']);

// ── Dev-time schema validation ─────────────────────────────────────────────
const isDev = import.meta.env.DEV;
if (isDev) {
	console.log('\n🔍 [qids] Running schema validation...');
	try {
		const result = validateAllQids(qids, { strict: false, silent: false });
		if (result.valid) {
			console.log('✅ [qids] All queries match the schema!\n');
		}
	} catch (e) {
		console.warn('⚠️ [qids] Schema validation error:', e.message);
	}
}

export async function POST({ request, cookies }) {
	const data = await request.json();

	// ── Resolve query string ─────────────────────────────────────────────────
	// Only whitelisted qids are allowed. Raw client-supplied GraphQL would
	// bypass the whitelist entirely, so it is permitted in dev only.
	const queId = data?.data?.queId;
	let query;
	if (queId) {
		query = qids[queId];
		if (!query) throw error(400, `Unknown queId: ${queId}`);
	} else {
		if (!isDev) throw error(403, 'Raw GraphQL queries are not allowed; use a queId');
		query = data?.data?.query;
		if (!query) throw error(400, 'queId or query is required');
		const validation = validateQuery('raw-query', query);
		if (!validation.valid) {
			console.error('❌ [qids] Raw query validation failed:');
			validation.errors.forEach(e => console.error(`   ${e}`));
		}
	}

	// ── Auth flags ───────────────────────────────────────────────────────────
	// `isSer` grants the service/admin token, so it is honoured only when the
	// request carries the internal secret (injected by handleFetch for genuine
	// server-side calls). A client cannot forge it.
	const isSer = (data.isSer === true) && isInternalRequest(request);
	const idL = cookies.get('id');
	const un = cookies.get('un');   // username — used as voter-id for JWT path
	const isConsensusQid = queId && CONSENSUS_QIDS.has(queId);

	// ── Security: validate consensus proxy secret for service calls ──────────
	if (isSer && isConsensusQid) {
		const consensusProxySecret = normalizeSecret(CONSENSUS_PROXY_SECRET, 'CONSENSUS_PROXY_SECRET');

		if (!consensusProxySecret) {
			throw error(500, 'Server misconfiguration: CONSENSUS_PROXY_SECRET not set');
		}
		const incoming = request.headers.get('x-consensus-secret');
		if (incoming !== consensusProxySecret) {
			throw error(401, 'Unauthorized: Invalid consensus proxy secret');
		}
	}

	// ── Static authorization: principal kind × qid (see src/lib/server/authz) ─
	// Runs after the consensus-secret validation above so a bad secret still
	// 401s exactly as before. Raw dev queries (no queId) are dev-only and skip
	// this layer. AUTHZ_MODE=log (default) only logs would-be denials;
	// AUTHZ_MODE=enforce returns 403. Entity-level guards further down and the
	// per-action authRules are unaffected — this is the coarse first layer.
	const principal = isSer ? resolveServicePrincipal(request) : resolveCookiePrincipal(cookies);
	if (queId) {
		const { blocked, decision } = applyAuthz({ principal, op: `send:${queId}` });
		if (blocked) throw error(403, `Forbidden: ${decision.reason}`);
	}

	// ── Token selection ──────────────────────────────────────────────────────
	// Service calls to consensus qids use the limited-scope token; other service
	// calls keep the admin token; JWT calls use the user's own token.
	let jw;
	if (isSer) {
		jw = getServiceToken(isConsensusQid);
	} else {
		jw = cookies.get('jwt');
	}

	if (!jw) {
		if (!isSer) throw error(401, 'Unauthorized: No token found');
		throw error(500, 'Server misconfiguration: service token not set');
	}

	// ── Extract __identity before building variables ─────────────────────────
	const keyValueObject = data.data?.arg || {};
	const identity = keyValueObject.__identity ?? null;

	// ── Build GraphQL variables (strip __identity and resolve idL) ───────────
	let variablesObject = {};
	for (const key in keyValueObject) {
		if (keyValueObject[key] != null && key !== '__identity') {
			variablesObject[key] = (key === 'idL') ? idL : keyValueObject[key];
		}
	}

	// ── Inject identity fields for author-creation qids ─────────────────────
	// Server uses __identity as the authoritative source — never trust client-sent author fields.
	if (isSer && identity && IDENTITY_INJECT_QIDS.has(queId)) {
		if (identity.email) variablesObject.authorEmail = identity.email;
		if (identity.externalId) variablesObject.authorExternalId = identity.externalId;
		if (identity.type) variablesObject.authorType = identity.type;
		if (identity.name) variablesObject.authorName = identity.name;
	}

	const bearer1 = 'Bearer ' + jw;

	// ── Server-side idempotent vote handler ──────────────────────────────────
	// Handles both JWT path (username as voter-id) and service path (__identity.externalId).
	if (keyValueObject.support === true && VOTE_QIDS.has(queId)) {
		// Determine voter id
		let voterId;
		if (isSer && identity?.externalId) {
			voterId = identity.externalId;
		} else if (!isSer && un) {
			voterId = un;
		} else {
			throw error(400, 'Missing voter identity for vote operation');
		}

		const entityId = variablesObject.id;
		if (!entityId) throw error(400, 'Missing id for vote operation');

		const isPosition = queId === '42UpdatePosition';
		const entityType = isPosition ? 'position' : 'argument';

		// Step 1 — Fetch current voters/votes
		const fetchGql = `query GetVoters { ${entityType}(id: "${entityId}") { data { attributes { votes voters } } } }`;
		let fetchData;
		try {
			const fetchRes = await fetch(ep, {
				method: 'POST',
				body: JSON.stringify({ query: fetchGql }),
				headers: { 'Content-Type': 'application/json', Authorization: bearer1 }
			});
			fetchData = await fetchRes.json();
		} catch (e) {
			throw error(500, `Failed to fetch ${entityType} for vote: ${e.message}`);
		}

		const attrs = fetchData.data?.[entityType]?.data?.attributes;
		if (!attrs) throw error(404, `${entityType} not found`);

		// Step 2 — Idempotency check
		const currentVoters = Array.isArray(attrs.voters) ? attrs.voters : [];
		if (currentVoters.includes(voterId)) {
			return json({ data: { alreadyVoted: true, votes: attrs.votes } });
		}

		// Step 3 — Write updated voters + votes
		const newVoters = [...currentVoters, voterId];
		const newVotes = (attrs.votes || 0) + 1;

		const updateMutation = isPosition
			? `mutation VotePosition($id: ID!, $voters: JSON, $votes: Int) { updatePosition(id: $id, data: { voters: $voters, votes: $votes }) { data { id attributes { votes voters } } } }`
			: `mutation VoteArgument($id: ID!, $voters: JSON, $votes: Int) { updateArgument(id: $id, data: { voters: $voters, votes: $votes }) { data { id attributes { votes voters } } } }`;

		const controller2 = new AbortController();
		const tid2 = setTimeout(() => controller2.abort(), 30000);
		try {
			const updateRes = await fetch(ep, {
				method: 'POST',
				body: JSON.stringify({ query: updateMutation, variables: { id: entityId, voters: newVoters, votes: newVotes } }),
				headers: { 'Content-Type': 'application/json', Authorization: bearer1 },
				signal: controller2.signal
			});
			clearTimeout(tid2);
			const updateData = await updateRes.json();
			return json(updateData);
		} catch (e) {
			clearTimeout(tid2);
			if (e.name === 'AbortError') throw error(504, 'Vote update timed out');
			throw error(500, e.message || 'Vote update failed');
		}
	}

	// ── Enforce: service accounts cannot directly edit positions ─────────────
	// (editing = UpdatePosition without support:true — only registered JWT users allowed)
	if (isSer && queId === '42UpdatePosition' && keyValueObject.support !== true) {
		throw error(403, 'Forbidden: Service accounts cannot edit positions directly');
	}

	// ── Enforce: UpdateClause ownership rules ────────────────────────────────
	// body/issueId: JWT (registered owner) only — block service path entirely.
	// stanceValue/confirmedByAuthor: service path allowed, but only for the clause author.
	if (queId === 'UpdateClause') {
		if (isSer && (keyValueObject.body != null || keyValueObject.issueId != null)) {
			throw error(403, 'Forbidden: Service accounts cannot edit clause body or issueId');
		}
		if (isSer) {
			const clauseId = variablesObject.id;
			if (!clauseId) throw error(400, 'Missing id for UpdateClause');
			const ownerExternalId = identity?.externalId;
			if (!ownerExternalId) throw error(403, 'Forbidden: Missing __identity.externalId for UpdateClause');

			let fetchData;
			try {
				const fetchRes = await fetch(ep, {
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

	// ── Standard GraphQL fetch ───────────────────────────────────────────────
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 30000);

	try {
		const res = await fetch(ep, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify({ query, variables: variablesObject || {} }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: bearer1
			},
			signal: controller.signal
		});

		clearTimeout(timeoutId);
		const newd = await res.json();

		if (newd.data) {
			// §5 bridge spec: never hand a private (bridge) discussion to the
			// service path (guest/charter). Registered users read it through the
			// JWT path, where Strapi enforces visibility. GetNegotiationByToken is
			// link-based and ListLocalNegotiations already excludes private — so
			// only the read-by-id qid needs guarding here.
			if (isSer && queId === '39GetNegotiation') {
				const vis = newd.data?.negotiation?.data?.attributes?.visibility;
				if (vis === 'private') {
					return json({ data: { negotiation: { data: null } } });
				}
			}
			return json(newd);
		}

		if (newd.errors) {
			console.error(`[${queId}] GraphQL Errors from downstream:`, JSON.stringify(newd.errors, null, 2));
			const authError = newd.errors.find(err =>
				err.message === 'Invalid token.' ||
				err.extensions?.code === 'UNAUTHENTICATED' ||
				err.message.includes('401') ||
				err.message.includes('Unauthorized')
			);
			if (authError) throw error(401, authError.message);
			return json(newd, { status: 500 });
		}

		console.error('Unexpected response structure:', {
			queId,
			isSer,
			isConsensusQid,
			endpoint: ep,
			serviceToken: isSer ? fingerprintSecret(jw) : { present: Boolean(jw) },
			response: newd
		});
		if (newd.error?.status === 401 || newd.error?.name === 'UnauthorizedError') {
			throw error(401, newd.error?.message || 'Unauthorized');
		}
		return json({ error: 'Unexpected response from server', details: newd }, { status: 500 });

	} catch (e) {
		clearTimeout(timeoutId);
		if (e.name === 'AbortError') {
			console.error('Fetch request timed out.');
			throw error(504, 'Gateway Timeout: The server did not respond in time.');
		}
		if (e.status && e.body) throw e;
		console.error('Error:', e);
		throw error(500, e.message || 'An internal server error occurred.');
	}
}
/*
ללוגין
export async function post({ request, cookies }) {
	// ... your code

	return {
		headers: {
			'set-cookie': `yourCookieName=${yourCookieValue}; path=/; HttpOnly; max-age=31536000`,
		},
		// ... your code
	};
}
*/
