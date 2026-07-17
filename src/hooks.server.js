
// hooks.server.(js|ts)
//import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/private';
import { getInternalSecret, INTERNAL_HEADER } from '$lib/server/internalSecret.js';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';

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
 * Inject the internal proxy secret on same-origin /api/* requests made with the
 * server-side fetch. Browser fetches never reach this hook, so the header
 * cannot be forged by a client. This is what lets /api/send and /api/action
 * trust a request's `isSer` flag.
 * @type {import('@sveltejs/kit').HandleFetch}
 */
export async function handleFetch({ event, request, fetch }) {
	try {
		const url = new URL(request.url);
		if (url.origin === event.url.origin && url.pathname.startsWith('/api/')) {
			request.headers.set(INTERNAL_HEADER, getInternalSecret());
		}
	} catch (e) {
		console.error('handleFetch: failed to attach internal secret', e);
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
  ru: "https://res.cloudinary.com/love1/raw/upload/v1749552534/eng-mani-updated_xpcxdf.json?v=2"
};

const desc = {
  he: '1💗1 הסכמה עולמית על חירות | ליצור יחד בהסכמה. לכל 1 יש כישרונות ויכולות ייחודים, לכל 1 יש חלום. ביחד ניתן ליצור כל דבר, לשתף פעולה, לחלום, להעז, להצליח ולהרוויח בגדול.',
  en: '1💗1 WorldWide consensus for Security and Peace | collaboration platform, create together harmoniously | consensus based partnerships management platform | we can together',
  ar: '1💗1 اتفاق عالمي للحرية والسلام، منصة تعاون، نخلق معًا بتناغم | نظام إدارة الشراكات القائم على التوافق، يمكننا معًا',
  ru: '1💗1 Всемирное согласие на свободу и безопасность | платформа сотрудничества, создавать вместе в согласии | система управления партнёрствами на основе консенсуса | вместе мы можем'
};

const title = {
  en: '1💗1 | Create together harmoniously | Worldwide Consensus for Freedom',
  he: 'הסכמה עולמית על חירות וביטחון | 1💗1️ ליצור ביחד בהסכמה | 1💗1',
  ar: '1💗1 | نخلق معًا بتناغم | اتفاق عالمي للحرية',
  ru: '1💗1 | Создавать вместе в согласии | Всемирное согласие на свободу'
};

const cl = {
  he: 'he-IL',
  en: 'en-gb',
  ar: 'ar-EG',
  ru: 'ru-RU'
};

let lang = 'he'; // Default language set to Hebrew

// Helper function to get language from URL or cookies
function getLanguage(event) {
  let qlang = event.url.searchParams.get('lang');
  const coociLang = event.cookies.get('lang');
  const userAgent = event.request.headers.get('accept-language');

  if (qlang && ['he', 'en', 'ar', 'ru'].includes(qlang)) {
    return qlang;
  } else if (event.url.pathname === '/en') {
    return 'en';
  } else if (event.url.pathname === '/ar') {
    return 'ar';
  } else if (event.url.pathname === '/he') {
    return 'he';
  } else if (event.url.pathname === '/ru') {
    return 'ru';
  } else if (!coociLang) {
    return userAgent?.includes('he') ? 'he' : 'en';
  } else {
    return coociLang;
  }
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

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  lang = getLanguage(event);

  event.locals.lang = lang;
  event.locals.userAgent = event.request.headers.get('accept-language');
  event.locals.isDesktop = event.request.headers.get('sec-ch-ua-mobile') === '?0';
  event.locals.tok = event.cookies.get('jwt') || false;
  event.locals.uid = event.cookies.get('id') || false;
  event.locals.un = event.cookies.get('un') || false;
  event.locals.email = event.cookies.get('email') || false;
  const isSecure = event.url.protocol === 'https:';
  // Set language cookie based on URL path
  if (event.url.pathname === '/en' || event.url.pathname === '/ar' || event.url.pathname === '/he' || event.url.pathname === '/ru') {
    event.cookies.set('lang', lang, { path: '/' });
  }

  // Redirect logic based on authentication
  if (event.url.pathname === '/convention' || event.url.pathname === '/aitifaqia') {
    return new Response('Redirect', {
      status: 303,
      headers: { Location: '/hascama' }
    });
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

    return new Response('Redirect', { status: 303, headers });
  }
  if (event.url.pathname === '/' && event.locals.tok) {
    return new Response('Redirect', {
      status: 303,
      headers: { Location: '/lev' }
    });
  } else if (event.url.pathname.startsWith('/lev') && !event.locals.tok) {
    return new Response('Redirect', {
      status: 303,
      headers: { Location: '/' }
    });
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

  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html
        .replace('%lang%', lang)
        .replace('%xtitle%', title[lang])
        .replace('%title%', title[lang])
        .replace('%desc%', desc[lang])
        .replace('%xdes%', desc[lang])
        .replace('%desci%', desc[lang])
        .replace('%cl%', cl[lang])
        .replace('%manifest%', manifestLink[lang])
  });
  return applySecurityHeaders(response, isSecure);
}

// Uncomment if using Sentry
// export const handle = sequence(Sentry.sentryHandle(), handle);
