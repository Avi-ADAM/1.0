
/** @type {import('@sveltejs/kit').Handle} */

const desc = {
  he: '1💗1 הסכמה עולמית על חירות, לכל 1 יש כישרונות ויכולות ייחודים, לכל 1 יש חלום. ביחד ניתן ליצור כל דבר, לשתף פעולה, לחלום, להעז, להצליח ולהרוויח בגדול.',
  en: '1💗1 WorldWide consensus for Security and Peace, colaboration platform, create together harmoniously | consrnsus based partnerships manegment sistem, we can together',
  ar: '1💗1 اتفاق عالمي للحرية والسلام، منصة تعاون، نخلق معًا بتناغم | نظام إدارة الشراكات القائم على التوافق، يمكننا معًا'
};

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


export async function handle({ event, resolve }) {
    let qlang = event.url.searchParams.get('lang') || null
    event.locals.userAgent = event.request.headers.get('accept-language')
    //coocies?
    let userAgent = event.request.headers.get('accept-language');
    const coociLang = event.cookies.get('lang');
        const uid = event.cookies.get('id') || false;
        const isJ = event.cookies.get('jwt') || false;
        event.locals.tok = isJ;
        event.locals.uid = uid;
          if (qlang != 'he' && qlang != 'en' && qlang != 'ar') {
            //&& qlang != 'ar'
            if (coociLang == undefined) {
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
       console.log('id = ', uid, " lang=", lang);
    if (event.url.pathname == '/' && isJ != false){
      console.log("jr")
        return new Response('Redirect', {
          status: 303,
          headers: { Location: '/lev' }
        });

    }else if(event.url.pathname.startsWith('/lev') && isJ == false){
         return new Response('Redirect', {
           status: 303,
           headers: { Location: '/' }
         });

    }

    
      return await resolve(event, {
        transformPageChunk: ({ html }) =>
          html
            .replace('%lang%', lang)
            .replace('%title%', title[lang])
            .replace('%desc%', desc[lang])
            .replace('%desci%', desc[lang])
            .replace('%cl%', cl[lang])
      });

    
}