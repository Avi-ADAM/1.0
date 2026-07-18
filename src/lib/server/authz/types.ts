/**
 * Authorization layer — shared types.
 *
 * A `Principal` is WHO carries the request (derived from the token that
 * authenticated it); an operation string is WHAT is being attempted:
 * `send:<qid>` for /api/send or `action:<actionKey>` for /api/action.
 *
 * See docs/PLAN_API_PERMISSIONS.md.
 */

export type PrincipalKind =
  /** Registered user authenticated by the httpOnly `jwt` cookie */
  | 'user'
  /** Server-originated call: isSer + x-internal-secret → ADMINMONTHER token */
  | 'serviceAdmin'
  /** Server-originated consensus call: isSer + x-consensus-secret → CONSENSUS_PUBLIC_TOKEN */
  | 'serviceConsensus'
  /** External caller authenticated by a 1lev1_… API key (Strapi does not know
   *  this token — WE enforce permissions here, and execution ultimately uses
   *  the Strapi admin token behind the scenes) */
  | 'apiKey'
  /** No recognized credential */
  | 'anonymous';

/**
 * Scopes attached to an API key. Keys are always owned by a user; scopes
 * optionally narrow what that key may do on the user's behalf.
 */
export interface ApiKeyScopes {
  /** Strapi project ids this key may act on. Empty/missing or ['*'] = no project restriction. */
  projects?: string[];
  /** Operation strings (`action:createTask`, `send:12mission`) this key may run.
   *  Empty/missing or ['*'] = every op whose manifest allows 'apiKey'. */
  ops?: string[];
}

export interface Principal {
  kind: PrincipalKind;
  /** Strapi user id — set for 'user' and 'apiKey' */
  userId?: string;
  /** cookie `un` — used as voter-id on the JWT path */
  username?: string;
  /** API-key scopes ('apiKey' only) */
  scopes?: ApiKeyScopes;
}

export type AuthzResult = 'allowed' | 'denied' | 'conditional';

export interface AuthzDecision {
  result: AuthzResult;
  /** Human-readable reason — set when denied, or names the guard when conditional */
  reason?: string;
}

/** One entry of the /api/send permission manifest (qidsAccess.js) */
export interface QidAccessEntry {
  allow: PrincipalKind[];
}
