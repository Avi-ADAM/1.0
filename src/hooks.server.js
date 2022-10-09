
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    event.locals.userAgent = event.request.headers.get('accept-language')
    const response = await resolve(event);

    return response;
}