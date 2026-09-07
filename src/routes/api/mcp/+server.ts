import { MCPServer } from '@mastra/mcp';
import {
    checkApiKey,
    isRejected,
    repairPlan,
    SHADOWING_WARNING,
    CONFIG_LOCATIONS,
    CONNECT_URL,
    KEYS_PAGE_URL,
    MCP_ENDPOINT,
    type KeyVerdict
} from '$lib/server/mcp/keyDiagnosis';
import { oauthChallenge } from '$lib/server/oauth/challenge.js';
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
                `5. The endpoint is ${MCP_ENDPOINT}`
            ],
            // Said here too, not only in the rejected-key path: someone who is
            // reconnecting a client that already has an entry is one restart away
            // from the same silent shadowing loop.
            if_a_key_is_already_configured: SHADOWING_WARNING,
            look_for_existing_entries_in: CONFIG_LOCATIONS,
            is_unauthenticated: true
        };
    }
});

/**
 * The "just do it" tool. `howToConnect` explains; this one hands over the exact
 * command and URL, and repeats the delete-first step, because it is reachable
 * from the rejected-key state where minting alone provably does not help.
 */
const createNewApiKey = createTool({
    id: 'createNewApiKey',
    description:
        'Get a NEW 1lev1 API key: the exact command to run (npx 1lev1-mcp) and the ' +
        'approval URL. Also lists the stale config entries that must be deleted first, ' +
        'otherwise the new key is shadowed and nothing changes after a restart.',
    inputSchema: z.object({}),
    execute: async () => {
        return {
            before_you_mint: SHADOWING_WARNING,
            delete_stale_entries_in: CONFIG_LOCATIONS,
            install_and_mint: 'npx 1lev1-mcp',
            what_it_does:
                `Opens ${CONNECT_URL}, the user logs in and approves the connection, ` +
                "and the package writes the key into the MCP client's user-level config.",
            then: 'Restart the MCP client so it re-reads its configuration.',
            manual_alternative: {
                page: KEYS_PAGE_URL,
                header: { Authorization: 'Bearer <your key>' },
                endpoint: MCP_ENDPOINT
            },
            keep_it_out_of_git:
                'Never write the key into a file the repository tracks (a project .mcp.json ' +
                'is the usual one). A committed key gets revoked, and you land back here.'
        };
    }
});

/**
 * Built per-request, because the diagnosis belongs in the tool *description* —
 * an agent picking tools reads the list long before it calls anything, and the
 * list is the only place a refusal can be stated loudly enough to stop the
 * "reinstall and restart" loop.
 */
function makeFixRejectedApiKeyTool(reason: 'malformed' | 'unknown' | 'revoked') {
    return createTool({
        id: 'fixRejectedApiKey',
        description:
            `STOP — the 1lev1 API key this client sent was REJECTED (${reason}). You are ` +
            'NOT connected to the user\'s account and no mission, timer or project tool is ' +
            'available. This is NOT the same as an unregistered user, so do not simply tell ' +
            'them to sign up. Call this tool for the repair steps and relay them.',
        inputSchema: z.object({}),
        execute: async () => repairPlan(reason)
    });
}

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
    let verdict: KeyVerdict = 'absent';

    if (authHeader) {
        apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        // `verifyApiKey` collapses malformed/unknown/revoked into null. Keep the
        // distinction: "you sent a dead key" and "you sent no key" need different
        // answers, and conflating them is what made a revoked key look like an
        // unregistered user for three restarts running.
        ({ user, verdict } = await checkApiKey(apiKey));
        console.log(
            `[MCP] Request from ${user ? 'authenticated user: ' + user.id : `client with a ${verdict} key`}` +
            ` at ${url.pathname} (${request.method})`
        );
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
        // A spec client (claude.ai, or anything else that speaks the MCP
        // authorization flow) will not start an OAuth handshake until it is told
        // to. Answering 200 with two public tools reads to it as success, and the
        // connector stays silently anonymous — which is exactly how this went
        // unnoticed. `oauthChallenge` returns null while public mode is on, so
        // today's behaviour is unchanged until MCP_OAUTH_ENABLED is set.
        const challenge = oauthChallenge(url);
        if (challenge) return challenge;

        if (isRejected(verdict)) {
            // --- REJECTED-KEY MODE ---
            // Deliberately NOT the public probe. The caller is configured, tried to
            // authenticate, and failed; answering with the newcomer's tool set sends
            // the agent off to mint a key that the same stale config will shadow on
            // the next restart. Name the failure instead.
            console.warn(
                `[MCP] Rejected key (${verdict}) at ${url.pathname} — exposing the repair tools only.`
            );
            toolsToExpose = {
                fixRejectedApiKey: makeFixRejectedApiKeyTool(verdict),
                createNewApiKey,
                getPlatformInfo
            };
        } else {
            // --- UNAUTHENTICATED MODE (public probe) ---
            toolsToExpose = {
                getPlatformInfo,
                howToConnect,
                createNewApiKey
            };
        }
    }

    let mcpServer;
    try {
        mcpServer = new MCPServer({
            id: '1lev1-mcp-server',
            name: '1lev1 Platform MCP',
            version: '1.0.0',
            description: user
                ? '1lev1 Platform APIs with direct AI Agents and Context access over standard MCP'
                : isRejected(verdict)
                    ? `NOT CONNECTED — the API key this client sent was rejected (${verdict}). ` +
                      'Call fixRejectedApiKey. Delete the stale config entry before minting a ' +
                      'new key, or the replacement will be shadowed again.'
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
