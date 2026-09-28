// RFC 9728 §3.1 — the path-suffixed form of the same document. A client whose
// MCP URL has a path (/api/mcp) tries this one first; Claude does too
// (claude.com/docs/connectors/building/lazy-authentication). Same body.
export { GET, OPTIONS } from '../../+server';
