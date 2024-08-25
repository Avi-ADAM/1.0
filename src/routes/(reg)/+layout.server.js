export function load({ locals, url }) {
    const userAgent = locals.userAgent;
    const tok = locals.tok
    const un = locals.un
    const from = url.pathname
    const uid = locals.uid
    console.log(from)
    return {
        userAgent,
        tok,
        from,
        un,
        uid
    };
}