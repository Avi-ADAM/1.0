/**
 * The write side of the rikma API — `sales` and `tasks`, at whichever address
 * they are reached (PLAN_HEADLESS_PRODUCTS_API §5.8, Phase 1b).
 *
 * Before this module, the whole flow lived inside each SvelteKit endpoint:
 * verify the key → check the scope → rate limit → origin allow-list → validate
 * → idempotency → `actionService.executeAction`. Three copies of "verify an API
 * key" was already one copy too many, and the moment `/api/v1/r/{rikma}/sales`
 * had to answer *the same* request as `/api/v1/sales`, a copy per address would
 * have been the whole bug: two tenants, two rate budgets, two error shapes.
 *
 * So the flow lives here once and the endpoints are one-liners. Two things are
 * passed in, and they are the only two things that differ between the old
 * address and the new one:
 *
 *   - `pathProjectId` — the rikma named **by the path**. Absent on the legacy
 *     address, where the key's own rikma is the only tenant there is. When it
 *     is present it must equal the key's rikma, or the answer is
 *     `403 RIKMA_MISMATCH` (§5.8) — the key was minted for one shop and the
 *     path may not talk it into another one.
 *   - `legacy` — this request came in on the old, rikma-less address. The
 *     response then carries `Deprecation` / `Sunset` / a `Link` to *this
 *     caller's* new address, and a line is logged for `[api-legacy]`, so the
 *     old path can be removed once the log goes quiet (§9.12).
 *
 * Everything else — including every status code and every body — is byte for
 * byte what the endpoints answered before.
 */

import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
  verifyApiKeyDetailed,
  assertScope,
  touchLastUsed,
  type VerifiedApiKey
} from '$lib/server/apiKeys.js';
import { actionService, strapiClient } from '$lib/server/actions/index.js';
import type { ActionContext } from '$lib/server/actions/types.js';
import {
  validateSalesPayload,
  buildCreateSaleParams,
  SALES_SCOPE
} from '$lib/server/salesApi.js';
import {
  validateTasksPayload,
  buildCreateTaskParams,
  toTaskStatusView,
  TASKS_CREATE_SCOPE,
  TASKS_READ_SCOPE
} from '$lib/server/tasksApi.js';
import {
  validateOrderPayload,
  toOrderView,
  ORDERS_CREATE_SCOPE,
  ORDERS_READ_SCOPE
} from '$lib/server/ordersApi.js';
import { checkRateLimit, errorResponse } from './http.js';
import { ordersSchemaLive, shopSchemaLive, strapiRun } from './catalog.js';

/** Admin token for Strapi bypass (internal use) — same handling as v1/actions. */
const ADMIN_TOKEN = (env.ADMINMONTHER ?? '')
  .replace(/\s+/g, '')
  .replace(/^ADMINMONTHER=/, '');

/**
 * Per key, per endpoint kind, per minute. Payment gateways and ticket desks
 * fire once per order/ticket; 60/min is generous. The buckets live in
 * `http.ts`'s limiter (one map, one reset seam for tests) under their own
 * prefix, so `sales` and `tasks` keep the separate budgets they always had.
 */
const WRITE_RATE_LIMIT = 60;

const CORS_POST = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const CORS_GET = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/**
 * When the old addresses stop answering (§9.12: 90 days from the migration).
 * Sent as `Sunset`, and the only place the date is written — the removal is a
 * deploy that deletes the three legacy routes, and this header is how callers
 * get told before it happens.
 */
export const LEGACY_SUNSET = 'Thu, 14 Jan 2027 00:00:00 GMT';

export interface WriteArgs {
  request: Request;
  fetch?: typeof fetch;
  /** The rikma in the path — null/undefined on the legacy, path-less address. */
  pathProjectId?: string | null;
  /** True when the request arrived on the deprecated address. */
  legacy?: boolean;
}

// ─── the shared front door ──────────────────────────────────────────────────

/**
 * Verify the key, the scope, the budget and the origin allow-list — in that
 * order, throwing the same HttpErrors the endpoints always threw (so a legacy
 * caller sees no difference at all).
 */
async function authenticateWrite(
  request: Request,
  opts: {
    scope: string;
    bucket: string;
    /**
     * How this endpoint has always refused a caller over its budget: `sales`
     * answers `{success:false,error}` with a 429, `tasks` throws, and the
     * status pull has no limit at all. Copied per endpoint on purpose — a
     * migration may not quietly change an error shape a client already handles.
     */
    rateLimit: 'json' | 'throw' | 'none';
  }
): Promise<{ key: VerifiedApiKey } | { response: Response }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw error(401, 'Missing Authorization header');
  const rawKey = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  const key = await verifyApiKeyDetailed(rawKey);
  if (!key) throw error(401, 'Invalid API key');
  if (key.revoked) throw error(401, 'API key has been revoked');
  if (!assertScope(key, opts.scope))
    throw error(403, `API key is missing the "${opts.scope}" scope`);
  if (!key.project?.id) throw error(403, 'API key is not scoped to a rikma');

  if (
    opts.rateLimit !== 'none' &&
    !checkRateLimit(`${opts.bucket}:${key.keyId}`, WRITE_RATE_LIMIT).allowed
  ) {
    if (opts.rateLimit === 'json') {
      return {
        response: json(
          { success: false, error: 'Rate limit exceeded' },
          { status: 429, headers: CORS_POST }
        )
      };
    }
    throw error(429, 'Rate limit exceeded');
  }

  if (key.allowedOrigins.length > 0) {
    const origin = request.headers.get('Origin');
    if (origin && !key.allowedOrigins.includes(origin)) {
      throw error(403, 'Origin not allowed for this API key');
    }
  }

  return { key };
}

/** Unwrap the two outcomes of `authenticateWrite`. */
function keyOrResponse(
  result: { key: VerifiedApiKey } | { response: Response }
): VerifiedApiKey | Response {
  return 'response' in result ? result.response : result.key;
}

/**
 * The second, independent tenant — the key's rikma against the path's. A
 * mismatch is the one *new* refusal this phase introduces, so it answers in the
 * read API's envelope (`{ error: { code } }`), which is what an integration
 * built against §5.6 already parses.
 */
function assertPathTenant(
  key: VerifiedApiKey,
  pathProjectId: string | null | undefined
): Response | null {
  if (!pathProjectId) return null;
  const keyProject = String(key.project!.id);
  if (keyProject === String(pathProjectId)) return null;
  return errorResponse(
    403,
    'RIKMA_MISMATCH',
    `This API key is scoped to rikma ${keyProject} and cannot write to rikma ${pathProjectId}`
  );
}

/**
 * Stamp a legacy answer: `Deprecation: true`, `Sunset`, and a `Link` to the
 * very address this caller should move to — built from the *key's* rikma, so
 * the header is a working URL, not a template.
 *
 * One line per request to the old address is the whole migration telemetry
 * (§5.8): when `[api-legacy]` stops appearing, the routes can go.
 */
function markLegacy(
  response: Response,
  args: {
    request: Request;
    key: VerifiedApiKey;
    legacyPath: string;
    successor: string;
  }
): Response {
  const projectId = String(args.key.project!.id);
  const successor = args.successor.replace('{rikma}', projectId);
  const headers = new Headers(response.headers);
  headers.set('Deprecation', 'true');
  headers.set('Sunset', LEGACY_SUNSET);
  headers.set('Link', `<${successor}>; rel="successor-version"`);
  console.log(
    `[api-legacy] ${args.legacyPath} key=${args.key.keyId} project=${projectId}`
  );
  return new Response(response.body, { status: response.status, headers });
}

const actionContext = (
  userId: string,
  fetchFn?: typeof fetch
): ActionContext => ({
  userId,
  jwt: ADMIN_TOKEN,
  lang: 'he',
  fetch: fetchFn
});

/** `VALIDATION_FAILED`/`UNAUTHORIZED`/`NOT_FOUND` → the status the endpoints used. */
function statusOfActionError(code: string | undefined): number {
  return code === 'VALIDATION_FAILED'
    ? 400
    : code === 'UNAUTHORIZED'
      ? 403
      : code === 'NOT_FOUND'
        ? 404
        : 500;
}

// ─── sales ──────────────────────────────────────────────────────────────────

/**
 * `POST /api/v1/r/{rikma}/sales` (and its legacy alias `/api/v1/sales`).
 *
 * A deliberately "dumb" REST endpoint that a rikma member's own shop / payment
 * system calls after a successful checkout. It rides the exact same choke point
 * as the in-app sale flow (`createSale`), so holder-consent (saleClaim),
 * inventory and monter logic all apply unchanged.
 *
 * Security: the `projectId` is NEVER taken from the client — it is the key's
 * rikma, and on the new address the path has to agree with it. The worst a
 * leaked key can do is file sales reports for one rikma; reports where the
 * holder ≠ key owner still stall behind the holder's consent.
 */
export async function handleSalesPost(args: WriteArgs): Promise<Response> {
  const { request, fetch, pathProjectId, legacy } = args;
  const auth = keyOrResponse(
    await authenticateWrite(request, {
      scope: SALES_SCOPE,
      bucket: 'sales:report',
      rateLimit: 'json'
    })
  );
  if (auth instanceof Response) return auth;
  const key = auth;

  const mismatch = assertPathTenant(key, pathProjectId);
  if (mismatch) return mismatch;

  const projectId = String(key.project!.id);
  const reporterId = String(key.user.id);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const validated = validateSalesPayload(body);
  if (validated.ok === false) throw error(validated.status, validated.message);
  const payload = validated.value;

  // The product must belong to this rikma; read quant + kindOf for createSale.
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
  const productRow =
    productInfo?.data?.project?.data?.attributes?.matanotofs?.data?.[0];
  if (!productRow?.id) throw error(404, 'Product not found in this rikma');
  const availableQuantity = Number(productRow.attributes?.quant ?? -1);
  const kindOf = productRow.attributes?.kindOf ?? 'total';

  // Idempotency — a retried checkout must not create a second sale.
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
        const response = json(
          {
            success: true,
            duplicated: true,
            saleId: String(dup.id),
            holderStatus: dup.attributes?.holderStatus
          },
          { status: 200, headers: CORS_POST }
        );
        return legacy
          ? markLegacy(response, {
              request,
              key,
              legacyPath: '/api/v1/sales',
              successor: '/api/v1/r/{rikma}/sales'
            })
          : response;
      }
    } catch (e) {
      console.error('[SalesAPI] idempotency lookup failed:', e);
      // Fall through — better a possible duplicate than a dropped sale.
    }
  }

  const params = buildCreateSaleParams({
    payload,
    projectId,
    availableQuantity,
    kindOf
  });
  console.log(
    `[SalesAPI] createSale project=${projectId} product=${payload.productId} holder=${payload.holderUserId} amount=${payload.amount}`
  );

  const result = await actionService.executeAction(
    'createSale',
    params,
    actionContext(reporterId, fetch)
  );

  // Non-blocking "seen last at" stamp.
  touchLastUsed(key.keyId, fetch);

  const response = !result.success
    ? json(
        { success: false, error: result.error },
        { status: statusOfActionError(result.error?.code), headers: CORS_POST }
      )
    : json(
        {
          success: true,
          duplicated: false,
          saleId: result.data?.saleId,
          holderStatus: result.data?.holderStatus
        },
        { status: 201, headers: CORS_POST }
      );

  return legacy
    ? markLegacy(response, {
        request,
        key,
        legacyPath: '/api/v1/sales',
        successor: '/api/v1/r/{rikma}/sales'
      })
    : response;
}

// ─── tasks ──────────────────────────────────────────────────────────────────

/**
 * `POST /api/v1/r/{rikma}/tasks` (and its legacy alias `/api/v1/tasks`).
 *
 * A deliberately "dumb" REST endpoint that a rikma member's own system (ticket
 * desk, bug board, contact form, bot) calls when it produces work. It rides the
 * same choke point as the in-app flow (`createTask`), so the assignee's consent
 * — `myIshur:false` until a human accepts in the platform — applies unchanged.
 *
 * The key's owner is used for exactly one thing: writing who created the task
 * (`Act.vali`).
 */
export async function handleTaskCreatePost(args: WriteArgs): Promise<Response> {
  const { request, fetch, pathProjectId, legacy } = args;
  const auth = keyOrResponse(
    await authenticateWrite(request, {
      scope: TASKS_CREATE_SCOPE,
      bucket: 'tasks:create',
      rateLimit: 'throw'
    })
  );
  if (auth instanceof Response) return auth;
  const key = auth;

  const mismatch = assertPathTenant(key, pathProjectId);
  if (mismatch) return mismatch;

  const projectId = String(key.project!.id);
  const creatorId = String(key.user.id);

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const validated = validateTasksPayload(body);
  if (validated.ok === false) throw error(validated.status, validated.message);
  const payload = validated.value;

  const finish = (response: Response) =>
    legacy
      ? markLegacy(response, {
          request,
          key,
          legacyPath: '/api/v1/tasks',
          successor: '/api/v1/r/{rikma}/tasks'
        })
      : response;

  // 1. Idempotency — a ticket desk that retries must not put the same job on
  //    somebody's plate twice. Best-effort: if the lookup itself fails we would
  //    rather risk a duplicate than silently drop the work.
  if (payload.externalId) {
    try {
      const existing = await strapiClient.execute(
        'tasksApiActByExternalId',
        { pid: projectId, externalId: payload.externalId },
        ADMIN_TOKEN,
        fetch
      );
      const dup = existing?.data?.acts?.data?.[0];
      if (dup?.id) {
        touchLastUsed(key.keyId, fetch);
        const view = toTaskStatusView(dup);
        return finish(
          json(
            {
              success: true,
              duplicated: true,
              taskId: String(dup.id),
              externalId: payload.externalId,
              status: view?.status ?? 'open',
              assignee: view?.assignee ?? null
            },
            { status: 200, headers: CORS_POST }
          )
        );
      }
    } catch (e) {
      console.error('[TasksAPI] idempotency lookup failed:', e);
    }
  }

  // 2. Every id in the payload must belong to THIS rikma. A key scoped to one
  //    rikma may not reach into another one's missions, members or roles — and
  //    a typo should say so rather than create a dangling task.
  let refs: any;
  try {
    refs = await strapiClient.execute(
      'tasksApiProjectRefs',
      { pid: projectId },
      ADMIN_TOKEN,
      fetch
    );
  } catch (e) {
    console.error('[TasksAPI] project refs lookup failed:', e);
    throw error(502, 'Failed to look up the rikma');
  }
  const projAttrs = refs?.data?.project?.data?.attributes;
  if (!projAttrs) throw error(404, 'Rikma not found');

  const memberIds = new Set<string>(
    (projAttrs.user_1s?.data ?? []).map((u: any) => String(u.id))
  );
  const roleIds = new Set<string>(
    (projAttrs.tafkidims?.data ?? []).map((r: any) => String(r.id))
  );
  const missionIds = new Set<string>(
    (projAttrs.mesimabetahaliches?.data ?? []).map((m: any) => String(m.id))
  );

  if (payload.missionId && !missionIds.has(payload.missionId)) {
    throw error(
      404,
      `Mission ${payload.missionId} is not an in-progress mission of this rikma`
    );
  }
  if (payload.assignedUserId && !memberIds.has(payload.assignedUserId)) {
    throw error(
      403,
      `User ${payload.assignedUserId} is not a member of this rikma`
    );
  }
  const unknownRole = payload.roleIds.find((r) => !roleIds.has(r));
  if (unknownRole)
    throw error(404, `Role ${unknownRole} does not belong to this rikma`);

  // 3. Execute the shared createTask action — same choke point as the UI flow,
  //    so notifications and the assignee-consent rule come along for free.
  const params = buildCreateTaskParams({ payload, projectId });
  console.log(
    `[TasksAPI] createTask project=${projectId} externalId=${payload.externalId || '-'} ` +
      `assignee=${payload.assignedUserId ?? '-'} roles=${payload.roleIds.join(',') || '-'}`
  );

  const result = await actionService.executeAction(
    'createTask',
    params,
    actionContext(creatorId, fetch)
  );

  touchLastUsed(key.keyId, fetch);

  if (!result.success) {
    return finish(
      json(
        { success: false, error: result.error },
        { status: statusOfActionError(result.error?.code), headers: CORS_POST }
      )
    );
  }

  const taskId = result.data?.id != null ? String(result.data.id) : null;

  return finish(
    json(
      {
        success: true,
        duplicated: false,
        taskId,
        externalId: payload.externalId || null,
        // An assigned task is an offer until the assignee accepts it in the
        // platform; an unassigned/role task is simply open for whoever takes it.
        status: payload.assignedUserId ? 'awaitingConsent' : 'open',
        assignee: payload.assignedUserId ? { id: payload.assignedUserId } : null
      },
      { status: 201, headers: CORS_POST }
    )
  );
}

/**
 * `GET /api/v1/r/{rikma}/tasks/{externalId}` (and its legacy alias
 * `/api/v1/tasks/{externalId}`).
 *
 * The lazy half of the sync contract: whoever cannot host a webhook receiver
 * can simply ask "what happened to my ticket's task?". Read-only, and scoped to
 * the key's own rikma — an externalId from another rikma is a 404 here, which
 * is also what stops a key from being used to probe other rikmot.
 */
export async function handleTaskStatusGet(args: {
  request: Request;
  fetch?: typeof fetch;
  externalId: string;
  pathProjectId?: string | null;
  legacy?: boolean;
}): Promise<Response> {
  const { request, fetch, pathProjectId, legacy } = args;
  // The status pull never had a rate limit of its own; it keeps none.
  const auth = keyOrResponse(
    await authenticateWrite(request, {
      scope: TASKS_READ_SCOPE,
      bucket: 'tasks:status',
      rateLimit: 'none'
    })
  );
  if (auth instanceof Response) return auth;
  const key = auth;

  const mismatch = assertPathTenant(key, pathProjectId);
  if (mismatch) return mismatch;

  const externalId = String(args.externalId ?? '').trim();
  if (!externalId) throw error(400, 'externalId is required');

  let res: any;
  try {
    res = await strapiClient.execute(
      'tasksApiActByExternalId',
      { pid: String(key.project!.id), externalId },
      ADMIN_TOKEN,
      fetch
    );
  } catch (e) {
    console.error('[TasksAPI] status lookup failed:', e);
    throw error(502, 'Failed to look up the task');
  }

  const row = res?.data?.acts?.data?.[0];
  if (!row?.id)
    throw error(404, `No task with externalId "${externalId}" in this rikma`);

  touchLastUsed(key.keyId, fetch);

  const view = toTaskStatusView(row);
  const response = json(
    { success: true, ...view, externalId },
    { status: 200, headers: CORS_GET }
  );
  return legacy
    ? markLegacy(response, {
        request,
        key,
        legacyPath: `/api/v1/tasks/${externalId}`,
        successor: '/api/v1/r/{rikma}/tasks'
      })
    : response;
}

// ─── orders (PLAN_SHOP_CUSTOMER_EXPERIENCE §3.3, §5.4 — S3) ────────────────

/**
 * The orders envelope: the read API's `{ error: { code, message, details } }`,
 * with real `details` (the line problems), and **no CORS headers** — these
 * endpoints are for a storefront's server, and a browser that cannot read the
 * answer has one more reason not to be the caller.
 */
function orderJson(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function orderError(
  status: number,
  code: string,
  message: string,
  details: Record<string, unknown> = {}
): Response {
  return orderJson(status, { error: { code, message, details } });
}

/** `createPaidOrder`'s refusals → the statuses §5.4 promises. */
function statusOfOrderError(code: string | undefined): number {
  switch (code) {
    case 'PRODUCT_NOT_FOUND':
    case 'VARIANT_NOT_FOUND':
      return 404;
    case 'NOT_FOUND':
      return 404;
    case 'NOT_CHECKOUTABLE':
    case 'VARIANT_REQUIRED':
    case 'EXTERNAL_ID_CONFLICT':
    case 'ORDER_CANCELLED':
    case 'INVALID_TRANSITION':
    case 'PAYMENT_PENDING':
      return 409;
    case 'NOT_HOLDER':
      return 403;
    case 'VALIDATION_FAILED':
      return 400;
    case 'UNAUTHORIZED':
      return 403;
    default:
      return 502;
  }
}

/**
 * The checks every orders endpoint shares after the key: the path's rikma is
 * the key's, the caller is not a browser, and the shop schema is deployed.
 */
async function orderGate(
  key: VerifiedApiKey,
  args: { request: Request; fetch?: typeof fetch; pathProjectId?: string | null }
): Promise<Response | null> {
  const mismatch = assertPathTenant(key, args.pathProjectId);
  if (mismatch) return mismatch;

  // `orders:*` moves money and reads orders — a server-side scope (§3.3). A
  // browser always sends `Origin` on a cross-site POST; a server's fetch does
  // not. Refusing it here makes "never put this key in the page" a rule the
  // API keeps, not a sentence in the docs.
  if (args.request.headers.get('Origin')) {
    return orderError(
      403,
      'ORIGIN_NOT_ALLOWED',
      'Orders are reported from your server, never from a browser — an orders key in a web page is readable by anyone'
    );
  }

  // Both: the catalog columns, and the order columns added after them — every
  // order query names `displayNumber`, so a Strapi without it would fail each
  // request with a 502 instead of saying plainly that it is not ready.
  const run = strapiRun(args.fetch);
  if (!(await shopSchemaLive(run)) || !(await ordersSchemaLive(run))) {
    return orderError(
      503,
      'SHOP_NOT_READY',
      "This deployment's shop schema is not live yet — try again later"
    );
  }
  return null;
}

/**
 * `POST /api/v1/r/{rikma}/orders` — a paid order, from the storefront's
 * server, after its payment provider confirmed the charge.
 *
 * Validation here, everything else in `createPaidOrder`: reading the products
 * and variants from the server, deciding every line before writing any,
 * idempotency and resume by `<rikma>:<externalId>`, a self-held sale per line.
 * The key's owner is the reporter and the money's holder — the till is theirs.
 */
export async function handleOrderPost(args: WriteArgs): Promise<Response> {
  const { request, fetch, pathProjectId } = args;
  const auth = keyOrResponse(
    await authenticateWrite(request, {
      scope: ORDERS_CREATE_SCOPE,
      bucket: 'orders:create',
      rateLimit: 'json'
    })
  );
  if (auth instanceof Response) return auth;
  const key = auth;

  const gate = await orderGate(key, { request, fetch, pathProjectId });
  if (gate) return gate;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return orderError(400, 'VALIDATION', 'Invalid JSON body');
  }
  const validated = validateOrderPayload(body);
  if (validated.ok === false) {
    return orderError(400, 'VALIDATION', validated.message, {
      problems: validated.problems
    });
  }
  const payload = validated.value;
  const projectId = String(key.project!.id);

  console.log(
    `[OrdersAPI] createPaidOrder project=${projectId} externalId=${payload.externalId} lines=${payload.lines.length}`
  );
  const result = await actionService.executeAction(
    'createPaidOrder',
    { projectId, order: payload },
    actionContext(String(key.user.id), fetch)
  );
  touchLastUsed(key.keyId, fetch);

  if (!result.success) {
    const code = result.error?.code;
    const status = statusOfOrderError(code);
    return orderError(
      status,
      status === 502 ? 'UPSTREAM_ERROR' : (code ?? 'UPSTREAM_ERROR'),
      status === 502
        ? 'The order could not be recorded — retry with the same externalId; nothing is charged twice'
        : (result.error?.message ?? 'Refused'),
      result.error?.details && typeof result.error.details === 'object' && !Array.isArray(result.error.details)
        ? { line: (result.error.details as any).line }
        : {}
    );
  }

  const data = result.data ?? {};
  const duplicated = data.duplicated === true;
  return orderJson(duplicated ? 200 : 201, {
    success: true,
    duplicated,
    orderRef: data.orderRef,
    orderId: data.orderId ?? null,
    displayNumber: data.displayNumber ?? null,
    status: data.status,
    // An arranged order (payment: "arranged") waits in pendingPayment until then.
    expiresAt: data.expiresAt ?? null,
    oversold: data.oversold === true,
    total: data.total,
    currency: data.currency,
    // Paid below the catalog and promotion prices (PLAN_SHOP_PROMOTIONS §5.3) —
    // recorded as paid, and the rikma is told. Null when it was not.
    belowCatalog: data.belowCatalog ?? null,
    lines: data.lines ?? []
  });
}

/**
 * `GET /api/v1/r/{rikma}/orders/{ref}` — where the storefront's "thank you"
 * page reads the status. Lines and money, never the buyer (`toOrderView`).
 */
export async function handleOrderGet(args: {
  request: Request;
  fetch?: typeof fetch;
  ref: string;
  pathProjectId?: string | null;
}): Promise<Response> {
  const { request, fetch, pathProjectId } = args;
  const auth = keyOrResponse(
    await authenticateWrite(request, {
      scope: ORDERS_READ_SCOPE,
      bucket: 'orders:read',
      rateLimit: 'json'
    })
  );
  if (auth instanceof Response) return auth;
  const key = auth;

  const gate = await orderGate(key, { request, fetch, pathProjectId });
  if (gate) return gate;

  const projectId = String(key.project!.id);
  const ref = String(args.ref ?? '').trim();
  // A ref names its rikma; another rikma's ref is simply not here.
  if (!ref.startsWith(`${projectId}:`)) {
    return orderError(404, 'NOT_FOUND', 'No such order in this rikma');
  }

  let res: any;
  try {
    res = await strapiClient.execute(
      'rikmaApiOrderByRef',
      { pid: projectId, ref },
      ADMIN_TOKEN,
      fetch
    );
  } catch (e) {
    console.error('[OrdersAPI] order lookup failed:', e);
    return orderError(502, 'UPSTREAM_ERROR', 'Failed to look up the order');
  }
  const node = res?.data?.orders?.data?.[0];
  const view = node ? toOrderView(node) : null;
  if (!view) return orderError(404, 'NOT_FOUND', 'No such order in this rikma');

  touchLastUsed(key.keyId, fetch);
  return orderJson(200, view);
}

/**
 * `POST /api/v1/r/{rikma}/orders/{ref}/cancel` — the storefront refunded the
 * buyer. Same key as the order (`orders:create`), and its owner is the order's
 * holder, so the refund is theirs to report (`cancelOrder`). Retry-safe: a
 * second cancel answers 200 with `alreadyCancelled: true`.
 */
export async function handleOrderCancel(args: {
  request: Request;
  fetch?: typeof fetch;
  ref: string;
  pathProjectId?: string | null;
}): Promise<Response> {
  const { request, fetch, pathProjectId } = args;
  const auth = keyOrResponse(
    await authenticateWrite(request, {
      scope: ORDERS_CREATE_SCOPE,
      bucket: 'orders:create',
      rateLimit: 'json'
    })
  );
  if (auth instanceof Response) return auth;
  const key = auth;

  const gate = await orderGate(key, { request, fetch, pathProjectId });
  if (gate) return gate;

  const projectId = String(key.project!.id);
  const ref = String(args.ref ?? '').trim();
  if (!ref.startsWith(`${projectId}:`)) {
    return orderError(404, 'NOT_FOUND', 'No such order in this rikma');
  }

  // The body is optional — a bare POST is a plain cancel.
  let body: any = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    body = {};
  }
  if (body.restock != null && typeof body.restock !== 'boolean') {
    return orderError(400, 'VALIDATION', 'restock must be true or false');
  }
  const params: Record<string, unknown> = { projectId, orderRef: ref };
  if (typeof body.reason === 'string' && body.reason.trim()) params.reason = body.reason.trim();
  if (typeof body.restock === 'boolean') params.restock = body.restock;

  const result = await actionService.executeAction(
    'cancelOrder',
    params,
    actionContext(String(key.user.id), fetch)
  );
  touchLastUsed(key.keyId, fetch);

  if (!result.success) {
    const code = result.error?.code;
    const status = statusOfOrderError(code);
    return orderError(
      status,
      status === 502 ? 'UPSTREAM_ERROR' : (code ?? 'UPSTREAM_ERROR'),
      status === 502 ? 'The cancel could not be completed — send it again; it is safe to retry' : (result.error?.message ?? 'Refused')
    );
  }

  const data = result.data ?? {};
  return orderJson(200, {
    success: true,
    orderRef: data.orderRef ?? ref,
    status: 'cancelled',
    alreadyCancelled: data.alreadyCancelled === true,
    restocked: data.restocked === true,
    // How many sales were reset, and how many the rikma still has to settle.
    refunds: {
      reset: data.refunds?.reset?.length ?? 0,
      leftForRikma: (data.refunds?.afterSplit?.length ?? 0) + (data.refunds?.notMine?.length ?? 0)
    }
  });
}

/** CORS preflight, identical for every write endpoint. */
export function writePreflight(
  methods: 'POST, OPTIONS' | 'GET, OPTIONS' = 'POST, OPTIONS'
): Response {
  return new Response(null, {
    status: 204,
    headers: methods === 'GET, OPTIONS' ? CORS_GET : CORS_POST
  });
}
