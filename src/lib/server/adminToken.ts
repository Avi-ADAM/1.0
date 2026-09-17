import { env as dynamicEnv } from '$env/dynamic/private';

/**
 * Normalize the Strapi admin/service token before it is used as a Bearer
 * credential.
 *
 * The `ADMINMONTHER` env value is sometimes stored with an accidental
 * `ADMINMONTHER=` prefix or surrounding whitespace/newlines. `StrapiClient`
 * normalizes its own internal token the same way, but when a caller passes the
 * admin token explicitly as `context.jwt` (e.g. the chat/MCP tools or the
 * Telegram bot acting on behalf of a user) it is used verbatim — an
 * un-normalized value is sent as `bearer <garbage>` and Strapi replies 401.
 *
 * Always run the raw value through this helper before passing it on.
 */
export function normalizeAdminToken(raw?: string | null): string {
  return (raw || '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

/**
 * The admin token, read the way SvelteKit actually provides it.
 *
 * `process.env` is empty under `vite dev` — only `$env/dynamic/private` is
 * populated there — so `normalizeAdminToken(process.env.ADMINMONTHER)` yields
 * an empty Bearer locally and Strapi answers "Forbidden access" to every field.
 * Production was fine, which is exactly what made it hard to see: the MCP tools
 * that run actions (conversations, processes, tasks, wishes, links) all failed
 * in dev only. `$lib/server/actions/index.ts` already guards against this for
 * its own client; this is the same guard for callers that pass the token as
 * `context.jwt`.
 */
export function adminToken(): string {
  return normalizeAdminToken(dynamicEnv.ADMINMONTHER || process.env.ADMINMONTHER);
}
