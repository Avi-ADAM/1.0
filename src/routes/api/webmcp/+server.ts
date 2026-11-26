/**
 * WebMCP endpoint (docs/inprogress/PLAN_WEBMCP.md §3.3).
 *
 *   GET  /api/webmcp?path=/moach/89  → the tools that page registers
 *   POST /api/webmcp  {tool, input, path} → runs one of them as the signed-in user
 *
 * Same-origin only: it acts with the session cookie, so a request another
 * site's page makes is refused before anything runs, and hooks.server.js
 * never adds CORS headers here. 404 while WEBMCP is off.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { callWebMcpTool, describeSurface, webmcpMode } from '$lib/server/webmcp/index.js';
import { sameOrigin } from '$lib/server/webmcp/sameOrigin.js';
import { resolveChatIdentity } from '$lib/server/chatIdentity';

const MAX_BODY = 64 * 1024;

function safeAddress(getClientAddress: () => string): string {
  try {
    return getClientAddress();
  } catch {
    return 'unknown';
  }
}

const noStore = { 'cache-control': 'private, no-store' };

export const GET: RequestHandler = async ({ request, url, locals }) => {
  const mode = webmcpMode();
  if (mode === 'off') return new Response('Not found', { status: 404 });
  if (!sameOrigin(request, url)) return json({ success: false, message: 'Same-origin only.' }, { status: 403 });

  const path = url.searchParams.get('path') || '/';
  const { userId } = resolveChatIdentity(locals as any);
  return json({ mode, tools: describeSurface(path, !!userId, mode) }, { headers: noStore });
};

export const POST: RequestHandler = async ({ request, url, locals, fetch, getClientAddress }) => {
  const mode = webmcpMode();
  if (mode === 'off') return new Response('Not found', { status: 404 });
  if (!sameOrigin(request, url)) return json({ success: false, message: 'Same-origin only.' }, { status: 403 });
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json({ success: false, message: 'JSON only.' }, { status: 415 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ success: false, message: 'Too large.' }, { status: 413 });
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ success: false, message: 'Invalid JSON.' }, { status: 400 });
  }
  const tool = typeof body?.tool === 'string' ? body.tool : '';
  const path = typeof body?.path === 'string' ? body.path : '/';
  const input = body?.input && typeof body.input === 'object' && !Array.isArray(body.input) ? body.input : {};
  if (!tool) return json({ success: false, message: 'Missing tool.' }, { status: 400 });

  const { userId } = resolveChatIdentity(locals as any);
  try {
    const out = await callWebMcpTool(
      { tool, input, path },
      { userId, clientIp: safeAddress(getClientAddress), lang: (locals as any)?.lang || 'he', fetchInstance: fetch },
      mode
    );
    return json(out.body, { status: out.status, headers: noStore });
  } catch (e) {
    console.error('[webmcp] tool failed:', tool, e);
    return json({ success: false, message: 'The tool failed. Try again shortly.' }, { status: 500, headers: noStore });
  }
};
