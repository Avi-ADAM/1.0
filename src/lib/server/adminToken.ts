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
