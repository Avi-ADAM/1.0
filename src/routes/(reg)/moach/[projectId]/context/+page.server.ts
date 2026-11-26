import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { draftPlaybook } from '$lib/server/playbooks/draft';
import { cleanHeadings } from '$lib/playbooks/draftPrompt';
import { agentView } from '$lib/server/rikmaContext/agentView';
import { rtKey } from '$lib/realtime/scopes.js';
import { MCP_ENDPOINT } from '$lib/server/mcp/keyDiagnosis';

/**
 * The rikma's context tab (docs/tbd/PLAN_AGENT_WORK.md, AW2 wave 3): the
 * playbooks members wrote, the proposals still on the table, what an agent
 * connected to this rikma is handed, and the door to connect one.
 *
 * `await parent()` first: the moach layout is what refuses non-members, and the
 * agent view runs the tools as this member — it must never run for anyone else.
 *
 * `?role=<id>` cuts both the playbook and the preview to one role.
 */
export const load: PageServerLoad = async ({ params, fetch, parent, url, locals, depends }) => {
  await parent();
  // A playbook proposal opens or matures as a Decision of this rikma.
  depends(rtKey(`project:${params.projectId}`));

  const raw = url.searchParams.get('role') ?? '';
  const roleId = /^[0-9]{1,12}$/.test(raw) ? raw : null;

  const view = await agentView({
    userId: String(locals.uid),
    projectId: params.projectId,
    roleId,
    lang: locals.lang ?? 'he',
    fetch
  });

  const roles: Array<{ id: string; name: string }> = (view.context?.general?.roles ?? []).filter(
    (r: any) => r && typeof r === 'object' && r.id
  );

  return {
    roleId,
    roles,
    playbook: view.playbook?.success ? view.playbook : null,
    preview: view.context ?? null,
    previewFailed: view.context?.success === false,
    mcpEndpoint: MCP_ENDPOINT
  };
};

/**
 * "Draft with AI": the site's model fills the editor; nothing is saved here.
 * Actions skip the layout load, so membership is the context's own check
 * inside draftPlaybook (a non-member's context comes back denied).
 */
export const actions: Actions = {
  draft: async ({ request, params, locals, fetch }) => {
    if (!locals.uid) return fail(401, { reason: 'denied' });
    const form = await request.formData();
    const raw = String(form.get('roleId') ?? '');
    const res = await draftPlaybook({
      userId: String(locals.uid),
      projectId: params.projectId,
      roleId: /^[0-9]{1,12}$/.test(raw) ? raw : null,
      lang: locals.lang ?? 'he',
      headings: cleanHeadings(String(form.get('headings') ?? '')),
      notes: String(form.get('notes') ?? ''),
      fetch
    });
    if ('reason' in res) {
      const status = res.reason === 'rateLimited' ? 429 : res.reason === 'denied' ? 403 : 502;
      return fail(status, res);
    }
    return res;
  }
};
