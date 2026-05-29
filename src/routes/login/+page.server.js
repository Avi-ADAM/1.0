const baseUrl = import.meta.env.VITE_URL;

export const actions = {
    login: async ({ request, cookies, url }) => {
        const data = await request.formData();
        const email = data.get('email');
        const password = data.get('password');
        const redirectTo = String(data.get('from') || '/onboard');

        if (!email || !password) {
            return { success: false, error: 'Please fill all fields.' };
        }

        try {
            const response = await fetch(`${baseUrl}/api/auth/local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Login failed');
            }

            const { jwt, user } = await response.json();

            const isProduction = import.meta.env.PROD;

            // Scope the cookie to .1lev1.com so socket.1lev1.com receives the JWT
            // during the (same-site) WebSocket handshake — this is the config that
            // has worked for years. But ONLY when actually served from a 1lev1.com
            // host: on a non-matching origin (e.g. a *.vercel.app preview) the
            // browser silently rejects a .1lev1.com cookie, so we fall back to a
            // host-only cookie there.
            console.log(url.hostname, 'on own domain? ', url.hostname === '1lev1.com' || url.hostname.endsWith('.1lev1.com'));
            const onOwnDomain = url.hostname === '1lev1.com' || url.hostname.endsWith('.1lev1.com');
            const cookieOptions = {
                path: '/',
                expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                secure: isProduction,
                sameSite: /** @type {'lax'} */ ('lax'),
                domain: onOwnDomain ? '.1lev1.com' : undefined
            };

            // Clean up zombie cookies from previous sessions that had different
            // domain scopes than the cookie we are about to set.
            //
            // CRITICAL: do NOT add a delete variation whose Domain attribute is
            // canonically equal to the SET's Domain (`.1lev1.com`). Per RFC 6265
            // §5.2.3 the browser strips the leading dot, so `Domain=1lev1.com`
            // and `Domain=.1lev1.com` are the SAME cookie. SvelteKit, however,
            // keys its internal cookie Map by the RAW string (see
            // node_modules/@sveltejs/kit/src/runtime/server/cookie.js
            // `generate_cookie_key`), so both end up as separate Set-Cookie
            // headers in the response. The delete-without-dot is emitted AFTER
            // the set and silently wipes the JWT — the browser ends up with no
            // auth cookies and bounces back to /login. That was the prod bug.
            //
            // We only delete scopes that the SET does not touch:
            //   - host-only (no Domain attribute) — kills old host-only zombies
            //   - Domain=www.1lev1.com — kills old www-pinned zombies
            // The `.1lev1.com` delete is omitted because the SET below already
            // overwrites that exact key inside SvelteKit's cookie Map.
            const cookiesToDelete = ['jwt', 'id', 'un', 'when', 'email'];
            const deleteVariations = [
                { path: '/' },
                { path: '/', domain: 'www.1lev1.com' }
            ];
            for (const name of cookiesToDelete) {
                for (const opts of deleteVariations) {
                    cookies.delete(name, opts);
                }
            }

            cookies.set('jwt', jwt, { ...cookieOptions, httpOnly: true });
            cookies.set('id', String(user.id), { ...cookieOptions, httpOnly: false });
            cookies.set('un', user.name || user.username, { ...cookieOptions, httpOnly: false });
            cookies.set('when', Date.now().toString(), { ...cookieOptions, httpOnly: false });
            cookies.set('email', String(email), { ...cookieOptions, httpOnly: false });

            console.log('login success, redirecting to', redirectTo);

            // Return the redirect target instead of throwing redirect().
            // Throwing redirect() inside use:enhance can strip Set-Cookie headers
            // from the action response before the browser can store the cookies.
            // The client-side enhance callback will do a full browser navigation
            // once it receives this success response (with the cookies already set).
            return { success: true, redirectTo };

        } catch (err) {
            console.error('Login error:', err);
            return {
                success: false,
                error: /** @type {Error} */ (err).message || 'An unexpected error occurred.'
            };
        }
    }
};
