import { MCPServer } from '@mastra/mcp';
import { verifyApiKey } from '$lib/server/apiKeys';
import { setMcpContext } from '$lib/server/mcpContext';
import { toReqRes, toFetchResponse } from 'fetch-to-node';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SITE_CONTEXT } from '$lib/bot/context';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Import timer and platform tools to expose them explicitly
import { timerActionTool } from '../../../mastra/tools/timerActionTool';
import { listUserMissionsTool, getActiveTimersTool, getMissionDetailsTool, getTimerHistoryTool, getMissionStatsTool } from '../../../mastra/tools/missionTimers';
import { getSitePagesTool } from '../../../mastra/tools/siteNavigationTool';
import { navigateToPageTool } from '../../../mastra/tools/navigateToPageTool';
import { findMissionTool } from '../../../mastra/tools/findMissionTool';
import { findUserProjectsTool } from '../../../mastra/tools/findUserProjectsTool';
import { getPageContextTool } from '../../../mastra/tools/pageContextTool';
import { createProjectTool } from '../../../mastra/tools/createProjectTool';
import { createTaskTool } from '../../../mastra/tools/createTaskTool';
import { getProjectMembersTool } from '../../../mastra/tools/getProjectMembersTool';
import { getMemberMissionsTool } from '../../../mastra/tools/getMemberMissionsTool';
import { prepareMissionTool } from '../../../mastra/tools/prepareMissionTool';
import { createMissionTool } from '../../../mastra/tools/createMissionTool';
import { planProjectWorkTool, scanProjectDirectionsTool } from '../../../mastra/tools/planningTools';

// --- Public Tools for Unauthenticated Users ---

const getPlatformInfo = createTool({
    id: 'getPlatformInfo',
    description: 'Get general information about the 1lev1 platform, its goals, and features.',
    inputSchema: z.object({}),
    execute: async () => {
        return {
            info: SITE_CONTEXT,
            message: "This is general information about the 1lev1 platform."
        };
    }
});

const howToConnect = createTool({
    id: 'howToConnect',
    description: 'Instructions on how to register, login and get an API key for full MCP access.',
    inputSchema: z.object({}),
    execute: async () => {
        return {
            steps: [
                "1. Run 'npx 1lev1-mcp' in your terminal. It opens 1lev1.com, you approve the connection, and it writes the key into your agent's config for you.",
                "2. Restart your agent so it picks up the new configuration.",
                "3. Manual alternative: register at https://1lev1.com, then Settings -> API keys -> create a key named 'MCP'.",
                "4. Add it to your MCP client headers: { 'Authorization': 'Bearer YOUR_KEY' }",
                "5. The endpoint is https://api.1lev1.com/api/mcp"
            ],
            is_unauthenticated: true
        };
    }
});

// --- Tool exposure, classified by blast radius ---------------------------
//
// A key minted by the `npx 1lev1-mcp` flow carries no scopes, so the default
// set has to be the one that is safe to hand an autonomous agent. The line we
// draw is the platform's own: anything that only touches the key's owner is on
// by default; anything that lands work or obligations on ANOTHER member needs
// an explicit grant, because that is exactly the kind of act 1lev1 requires
// human consent for.
//
//   read         — queries. Always available.
//   prepare      — returns a prefilled URL, writes nothing. Always available.
//   selfWrite    — changes only the caller's own records (their timers/hours).
//   sharedWrite  — creates obligations for other people. Requires 'mcp:write'.
//
// Scopes live on the api-key record; `ops` is the list we honour here.
const MCP_WRITE_SCOPE = 'mcp:write';

/** Reads the `ops` list off a verified key's scopes, if it has any. */
function keyOps(user: any): string[] {
    const raw = user?.scopes;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === 'object' && Array.isArray((raw as any).ops)) {
        return (raw as any).ops.map(String);
    }
    return [];
}

// Process incoming MCP requests, mapping SvelteKit structures to fetch-to-node for Mastra Serverless HTTP
async function handleMcpRequest(request: Request, url: URL, svelteFetch: typeof fetch): Promise<Response> {
    // 1. Extract API Key from Authorization Header (Optional for public info)
    const authHeader = request.headers.get('Authorization');
    let user = null;
    let apiKey = null;

    if (authHeader) {
        apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        user = await verifyApiKey(apiKey);
        console.log(`[MCP] Request from ${user ? 'authenticated user: ' + user.id : 'unauthenticated client'} at ${url.pathname} (${request.method})`);
    } else {
        console.log(`[MCP] Unauthenticated request to ${url.pathname} (${request.method})`);
    }

    // Check if body is empty for POST requests
    if (request.method === 'POST') {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            // We can't easily read the body here without consuming it, 
            // but we can at least log the content length
            const contentLength = request.headers.get('content-length');
            console.log(`[MCP] POST body content-length: ${contentLength}`);
        }
    }

    let agentsToExpose: any = {};
    let workflowsToExpose: any = {};
    let toolsToExpose: any = {};

    if (user) {
        // --- AUTHENTICATED MODE ---
        // Set per-request context so tools know which user is acting.
        // Using setMcpContext instead of writing to global directly ensures
        // the userId is always tied to the verified API key owner.
        setMcpContext({
            userId: user.id.toString(),
            fetchInstance: svelteFetch
        });

        // Agents and workflows are deliberately NOT exposed. MCPServer turns
        // every registered agent into `ask_<key>` and every workflow into
        // `run_<key>`, which handed an external client tools like
        // `ask_enhancedBotAgent` and `run_chatWorkflow` — the site's own in-app
        // assistant. That puts a second, less-informed agent inside the calling
        // agent's loop, and it is never what a caller wants: it already IS the
        // agent. Concrete tools only.
        agentsToExpose = {};
        workflowsToExpose = {};

        const readTools = {
            listUserMissionsTool,
            getActiveTimersTool,
            getMissionDetailsTool,
            getTimerHistoryTool,
            getMissionStatsTool,
            getSitePagesTool,
            getPageContextTool,
            findMissionTool,
            findUserProjectsTool,
            getProjectMembersTool,
            getMemberMissionsTool
        };

        const prepareTools = {
            navigateToPageTool,
            createProjectTool,     // returns a prefilled URL; the human creates it
            prepareMissionTool,    // ditto
            planProjectWorkTool,
            scanProjectDirectionsTool
        };

        // Only ever touches the caller's own timers/hours.
        const selfWriteTools = {
            timerActionTool
        };

        // Creates work and obligations for other members; `createTaskTool` also
        // executes with the admin token rather than the caller's session.
        const sharedWriteTools = {
            createTaskTool,
            createMissionTool
        };

        const ops = keyOps(user);
        const mayWriteShared = ops.includes(MCP_WRITE_SCOPE);

        toolsToExpose = {
            ...readTools,
            ...prepareTools,
            ...selfWriteTools,
            ...(mayWriteShared ? sharedWriteTools : {}),
            howToConnect // Included even in auth mode for convenience
        };

        console.log(
            `[MCP] user ${user.id}: exposing ${Object.keys(toolsToExpose).length} tools ` +
            `(shared-write ${mayWriteShared ? 'granted' : 'withheld — needs the ' + MCP_WRITE_SCOPE + ' scope'})`
        );
    } else {
        // --- UNAUTHENTICATED MODE ---
        toolsToExpose = {
            getPlatformInfo,
            howToConnect
        };
    }

    let mcpServer;
    try {
        mcpServer = new MCPServer({
            id: '1lev1-mcp-server',
            name: '1lev1 Platform MCP',
            version: '1.0.0',
            description: user 
                ? '1lev1 Platform APIs with direct AI Agents and Context access over standard MCP'
                : 'Limited access to 1lev1 Platform. Please authenticate for full AI Agent and Tool access.',
            agents: agentsToExpose,
            workflows: workflowsToExpose,
            tools: toolsToExpose
        });
    } catch (e: any) {
        console.error("MCPServer Init Error:", e);
        throw error(500, `MCP Server Initialization Error: ${e.message}`);
    }

    // 3. Transform SvelteKit Request to Node-compatible req/res for Mastra
    const { req: nodeReq, res: nodeRes } = toReqRes(request);

    // 4. Start HTTP Transport (serverless mode since this is an Edge/SvelteKit +server function context)
    try {
        console.log(`[MCP] Starting HTTP transport for ${request.method} ${url.pathname}`);
        await mcpServer.startHTTP({
            url,
            // Our path matches this endpoint exactly
            httpPath: `/api/mcp`,
            req: nodeReq as any,
            res: nodeRes as any,
            options: {
                serverless: true 
            }
        });
    } catch (e: any) {
        console.error("[MCP] MCPServer startHTTP Error:", e);
        // If it's a JSON parse error in the body, it might be an empty request
        if (e.message?.includes('JSON') || e.cause?.message?.includes('JSON')) {
            console.error("[MCP] Possible empty or malformed JSON body received");
        }
        throw error(500, `MCP Server startHTTP Error: ${e.message}`);
    }

    // 5. Convert back to SvelteKit / winterTC Response format
    return toFetchResponse(nodeRes);
}

// We expose both GET mapping and POST mapping requests directly connecting to the new MCP Server
export const GET: RequestHandler = async ({ request, url, fetch }) => {
    return handleMcpRequest(request, url, fetch);
};

export const POST: RequestHandler = async ({ request, url, fetch }) => {
    return handleMcpRequest(request, url, fetch);
};

export const OPTIONS: RequestHandler = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
        }
    });
};
