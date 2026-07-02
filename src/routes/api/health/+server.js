import { json } from '@sveltejs/kit';

// Liveness probe for the Docker HEALTHCHECK / Nginx upstream checks.
// No auth, no Strapi round-trip — reports only that the node process is up.
export function GET() {
	return json({ status: 'ok', uptime: process.uptime() });
}
