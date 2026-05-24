const baseUrl = import.meta.env.VITE_URL;

export const actions = {
    login: async ({ request, cookies }) => {
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

            // domain: '.1lev1.com' is required so socket.1lev1.com receives
            // the JWT cookie during the WebSocket handshake.
            // sameSite: 'lax' (not 'none') — cross-subdomain is same-site so
            // Lax is sufficient and more broadly compatible than None.
            const cookieOptions = {
                path: '/',
                expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                secure: isProduction,
                sameSite: /** @type {'lax'} */ ('lax'),
                domain: isProduction ? '.1lev1.com' : undefined
            };

            // Clean up any zombie cookies from previous sessions or old deploys
            // that may have been set with explicit domain attributes.
            const cookiesToDelete = ['jwt', 'id', 'un', 'when', 'email'];
            const deleteVariations = [
                { path: '/' },                          // host-only (current scheme)
                { path: '/', domain: '.1lev1.com' },    // old wildcard domain cookies
                { path: '/', domain: 'www.1lev1.com' }, // old www-specific cookies
                { path: '/', domain: '1lev1.com' }      // old root-domain cookies
            ];
            for (const name of cookiesToDelete) {
                for (const opts of deleteVariations) {
                    cookies.delete(name, opts);
                }
            }

            cookies.set('jwt', jwt,                          { ...cookieOptions, httpOnly: true  });
            cookies.set('id',  String(user.id),              { ...cookieOptions, httpOnly: false });
            cookies.set('un',  user.name || user.username,   { ...cookieOptions, httpOnly: false });
            cookies.set('when', Date.now().toString(),        { ...cookieOptions, httpOnly: false });
            cookies.set('email', String(email),              { ...cookieOptions, httpOnly: false });

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
