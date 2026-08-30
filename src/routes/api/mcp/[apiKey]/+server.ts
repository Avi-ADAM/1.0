import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Retired: the API key used to travel in the URL path.
 *
 * Two reasons this endpoint is gone rather than merely discouraged:
 *
 *  1. A key in a path is a key in every access log, proxy history and browser
 *     referrer along the way. The header form leaks none of that.
 *  2. It duplicated the tool-exposure logic of `/api/mcp` — including handing
 *     out `ask_*` / `run_*` agent proxies and ignoring the key's scopes. Left
 *     alive it would be a way around the limits the main endpoint now enforces,
 *     which makes those limits decorative.
 *
 * No key has ever authenticated against it (the `api-keys` collection is
 * empty), so nothing is being broken. `npx 1lev1-mcp` has always written the
 * header form.
 */
const GUIDANCE = {
    error: 'This endpoint has been retired.',
    reason: 'Passing the API key in the URL exposes it in server and proxy logs.',
    use: 'https://api.1lev1.com/api/mcp',
    with: { Authorization: 'Bearer <your key>' },
    getAKey: "Run 'npx 1lev1-mcp', or create one at https://1lev1.com -> Settings -> API keys."
};

const gone: RequestHandler = async () => json(GUIDANCE, { status: 410 });

export const GET = gone;
export const POST = gone;

export const OPTIONS: RequestHandler = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true'
        }
    });
};
