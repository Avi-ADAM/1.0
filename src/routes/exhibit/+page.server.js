/**
 * /exhibit — the fair kiosk (docs/tbd/PLAN_EXHIBITION_MODE.md).
 *
 * The stand is opened once at `/exhibit?key=<EXHIBIT_KEY>`: the right key sets
 * the kiosk pass cookie (a hash, never the key) and redirects to the same
 * address without it, so the key is not left on screen or in history. With
 * the pass, a visitor's own idea goes to the live assistant; without it the
 * kiosk answers from its ready ideas. Everything else needs no server at all.
 */
import { redirect } from '@sveltejs/kit';
import { EXHIBIT_COOKIE, expectedPass, isExhibitPass, keyOpensPass } from '$lib/server/exhibit/pass';

const PASS_DAYS = 30;

/** Clamp `?idle=` to the 60–90 seconds the stand may be set to. */
function idleSeconds(/** @type {string | null} */ raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(90, Math.max(60, Math.round(n))) : 75;
}

export const load = async ({ url, cookies }) => {
  const key = url.searchParams.get('key');
  if (key !== null) {
    if (keyOpensPass(key)) {
      cookies.set(EXHIBIT_COOKIE, /** @type {string} */ (expectedPass()), {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: url.protocol === 'https:',
        maxAge: PASS_DAYS * 24 * 60 * 60
      });
    }
    const clean = new URL(url);
    clean.searchParams.delete('key');
    redirect(303, clean.pathname + clean.search);
  }

  return {
    aiPass: isExhibitPass(cookies.get(EXHIBIT_COOKIE)),
    idleSeconds: idleSeconds(url.searchParams.get('idle')),
    fullscreen: url.searchParams.get('fs') !== '0'
  };
};
