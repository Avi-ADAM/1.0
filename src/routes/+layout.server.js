
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
    jwt: tok  // DEPRECATED: Use /api/socket-auth endpoint instead. Kept for backward compatibility.
  };
}
