
/** @type {import('@sveltejs/kit').Handle} */
// hooks.server.(js|ts)
//import * as Sentry from '@sentry/sveltekit';

/*Sentry.init({
  dsn: 'https://880ab60c73ec06407ad3339ce31714a0@o4503949749321728.ingest.sentry.io/4506774069641216',
  tracesSampleRate: 1.0
});*/
//import { handleErrorWithSentry } from '@sentry/sveltekit';

 const myErrorHandler = (({ error, event }) => {
   console.error('An error occurred on the server side:', error, event);
 });

// export const handleError = handleErrorWithSentry(myErrorHandler);
 // or alternatively, if you don't have a custom error handler:
 // export const handleError = handleErrorWithSentry();
const desc = {
  he: '1💗1 הסכמה עולמית על חי | ליצור יחד בהסכמה. לכל 1 יש כישרונות ויכולות ייחודים, לכל 1 יש חלום. ביחד ניתן ליצור כל דבר, לשתף פעולה, לחלום, להעז, להצליח ולהרוויח בגדול.',
  en: '1💗1 WorldWide consensus for Security and Peace | colaboration platform, create together harmoniously | consensus based partnerships manegment sistem | we can together',
  ar: '1💗1 اتفاق عالمي للحرية والسلام، منصة تعاون، نخلق معًا بتناغم | نظام إدارة الشراكات القائم على التوافق، يمكننا معًا'
};
//To establish consensus for non-violence, To allow a network of harmoneus creation
const title = {
  en: '1💗1 | Create together harmoniously | Worldwide Consensus for Freedom',
  he: 'הסכמה עולמית על חירות וביטחון | 1💗1️ ליצור ביחד בהסכמה | 1💗1',
  ar: '1💗1 | نخلق معًا بتناغم | اتفاق عالمي للحرية'
};

let cl = {
  he: 'he-IL',
  en: 'en-gb',
  ar: 'ar-EG'
};

let lang = 'he'; // Default language set to Hebrew
//import { sequence } from '@sveltejs/kit/hooks';

//export const handle = Sentry.sentryHandle();
 // or alternatively, if you already have a handler defined, use the `sequence` function
 // see: https://kit.svelte.dev/docs/modules#sveltejs-kit-hooks-sequence
/// type: import('@sveltejs/kit').Handle
export async function handle({ event , resolve }) {
  let qlang = event.url.searchParams.get('lang') || null;
  event.locals.userAgent = event.request.headers.get('accept-language');
  //coocies?

  let userAgent = event.request.headers.get('accept-language');
  const coociLang = event.cookies.get('lang');
  const isDesktop = event.request.headers.get('sec-ch-ua-mobile') === '?0';
  event.locals.isDesktop = isDesktop;
  const uid = event.cookies.get('id') || false;
  const isJ = event.cookies.get('jwt') || false;
  const un = event.cookies.get('un') || false;
  event.locals.tok = isJ;
  event.locals.uid = uid;
  event.locals.un = un;
  if (qlang != 'he' && qlang != 'en' && qlang != 'ar') {
    console.log("here")
    //&& qlang != 'ar'
    if (event.url.pathname == '/en'){
        event.locals.lang = "en";
	    event.cookies.set('lang', 'en');
             lang = 'en';
    }else if (event.url.pathname == '/ar'){
       event.locals.lang = 'ar';
       	    event.cookies.set('lang', 'ar');
                  lang = 'ar';
    }else if (event.url.pathname == '/he'){
       event.locals.lang = 'he';
       	    event.cookies.set('lang', 'he');
        lang = 'he';
    }else if (coociLang == undefined) {
      if (userAgent?.includes('he')) {
        lang = 'he';
      } else {
        lang = 'en';
      }
    } else {
      lang = coociLang;
    }
  } else if (qlang != null) {
    lang = qlang;
  }

  event.locals.lang = lang;
  console.log('id = ', uid, ' lang=', lang);
  if (event.url.pathname == '/' && isJ != false) {
    return new Response('Redirect', {
      status: 303,
      headers: { Location: '/lev' }
    });
  } else if (event.url.pathname.startsWith('/lev') && isJ == false) {
    return new Response('Redirect', {
      status: 303,
      headers: { Location: '/' }
    });
  } else if (event.url.pathname.startsWith('/api')) {
    const response = await resolve(event);
    return response;
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
  });
}

 // export const handle = sequence(Sentry.sentryHandle(), myHandler);
