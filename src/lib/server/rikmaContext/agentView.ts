/**
 * "What the agent sees" (docs/tbd/PLAN_AGENT_WORK.md, AW2 wave 3).
 *
 * The context tab shows a member exactly what an agent connected with *their*
 * key, scoped to this rikma, gets back — by running the same tools under the
 * same kind of MCP context, not by re-deriving it. If the preview and the
 * agent ever differed, the preview would be the thing lying.
 *
 * The caller has already passed the moach layout's membership check; the
 * context is that of an external key limited to this one rikma (`keyProjects`),
 * so anything the tools refuse a scoped key is refused here too.
 */

import { setMcpContext } from '$lib/server/mcpContext';
import { getRikmaContextTool } from '../../../mastra/tools/rikmaContextTool';
import { getPlaybookTool } from '../../../mastra/tools/playbookTools';

export interface AgentView {
  context: any;
  playbook: any;
}

export async function agentView(input: {
  userId: string;
  projectId: string;
  roleId: string | null;
  lang: string;
  fetch: typeof fetch;
}): Promise<AgentView> {
  setMcpContext({
    userId: String(input.userId),
    fetchInstance: input.fetch,
    keyProjects: [String(input.projectId)],
    lang: input.lang
  });
  const focus = { projectId: String(input.projectId), ...(input.roleId ? { roleId: input.roleId } : {}) };
  const failed = (what: string) => (e: unknown) => {
    console.error(`[moach/context] ${what} failed`, e);
    return { success: false };
  };
  const [context, playbook] = await Promise.all([
    (getRikmaContextTool as any).execute(focus, {}).catch(failed('getRikmaContext')),
    (getPlaybookTool as any).execute(focus, {}).catch(failed('getPlaybook'))
  ]);
  return { context, playbook };
}
