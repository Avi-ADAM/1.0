import type { RequestHandler } from './$types';
import {
  handleTaskCreatePost,
  writePreflight
} from '$lib/server/apiPublic/writeApi.js';

/**
 * POST /api/v1/tasks — External Tasks API (PLAN_EXTERNAL_TASKS_API).
 *
 * **Deprecated** (PLAN_HEADLESS_PRODUCTS_API §5.8): replaced by
 * `POST /api/v1/r/{rikma}/tasks`. Legacy answers carry `Deprecation`,
 * `Sunset` and a `Link` to this caller's new address, and each request logs
 * one `[api-legacy]` line.
 *
 * The flow is shared verbatim with the new address
 * (`$lib/server/apiPublic/writeApi.js`) — same scopes, same validation, same
 * bodies.
 */
export const POST: RequestHandler = async ({ request, fetch }) =>
  handleTaskCreatePost({ request, fetch, legacy: true });

export const OPTIONS: RequestHandler = async () =>
  writePreflight('POST, OPTIONS');
