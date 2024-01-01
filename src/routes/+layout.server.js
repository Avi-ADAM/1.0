
/*import { locale, loadTranslations } from '$lib/translations';

export const load = async ({ url }) => {
  const { pathname } = url;

  const defaultLocale = 'he'; // get from cookie, user session, ...
  
  const initLocale = locale.get() || defaultLocale; // set default if no locale already set

  await loadTranslations(initLocale, pathname); // keep this just before the `return`

  return {};
}
*/
export function load({ locals }) {
  const userAgent = locals.userAgent;
  const lang = locals.lang
  const uid = locals.uid
  const isDesktop = locals.isDesktop
  return {
    isDesktop,
    userAgent,
    lang,
    uid
  };
}