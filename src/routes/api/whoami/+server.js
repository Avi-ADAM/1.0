/**
 * Who is the caller? — the identity oracle for a front that does not sit beside
 * Strapi.
 *
 * The Vercel front proxies all of its `/api/*` here (see
 * `src/lib/server/ssrApiBase.js`), so this instance — which *does* sit beside
 * Strapi — answers the one question the front cannot answer alone: which user
 * does this session token actually belong to.
 *
 * It reads nothing but the `jwt` cookie, and it deliberately does **not**
 * honour the internal secret as an elevation: a server-originated call gets the
 * same answer a browser would. That keeps this endpoint incapable of asserting
 * an identity — it can only report one Strapi already vouched for.
 */

import { json, error } from '@sveltejs/kit';
import { resolveSessionIdentity } from '$lib/server/identity.js';

export async function GET({ cookies }) {
	const identity = await resolveSessionIdentity({ jwt: cookies.get('jwt') });
	if (!identity) throw error(401, 'Unauthorized');
	return json(identity);
}
