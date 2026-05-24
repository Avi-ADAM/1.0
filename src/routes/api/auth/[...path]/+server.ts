import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Auth Proxy
 *
 * The single client-facing entry point for Strapi's users-permissions auth
 * endpoints. The browser talks only to `/api/auth/<action>`; Strapi itself can
 * be locked to localhost. The JWT never reaches the client: for actions that
 * return one it is persisted as an httpOnly cookie server-side and stripped from
 * the response. `change-password` reads the token from the cookie, never from
 * the request.
 *
 * POST /api/auth/<action>
 */

const BASE_URL = import.meta.env.VITE_URL as string;

type AuthAction = {
  /** Requires an authenticated user; token is taken from the httpOnly cookie. */
  requiresAuth: boolean;
  /** Response carries a `jwt` that should be turned into a session cookie. */
  setsSession: boolean;
};

// Whitelist of forwardable Strapi auth endpoints. Anything else → 404.
const ALLOWED: Record<string, AuthAction> = {
  local: { requiresAuth: false, setsSession: true },
  'local/register': { requiresAuth: false, setsSession: true },
  'change-password': { requiresAuth: true, setsSession: true },
  'forgot-password': { requiresAuth: false, setsSession: false },
  'reset-password': { requiresAuth: false, setsSession: true },
  'send-email-confirmation': { requiresAuth: false, setsSession: false }
};

function buildCookieOptions() {
  const isProduction = import.meta.env.PROD;
  return {
    path: '/',
    expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    secure: isProduction,
    sameSite: 'lax' as const,
    domain: isProduction ? '.1lev1.com' : undefined
  };
}

type StrapiAuthResult = {
  jwt?: string;
  user?: { id?: number | string; username?: string; name?: string; email?: string };
};

export const POST: RequestHandler = async ({ params, request, cookies, fetch }) => {
  const path = (params.path ?? '').replace(/^\/+|\/+$/g, '');
  const action = ALLOWED[path];

  if (!action) {
    throw error(404, 'Unknown auth action');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // The token comes from the httpOnly cookie, never from the client payload.
  if (action.requiresAuth) {
    const jwt = cookies.get('jwt');
    if (!jwt) {
      throw error(401, 'Authentication required. Please log in.');
    }
    headers.Authorization = `Bearer ${jwt}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${BASE_URL}/api/auth/${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = (await res.json().catch(() => ({}))) as StrapiAuthResult;

    // Pass Strapi's error shape and status straight through.
    if (!res.ok) {
      return json(data, { status: res.status });
    }

    // Persist a returned JWT server-side and strip it from the client payload.
    if (action.setsSession && data?.jwt) {
      const opts = buildCookieOptions();
      cookies.set('jwt', data.jwt, { ...opts, httpOnly: true });

      if (data.user) {
        if (data.user.id != null) {
          cookies.set('id', String(data.user.id), { ...opts, httpOnly: false });
        }
        const un = data.user.name || data.user.username;
        if (un) {
          cookies.set('un', String(un), { ...opts, httpOnly: false });
        }
        if (data.user.email) {
          cookies.set('email', String(data.user.email), { ...opts, httpOnly: false });
        }
        cookies.set('when', Date.now().toString(), { ...opts, httpOnly: false });
      }

      const { jwt: _jwt, ...safe } = data;
      return json(safe);
    }

    return json(data);
  } catch (e) {
    clearTimeout(timeoutId);

    if (e instanceof Error && e.name === 'AbortError') {
      throw error(504, 'Gateway Timeout: the auth provider did not respond in time.');
    }

    // Re-throw SvelteKit errors.
    if (e && typeof e === 'object' && 'status' in e && 'body' in e) {
      throw e;
    }

    console.error('Auth proxy error:', e);
    throw error(500, e instanceof Error ? e.message : 'Auth request failed');
  }
};
