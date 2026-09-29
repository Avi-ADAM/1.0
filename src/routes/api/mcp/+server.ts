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
import { oauthChallenge, lazyAuthEnabled, needsSignIn } from '$lib/server/oauth/challenge.js';
import { signInListing } from '$lib/server/mcp/lazyListing';
import { setMcpContext, getMcpContext } from '$lib/server/mcpContext';
import { toReqRes, toFetchResponse } from 'fetch-to-node';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { wrapMcpTool } from '$lib/server/mcp/guard';
import {
    MCP_TOOL_MANIFEST,
    MCP_DOCS_URL,
    tierAllowed,
    entryEnabled,
    mcpAnnotations,
    mcpDescription
} from '$lib/server/mcp/toolManifest';
import { mcpInstructions } from '$lib/server/mcp/instructions';
import { getPlatformInfoTool, noAccountTools, noAccountToolNames } from '$lib/server/mcp/publicTools';
import { assistantMcpEnabled } from '../../../mastra/tools/assistantTools';
import { normalizeApiKeyScopes } from '$lib/server/apiKeys';

// --- Public Tools for Unauthenticated Users ---

/** Where the public tools point: the connect section of the tool reference. */
const CONNECT_DOCS = ` Docs: ${MCP_DOCS_URL}#connect`;

/** Annotations for the public tools: none of them touches any record. */
const readOnly = (title: string) => ({
    mcp: { annotations: mcpAnnotations({ tier: 'read', title }) }
});

// getPlatformInfo and prepareSignup — the tools that need no account — live in
// $lib/server/mcp/publicTools, shared with the /mcp reference page.
const getPlatformInfo = getPlatformInfoTool;

const howToConnect = createTool({
    id: 'howToConnect',
    description: 'Instructions on how to register, login and get an API key for full MCP access.' + CONNECT_DOCS,
    inputSchema: z.object({}),
    ...readOnly('How to connect'),
    execute: async () => {
        // The same tool is listed while signed in. Saying "unauthenticated" there
        // sent claude.ai looking for a signup tool it is — rightly — not shown.
        const userId = getMcpContext()?.userId;
        if (userId) {
            return {
                already_connected: true,
                connected_as_user_id: userId,
                note:
                    'This client is already signed in to a 1lev1 account, so every tool it needs is listed. ' +
                    'prepareSignup is offered only to a client with no account; to try it, disconnect this ' +
                    'connector (or use a client that has never connected) and ask again.'
            };
        }
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
        'otherwise the new key is shadowed and nothing changes after a restart.' + CONNECT_DOCS,
    inputSchema: z.object({}),
    ...readOnly('Get a new API key'),
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
            'them to sign up. Call this tool for the repair steps and relay them.' + CONNECT_DOCS,
        inputSchema: z.object({}),
        ...readOnly('Fix a rejected API key'),
        execute: async () => repairPlan(reason)
    });
}

// --- Tool exposure ------------------------------------------------------
//
// A key minted by the `npx 1lev1-mcp` flow carries no scopes, so the default
// set has to be the one that is safe to hand an autonomous agent. Which tools
// exist, their blast-radius tier and how each is guarded (rate limit, key
// scope, membership, audit) all live in one place: $lib/server/mcp/toolManifest.
// Wrapped once here; the wrappers read the caller from the per-request context.
const WRAPPED_TOOLS: Record<string, any> = Object.fromEntries(
    Object.entries(MCP_TOOL_MANIFEST).map(([name, entry]) => [
        name,
        wrapMcpTool(entry.tool, entry, {
            description: mcpDescription(name, entry),
            annotations: { ...mcpAnnotations(entry) }
        })
    ])
);


/**
 * The JSON-RPC body, read from a clone so the transport still gets the
 * original stream. Unparseable ⇒ null, which calls no tool and so meets no
 * gate — the transport answers it with its own parse error.
 */
async function peekJson(request: Request): Promise<unknown> {
    if (request.method !== 'POST') return null;
    try {
        return await request.clone().json();
    } catch {
        return null;
    }
}

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
async function handleMcpRequest(request: Request, url: URL, svelteFetch: typeof fetch, clientIp = ''): Promise<Response> {
    // 1. Extract API Key from Authorization Header (Optional for public info)
    const authHeader = request.headers.get('Authorization');
    let user = null;
    let apiKey = null;
    let verdict: KeyVerdict = 'absent';
    let keyId: string | undefined;

    if (authHeader) {
        apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        // `verifyApiKey` collapses malformed/unknown/revoked into null. Keep the
        // distinction: "you sent a dead key" and "you sent no key" need different
        // answers, and conflating them is what made a revoked key look like an
        // unregistered user for three restarts running.
        ({ user, verdict, keyId } = await checkApiKey(apiKey));
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
    // Lazy authentication for this (anonymous) caller — set below.
    let lazy = false;

    if (user) {
        // --- AUTHENTICATED MODE ---
        // Set per-request context so tools know which user is acting.
        // Using setMcpContext instead of writing to global directly ensures
        // the userId is always tied to the verified API key owner.
        setMcpContext({
            userId: user.id.toString(),
            fetchInstance: svelteFetch,
            keyProjects: normalizeApiKeyScopes(user.scopes)?.projects,
            keyId
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

        const ops = keyOps(user);
        toolsToExpose = { howToConnect }; // included even in auth mode for convenience
        const withheld: string[] = [];
        for (const [name, entry] of Object.entries(MCP_TOOL_MANIFEST)) {
            // A tool switched off by env is simply absent — not a refusal the
            // agent has to discover by calling it.
            if (!entryEnabled(entry)) continue;
            if (tierAllowed(entry.tier, ops)) toolsToExpose[name] = WRAPPED_TOOLS[name];
            else withheld.push(name);
        }

        console.log(
            `[MCP] user ${user.id}: exposing ${Object.keys(toolsToExpose).length} tools` +
            (withheld.length ? ` (withheld by key scope: ${withheld.join(', ')})` : '')
        );
    } else {
        // A spec client (claude.ai, or anything else that speaks the MCP
        // authorization flow) will not start an OAuth handshake until it is told
        // to. Answering 200 with two public tools reads to it as success, and the
        // connector stays silently anonymous — which is exactly how this went
        // unnoticed. `oauthChallenge` returns null while public mode is on, so
        // today's behaviour is unchanged until MCP_OAUTH_ENABLED is set.
        //
        // Lazy authentication (MCP_PUBLIC_MODE=lazy) moves that 401 from the
        // connect to the first call that needs an account: a person with no
        // account can still reach prepareSignup, and a member gets Claude's
        // Connect card the moment they ask for their own data. A sent-but-dead
        // token is always the 401 — that is how an expired OAuth token refreshes.
        lazy = lazyAuthEnabled(url);
        if (lazy) {
            if (isRejected(verdict) || needsSignIn(await peekJson(request), noAccountToolNames())) {
                return oauthChallenge(url, { force: true })!;
            }
        } else {
            const challenge = oauthChallenge(url);
            if (challenge) return challenge;
        }

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
        } else if (lazy) {
            // --- LAZY-AUTH MODE (no token yet) ---
            // The account tools are listed but gated above; the key-minting
            // tools are left out — sign-in here is Claude's Connect card, not
            // an npx command (they stay on ?public=1).
            toolsToExpose = { ...signInListing(), ...noAccountTools(clientIp, svelteFetch) };
        } else {
            // --- UNAUTHENTICATED MODE (public probe) ---
            // Someone without an account, talking to their agent: the agent can
            // prepare the signup — one prefilled screen the person signs
            // themselves (PLAN_AI_SIGNUP_CONCIERGE §5.1).
            toolsToExpose = {
                howToConnect,
                createNewApiKey,
                ...noAccountTools(clientIp, svelteFetch)
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
            // The platform model an outside agent otherwise has to guess. A
            // rejected key gets none: nothing but the repair tools applies there.
            instructions: isRejected(verdict)
                ? undefined
                : user
                    ? mcpInstructions({ rikmaImport: assistantMcpEnabled() })
                    : lazy
                        ? mcpInstructions({ rikmaImport: assistantMcpEnabled(), publicSignup: assistantMcpEnabled(), lazySignIn: true })
                        : mcpInstructions({ rikmaImport: false, publicSignup: assistantMcpEnabled() }),
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

    // 5. Convert back to SvelteKit / winterTC Response format.
    //
    // The body is drained here instead of being handed over as a live stream,
    // and that is load-bearing: fetch-to-node closes its stream controller from
    // the node response's 'finish' event, which arrives on a timer, AFTER the
    // runtime has already finished with the body and closed it. The late close
    // then throws ERR_INVALID_STATE asynchronously — nothing can catch it, and
    // it takes the whole server process down. It reproduced on every tools/list.
    // Reading the body to the end happens while the stream is still ours, so the
    // close lands exactly once.
    //
    // A streaming response (SSE) must NOT be drained — it never ends — so it is
    // passed through untouched. In serverless mode MCP answers with plain JSON.
    // toFetchResponse resolves to the Response — it is a promise, not the object.
    const fetchRes = await toFetchResponse(nodeRes);
    if (fetchRes.headers.get('content-type')?.includes('text/event-stream')) {
        return fetchRes;
    }
    const body = await fetchRes.arrayBuffer();
    return new Response(body, {
        status: fetchRes.status,
        statusText: fetchRes.statusText,
        headers: fetchRes.headers
    });
}

// We expose both GET mapping and POST mapping requests directly connecting to the new MCP Server
export const GET: RequestHandler = async ({ request, url, fetch, getClientAddress }) => {
    return handleMcpRequest(request, url, fetch, safeAddress(getClientAddress));
};

export const POST: RequestHandler = async ({ request, url, fetch, getClientAddress }) => {
    return handleMcpRequest(request, url, fetch, safeAddress(getClientAddress));
};

/** getClientAddress throws where the adapter cannot tell; the limiter then buckets by 'unknown'. */
function safeAddress(get: () => string): string {
    try {
        return get();
    } catch {
        return '';
    }
}

export const OPTIONS: RequestHandler = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            // No Allow-Credentials: auth is a Bearer header, never a cookie, and
            // credentials with a `*` origin is a combination browsers reject anyway.
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version'
        }
    });
};
