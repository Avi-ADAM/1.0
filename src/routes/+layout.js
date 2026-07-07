import { dev } from '$app/environment';
import { inject } from '@vercel/analytics';
import { locale, loadTranslations } from '$lib/translations';
import { isMobileBuild, installMobileFetchPatch } from '$lib/platform';

// Mobile (Tauri) build is a pure SPA: no SvelteKit server, so no SSR and no
// +layout.server.js data. Web builds keep SSR exactly as before.
export const ssr = !import.meta.env.VITE_TAURI;

if (isMobileBuild) {
  installMobileFetchPatch();
} else {
  inject({ mode: dev ? 'development' : 'production' });
}

function cookieLang() {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export const load = async ({ url, data }) => {
  const { pathname } = url;
  // data comes from +layout.server.js on web builds; it is absent on mobile,
  // where the language falls back to the lang cookie / Hebrew default.
  const lang = data?.lang || cookieLang() || 'he';
  console.log(lang, pathname);
  locale.set(lang);
  await loadTranslations(lang, pathname);

  return { ...(data || {}), lang };
};
