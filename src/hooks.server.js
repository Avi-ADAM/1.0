
/** @type {import('@sveltejs/kit').Handle} */
const desc = {
  he: '1💗1 הסכמה על חירות, לכל 1 יש כישרונות ויכולות ייחודים, לכל 1 יש חלום. ביחד ניתן ליצור כל דבר, לשתף פעולה, לחלום, להעז, להצליח ולהרוויח.',
  en: '1💗1 WorldWide consensus for Security and Peace, colaboration platform'
};
        let lang = 'he';
        const title ={
         "en": '1💗1 | create together harmoniously | worldwide consensus for freedom and security',
        "he": "הסכמה עולמית על חירות וביטחון | ליצור ביחד בהסכמה | 1💗1"
        }

export async function handle({ event, resolve }) {
    event.locals.userAgent = event.request.headers.get('accept-language')
    //coocies?
    let userAgent = event.request.headers.get('accept-language');
    const coociLang = event.cookies.get('lang');
        const isJ = event.cookies.get('jwt') || false;
        event.locals.tok = isJ;

        if (coociLang == undefined) {
          if (userAgent?.includes('he')) {
            lang = 'he';
            console.log(lang)
          } else {
            lang = 'en';
          }
        } else {
          lang = coociLang;
          console.log(lang,"cookie");
        }

        event.locals.lang = lang;
        
    if (event.url.pathname == '/' && isJ != false){
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
      transformPageChunk: ({ html }) => html.replace('%lang%', lang).replace('%title%', title[lang]).replace('%desc%', desc[lang])
    });

    
}