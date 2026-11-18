// src/lib/server/mcp/lang.ts
//
// Which language an MCP request is answered in (PLAN_MCP_PARTNER_INTEGRATION P0.4).
//
// The MCP context never carried a language, so every tool fell to
// `ctx.lang ?? 'he'` — a partner's English-speaking user got Hebrew action
// messages. Resolve it once per request, in this order:
//   1. the key owner's stored language (their profile choice — the strongest signal);
//   2. the request's `Accept-Language`;
//   3. `en` for a key minted by OAuth (a third-party client, language unknown),
//      `he` — the site's default — for anything else.

import { env } from '$env/dynamic/private';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';
import { localeFromAcceptLanguage } from '../../i18n/acceptLanguage.js';

export const MCP_LANGS = ['he', 'en', 'ar', 'ru', 'es'] as const;
export type McpLang = (typeof MCP_LANGS)[number];

function supported(v: unknown): McpLang | null {
  const l = String(v ?? '').trim().slice(0, 2).toLowerCase();
  return (MCP_LANGS as readonly string[]).includes(l) ? (l as McpLang) : null;
}

/** The first supported language in an `Accept-Language` header, by q-weight. */
export function langFromAcceptLanguage(header: string | null | undefined): McpLang | null {
  const l = localeFromAcceptLanguage(header, MCP_LANGS);
  return l ? (supported(l) as McpLang) : null;
}

/** A key named `MCP · <client>` was minted by the OAuth consent screen. */
export function isOAuthKeyName(name: string | null | undefined): boolean {
  return typeof name === 'string' && name.startsWith('MCP · ');
}

export function resolveMcpLang(input: {
  storedLang?: string | null;
  acceptLanguage?: string | null;
  keyName?: string | null;
}): McpLang {
  return (
    supported(input.storedLang) ??
    langFromAcceptLanguage(input.acceptLanguage) ??
    (isOAuthKeyName(input.keyName) ? 'en' : 'he')
  );
}

// ─── the stored language, read once per user every few minutes ──────────────

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { lang: string | null; expiresAt: number }>();

/**
 * The owner's `lang` profile field. Never throws: a failed read is "no stored
 * language", and the request falls through to the header — a language is a
 * nicety, never a reason to refuse an MCP call.
 */
export async function fetchUserLang(
  userId: string,
  fetchFn: typeof fetch = fetch
): Promise<string | null> {
  const hit = cache.get(userId);
  if (hit && hit.expiresAt > Date.now()) return hit.lang;
  let lang: string | null = null;
  try {
    const res = await fetchFn(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.STRAPI_API_NEW ?? process.env.STRAPI_API_NEW ?? ''}`
      },
      body: JSON.stringify({
        query: `query McpUserLang($id: ID!) { usersPermissionsUser(id: $id) { data { attributes { lang } } } }`,
        variables: { id: userId }
      })
    });
    if (res.ok) {
      const body = await res.json();
      lang = body?.data?.usersPermissionsUser?.data?.attributes?.lang ?? null;
    }
  } catch {
    lang = null;
  }
  cache.set(userId, { lang, expiresAt: Date.now() + TTL_MS });
  return lang;
}

/** Test seam. */
export function _clearLangCache(): void {
  cache.clear();
}
