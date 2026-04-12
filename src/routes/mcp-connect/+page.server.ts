// src/routes/mcp-auth/+page.server.ts
import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isValidCallback } from '$lib/server/apiKeys';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
  const callback = url.searchParams.get('callback');

  if (!callback || !isValidCallback(callback)) {
    return { error: 'כתובת callback חסרה או לא תקינה', callback: null };
  }

  if (!locals.uid) {
    const returnTo = encodeURIComponent(`/mcp-connect?callback=${encodeURIComponent(callback)}`);
    redirect(302, `/login?redirect=${returnTo}`);
  }

  // Check if an MCP key already exists
  const res = await fetch('/api/api-keys');
  const keys = await res.json().catch(() => []);
  const hasMcpKey = Array.isArray(keys) && keys.some((k: any) => k.name === 'MCP');

  return {
    callback,
    userName: locals.un ?? locals.email,
    hasMcpKey,
  };
};

export const actions: Actions = {
  default: async ({ request, locals, fetch }) => {
    if (!locals.uid) redirect(302, '/login');

    const form     = await request.formData();
    const callback = form.get('callback') as string;

    if (!callback || !isValidCallback(callback)) {
      return fail(400, { error: 'כתובת callback לא תקינה' });
    }

    // ─── delegate to the API route (httpOnly cookie forwarded automatically) ──
    const res = await fetch('/api/api-keys', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: 'MCP' }),
      // fetch inside a server action shares the incoming request's cookies,
      // so the httpOnly JWT cookie is forwarded to the API route automatically
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return fail(res.status, {
        error: body?.message ?? 'שגיאה ביצירת מפתח API',
      });
    }

    const { raw } = await res.json();

    const target = new URL(callback);
    target.searchParams.set('api_key', raw);
    redirect(302, target.toString());
  },
};