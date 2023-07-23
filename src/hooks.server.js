
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    event.locals.userAgent = event.request.headers.get('accept-language')
    //coocies?
    let userAgent = event.request.headers.get('accept-language');
    const coociLang = event.cookies.get('lang');
        const isJ = event.cookies.get('jwt') || false;
        event.locals.tok = isJ;
        let lang = "he"
        let title = '1💗1 | create together harmoniously | worldwide consensus for freedom and security';
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
        if(lang == "he"){
          title = "הסכמה עולמית על חירות וביטחון | ליצור ביחד בהסכמה | 1💗1";
        }
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

    const response = await resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%lang%', lang),
      transformPageChunk: ({ html }) => html.replace('%title%', title)
    });

    return response;
}