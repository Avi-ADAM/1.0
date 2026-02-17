import { dev } from '$app/environment';
import { inject } from '@vercel/analytics';
import { locale, loadTranslations } from '$lib/translations';

inject({ mode: dev ? 'development' : 'production' });

export const load = async ({ url, data }) => {
  const { pathname } = url;
  const { lang } = data;
  console.log(lang,pathname);
  locale.set(lang);
  await loadTranslations(lang, pathname);

  return data;
};
