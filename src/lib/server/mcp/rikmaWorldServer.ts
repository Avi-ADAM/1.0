/**
 * The MCP prompt and resources of a rikma (docs/tbd/PLAN_AGENT_WORK.md, AW2
 * wave 3) — the server half of `rikmaWorld.ts`.
 *
 * Nothing here reads Strapi: every answer comes from the same *wrapped* tools a
 * call would meet (`getRikmaContextTool`, `getPlaybookTool`,
 * `findUserProjectsTool`), so key scope, membership, rate limits and audit are
 * the guard's, not a second copy of it. Offered only to a caller whose key
 * reaches those tools at all.
 */

import {
  parseRikmaUri,
  rikmaPromptDefinition,
  rikmaResources,
  workPromptArgs,
  workPromptProblemText,
  workPromptText,
  RIKMA_PROMPT
} from './rikmaWorld';

type Tool = { execute: (input: any, context: any) => Promise<any> };
export type WorldTools = {
  getRikmaContextTool?: Tool;
  getPlaybookTool?: Tool;
  findUserProjectsTool?: Tool;
};

const text = (t: string) => [{ role: 'user' as const, content: { type: 'text' as const, text: t } }];
const asJson = (v: unknown) => ({ text: JSON.stringify(v ?? null, null, 2) });

/** Whether the caller can be given the prompt and resources: both read tools must be theirs. */
export const worldAvailable = (tools: WorldTools) => !!(tools.getRikmaContextTool && tools.getPlaybookTool);

export function rikmaPrompts(tools: WorldTools) {
  return {
    listPrompts: async () => [rikmaPromptDefinition],
    getPromptMessages: async ({ name, args }: { name: string; args?: any }) => {
      if (name !== RIKMA_PROMPT) throw new Error(`Unknown prompt: ${name}`);
      const parsed = workPromptArgs(args);
      if ('problem' in parsed) return text(workPromptProblemText(parsed.problem));
      try {
        const context = await tools.getRikmaContextTool!.execute(
          { projectId: parsed.projectId, ...(parsed.roleId ? { roleId: parsed.roleId } : {}) },
          {}
        );
        if (context?.denied || context?.success === false) {
          return text(workPromptProblemText('denied', context?.message));
        }
        return text(workPromptText({ ...parsed, context }));
      } catch (e) {
        console.error('[MCP] work-in-rikma prompt failed:', e);
        return text(workPromptProblemText('failed'));
      }
    }
  };
}

export function rikmaResourceHandlers(tools: WorldTools) {
  return {
    listResources: async () => {
      try {
        const res = await tools.findUserProjectsTool?.execute({ limit: 25 }, {});
        const projects = (Array.isArray(res?.projects) ? res.projects : [])
          .map((p: any) => ({ id: String(p.id ?? ''), name: p.name ?? p.projectName ?? null }))
          .filter((p: { id: string }) => /^[0-9]+$/.test(p.id));
        return rikmaResources(projects);
      } catch (e) {
        console.error('[MCP] rikma resources listing failed:', e);
        return [];
      }
    },
    getResourceContent: async ({ uri }: { uri: string }) => {
      const r = parseRikmaUri(uri);
      if (!r) throw new Error(`Unknown resource: ${uri}`);
      if (r.kind === 'context') {
        return asJson(await tools.getRikmaContextTool!.execute({ projectId: r.projectId }, {}));
      }
      return asJson(await tools.getPlaybookTool!.execute({ projectId: r.projectId }, {}));
    }
  };
}
