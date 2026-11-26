/**
 * Keeps the page's registered WebMCP tools in step with the route
 * (PLAN_WEBMCP §3.4). Called from the root layout on every navigation.
 *
 * Nothing happens in a browser without WebMCP — not even the request for the
 * list — so the feature costs ordinary visitors nothing. Each tool's execute
 * is a same-origin POST to /api/webmcp; the server decides again whether the
 * tool belongs to this page and runs it behind the MCP guard.
 */

import { registerPageTool, webMcpSupported, type PageTool } from './modelContext';

interface Descriptor extends Omit<PageTool, 'execute'> {
  defaults?: Record<string, string>;
}

let controllers: AbortController[] = [];
let generation = 0;
let lastKey = '';

function clear() {
  for (const c of controllers) c.abort();
  controllers = [];
}

async function callTool(name: string, path: string, input: Record<string, unknown>, signal?: AbortSignal) {
  const res = await fetch('/api/webmcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ tool: name, path, input: input ?? {} }),
    signal
  });
  const body = await res.json().catch(() => ({ success: false, message: `HTTP ${res.status}` }));
  return body;
}

/** Re-registers the surface for `path`. `signedIn` is part of the key so a login refreshes it. */
export async function syncWebMcp(path: string, signedIn: boolean): Promise<void> {
  if (!webMcpSupported()) return;
  const key = `${path}|${signedIn ? 1 : 0}`;
  if (key === lastKey) return;
  lastKey = key;
  const mine = ++generation;
  clear();

  let tools: Descriptor[] = [];
  try {
    const res = await fetch(`/api/webmcp?path=${encodeURIComponent(path)}`, { credentials: 'same-origin' });
    if (!res.ok) return; // 404 = WEBMCP is off on this deployment
    tools = (await res.json())?.tools ?? [];
  } catch {
    return;
  }
  if (mine !== generation) return; // a newer navigation took over

  for (const d of tools) {
    const { defaults, ...rest } = d;
    const controller = await registerPageTool({
      ...rest,
      execute: (input, options) => callTool(d.name, path, { ...(defaults ?? {}), ...(input ?? {}) }, options?.signal)
    });
    if (mine !== generation) {
      controller?.abort();
      return;
    }
    if (controller) controllers.push(controller);
  }
}
