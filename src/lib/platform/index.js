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

/**
 * Web builds: optional remote base for /api/* (the SvelteKit instance on the
 * VPS, e.g. https://api.1lev1.com). When VITE_API_BASE is set at build time,
 * browser fetches to /api/* leave the frontend origin (Vercel) and go straight
 * to the proxy instance next to Strapi — with cookies (same-site *.1lev1.com).
 * Empty ⇒ identity, everything stays relative as before.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

let patched = false;
let patchedApiBase = false;

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

/**
 * Web builds: route browser /api/* calls to API_BASE (see above). Narrower
 * than the mobile patch — only /api/* paths move; page data requests
 * (__data.json), form actions and assets stay on the frontend origin.
 * Adds credentials:'include' so the jwt cookie (Domain=.1lev1.com, Lax —
 * same-site between www and api subdomains) rides along cross-origin.
 * The server side must answer CORS for the frontend origin (hooks.server.js).
 */
export function installApiBasePatch() {
  if (!browser || isMobileBuild || !API_BASE || patchedApiBase) return;
  if (API_BASE === window.location.origin) return; // running on the api instance itself
  patchedApiBase = true;

  const origFetch = window.fetch.bind(window);
  const localOrigin = window.location.origin;

  window.fetch = (input, init) => {
    try {
      let moved = false;
      if (typeof input === 'string') {
        if (input.startsWith('/api/')) {
          input = API_BASE + input;
          moved = true;
        }
      } else if (input instanceof URL) {
        if (input.origin === localOrigin && input.pathname.startsWith('/api/')) {
          input = new URL(API_BASE + input.pathname + input.search + input.hash);
          moved = true;
        }
      } else if (input instanceof Request) {
        const u = new URL(input.url);
        if (u.origin === localOrigin && u.pathname.startsWith('/api/')) {
          input = new Request(API_BASE + u.pathname + u.search + u.hash, input);
          moved = true;
        }
      }
      if (moved) {
        if (input instanceof Request) {
          input = new Request(input, { credentials: 'include' });
        } else {
          init = { ...(init || {}), credentials: 'include' };
        }
      }
    } catch (e) {
      console.error('installApiBasePatch: rewrite failed', e);
    }
    return origFetch(input, init);
  };

  // axios (login/passwordReset, passChange, editBasic change-password) rides
  // on XMLHttpRequest, not fetch — rewrite those /api/* calls too.
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    let movedXhr = false;
    try {
      if (typeof url === 'string' && url.startsWith('/api/')) {
        url = API_BASE + url;
        movedXhr = true;
      }
    } catch (e) {
      console.error('installApiBasePatch: xhr rewrite failed', e);
    }
    const out = origOpen.call(this, method, url, ...rest);
    if (movedXhr) this.withCredentials = true;
    return out;
  };
}
