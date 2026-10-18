import type { RequestHandler } from './$types';
import {
  API_VERSION,
  PUBLIC_KEY_DRAFT_SCOPE,
  PUBLIC_KEY_SCOPE,
  authenticateRead,
  errorResponse,
  preflightResponse,
  respond
} from '$lib/server/apiPublic/http.js';
import { apiRikmaPath } from '$lib/server/apiPublic/rikmaPath.js';
import {
  fetchRikmaRef,
  fetchUserName,
  strapiRun
} from '$lib/server/apiPublic/catalog.js';

/**
 * GET /api/v1/me — who this key is (§5.2).
 *
 * The one call that makes the rest of the contract usable by an agent: instead
 * of asking a human "what is my rikma id?", an integration starts here and gets
 * the rikma, its slug (and therefore every address), the scopes it was granted
 * and the quota it is spending — then builds the rest from that.
 *
 * A key is required (there is nothing to say to an anonymous caller), and it is
 * not a leak: the key is describing itself to its owner.
 */
export const GET: RequestHandler = async ({ request, fetch }) => {
  const authResult = await authenticateRead(request, fetch);
  if (authResult.kind === 'deny') return authResult.response;
  const { auth } = authResult;

  if (auth.kind !== 'key' || !auth.key) {
    return errorResponse(
      401,
      'KEY_REQUIRED',
      'This endpoint describes an API key — send one in the Authorization header'
    );
  }

  const run = strapiRun(fetch);
  const projectId = auth.projectId!;

  const [rikmaRow, userName] = await Promise.all([
    fetchRikmaRef(run, projectId),
    fetchUserName(run, String(auth.key.user.id))
  ]);

  const scopes: string[] = Array.isArray(auth.key.scopes)
    ? auth.key.scopes.filter((s) => typeof s === 'string')
    : [];
  const prefix = rikmaRow
    ? apiRikmaPath(rikmaRow.slug ?? rikmaRow.id)
    : apiRikmaPath(projectId);

  const body = {
    data: {
      key: {
        id: auth.key.keyId,
        name: auth.key.name,
        lastUsedAt: auth.key.lastUsedAt
      },
      user: { id: String(auth.key.user.id), name: userName },
      rikma: {
        id: rikmaRow?.id ?? projectId,
        slug: rikmaRow?.slug ?? null,
        name: rikmaRow?.name ?? null,
        canonicalPath: prefix
      },
      scopes,
      access: {
        read:
          scopes.includes(PUBLIC_KEY_SCOPE) ||
          scopes.includes(PUBLIC_KEY_DRAFT_SCOPE),
        draft: scopes.includes(PUBLIC_KEY_DRAFT_SCOPE)
      },
      // The *same* window the request just spent, not a fresh one: asking the
      // limiter again would count this call twice (see ApiAuth.quota).
      quota: {
        limit: auth.quota?.limit ?? 600,
        windowSeconds: 60,
        remaining: auth.quota?.remaining ?? 0
      },
      apiVersion: API_VERSION,
      endpoints: {
        rikma: prefix,
        products: `${prefix}/products`,
        product: `${prefix}/products/{productId}`,
        categories: `${prefix}/categories`,
        // The write half, now at the rikma's own address too (§5.8). An agent
        // that starts at /me should never have to be told the legacy paths.
        sales: `${prefix}/sales`,
        tasks: `${prefix}/tasks`,
        task: `${prefix}/tasks/{externalId}`,
        me: '/api/v1/me'
      }
    }
  };

  // This body carries the key's own live state (remaining quota, last use), so
  // it is never stored: no ETag, no shared cache.
  return respond({ request, auth, body, etag: '', noStore: true });
};

export const OPTIONS: RequestHandler = async () => preflightResponse();
