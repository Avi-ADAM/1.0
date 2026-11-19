// src/lib/server/mcp/apps/index.ts
//
// The interactive views (MCP Apps, SEP-1865) the 1lev1 MCP server offers.
// A manifest entry names its view with `ui: <uri>`; the route registers the
// HTML here as `appResources`. See docs/inprogress/PLAN_MCP_APPS.md.
//
// A view is only an extra: every tool that has one still returns its full
// result as text, so a host without MCP Apps support loses nothing.

import { TIMER_APP_URI, timerAppHtml } from './timerApp';

export { TIMER_APP_URI } from './timerApp';

/** Every `ui://` resource a manifest entry may point at. */
export const MCP_APP_URIS: readonly string[] = [TIMER_APP_URI];

/** `MCPServer({ appResources })` for one request, in the caller's language. */
export function mcpAppResources(lang: string | undefined) {
  return {
    [TIMER_APP_URI]: {
      name: '1lev1 timer',
      description: 'Running mission timers with a live clock and a stop button.',
      html: timerAppHtml(lang),
      // Nothing outside the iframe is loaded or fetched: the view reaches 1lev1
      // only through tools/call on this server.
      meta: { csp: { connectDomains: [], resourceDomains: [] }, prefersBorder: true }
    }
  };
}

/** The tool `_meta` that links a tool to its view, or undefined. */
export function mcpUiMeta(resourceUri: string | undefined): { ui: { resourceUri: string } } | undefined {
  return resourceUri ? { ui: { resourceUri } } : undefined;
}
