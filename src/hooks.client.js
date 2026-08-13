/**
 * Client-side counterpart of `handleError` in hooks.server.js.
 *
 * An error thrown during a client-side navigation (a universal load, a
 * component that blew up while hydrating) renders the same `+error.svelte`
 * screen, but without this hook it arrives with no `code` — so the screen could
 * not tell "your session expired" apart from a genuine bug and had nothing
 * actionable to offer.
 *
 * @type {import('@sveltejs/kit').HandleClientError}
 */
export function handleError({ error, event, status, message }) {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const isAuth =
    status === 401 ||
    status === 403 ||
    /unauthorized|invalid token|forbidden|jwt|\b401\b|\b403\b/i.test(raw);

  console.error(`[error] ${status} ${event.url.pathname}`, raw);

  return {
    message,
    code: isAuth ? 'auth' : 'server',
    from: event.url.pathname.replace(/^\//, '') + event.url.search
  };
}
