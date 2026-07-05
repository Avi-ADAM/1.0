/**
 * Platform detection + mobile networking helpers.
 *
 * Two distinct flags:
 *  - isMobileBuild: compile-time — this bundle was produced by `npm run build:mobile`
 *    (VITE_TAURI=1). Dead-code-eliminated to `false` in web/vercel/node builds.
 *  - isTauri: runtime — actually running inside a Tauri WebView.
 */
import { browser } from '$app/environment';

export const isMobileBuild = !!import.meta.env.VITE_TAURI;

export const isTauri = browser && '__TAURI_INTERNALS__' in window;

/**
 * Remote origin that serves /api/* for the mobile app (the Vercel/node deployment).
 * Example: https://1lev1.com — set via VITE_URL at build time.
 */
export const API_ORIGIN = (import.meta.env.VITE_URL || '').replace(/\/+$/, '');

/**
 * Prefix a same-origin path with the remote API origin on mobile builds.
 * On web builds this is an identity function.
 */
export function apiUrl(path) {
  if (!isMobileBuild || !API_ORIGIN) return path;
  return typeof path === 'string' && path.startsWith('/') ? API_ORIGIN + path : path;
}

let patched = false;

/**
 * Rewrites relative fetch() calls (e.g. fetch('/api/send')) to the remote
 * API origin. Lets the ~80 existing call sites work unmodified inside Tauri,
 * where the app is served from tauri://localhost and has no local /api.
 * No-op on web builds and when VITE_URL is missing.
 */
export function installMobileFetchPatch() {
  if (!browser || !isMobileBuild || !API_ORIGIN || patched) return;
  patched = true;

  const origFetch = window.fetch.bind(window);
  const localOrigin = window.location.origin;

  window.fetch = (input, init) => {
    try {
      if (typeof input === 'string') {
        if (input.startsWith('/')) input = API_ORIGIN + input;
      } else if (input instanceof URL) {
        if (input.origin === localOrigin) {
          input = new URL(input.pathname + input.search + input.hash, API_ORIGIN);
        }
      } else if (input instanceof Request) {
        const u = new URL(input.url);
        if (u.origin === localOrigin) {
          input = new Request(API_ORIGIN + u.pathname + u.search + u.hash, input);
        }
      }
    } catch (e) {
      console.error('installMobileFetchPatch: rewrite failed', e);
    }
    return origFetch(input, init);
  };
}
