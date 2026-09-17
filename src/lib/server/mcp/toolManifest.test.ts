/**
 * The manifest is the MCP exposure list. These checks make a forgotten guard a
 * CI failure instead of a production IDOR — the reason the manifest exists.
 */
import { describe, expect, it } from 'vitest';
import { MCP_TOOL_MANIFEST, tierAllowed, MCP_WRITE_SCOPE } from './toolManifest';

const TIERS = ['read', 'prepare', 'selfWrite', 'consentWrite', 'communicate', 'sharedWrite'];

/** Top-level input field names of a tool's zod object schema. */
function inputFields(tool: any): string[] {
  const schema = tool?.inputSchema;
  const shape = typeof schema?.shape === 'function' ? schema.shape() : schema?.shape;
  return shape ? Object.keys(shape) : [];
}

describe('MCP tool manifest', () => {
  const entries = Object.entries(MCP_TOOL_MANIFEST);

  it('every entry has a tool and a known tier', () => {
    for (const [name, entry] of entries) {
      expect(entry.tool, `${name}: tool`).toBeTruthy();
      expect(TIERS, `${name}: tier`).toContain(entry.tier);
    }
  });

  it('every tool that takes a projectId says how it is guarded', () => {
    for (const [name, entry] of entries) {
      if (!inputFields(entry.tool).includes('projectId')) continue;
      expect(entry.project, `${name} takes projectId but has no project policy`).toBeDefined();
    }
  });

  it('every tool that takes a missionId says how it is guarded', () => {
    for (const [name, entry] of entries) {
      if (!inputFields(entry.tool).includes('missionId')) continue;
      expect(entry.mission, `${name} takes missionId but has no mission policy`).toBeDefined();
    }
  });

  it('every write names a rikma or mission guard', () => {
    // draftWish creates a wish on the caller's own account; posting is gated by
    // the forum's own participant rule plus forumAllowedByKey inside the tool.
    // Neither names a rikma in its input, so there is nothing for the wrapper to gate.
    const OWN_RECORD_ONLY = ['draftWishTool', 'postConversationMessageTool'];
    for (const [name, entry] of entries) {
      if (entry.tier === 'read' || entry.tier === 'prepare') continue;
      if (OWN_RECORD_ONLY.includes(name)) continue;
      expect(entry.project ?? entry.mission, `${name} writes without a project/mission guard`).toBeDefined();
    }
  });

  it('the tools that call a model are in the ai bucket', () => {
    expect(MCP_TOOL_MANIFEST.scanProjectDirectionsTool.ai).toBe(true);
    expect(MCP_TOOL_MANIFEST.planProjectWorkTool.ai).toBe(true);
  });
});

describe('tierAllowed', () => {
  it('sharedWrite needs mcp:write', () => {
    expect(tierAllowed('sharedWrite', [])).toBe(false);
    expect(tierAllowed('sharedWrite', [MCP_WRITE_SCOPE])).toBe(true);
  });

  it('communicate is on by default, off for a key that lists ops without mcp:post (D1)', () => {
    expect(tierAllowed('communicate', [])).toBe(true);
    expect(tierAllowed('communicate', ['mcp:write'])).toBe(false);
    expect(tierAllowed('communicate', ['mcp:post'])).toBe(true);
  });

  it('everything else is always on', () => {
    for (const tier of ['read', 'prepare', 'selfWrite', 'consentWrite'] as const) {
      expect(tierAllowed(tier, [])).toBe(true);
    }
  });
});
