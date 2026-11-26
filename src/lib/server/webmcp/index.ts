/**
 * WebMCP on the server (docs/inprogress/PLAN_WEBMCP.md §3.3): what a page
 * registers, and running a call a browser agent made through it.
 *
 * The call runs like an external MCP key, not like the in-app bot: no
 * `isInternalBot`, so the membership gate, the rate limit and the audit all
 * apply — the agent that decided to call is not the person, and it may have
 * been steered by another tab's content.
 */

import { z } from 'zod';
import { env } from '$env/dynamic/private';
import { setMcpContext } from '../mcpContext.js';
import { wrapMcpTool } from '../mcp/guard.js';
import { MCP_TOOL_MANIFEST, entryEnabled, entryPublic, mcpAnnotations, mcpDescription } from '../mcp/toolManifest.js';
import { getPlatformInfoTool } from '../mcp/publicTools.js';
import {
  PLATFORM_INFO,
  PLATFORM_TEXT_ONLY,
  projectIdFromPath,
  surfaceTools,
  type SurfaceEntry,
  type WebMcpMode
} from './surfaces.js';

/** `WEBMCP=off|read|on`; anything else (unset included) is off. */
export function webmcpMode(): WebMcpMode {
  const v = String(env.WEBMCP ?? '').trim().toLowerCase();
  return v === 'read' || v === 'on' ? v : 'off';
}

function lookup(name: string): SurfaceEntry | undefined {
  if (name === PLATFORM_INFO) return { tier: 'read', pure: true, enabled: true, restricted: false };
  const entry = MCP_TOOL_MANIFEST[name];
  if (!entry) return undefined;
  return { tier: entry.tier, pure: entry.pure, enabled: entryEnabled(entry), restricted: !entryPublic(entry) };
}

/** Tool names this page offers to this caller. */
export function surfaceFor(pathname: string, signedIn: boolean, mode: WebMcpMode = webmcpMode()): string[] {
  return surfaceTools(pathname, signedIn, mode, lookup);
}

/** One tool, as the page hands it to `document.modelContext.registerTool` (minus `execute`). */
export interface WebMcpToolDescriptor {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; consequentialHint: boolean; untrustedContentHint: boolean };
  /** Filled into the input when the agent leaves it out (the rikma the page is about). */
  defaults?: Record<string, string>;
}

const schemaCache = new Map<string, Record<string, unknown>>();

/** The tool's zod input schema as JSON Schema — what WebMCP requires (an object, never a string). */
export function toolJsonSchema(name: string, schema: unknown): Record<string, unknown> {
  const hit = schemaCache.get(name);
  if (hit) return hit;
  let js: Record<string, unknown> = { type: 'object', properties: {} };
  if (schema) {
    try {
      js = z.toJSONSchema(schema as any, { unrepresentable: 'any', io: 'input' }) as Record<string, unknown>;
      delete js.$schema;
    } catch {
      // A schema zod cannot render still registers; the server validates on call.
    }
  }
  if (js.type !== 'object') js = { type: 'object', properties: {} };
  schemaCache.set(name, js);
  return js;
}

function describe(name: string, pathname: string): WebMcpToolDescriptor | null {
  const isInfo = name === PLATFORM_INFO;
  const entry = isInfo ? null : MCP_TOOL_MANIFEST[name];
  if (!isInfo && !entry) return null;
  const tool: any = isInfo ? getPlatformInfoTool : entry!.tool;
  const a = isInfo ? mcpAnnotations({ tier: 'read', title: 'About 1lev1', pure: true }) : mcpAnnotations(entry!);
  const inputSchema = toolJsonSchema(name, tool.inputSchema);

  const projectId = projectIdFromPath(pathname);
  const props = (inputSchema.properties ?? {}) as Record<string, unknown>;
  const defaults = projectId && 'projectId' in props ? { projectId } : undefined;

  return {
    name,
    title: a.title,
    description: isInfo ? String(tool.description ?? '') : mcpDescription(name, entry!),
    inputSchema,
    annotations: {
      readOnlyHint: a.readOnlyHint,
      consequentialHint: !a.readOnlyHint,
      untrustedContentHint: !PLATFORM_TEXT_ONLY.has(name)
    },
    ...(defaults ? { defaults } : {})
  };
}

/** The page's registration list. */
export function describeSurface(pathname: string, signedIn: boolean, mode: WebMcpMode = webmcpMode()): WebMcpToolDescriptor[] {
  return surfaceFor(pathname, signedIn, mode)
    .map((n) => describe(n, pathname))
    .filter((d): d is WebMcpToolDescriptor => d !== null);
}

// Wrapped once, like /api/mcp: the wrapper reads the caller from the per-request context.
const wrapped = new Map<string, any>();
function wrappedTool(name: string): any {
  if (name === PLATFORM_INFO) return getPlatformInfoTool;
  let w = wrapped.get(name);
  if (!w) {
    const entry = MCP_TOOL_MANIFEST[name];
    w = wrapMcpTool(entry.tool, entry);
    wrapped.set(name, w);
  }
  return w;
}

export interface WebMcpCall {
  tool: string;
  input: Record<string, unknown>;
  /** The page the agent called from; the tool must be on that page's surface. */
  path: string;
}

export interface WebMcpCaller {
  userId: string | null;
  clientIp: string;
  lang: string;
  fetchInstance: typeof fetch;
}

export type WebMcpOutcome =
  | { status: 200; body: unknown }
  | { status: 400 | 403; body: { success: false; message: string } };

/** Runs one call. A tool off this page's surface is refused, so a page cannot be used to reach tools it never offered. */
export async function callWebMcpTool(call: WebMcpCall, caller: WebMcpCaller, mode: WebMcpMode = webmcpMode()): Promise<WebMcpOutcome> {
  const signedIn = !!caller.userId;
  if (!surfaceFor(call.path, signedIn, mode).includes(call.tool)) {
    return { status: 403, body: { success: false, message: `${call.tool} is not offered on this page.` } };
  }

  const tool = wrappedTool(call.tool);
  let input: Record<string, unknown> = call.input ?? {};
  const projectId = projectIdFromPath(call.path);
  if (projectId && input.projectId == null && describe(call.tool, call.path)?.defaults?.projectId) {
    input = { ...input, projectId };
  }
  if (tool.inputSchema?.safeParse) {
    const parsed = tool.inputSchema.safeParse(input);
    if (!parsed.success) {
      return { status: 400, body: { success: false, message: `Invalid input for ${call.tool}: ${parsed.error.issues.map((i: any) => `${i.path.join('.') || 'input'} ${i.message}`).join('; ')}` } };
    }
    input = parsed.data;
  }

  setMcpContext({
    userId: caller.userId ?? '',
    fetchInstance: caller.fetchInstance,
    channel: 'webmcp',
    rateKey: caller.userId ? `webmcp:user:${caller.userId}` : `webmcp:ip:${caller.clientIp}`,
    lang: caller.lang,
    currentPath: call.path
  });
  const out = await tool.execute(input, {});
  return { status: 200, body: out };
}
