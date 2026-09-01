// src/routes/mcp-connect/+page.server.ts
import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isValidCallback } from '$lib/server/apiKeys';
import { verifyAuthRequest, redirectWith } from '$lib/server/oauth/authreq.js';
import { mintCode } from '$lib/server/oauth/codes.js';

// This page serves two callers with one consent screen:
//   - the CLI (`npx 1lev1-mcp`), which passes ?callback=http://localhost:PORT
//     and receives the raw key on the query string;
//   - OAuth clients such as claude.ai, which arrive via /oauth/authorize with
//     ?oauth=<signed AuthRequest> and receive a short-lived code instead.
// Everything the user reads and approves is identical; only the delivery of the
// credential differs.

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
  const oauthToken = url.searchParams.get('oauth');
  const callback = url.searchParams.get('callback');

  const authRequest = oauthToken ? verifyAuthRequest(oauthToken) : null;
  if (oauthToken && !authRequest) {
    return { error: 'בקשת ההרשאה אינה תקינה או פגה. נסה להתחבר מחדש מהאפליקציה.', callback: null, oauth: null };
  }

  if (!authRequest && (!callback || !isValidCallback(callback))) {
    return { error: 'כתובת callback חסרה או לא תקינה', callback: null, oauth: null };
  }

  if (!locals.uid) {
    const self = authRequest
      ? `/mcp-connect?oauth=${encodeURIComponent(oauthToken!)}`
      : `/mcp-connect?callback=${encodeURIComponent(callback!)}`;
    redirect(302, `/login?redirect=${encodeURIComponent(self)}`);
  }

  // Check if an MCP key already exists
  const res = await fetch('/api/api-keys');
  const keys = await res.json().catch(() => []);
  const hasMcpKey = Array.isArray(keys) && keys.some((k: any) => k.name === 'MCP');

  return {
    callback,
    oauth: oauthToken,
    // Shown so the user knows who is asking, not just that someone is.
    clientName: authRequest?.clientName ?? null,
    userName: locals.un ?? locals.email,
    hasMcpKey
  };
};

export const actions: Actions = {
  default: async ({ request, locals, fetch }) => {
    if (!locals.uid) redirect(302, '/login');

    const form = await request.formData();
    const callback = form.get('callback') as string | null;
    const oauthToken = form.get('oauth') as string | null;

    const authRequest = oauthToken ? verifyAuthRequest(oauthToken) : null;
    if (oauthToken && !authRequest) {
      return fail(400, { error: 'בקשת ההרשאה אינה תקינה או פגה' });
    }
    if (!authRequest && (!callback || !isValidCallback(callback))) {
      return fail(400, { error: 'כתובת callback לא תקינה' });
    }

    // ─── delegate to the API route (httpOnly cookie forwarded automatically) ──
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'MCP' })
      // fetch inside a server action shares the incoming request's cookies,
      // so the httpOnly JWT cookie is forwarded to the API route automatically
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return fail(res.status, {
        error: body?.message ?? 'שגיאה ביצירת מפתח API'
      });
    }

    const { raw } = await res.json();

    if (authRequest) {
      // The raw key rides inside the encrypted code — the database holds only
      // its HMAC, so /oauth/token has no other way to hand it back.
      const code = mintCode({
        key: raw,
        userId: String(locals.uid),
        clientId: authRequest.clientId,
        redirectUri: authRequest.redirectUri,
        codeChallenge: authRequest.codeChallenge
      });
      redirect(302, redirectWith(authRequest.redirectUri, { code }, authRequest.state));
    }

    const target = new URL(callback!);
    target.searchParams.set('api_key', raw);
    redirect(302, target.toString());
  }
};
