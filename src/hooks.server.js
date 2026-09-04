
// hooks.server.(js|ts)
//import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/private';
import { getInternalSecret, INTERNAL_HEADER } from '$lib/server/internalSecret.js';
import { ssrApiBase, rewriteToApiBase } from '$lib/server/ssrApiBase.js';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';
import { isExpiredJwt, clearStaleAuthCookies } from '$lib/server/session.js';
import { log, requestId } from '$lib/server/log.js';
import {
  DEFAULT_THEME,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  THEME_PARAM,
  normalizeTheme
} from '$lib/theme/themeParam.js';

// ── Strapi gate: stamp every server→Strapi request with a shared secret ─────
// tovmeod's nginx blocks requests without x-strapi-gate once the gate is
// closed (`strapi-gate close` on the VPS — see docs/PLAN_PROXY_SECURITY.md §10).
// Patching the global fetch here covers every call site (SSR loads, /api
// routes, actions) without touching them. No-op unless STRAPI_GATE_KEY is set.
const STRAPI_GATE_KEY = env.STRAPI_GATE_KEY || '';
if (STRAPI_GATE_KEY && !globalThis.__strapiGateFetchPatched) {
  globalThis.__strapiGateFetchPatched = true;
  // STRAPI_URL covers the runtime address (strapi-green on the api container);
  // env.VITE_URL covers code paths still building URLs off the public tovmeod
  // address. Both get stamped — an extra header is harmless.
  const gateOrigins = new Set(
    [STRAPI_URL, env.VITE_URL]
      .filter(Boolean)
      .map((u) => {
        try { return new URL(u).origin; } catch { return null; }
      })
      .filter(Boolean)
  );
  const baseFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input, init) => {
    try {
      const raw =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url;
      if (raw && gateOrigins.has(new URL(raw).origin)) {
        if (input instanceof Request && !init) {
          const headers = new Headers(input.headers);
          headers.set('x-strapi-gate', STRAPI_GATE_KEY);
          input = new Request(input, { headers });
        } else {
          init = { ...(init || {}) };
          const headers = new Headers(
            init.headers || (input instanceof Request ? input.headers : undefined)
          );
          headers.set('x-strapi-gate', STRAPI_GATE_KEY);
          init.headers = headers;
        }
      }
    } catch {
      // gating must never break a fetch — fall through with the original args
    }
    return baseFetch(input, init);
  };
}

// Frontend origins allowed to call /api/* cross-origin (the api.1lev1.com
// instance serving browsers that load the app from Vercel). Cookies ride along
// because *.1lev1.com is same-site; CORS is what un-blocks the JS response.
// Override with CORS_ALLOWED_ORIGINS (comma-separated) in the runtime .env.
const DEFAULT_CORS_ORIGINS = [
  'https://www.1lev1.com',
  'https://1lev1.com',
  'https://app.1lev1.com',
  // dev: hosts-file alias dev.1lev1.com → 127.0.0.1 keeps cookies same-site
  'http://dev.1lev1.com:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

function allowedCorsOrigins() {
  const fromEnv = (env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_CORS_ORIGINS;
}

// set() (not append) so a route with its own CORS headers (e.g. /api/chat)
// doesn't end up with duplicate values the browser rejects.
function applyCorsHeaders(headers, origin, request) {
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.append('Vary', 'Origin');
  if (request.method === 'OPTIONS') {
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set(
      'Access-Control-Allow-Headers',
      request.headers.get('access-control-request-headers') || 'Content-Type'
    );
    headers.set('Access-Control-Max-Age', '86400');
  }
}

/**
 * Route the server's own `/api/*` calls and prove they are server-originated.
 *
 * Two things happen here, both only for same-origin `/api/*`:
 *
 * 1. **Re-point at the API instance.** When `SSR_API_BASE` is set (Vercel), a
 *    load's relative `/api/send` is sent to `https://api.1lev1.com/api/send`
 *    instead of being served in-process. That is what keeps Strapi out of
 *    reach of everything except the VPS — see $lib/server/ssrApiBase.js.
 *    Going cross-origin means SvelteKit stops forwarding the session cookie,
 *    so it is copied over explicitly; the proxy resolves the caller from it
 *    exactly as it does for a browser request.
 * 2. **Stamp the internal secret.** Browser fetches never reach this hook, so
 *    the header cannot be forged by a client. This is what lets /api/send and
 *    /api/action trust a request's `isSer` flag.
 *
 * @type {import('@sveltejs/kit').HandleFetch}
 */
export async function handleFetch({ event, request, fetch }) {
	try {
		const url = new URL(request.url);
		if (url.origin === event.url.origin && url.pathname.startsWith('/api/')) {
			const rewritten = rewriteToApiBase(url, event.url, ssrApiBase());
			if (rewritten) {
				request = new Request(rewritten, request);
				const cookie = event.request.headers.get('cookie');
				if (cookie) request.headers.set('cookie', cookie);
			}
			request.headers.set(INTERNAL_HEADER, getInternalSecret());
		}
	} catch (e) {
		log.error('handleFetch: failed to route the internal API call', { err: e });
	}
	return fetch(request);
}

/*Sentry.init({
  dsn: 'https://880ab60c73ec06407ad3339ce31714a0@o4503949749321728.ingest.sentry.io/4506774069641216',
  tracesSampleRate: 1.0
});*/
//import { handleErrorWithSentry } from '@sentry/sveltekit';
/*
const myErrorHandler = ({ error, event }) => {
  console.error('An error occurred on the server side:', error, event);
};
*/
// export const handleError = handleErrorWithSentry(myErrorHandler);
// or alternatively, if you don't have a custom error handler:
// export const handleError = handleErrorWithSentry();

const manifestLink = {
  he: "https://res.cloudinary.com/love1/raw/upload/v1749551626/manifest_with_new_routes_qktyc3.json?v=3",
  en: "https://res.cloudinary.com/love1/raw/upload/v1749552534/eng-mani-updated_xpcxdf.json?v=2",
  ar: "https://res.cloudinary.com/love1/raw/upload/v1749552534/eng-mani-updated_xpcxdf.json?v=2",
  ru: "https://res.cloudinary.com/love1/raw/upload/v1749552534/eng-mani-updated_xpcxdf.json?v=2",
  es: "https://res.cloudinary.com/love1/raw/upload/v1749552534/eng-mani-updated_xpcxdf.json?v=2"
};

/* Site-wide <title>/description fallbacks, one per locale.
 *
 * They describe what 1lev1 actually is — a platform for running fair
 * partnerships (rikmot): open missions and resources, logged hours, decisions
 * by consensus, transparent profit splits. The old copy sold the "worldwide
 * consensus for freedom and security" declaration, which now lives on its own
 * site (agreement.1lev1.com); keep that out of this app's metadata.
 *
 * Only pages that declare no <title> of their own fall back to these — see the
 * placement note in app.html. Titles are kept near 50–60 characters and
 * descriptions near 110–160, which is what search results actually render.
 */
const desc = {
  he: '1💗1 היא פלטפורמה לשותפויות הוגנות: ריקמת שותפים ללא בוס וללא הון התחלתי, משימות ומשאבים פתוחים, תיעוד שעות, החלטות בהסכמה וחלוקת רווחים שקופה לפי תרומה.',
  en: '1💗1 is a platform for fair partnerships: build a network with no boss and no upfront capital, publish open missions and resources, log hours, decide by consensus, split profits by contribution.',
  ar: '1💗1 منصة للشراكات العادلة: شبكة شركاء بلا مدير وبلا رأس مال، مهام وموارد مفتوحة، تسجيل الساعات، قرارات بالتوافق، وتقاسم شفاف للأرباح حسب المساهمة.',
  ru: '1💗1 - платформа честных партнёрств: сеть без начальника и стартового капитала, открытые задачи и ресурсы, учёт часов, решения по согласию и прозрачный раздел прибыли по вкладу.',
  es: '1💗1 es una plataforma de asociaciones justas: una red sin jefe ni capital inicial, misiones y recursos abiertos, registro de horas, decisiones por consenso y reparto transparente de beneficios.'
};

const title = {
  he: '1💗1 · שותפויות הוגנות: משימות, שעות וחלוקת רווחים',
  en: '1💗1 · Fair Partnerships: Missions, Hours, Profit Split',
  ar: '1💗1 · شراكات عادلة: مهام وساعات وتقاسم الأرباح',
  ru: '1💗1 · Честные партнёрства: задачи, часы и доля прибыли',
  es: '1💗1 · Asociaciones justas: misiones, horas y reparto'
};

// Public address of the site, used to build og:url. Not derived from
// event.url.origin: behind the proxy that is an internal host.
const SITE_ORIGIN = 'https://1lev1.com';

const cl = {
  he: 'he-IL',
  en: 'en-gb',
  ar: 'ar-EG',
  ru: 'ru-RU',
  es: 'es-ES'
};

// Every locale the site can actually render. Kept in one place so the URL/cookie
// resolution below and the per-locale metadata maps above can't drift apart —
// an unlisted locale used to reach transformPageChunk and stamp `undefined`
// into <title>, the description and the manifest link.
const SUPPORTED_LANGS = ['he', 'en', 'ar', 'ru', 'es'];

// The legacy per-locale homepage paths, 301'd to `?lang=` below.
const LOCALE_PATHS = new Set(SUPPORTED_LANGS.map((l) => `/${l}`));

let lang = 'he'; // Default language set to Hebrew

// Helper function to get language from URL or cookies
function getLanguage(event) {
  let qlang = event.url.searchParams.get('lang');
  const coociLang = event.cookies.get('lang');
  const userAgent = event.request.headers.get('accept-language');

  if (qlang && SUPPORTED_LANGS.includes(qlang)) {
    return qlang;
  }
  const fromPath = event.url.pathname.slice(1);
  if (SUPPORTED_LANGS.includes(fromPath)) {
    return fromPath;
  }
  if (!coociLang) {
    return userAgent?.includes('he') ? 'he' : 'en';
  }
  // The cookie is user-writable, so validate it too — an unknown value here
  // would propagate into locals.lang and out to the metadata maps.
  return SUPPORTED_LANGS.includes(coociLang) ? coociLang : 'he';
}
// Appearance is two cookies: `theme` (personal|business) and `mode`
// (light|dark|system). Both are user-writable, so both are validated here
// before they reach the markup. `system` cannot be resolved server-side — the
// OS preference is not in the request — so it renders without `dark` and the
// inline script in app.html corrects it before first paint.
//
// `?theme=` overrides the cookie and is then written to it ("pinned"), which is
// what makes a shared link like `…/?theme=professional` show the clean business
// identity for the whole visit and not just the landing page. The spelling
// table is shared with the client store — see $lib/theme/themeParam.js.

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @returns {{ theme: import('$lib/theme/themeParam.js').ThemeName, pinned: boolean }}
 */
function resolveTheme(event) {
  const fromUrl = normalizeTheme(event.url.searchParams.get(THEME_PARAM));
  return {
    theme: fromUrl ?? normalizeTheme(event.cookies.get(THEME_COOKIE)) ?? DEFAULT_THEME,
    pinned: fromUrl !== undefined
  };
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {string} theme
 */
function getThemeClass(event, theme) {
  return event.cookies.get('mode') === 'dark' ? `${theme} dark` : theme;
}

// Baseline security headers applied to every response. A full Content-Security-Policy
// is intentionally NOT set here — it needs a dedicated, tested pass to whitelist all
// external origins (Cloudinary, MapLibre, Google, Telegram, fonts, socket, etc.).
function applySecurityHeaders(response, isSecure) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  if (isSecure) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return response;
}

// Requests we deliberately never log: the Docker HEALTHCHECK hits /api/health
// every 30s (≈2.9k lines/day of nothing) and the immutable build assets are
// served by the same node process on the VPS.
const LOG_SKIP = /^\/(api\/health|_app\/immutable|favicon|robots\.txt|sw\.js)/;

/**
 * Request logging + correlation id, wrapped around the real hook below.
 *
 * One JSON line per request — method, path, status, duration, uid — which is
 * what makes the VPS containers queryable in Axiom (`vector.toml` parses these
 * lines into fields). `x-request-id` is taken from the incoming request when
 * present, so a call that starts on the Vercel front and lands on
 * api.1lev1.com is one id end to end; it is echoed back on the response so a
 * user can quote it from devtools.
 *
 * @type {import('@sveltejs/kit').Handle}
 */
export async function handle({ event, resolve }) {
  const reqId = requestId(event.request);
  event.locals.reqId = reqId;
  event.locals.log = log.child({ reqId });

  const quiet = LOG_SKIP.test(event.url.pathname);
  const started = Date.now();
  try {
    const response = await handleRequest({ event, resolve });
    try {
      response.headers.set('x-request-id', reqId);
    } catch {
      // immutable headers (rare, e.g. a cached Response) — not worth failing
    }
    if (!quiet) {
      const status = response.status;
      const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      event.locals.log[level]('request', {
        method: event.request.method,
        path: event.url.pathname,
        route: event.route?.id ?? null,
        status,
        dur: Date.now() - started,
        uid: event.locals.uid || null,
        lang: event.locals.lang,
        ip: clientIp(event),
        ua: event.request.headers.get('user-agent')?.slice(0, 160) ?? null
      });
    }
    return response;
  } catch (err) {
    // handleError() reports the error itself; this line is what ties it to a
    // request that produced no response at all.
    event.locals.log.error('request failed', {
      method: event.request.method,
      path: event.url.pathname,
      dur: Date.now() - started,
      uid: event.locals.uid || null,
      err
    });
    throw err;
  }
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
function clientIp(event) {
  try {
    return event.getClientAddress();
  } catch {
    // adapter-node throws when the request arrived without the expected
    // forwarding header; an unknown IP must never cost us the whole log line.
    return null;
  }
}

/** @type {import('@sveltejs/kit').Handle} */
async function handleRequest({ event, resolve }) {
  lang = getLanguage(event);

  event.locals.lang = lang;
  event.locals.userAgent = event.request.headers.get('accept-language');
  event.locals.isDesktop = event.request.headers.get('sec-ch-ua-mobile') === '?0';
  // An expired cookie is worse than no cookie: it makes every layer below
  // believe there is a session and then fail. Downgrade to guest and wipe it.
  const rawTok = event.cookies.get('jwt') || false;
  const sessionExpired = rawTok !== false && isExpiredJwt(rawTok);
  if (sessionExpired) clearStaleAuthCookies(event);

  event.locals.sessionExpired = sessionExpired;
  event.locals.tok = sessionExpired ? false : rawTok;
  event.locals.uid = sessionExpired ? false : event.cookies.get('id') || false;
  event.locals.un = sessionExpired ? false : event.cookies.get('un') || false;
  event.locals.email = event.cookies.get('email') || false;
  const isSecure = event.url.protocol === 'https:';

  // Resolved before the redirects below, because several of them (a member
  // landing on `/?theme=business`, a logged-out visitor bounced off /lev) drop
  // the query string — without pinning here the shared link would be forgotten
  // at the very first hop.
  const appearance = resolveTheme(event);
  event.locals.theme = appearance.theme;
  if (appearance.pinned) {
    // httpOnly:false — the appearance menu and the anti-flash script in
    // app.html both read this through document.cookie. `secure` follows the
    // protocol rather than SvelteKit's default, which would mark the cookie
    // Secure on the http dev host and have the browser drop it.
    event.cookies.set(THEME_COOKIE, appearance.theme, {
      path: '/',
      maxAge: THEME_COOKIE_MAX_AGE,
      httpOnly: false,
      sameSite: 'lax',
      secure: isSecure
    });
  }
  /* SvelteKit only flushes `cookies.set()` onto responses that came out of
     `resolve()`, so every hand-built Response below goes through this. */
  const pinTheme = (/** @type {Response} */ response) => {
    if (appearance.pinned) {
      response.headers.append(
        'set-cookie',
        `${THEME_COOKIE}=${appearance.theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax${
          isSecure ? '; Secure' : ''
        }`
      );
    }
    return response;
  };
  // /he, /en and /ar rendered a byte-identical copy of the homepage, and /ru
  // and /es 404'd. They are not part of the locale scheme the rest of the site
  // agrees on - app.html's hreflang table and the sitemap both say a locale is
  // `?lang=`, and the bare path is Hebrew - so they were three more addresses
  // serving "/" and two dead ends. 301 (not 303) so the redirect is permanent
  // and whatever links point at them consolidate onto the canonical address.
  if (LOCALE_PATHS.has(event.url.pathname)) {
    event.cookies.set('lang', lang, { path: '/' });
    return pinTheme(new Response('Redirect', {
      status: 301,
      headers: { Location: lang === 'he' ? '/' : `/?lang=${lang}` }
    }));
  }

  // Redirect logic based on authentication
  if (event.url.pathname === '/convention' || event.url.pathname === '/aitifaqia') {
    return pinTheme(new Response('Redirect', {
      status: 303,
      headers: { Location: '/hascama' }
    }));
  }

  // /hascama?ref=true&id=...&con=...&un=...&em=...&lang=...  ← sister-site referral
  if (event.url.pathname === '/hascama' && event.url.searchParams.get('ref') === 'true') {
    const p = event.url.searchParams;
    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    const exp = oneYear.toUTCString();

    const headers = new Headers({ Location: '/signup' });
    const setCookie = (name, value) => {
      if (value == null || value === '') return;
      headers.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; Path=/; Expires=${exp}; SameSite=Lax`);
    };

    const em = p.get('em');
    const un = p.get('un');
    const id = p.get('id');
    const con = p.get('con');
    const refLang = p.get('lang');

    if (refLang && ['he', 'en', 'ar'].includes(refLang)) setCookie('lang', refLang);
    if (em) setCookie('email', em);
    if (un) setCookie('un', un);
    if (id) setCookie('fpval', id);
    if (con) setCookie('contriesi', con);

    return pinTheme(new Response('Redirect', { status: 303, headers }));
  }
  if (event.url.pathname === '/' && event.locals.tok) {
    return pinTheme(new Response('Redirect', {
      status: 303,
      headers: { Location: '/lev' }
    }));
  } else if (event.url.pathname.startsWith('/lev') && !event.locals.tok) {
    // A member whose session just expired is not an anonymous visitor: send
    // them to /login with a way back, instead of dumping them on the homepage.
    const back = event.url.pathname.replace(/^\//, '') + event.url.search;
    return pinTheme(new Response('Redirect', {
      status: 303,
      headers: {
        Location: sessionExpired ? `/login?from=${encodeURIComponent(back)}&expired=1` : '/'
      }
    }));
  } else if (event.url.pathname.startsWith('/api')) {
    const origin = event.request.headers.get('origin');
    const corsAllowed = origin && allowedCorsOrigins().includes(origin.replace(/\/+$/, ''));

    // Answer preflights here — API routes don't declare OPTIONS handlers.
    if (corsAllowed && event.request.method === 'OPTIONS') {
      const preflight = new Response(null, { status: 204 });
      applyCorsHeaders(preflight.headers, origin, event.request);
      return applySecurityHeaders(preflight, isSecure);
    }

    const response = applySecurityHeaders(await resolve(event), isSecure);
    if (corsAllowed) applyCorsHeaders(response.headers, origin, event.request);
    return response;
  }

  const themeClass = getThemeClass(event, appearance.theme);
  // og:url used to be the hardcoded homepage on every page, so every share of
  // an inner page resolved back to "/" . Build it from the request instead —
  // pathname only (percent-encoded, so it cannot break out of the attribute)
  // plus the locale marker, matching the hreflang table in app.html.
  const canonical =
    `${SITE_ORIGIN}${event.url.pathname}` + (lang === 'he' ? '' : `?lang=${lang}`);
  // The alternates for THIS path, not for the homepage. app.html used to carry
  // them as six literal tags naming "/", so every inner page claimed its
  // translations lived at the homepage - the one signal that tells Google the
  // pages are the same page in another language. Same shape as the sitemap:
  // Hebrew is the bare address and doubles as x-default, the rest are `?lang=`.
  const hreflang = [...SUPPORTED_LANGS, 'x-default']
    .map((code) => {
      const l = code === 'x-default' ? 'he' : code;
      const href = `${SITE_ORIGIN}${event.url.pathname}` + (l === 'he' ? '' : `?lang=${l}`);
      return `    <link rel="alternate" hreflang="${code}" href="${href}" />`;
    })
    .join('\n');
  const response = await resolve(event, {
    // replaceAll, not replace: app.html reuses `%xtitle%` for both og:title and
    // twitter:title, and `replace` would have left the second one rendering the
    // literal placeholder into the share card.
    transformPageChunk: ({ html }) =>
      html
        // Only over https. As a literal tag in app.html it also fired on the
        // http dev origin, where it upgraded every module/asset request to
        // https://dev.1lev1.com:5173 — a port that speaks plain http — so the
        // page shipped its SSR markup and then never hydrated
        // (ERR_BLOCKED_BY_CLIENT on entry.js). localhost is exempt from the
        // upgrade by spec, which is why only the dev.1lev1.com alias used for
        // cross-subdomain cookie testing (PLAN_PROXY_SECURITY §9) ever hit it.
        .replaceAll(
          '%upgradeInsecure%',
          isSecure
            ? '<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">'
            : ''
        )
        .replaceAll('%themeclass%', themeClass)
        .replaceAll('%lang%', lang)
        .replaceAll('%canonical%', canonical)
        .replaceAll('%hreflang%', hreflang)
        .replaceAll('%xtitle%', title[lang])
        .replaceAll('%title%', title[lang])
        .replaceAll('%desc%', desc[lang])
        .replaceAll('%xdes%', desc[lang])
        .replaceAll('%desci%', desc[lang])
        .replaceAll('%cl%', cl[lang])
        .replaceAll('%manifest%', manifestLink[lang])
  });
  return applySecurityHeaders(response, isSecure);
}

/**
 * Every uncaught server error used to reach the browser as a bare
 * `500 · Internal Error` — no cause, no way out. Classify it instead: an
 * auth-shaped failure (expired/misaligned token, 401/403 from the proxy) is
 * labelled `code:'auth'` so the error screen can offer sign-in/sign-up, and the
 * failing address rides along so the visitor can be returned to it afterwards.
 *
 * The raw message is logged, never localized here — the screen renders text
 * with `$t()` from the `auth` namespace.
 *
 * @type {import('@sveltejs/kit').HandleServerError}
 */
export function handleError({ error, event, status, message }) {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const isAuth =
    status === 401 ||
    status === 403 ||
    /unauthorized|invalid token|forbidden|jwt|\b401\b|\b403\b/i.test(raw);

  (event.locals?.log ?? log).error('server error', {
    status,
    method: event.request.method,
    path: event.url.pathname,
    code: isAuth ? 'auth' : 'server',
    uid: event.locals?.uid || null,
    err: error instanceof Error ? error : raw
  });

  return {
    message,
    code: isAuth ? 'auth' : 'server',
    // Where the visitor was trying to go, for the "sign in and come back" link.
    from: event.url.pathname.replace(/^\//, '') + event.url.search,
    // A session that expired mid-request is the likeliest cause of an auth error.
    sessionExpired: event.locals?.sessionExpired === true
  };
}

// Uncomment if using Sentry
// export const handle = sequence(Sentry.sentryHandle(), handle);
