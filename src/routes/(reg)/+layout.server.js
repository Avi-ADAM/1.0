export function load({ locals, url }) {
    const userAgent = locals.userAgent;
    const tok = locals.tok
    const un = locals.un
    const from = url.pathname
    console.log(from)
    return {
        userAgent,
        tok,
        from,
        un
    };
}