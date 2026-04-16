import { MCPServer } from '@mastra/mcp';
import { mastra } from '../../../mastra'; // Our global instance
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
                "1. Visit https://1lev1.com and register a new account.",
                "2. Login to your account.",
                "3. Go to your Profile -> API Keys to generate a new key.",
                "4. Alternatively, run 'npx 1lev1-mcp' in your terminal to quickly authenticate and get your key.",
                "5. Add the key to your MCP client headers: { 'Authorization': 'Bearer YOUR_KEY' }"
            ],
            is_unauthenticated: true
        };
    }
});

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

        // Extract valid agents handling missing description fields properly
        for (const [key, agent] of Object.entries((mastra as any).agents || {})) {
            const agt = agent as any;
            if (!agt.description) agt.description = `Agent for ${key}`;
            if (agt.config && !agt.config.description) agt.config.description = `Agent for ${key}`;
            agentsToExpose[key] = agt;
        }

        // Set missing descriptions in workflows too
        for (const [key, workflow] of Object.entries((mastra as any).workflows || {})) {
            const wf = workflow as any;
            if (!wf.description) wf.description = `Workflow for ${key}`;
            if (wf.config && !wf.config.description) wf.config.description = `Workflow for ${key}`;
            if (wf.options && !wf.options.description) wf.options.description = `Workflow for ${key}`;
            workflowsToExpose[key] = wf;
        }

        toolsToExpose = {
            timerActionTool,
            listUserMissionsTool,
            getActiveTimersTool,
            getMissionDetailsTool,
            getTimerHistoryTool,
            getMissionStatsTool,
            getSitePagesTool,
            navigateToPageTool,
            findMissionTool,
            findUserProjectsTool,
            getPageContextTool,
            createProjectTool,
            howToConnect // Included even in auth mode for convenience
        };
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
