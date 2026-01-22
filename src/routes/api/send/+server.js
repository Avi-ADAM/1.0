// TODO: Validation and server-side logic for GraphQL queries.
// Secure endpoint that uses HttpOnly cookies for authentication.
const HTTP_ST_ENDPOINT = import.meta.env.VITE_URL
const ep = HTTP_ST_ENDPOINT + "/graphql"
import { qids } from './qids.js'
import { json, error } from '@sveltejs/kit'
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;

export async function POST({ request, cookies }) {
	const data = await request.json();

	const query = data?.data?.queId ? qids[data.data.queId] : data?.data?.query;

	if (!query) {
		throw error(400, 'queId or query is required');
	}

	let isSer = data.isSer ?? false;
	let idL = cookies.get('id');
	let jw = isSer ? VITE_ADMINMONTHER : cookies.get('jwt');

	if (!jw && !isSer) {
		throw error(401, 'Unauthorized: No token found');
	}

	let variablesObject = {};
	let keyValueObject = data.data.arg || {};
	for (let key in keyValueObject) {
		if (keyValueObject[key] != null)
			if (key === 'idL') {
				variablesObject[key] = idL; // Use the local uid from 'idL' cookie for security
			} else {
				variablesObject[key] = keyValueObject[key];
			}
	}

	let bearer1 = 'bearer' + ' ' + jw;

	const controller = new AbortController();
	const timeout = 30000; // 30-second timeout
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const res = await fetch(ep, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify({ query: query, variables: variablesObject || {} }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: bearer1
			},
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		const newd = await res.json();

		if (newd.data) {
			return json(newd);
		}

		if (newd.errors) {
			console.error('GraphQL Errors from downstream:', JSON.stringify(newd.errors, null, 2));
			// Check for authentication errors
			const authError = newd.errors.find(err =>
				err.message === 'Invalid token.' ||
				err.extensions?.code === 'UNAUTHENTICATED' ||
				err.message.includes('401') ||
				err.message.includes('Unauthorized')
			);

			if (authError) {
				throw error(401, authError.message);
			}

			// Handle other GraphQL errors by returning the full error object with a 500 status.
			return json(newd, { status: 500 });
		}

		// Fallback for unexpected response structure from the server.
		console.error('Unexpected response structure:', newd);
		return json({ error: 'Unexpected response from server', details: newd }, { status: 500 });

	} catch (e) {
		clearTimeout(timeoutId); // Ensure timeout is cleared on other errors too
		
		if (e.name === 'AbortError') {
			console.error('Fetch request timed out.');
			throw error(504, 'Gateway Timeout: The server did not respond in time.');
		}

		// If SvelteKit's `error()` was thrown, it should be re-thrown.
		if (e.status && e.body) {
			throw e;
		}

		console.error('Error:', e);
		throw error(500, e.message || 'An internal server error occurred.');
	}
}
/*
ללוגין
export async function post({ request, cookies }) {
    // ... your code

    return {
        headers: {
            'set-cookie': `yourCookieName=${yourCookieValue}; path=/; HttpOnly; max-age=31536000`,
        },
        // ... your code
    };
}
*/ 