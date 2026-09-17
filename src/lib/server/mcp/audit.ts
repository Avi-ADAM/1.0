/**
 * MCP audit trail (PLAN_MCP_TOOLS_V2 §1.9).
 *
 * One structured line per write, AI run and refusal: who (key + user), what
 * (tool, tier, rikma, mission), how it ended and how long it took. Never the
 * parameters themselves — names, descriptions and messages are member-written
 * and do not belong in logs.
 */

export interface McpAuditEntry {
  keyId?: string;
  userId?: string;
  tool: string;
  tier: string;
  projectId?: unknown;
  missionId?: unknown;
  outcome: string;
  ms: number;
  [extra: string]: unknown;
}

const asId = (v: unknown): string | undefined =>
  v == null || v === '' ? undefined : String(v).slice(0, 32);

export function audit(entry: McpAuditEntry): void {
  const line = {
    at: new Date().toISOString(),
    ...entry,
    projectId: asId(entry.projectId),
    missionId: asId(entry.missionId)
  };
  console.info('[mcp-audit]', JSON.stringify(line));
}
