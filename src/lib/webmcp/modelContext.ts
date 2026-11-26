/**
 * The only file that touches the browser's WebMCP API (PLAN_WEBMCP §3.4).
 * The API has moved twice already (navigator → document, unregisterTool →
 * AbortSignal); when it moves again, this file changes and nothing else.
 *
 * Spec: https://webmachinelearning.github.io/webmcp/ (draft of 2026-11-24) —
 *   document.modelContext.registerTool(tool, { signal }) → Promise<void>
 *   tool = { name, title?, description, inputSchema, annotations?, execute(input, { signal }) }
 *   execute's result is JSON-serialised for the agent.
 */

export interface PageTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; consequentialHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<unknown>;
}

interface ModelContextLike {
  registerTool: (tool: PageTool, options?: { signal?: AbortSignal }) => unknown;
  unregisterTool?: (name: string) => unknown;
}

/** The browser's model context, or null where WebMCP is absent (every browser but a flagged / origin-trial Chrome today). */
export function getModelContext(): ModelContextLike | null {
  if (typeof document === 'undefined') return null;
  const mc = (document as any).modelContext ?? (globalThis.navigator as any)?.modelContext;
  return mc && typeof mc.registerTool === 'function' ? (mc as ModelContextLike) : null;
}

export function webMcpSupported(): boolean {
  return getModelContext() !== null;
}

/**
 * Registers one tool; aborting the returned controller unregisters it.
 * Falls back to `unregisterTool` for the early-preview builds that had it.
 */
export async function registerPageTool(tool: PageTool): Promise<AbortController | null> {
  const mc = getModelContext();
  if (!mc) return null;
  const controller = new AbortController();
  try {
    await mc.registerTool(tool, { signal: controller.signal });
  } catch (e) {
    // A name already taken (a fast double navigation) or a schema the browser rejects.
    console.warn('[webmcp] could not register', tool.name, e);
    return null;
  }
  if (typeof mc.unregisterTool === 'function') {
    controller.signal.addEventListener('abort', () => {
      try {
        mc.unregisterTool!(tool.name);
      } catch {
        /* already gone */
      }
    });
  }
  return controller;
}
