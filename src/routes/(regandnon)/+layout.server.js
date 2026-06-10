export function load({ locals, url }) {
    const userAgent = locals.userAgent;
    const tok = locals.tok
    const un = locals.un
    const from = url.pathname
    const uid = locals.uid
    console.log(from)
    return {
        userAgent,
        // SECURITY: expose only a boolean login flag — never the raw JWT. The
        // token stays in the HttpOnly cookie; consumers use `tok` as a login
        // flag and the socket authenticates from the cookie.
        tok: !!tok,
        from,
        un,
        uid
    };
}