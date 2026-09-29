// The public reference for the MCP connector: how to connect, the tools that
// answer with no account, and every tool an authenticated key can see. The
// signed-in tool list is read from the manifest on every
// request, so it cannot drift from what /api/mcp actually exposes — each tool's
// MCP description ends with a link to its anchor here (mcpDescription).
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import {
  MCP_TOOL_MANIFEST,
  MCP_WRITE_SCOPE,
  entryEnabled,
  mcpAnnotations,
  type McpManifestEntry
} from '$lib/server/mcp/toolManifest';
import { MCP_ENDPOINT } from '$lib/server/mcp/keyDiagnosis';
import { noAccountTools } from '$lib/server/mcp/publicTools';

export interface ToolInput {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface ToolDoc {
  name: string;
  title: string;
  tier: McpManifestEntry['tier'];
  description: string;
  readOnly: boolean;
  destructive: boolean;
  membersOnly: boolean;
  needsScope: string | null;
  inputs: ToolInput[];
}

/** One JSON-schema property as a short type label: `string`, `number[]`, `"a" | "b"`. */
function typeLabel(p: any): string {
  if (!p || typeof p !== 'object') return 'any';
  if (Array.isArray(p.enum)) return p.enum.map((v: unknown) => JSON.stringify(v)).join(' | ');
  if (p.type === 'array') return `${typeLabel(p.items)}[]`;
  if (Array.isArray(p.anyOf)) {
    return p.anyOf.filter((x: any) => x?.type !== 'null').map(typeLabel).join(' | ') || 'any';
  }
  if (Array.isArray(p.type)) return p.type.filter((t: string) => t !== 'null').join(' | ');
  return p.type ?? 'object';
}

/** Top-level inputs of a tool, from its zod schema. Nested objects stay one row. */
function inputsOf(tool: any): ToolInput[] {
  const schema = tool?.inputSchema;
  if (!schema) return [];
  try {
    const js: any = z.toJSONSchema(schema, { unrepresentable: 'any', io: 'input' });
    const required = new Set<string>(js.required ?? []);
    return Object.entries(js.properties ?? {}).map(([name, p]: [string, any]) => ({
      name,
      type: typeLabel(p),
      required: required.has(name),
      description: p?.description
    }));
  } catch {
    // A schema zod cannot render still lists its field names.
    const shape = typeof schema.shape === 'function' ? schema.shape() : schema.shape;
    return Object.keys(shape ?? {}).map((name) => ({ name, type: 'any', required: false }));
  }
}

function toolDoc(name: string, entry: McpManifestEntry): ToolDoc {
  const a = mcpAnnotations(entry);
  return {
    name,
    title: entry.title,
    tier: entry.tier,
    description: (entry.description ?? entry.tool.description ?? '').trim(),
    readOnly: a.readOnlyHint,
    destructive: a.destructiveHint,
    membersOnly: entry.project === 'member' || entry.mission === 'member',
    needsScope: entry.tier === 'sharedWrite' ? MCP_WRITE_SCOPE : null,
    inputs: inputsOf(entry.tool)
  };
}

/**
 * A tool that answers before anyone signs in (getPlatformInfo, prepareSignup).
 * Read from the very tools /api/mcp serves, so the description, inputs and
 * annotations shown are the ones an agent gets.
 */
function noAccountDoc(name: string, tool: any): ToolDoc {
  const a = tool?.mcp?.annotations ?? {};
  return {
    name,
    title: a.title ?? name,
    tier: a.readOnlyHint ? 'read' : 'prepare',
    // The docs link at the end points at this page; it is noise here.
    description: String(tool?.description ?? '').replace(/\s*Docs: \S+$/, '').trim(),
    readOnly: a.readOnlyHint === true,
    destructive: a.destructiveHint === true,
    membersOnly: false,
    needsScope: null,
    inputs: inputsOf(tool)
  };
}

export const load: PageServerLoad = ({ fetch }) => {
  const tools = Object.entries(MCP_TOOL_MANIFEST)
    .filter(([, entry]) => entryEnabled(entry))
    .map(([name, entry]) => toolDoc(name, entry));
  const noAccount = Object.entries(noAccountTools('', fetch)).map(([name, tool]) => noAccountDoc(name, tool));
  return { tools, noAccount, endpoint: MCP_ENDPOINT };
};
