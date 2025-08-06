import { redirect } from '@sveltejs/kit';

const baseUrl = import.meta.env.VITE_URL;

export const actions = {
    login: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email');
        const password = data.get('password');
        const redirectTo = data.get('from') || '/me'; // Get 'from' parameter, default to '/me'

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

            // Set httpOnly cookies on the server
            cookies.set('jwt', jwt, {
                path: '/',
                expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            cookies.set('id', user.id, {
                path: '/',
                expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            cookies.set('un', user.username, {
                path: '/',
                expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            cookies.set('when', Date.now().toString(), {
                path: '/',
                expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            cookies.set('email', email, {
                path: '/',
                expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
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
