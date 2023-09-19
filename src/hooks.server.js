
/** @type {import('@sveltejs/kit').Handle} */

const desc = {
  he: '1️⃣💗1️⃣ הסכמה על חירות, לכל 1 יש כישרונות ויכולות ייחודים, לכל 1 יש חלום. ביחד ניתן ליצור כל דבר, לשתף פעולה, לחלום, להעז, להצליח ולהרוויח.',
  en: '1️⃣💗1️⃣ WorldWide consensus for Security and Peace, colaboration platform, create together harmoniously | consrnsus based partnerships manegment sistem, we can together'
};
        let lang = 'he';
        const title = {
          en: '1️⃣💗1️⃣ | create together harmoniously | worldwide consensus for freedom',
          he: 'הסכמה עולמית על חירות וביטחון | 1💗1️ ליצור ביחד בהסכמה | 1️⃣💗1️⃣'
        };
        let cl = {
          he: 'he-IL',
          en: "en-gb"
        };

export async function handle({ event, resolve }) {
    event.locals.userAgent = event.request.headers.get('accept-language')
    //coocies?
    let userAgent = event.request.headers.get('accept-language');
    const coociLang = event.cookies.get('lang');
        const uid = event.cookies.get('id') || false;
        console.log("id = ",uid)
        const isJ = event.cookies.get('jwt') || false;
        event.locals.tok = isJ;
        event.locals.uid = uid;

        if (coociLang == undefined) {
          if (userAgent?.includes('he')) {
            lang = 'he';
          } else {
            lang = 'en';
          }
        } else {
          lang = coociLang;
        }

        event.locals.lang = lang;
        
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