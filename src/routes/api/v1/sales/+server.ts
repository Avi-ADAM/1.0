import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyApiKeyDetailed, assertScope, touchLastUsed } from '$lib/server/apiKeys';
import { actionService, strapiClient } from '$lib/server/actions/index.js';
import type { ActionContext } from '$lib/server/actions/types.js';
import { validateSalesPayload, buildCreateSaleParams, SALES_SCOPE } from '$lib/server/salesApi';
import { ADMINMONTHER } from '$env/static/private';

/**
 * POST /api/v1/sales — External Sales Reporting API (PLAN_EXTERNAL_SALES_API).
 *
 * A deliberately "dumb" REST endpoint that a rikma member's own shop / payment
 * system calls after a successful checkout. It rides the exact same choke point
 * as the in-app sale flow (`createSale`), so holder-consent (saleClaim),
 * inventory and monter logic all apply unchanged.
 *
 * Security: the `projectId` is NEVER taken from the client — it is derived from
 * the scoped API key. The worst a leaked key can do is file sales reports for
 * one rikma; reports where the holder ≠ key owner still stall behind the
 * holder's consent.
 */

// Admin token for Strapi bypass (internal use) — same handling as v1/actions.
const ADMIN_TOKEN = ADMINMONTHER.replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');

// ─── Basic in-memory per-key rate limiting ──────────────────────────────────
// Payment gateways fire once per order; 60/min is generous. This is a first
// line of defence only — Phase 3 may move it to Redis.
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 1000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(keyId: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(keyId);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(keyId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const POST: RequestHandler = async ({ request, fetch }) => {
  // 1. Verify API key (with scoping metadata).
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw error(401, 'Missing Authorization header');
  const rawKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  const key = await verifyApiKeyDetailed(rawKey);
  if (!key) throw error(401, 'Invalid API key');
  if (key.revoked) throw error(401, 'API key has been revoked');
  if (!assertScope(key, SALES_SCOPE)) throw error(403, `API key is missing the "${SALES_SCOPE}" scope`);
  if (!key.project?.id) throw error(403, 'API key is not scoped to a rikma');

  const projectId = String(key.project.id);
  const reporterId = String(key.user.id);

  // 2. Rate limit per key.
  if (!checkRateLimit(key.keyId)) {
    return json({ success: false, error: 'Rate limit exceeded' }, { status: 429, headers: CORS_HEADERS });
  }

  // 3. Optional origin hardening.
  if (key.allowedOrigins.length > 0) {
    const origin = request.headers.get('Origin');
    if (origin && !key.allowedOrigins.includes(origin)) {
      throw error(403, 'Origin not allowed for this API key');
    }
  }

  // 4. Parse + validate the body.
  let body: any;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const validated = validateSalesPayload(body);
  if (validated.ok === false) {
    throw error(validated.status, validated.message);
  }
  const payload = validated.value;

  // 5. Product must belong to the key's rikma; read quant + kindOf for createSale.
  let productInfo: any;
  try {
    productInfo = await strapiClient.execute(
      'salesApiProductInfo',
      { pid: projectId, productId: payload.productId },
      ADMIN_TOKEN,
      fetch
    );
  } catch (e) {
    console.error('[SalesAPI] product lookup failed:', e);
    throw error(502, 'Failed to look up product');
  }
  const productRow = productInfo?.data?.project?.data?.attributes?.matanotofs?.data?.[0];
  if (!productRow?.id) throw error(404, 'Product not found in this rikma');
  const availableQuantity = Number(productRow.attributes?.quant ?? -1);
  const kindOf = productRow.attributes?.kindOf ?? 'total';

  // 6. Idempotency — a retried checkout must not create a second sale.
  if (payload.externalId) {
    try {
      const existing = await strapiClient.execute(
        'saleByExternalId',
        { pid: projectId, externalId: payload.externalId },
        ADMIN_TOKEN,
        fetch
      );
      const dup = existing?.data?.sales?.data?.[0];
      if (dup?.id) {
        touchLastUsed(key.keyId, fetch);
        return json(
          { success: true, duplicated: true, saleId: String(dup.id), holderStatus: dup.attributes?.holderStatus },
          { status: 200, headers: CORS_HEADERS }
        );
      }
    } catch (e) {
      console.error('[SalesAPI] idempotency lookup failed:', e);
      // Fall through — better a possible duplicate than a dropped sale.
    }
  }

  // 7. Execute the shared createSale action (same choke point as the UI flow).
  const context: ActionContext = {
    userId: reporterId,
    jwt: ADMIN_TOKEN,
    lang: 'he',
    fetch
  };

  const params = buildCreateSaleParams({ payload, projectId, availableQuantity, kindOf });

  console.log(`[SalesAPI] createSale project=${projectId} product=${payload.productId} holder=${payload.holderUserId} amount=${payload.amount}`);

  const result = await actionService.executeAction('createSale', params, context);

  // Non-blocking "seen last at" stamp.
  touchLastUsed(key.keyId, fetch);

  if (!result.success) {
    const code = result.error?.code;
    const status = code === 'VALIDATION_FAILED' ? 400 : code === 'UNAUTHORIZED' ? 403 : code === 'NOT_FOUND' ? 404 : 500;
    return json({ success: false, error: result.error }, { status, headers: CORS_HEADERS });
  }

  return json(
    {
      success: true,
      duplicated: false,
      saleId: result.data?.saleId,
      holderStatus: result.data?.holderStatus
    },
    { status: 201, headers: CORS_HEADERS }
  );
};

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
