
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    event.locals.userAgent = event.request.headers.get('accept-language')
    //coocies? 
    const coociLang = event.cookies.get('lang');
        const isJ = event.cookies.get('jwt');
        event.locals.tok = isJ;
    if (event.url.pathname == '/' && isJ != undefined){
        return new Response('Redirect', {
          status: 303,
          headers: { Location: '/lev' }
        });

    }else if(event.url.pathname.startsWith('/lev') && isJ == undefined){
         return new Response('Redirect', {
           status: 303,
           headers: { Location: '/' }
         });

    }

    const response = await resolve(event);

    return response;
}