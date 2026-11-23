import { browser, dev } from '$app/environment';
import { env as publicEnv } from '$env/dynamic/public';
import { inject } from '@vercel/analytics';
import { loadPulse, PULSE_WEBSITE_ID } from '$lib/analytics/track.js';
import { locale, loadTranslations } from '$lib/translations';
import { isMobileBuild, installMobileFetchPatch, installApiBasePatch } from '$lib/platform';

// Mobile (Tauri) build is a pure SPA: no SvelteKit server, so no SSR and no
// +layout.server.js data. Web builds keep SSR exactly as before.
export const ssr = !import.meta.env.VITE_TAURI;

if (isMobileBuild) {
  installMobileFetchPatch();
} else {
  installApiBasePatch(); // no-op unless VITE_API_BASE is set at build time
  inject({ mode: dev ? 'development' : 'production' });
  // In-house analytics (docs/tbd/PLAN_INHOUSE_ANALYTICS.md). Runs beside
  // Vercel's until stage A4. The id is public by nature (it is in every page),
  // and the tracker's data-domains ignores any host but 1lev1.com, so dev and
  // previews send nothing. PUBLIC_UMAMI_WEBSITE_ID overrides it; '' turns it off.
  if (browser) loadPulse({ websiteId: publicEnv.PUBLIC_UMAMI_WEBSITE_ID ?? PULSE_WEBSITE_ID });
}

/** @param {string} name */
function cookieValue(name) {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function cookieLang() {
  return cookieValue('lang');
}

export const load = async ({ url, data }) => {
  const { pathname } = url;
  // data comes from +layout.server.js on web builds; it is absent on mobile,
  // where the language falls back to the lang cookie / Hebrew default.
  const lang = data?.lang || cookieLang() || 'he';
  console.log(lang, pathname);
  locale.set(lang);
  await loadTranslations(lang, pathname);

  // Mobile has no server data: the reader's currency comes from the cookie the
  // settings page wrote, and the rates from /api/fx on mount.
  const currency = data?.currency || cookieValue('currency') || undefined;

  return { ...(data || {}), lang, currency };
};
