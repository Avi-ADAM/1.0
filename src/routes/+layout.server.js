
import { loadTranslations } from '$lib/translations';

export const load = async ({ url, locals }) => {
  const { pathname } = url;
  const { lang, uid, un, email, isDesktop, userAgent, tok } = locals;
  // `locale` (from sveltekit-i18n) is a single module-level store shared by
  // every concurrent request this server process handles — it is NOT
  // per-request state. Reading `locale.get()` here used to let one user's
  // resolved language leak into another user's response (whoever's request
  // set it last "wins"). The only per-request source of truth is `locals.lang`,
  // which hooks.server.js derives fresh from this request's own cookie/URL.
  const initLocale = lang || 'he';

  await loadTranslations(initLocale, pathname); // keep this just before the `return`

  return {
    email,
    isDesktop,
    userAgent,
    lang: initLocale,
    uid,
    un,
    id: uid,  // Alias for socket client
    // SECURITY: never send the raw JWT to the client. The token lives only in the
    // HttpOnly cookie; the socket authenticates from that cookie (withCredentials)
    // and all reads/mutations go through /api/send + /api/action which read it
    // server-side. Expose only a boolean login flag.
    loggedIn: !!tok
  };
}
