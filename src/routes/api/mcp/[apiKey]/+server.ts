import { MCPServer } from '@mastra/mcp';
import { mastra } from '../../../../mastra'; // Our global instance
import { verifyApiKey } from '$lib/server/apiKeys';
import { toReqRes, toFetchResponse } from 'fetch-to-node';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Import timer and platform tools to expose them explicitly
import { timerActionTool } from '../../../../mastra/tools/timerActionTool';
import { listUserMissionsTool, getActiveTimersTool, getMissionDetailsTool, getTimerHistoryTool, getMissionStatsTool } from '../../../../mastra/tools/missionTimers';
import { getSitePagesTool } from '../../../../mastra/tools/siteNavigationTool';
import { navigateToPageTool } from '../../../../mastra/tools/navigateToPageTool';
import { findMissionTool } from '../../../../mastra/tools/findMissionTool';
import { findUserProjectsTool } from '../../../../mastra/tools/findUserProjectsTool';
import { getPageContextTool } from '../../../../mastra/tools/pageContextTool';

// Process incoming MCP requests, mapping SvelteKit structures to fetch-to-node for Mastra Serverless HTTP
async function handleMcpRequest(request: Request, apiKey: string, url: URL, svelteFetch: typeof fetch): Promise<Response> {
    // 1. Verify standard MCP API keys created inside the system. 
    // They are tracked in Strapi under 'api-keys' table (for internal users or external platforms)
    const user = await verifyApiKey(apiKey);
    if (!user) {
        throw error(401, 'Unauthorized: Invalid API Key');
    }

    // Set global context for tools (like timerActionTool) which rely on it to identify who is performing the action
    global.botContext = {
        userId: user.id.toString(),
        fetchInstance: svelteFetch
    };

    // Extract valid agents handling missing description fields properly (needed by MCPServer logic)
    const agentsToExpose: any = {};
    for (const [key, agent] of Object.entries((mastra as any).agents || {})) {
        const agt = agent as any;
        if (!agt.description) agt.description = `Agent for ${key}`;
        if (agt.config && !agt.config.description) agt.config.description = `Agent for ${key}`;
        
        agentsToExpose[key] = agt;
    }

    // Set missing descriptions in workflows too
    const workflowsToExpose: any = {};
    for (const [key, workflow] of Object.entries((mastra as any).workflows || {})) {
        const wf = workflow as any;
        if (!wf.description) wf.description = `Workflow for ${key}`;
        if (wf.config && !wf.config.description) wf.config.description = `Workflow for ${key}`;
        if (wf.options && !wf.options.description) wf.options.description = `Workflow for ${key}`;
        
        workflowsToExpose[key] = wf;
    }

    let mcpServer;
    try {
        mcpServer = new MCPServer({
            id: '1lev1-mcp-server',
            name: '1lev1 Platform MCP',
            version: '1.0.0',
            description: '1lev1 Platform APIs with direct AI Agents and Context access over standard MCP',
            agents: agentsToExpose,
            workflows: workflowsToExpose,
            tools: {
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
                getPageContextTool
            }
        });
    } catch (e: any) {
        console.error("MCPServer Init Error:", e);
        throw error(500, `MCP Server Initialization Error: ${e.message}`);
    }

    // 3. Transform SvelteKit Request to Node-compatible req/res for Mastra
    const { req: nodeReq, res: nodeRes } = toReqRes(request);

    // 4. Start HTTP Transport (serverless mode since this is an Edge/SvelteKit +server function context)
    try {
        await mcpServer.startHTTP({
            url,
            // Our path matches this endpoint exactly
            httpPath: `/api/mcp/${apiKey}`,
            req: nodeReq as any,
            res: nodeRes as any,
            options: {
                serverless: true 
            }
        });
    } catch (e: any) {
        console.error("MCPServer startHTTP Error:", e);
        throw error(500, `MCP Server startHTTP Error: ${e.message}`);
    }

    // 5. Convert back to SvelteKit / winterTC Response format
    return toFetchResponse(nodeRes);
}

// We expose both GET mapping and POST mapping requests directly connecting to the new MCP Server
export const GET: RequestHandler = async ({ request, params, url, fetch }) => {
    return handleMcpRequest(request, params.apiKey, url, fetch);
};

export const POST: RequestHandler = async ({ request, params, url, fetch }) => {
    return handleMcpRequest(request, params.apiKey, url, fetch);
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
