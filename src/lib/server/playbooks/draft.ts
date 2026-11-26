/**
 * "Draft with AI" — the site's model writes a playbook draft for a member's
 * editor (docs/tbd/PLAN_AGENT_WORK.md, AW2 wave 3).
 *
 * Reads the rikma through the same agentView the context tab shows — so the
 * model knows exactly what a connected agent would know, and a non-member
 * gets a refusal from the context itself. Writes nothing: the draft goes back
 * to the editor, and only the member's own send opens a proposal.
 *
 * Every call is a paid model run, so it rides the `ai` bucket (10 an hour).
 */

import { Agent } from '@mastra/core/agent';
import { createModelChain } from '../../../mastra/lib/createModel';
import { consume } from '$lib/server/mcp/rateLimit';
import { agentView } from '$lib/server/rikmaContext/agentView';
import { cleanDraft, draftPrompt } from '$lib/playbooks/draftPrompt';

export type DraftResult =
  | { ok: true; draft: string }
  | { ok: false; reason: 'rateLimited'; retryAfterSeconds: number }
  | { ok: false; reason: 'denied' | 'empty' | 'failed' };

export interface DraftDeps {
  view: typeof agentView;
  generate: (prompt: string) => Promise<string>;
  limit: (identity: string) => { ok: boolean; retryAfterSeconds?: number };
}

const liveDeps: DraftDeps = {
  view: agentView,
  limit: (identity) => consume(identity, 'ai'),
  generate: async (prompt) => {
    const agent = new Agent({
      id: 'PlaybookDrafter',
      name: 'PlaybookDrafter',
      instructions:
        'You draft rikma playbooks from the data you are given. You never invent rules; what the data does not say ' +
        'becomes a question to the member. Return only the playbook text.',
      model: createModelChain()
    });
    const res = await agent.generate([{ role: 'user', content: prompt }]);
    return res.text ?? '';
  }
};

export async function draftPlaybook(
  input: {
    userId: string;
    projectId: string;
    roleId: string | null;
    lang: string;
    headings: string[];
    notes: string;
    fetch: typeof fetch;
  },
  deps: DraftDeps = liveDeps
): Promise<DraftResult> {
  const limit = deps.limit(`playbookDraft:${input.userId}`);
  if (!limit.ok) return { ok: false, reason: 'rateLimited', retryAfterSeconds: limit.retryAfterSeconds ?? 60 };

  const view = await deps.view({
    userId: input.userId,
    projectId: input.projectId,
    roleId: input.roleId,
    lang: input.lang,
    fetch: input.fetch
  });
  const context = view.context;
  if (!context || context.success === false) return { ok: false, reason: 'denied' };

  const roleName = input.roleId
    ? ((context.general?.roles ?? []).find((r: any) => r && String(r.id) === input.roleId)?.name ?? null)
    : null;

  try {
    const draft = cleanDraft(
      await deps.generate(
        draftPrompt({ lang: input.lang, roleName, headings: input.headings, notes: input.notes, context })
      )
    );
    return draft ? { ok: true, draft } : { ok: false, reason: 'empty' };
  } catch (e) {
    console.error('[playbookDraft] model failed', e);
    return { ok: false, reason: 'failed' };
  }
}
