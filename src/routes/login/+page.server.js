import { redirect } from '@sveltejs/kit';

const baseUrl = import.meta.env.VITE_URL;

export const actions = {
    login: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email');
        const password = data.get('password');
        const redirectTo = String(data.get('from') || '/me'); // Get 'from' parameter, default to '/me'

        if (!email || !password) {
            return {
                success: false,
                error: 'Please fill all fields.'
            };
        }

        let response;
        try {
            response = await fetch(`${baseUrl}/api/auth/local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: email, password })
            });

            if (!response.ok) { // Check if the response was successful (e.g., 2xx status)
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Login failed');
            }

            const { jwt, user } = await response.json();

            // Set cookies on the server
            // domain: '.1lev1.com' allows subdomain access (socket.1lev1.com)
            const isProduction = import.meta.env.PROD;
            
            // In production: use 'none' for cross-subdomain (requires secure: true)
            // In development: use 'lax' for localhost (no domain/secure needed)
            const cookieOptions = {
                path: '/',
                expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                secure: isProduction, // Required for sameSite: 'none'
                sameSite: isProduction ? /** @type {'none'} */ ('none') : /** @type {'lax'} */ ('lax'),
                domain: isProduction ? '.1lev1.com' : undefined // Subdomain support only in production
            };

            // JWT cookie - now httpOnly for security, preventing client-side exposure.
            
            // Aggressively clean up potential "zombie" cookies from previous sessions/deploys.
            // We iterate over multiple domain possibilities to catch stubborn cookies (like those set specifically on 'www').
            const cookiesToDelete = ['jwt', 'id', 'un', 'when', 'email'];
            const deleteVariations = [
                { path: '/' },                         // Standard HostOnly (current domain)
                { path: '/', domain: '.1lev1.com' },   // Wildcard for all subdomains
                { path: '/', domain: 'www.1lev1.com' },// Explicit WWW subdomain (crucial for the issue you saw)
                { path: '/', domain: '1lev1.com' }     // Explicit root domain
            ];

            for (const name of cookiesToDelete) {
                for (const opts of deleteVariations) {
                    cookies.delete(name, opts);
                }
            }

            // JWT cookie - now httpOnly for security, preventing client-side exposure.
            cookies.set('jwt', jwt, {
                ...cookieOptions,
                httpOnly: true 
            });
            
            cookies.set('id', String(user.id), {
                ...cookieOptions,
                httpOnly: false 
            });
            
            cookies.set('un', user.username, {
                ...cookieOptions,
                httpOnly: false
            });
            
            cookies.set('when', Date.now().toString(), {
                ...cookieOptions,
                httpOnly: false
            });
            
            cookies.set('email', String(email), {
                ...cookieOptions,
                httpOnly: false
            });

            console.log('success');
            // If everything is successful, throw the redirect
            throw redirect(303, redirectTo); // Use the determined redirect path

        } catch (err) {
            console.error('Login error:', err);
            // If the error is a SvelteKit redirect, re-throw it so SvelteKit handles it
            if (err && err.status === 303 && err.location) {
                throw err;
            }
            // Otherwise, return a generic error message
            return {
                success: false,
                error: err.message || 'An unexpected error occurred.'
            };
        }
    }
};
