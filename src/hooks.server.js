
// hooks.server.(js|ts)
//import * as Sentry from '@sentry/sveltekit';

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
  ar: "https://res.cloudinary.com/love1/raw/upload/v1749552534/eng-mani-updated_xpcxdf.json?v=2"
};

const desc = {
  he: '1💗1 הסכמה עולמית על חירות | ליצור יחד בהסכמה. לכל 1 יש כישרונות ויכולות ייחודים, לכל 1 יש חלום. ביחד ניתן ליצור כל דבר, לשתף פעולה, לחלום, להעז, להצליח ולהרוויח בגדול.',
  en: '1💗1 WorldWide consensus for Security and Peace | collaboration platform, create together harmoniously | consensus based partnerships management platform | we can together',
  ar: '1💗1 اتفاق عالمي للحرية والسلام، منصة تعاون، نخلق معًا بتناغم | نظام إدارة الشراكات القائم على التوافق، يمكننا معًا'
};

const title = {
  en: '1💗1 | Create together harmoniously | Worldwide Consensus for Freedom',
  he: 'הסכמה עולמית על חירות וביטחון | 1💗1️ ליצור ביחד בהסכמה | 1💗1',
  ar: '1💗1 | نخلق معًا بتناغم | اتفاق عالمي للحرية'
};

const cl = {
  he: 'he-IL',
  en: 'en-gb',
  ar: 'ar-EG'
};

let lang = 'he'; // Default language set to Hebrew

// Helper function to get language from URL or cookies
function getLanguage(event) {
  let qlang = event.url.searchParams.get('lang');
  const coociLang = event.cookies.get('lang');
  const userAgent = event.request.headers.get('accept-language');

  if (qlang && ['he', 'en', 'ar'].includes(qlang)) {
    return qlang;
  } else if (event.url.pathname === '/en') {
    return 'en';
  } else if (event.url.pathname === '/ar') {
    return 'ar';
  } else if (event.url.pathname === '/he') {
    return 'he';
  } else if (!coociLang) {
    return userAgent?.includes('he') ? 'he' : 'en';
  } else {
    return coociLang;
  }
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
  console.log(lang, event.url.pathname);
  // Set language cookie based on URL path
  if (event.url.pathname === '/en' || event.url.pathname === '/ar' || event.url.pathname === '/he') {
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
    return await resolve(event);
  }

  return await resolve(event, {
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
}

// Uncomment if using Sentry
// export const handle = sequence(Sentry.sentryHandle(), handle);
