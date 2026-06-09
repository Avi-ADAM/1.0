import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyApiKey } from '$lib/server/apiKeys';
import { actionService } from '$lib/server/actions/index.js';
import type { ActionContext } from '$lib/server/actions/types.js';
// Server-only secret — never exposed to the client bundle (no VITE_ prefix).
import { ADMINMONTHER } from '$env/static/private';

// Whitelist of actions allowed via API
const ALLOWED_ACTIONS = ['createTask'];

// Admin token for Strapi bypass (internal use)
const ADMIN_TOKEN = ADMINMONTHER;

/**
 * POST /api/v1/actions
 * 
 * Secure endpoint for executing specific actions via API keys.
 * Requires Authorization: Bearer <api_key>
 * 
 * Body: { actionKey: string, params: Record<string, any> }
 */
export const POST: RequestHandler = async ({ request, fetch }) => {
    // 1. Verify API Key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        throw error(401, 'Missing Authorization header');
    }

    const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const user = await verifyApiKey(apiKey);

    if (!user) {
        throw error(401, 'Invalid or expired API key');
    }

    console.log(`[API-Actions] Authenticated request from user ${user.id} (${user.username})`);

    try {
        // 2. Parse and Validate Request Body
        const body = await request.json();
        const { actionKey, params } = body;

        if (!actionKey || typeof actionKey !== 'string') {
            throw error(400, 'Missing or invalid actionKey');
        }

        if (!params || typeof params !== 'object') {
            throw error(400, 'Missing or invalid params');
        }

        // 3. Check Whitelist
        if (!ALLOWED_ACTIONS.includes(actionKey)) {
            console.warn(`[API-Actions] Action "${actionKey}" is not allowed via API`);
            throw error(403, `Action "${actionKey}" is not permitted via this endpoint`);
        }

        // 4. Build Action Context
        // We use the ADMIN_TOKEN for the JWT because API keys identify the USER, 
        // but the internal action system might need a valid Strapi JWT.
        // Usually, the action system should be able to work with the user ID directly if it has admin rights,
        // or we need to ensure the context has a JWT that Strapi accepts.
        // In this case, we use the verified user's ID.
        const context: ActionContext = {
            userId: user.id.toString(),
            jwt: ADMIN_TOKEN, // Using admin token to perform actions on behalf of the user
            lang: 'he',
            fetch
        };

        // 5. Execute Action
        console.log(`[API-Actions] Executing action: ${actionKey} for user ${user.id}`);
        const result = await actionService.executeAction(actionKey, params, context);

        // 6. Return Result
        if (result.success) {
            return json({
                success: true,
                data: result.data,
                updateStrategy: result.updateStrategy
            });
        } else {
            // Map error codes to status codes
            const statusCode = getStatusCodeForError(result.error?.code);
            return json({
                success: false,
                error: result.error
            }, { status: statusCode });
        }

    } catch (e: any) {
        if (e.status) throw e; // Re-throw SvelteKit errors
        
        console.error('[API-Actions] Unexpected error:', e);
        throw error(500, e.message || 'Internal server error');
    }
};

/**
 * Map action system error codes to HTTP status codes
 */
function getStatusCodeForError(errorCode?: string): number {
    switch (errorCode) {
        case 'VALIDATION_FAILED':
            return 400;
        case 'UNAUTHORIZED':
            return 403;
        case 'UNKNOWN_ACTION':
        case 'NOT_FOUND':
            return 404;
        default:
            return 500;
    }
}

/**
 * Handle CORS for external API calls
 */
export const OPTIONS: RequestHandler = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
        }
    });
};
