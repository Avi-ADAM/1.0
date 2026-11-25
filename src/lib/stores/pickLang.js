import { lang, langUs, doesLang } from '$lib/stores/lang.js';
import { locale } from '$lib/translations';

/**
 * Switch the reader's language everywhere it is kept: the three lang stores,
 * the i18n locale and the `lang` cookie the server reads on the next request.
 * `<html dir/lang>` follow `locale` from the root layout (dirOf).
 *
 * @param {'he'|'en'|'ar'|'ru'|'es'} code
 */
export function pickLang(code) {
  lang.set(code);
  locale.set(code);
  langUs.set(code);
  doesLang.set(true);
  document.cookie = `lang=${code}; path=/; expires=` + new Date(2027, 0, 1).toUTCString();
}
