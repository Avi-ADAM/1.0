
import { loadTranslations, locale } from '$lib/translations';

export const load = async ({ url, locals }) => {
  const { pathname } = url;
  const { lang, uid, un, email, isDesktop, userAgent, tok } = locals;
  const defaultLocale = lang || 'he'; // get from cookie, user session, ...
  
  const initLocale = locale.get() || defaultLocale; // set default if no locale already set

  await loadTranslations(initLocale, pathname); // keep this just before the `return`

  return {
    email,
    isDesktop,
    userAgent,
    lang,
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
