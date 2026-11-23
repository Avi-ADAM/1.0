/**
 * getRikmaContext — the rikma as a world an agent walks into
 * (docs/tbd/PLAN_AGENT_WORK.md, AW2).
 *
 * One call, one focus, and the agent knows what world the work lives in: who
 * the rikma is, what waits and what moved this week, and the slice that
 * matters for the job — a lead before a meeting, a role, a process, a task, a
 * mission, a product, or a topic. Nothing new is queried: every part is what
 * an existing tool already returns, assembled and cut by
 * `$lib/rikmaContext/buildRikmaContext`, with `more` pointing at the tool that
 * goes deeper.
 *
 * Access: the manifest guards `projectId` (member + key scope) and
 * `missionId`. The other focus ids are checked inside the assembler to belong
 * to that rikma. A lead's phone and email never leave through here.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { sendToSer } from '../../lib/send/sendToSer';
import { getMcpContext } from '../../lib/server/mcpContext.js';
import { missionsMapOf } from '../../lib/fulfillment/rows';
import { buildRikmaContext, type RikmaContextLoaders } from '../../lib/rikmaContext/buildRikmaContext';
import { getProjectDetailsTool, getProjectStatsTool } from './projectDetailsTools';
import { getMyUpdatesTool } from './myUpdatesTool';
import { listRikmaProcessesTool } from './processTools';
import { readConversationTool } from './forumTools';
import { listRikmaProductsTool, getRikmaProductTool, getShippingConfigTool } from './shopTools';
import { getTaskContextTool } from './agentTaskTools';
import { getMissionDetailsTool } from './missionTimers';
import { searchContentTool } from './conciergeTools';
import { loadPlaybooks } from '../../lib/server/playbooks/store';

const run = (tool: any, input: Record<string, unknown>) => tool.execute(input, {});

/** A part that is only supporting the focus must not turn the whole answer into a refusal. */
const soft = async (p: Promise<any>) => {
  const r = await p;
  return r?.denied ? { success: false } : r;
};

function liveLoaders(): RikmaContextLoaders {
  return {
    details: (pid) => run(getProjectDetailsTool, { projectId: pid }),
    updates: (pid) => soft(run(getMyUpdatesTool, { projectId: pid, limit: 10 })),
    stats: (pid) => soft(run(getProjectStatsTool, { projectId: pid, days: 7 })),
    missions: async (pid) => {
      const ctx = getMcpContext()!;
      const res: any = await sendToSer({ pid }, 'fulfillmentMissions', 0, 0, !ctx.isInternalBot, ctx.fetchInstance);
      const nodes = res?.data?.mesimabetahaliches?.data;
      return Array.isArray(nodes) ? [...missionsMapOf(nodes).values()] : null;
    },
    processes: (pid) => soft(run(listRikmaProcessesTool, { projectId: pid })),
    conversation: (forumId) => soft(run(readConversationTool, { forumId, limit: 8 })),
    lead: async (pid, leadId) => {
      const ctx = getMcpContext()!;
      const { loadLeadPage } = await import('../../lib/server/leads/pipelineLoad');
      const lead = await loadLeadPage(pid, leadId, ctx.fetchInstance);
      // Not found and another rikma's lead read the same.
      if (!lead) return { success: false, denied: true, message: `Lead ${leadId} is not in rikma ${pid}.` };
      return { success: true, lead, url: `https://www.1lev1.com/moach/${pid}/sales/manage/leads/${lead.id}` };
    },
    products: (pid) => soft(run(listRikmaProductsTool, { projectId: pid })),
    product: async (pid, productId) => {
      const r = await run(getRikmaProductTool, { projectId: pid, productId });
      return r?.success === false ? { success: false, denied: true, message: `Product ${productId} is not in rikma ${pid}.` } : r;
    },
    shipping: (pid) => soft(run(getShippingConfigTool, { projectId: pid })),
    task: (actId) => run(getTaskContextTool, { taskId: actId }),
    mission: (missionId) => run(getMissionDetailsTool, { missionId }),
    search: (topic) => soft(run(searchContentTool, { query: topic.slice(0, 100), limit: 10 })),
    playbooks: (pid) => {
      const ctx = getMcpContext()!;
      return loadPlaybooks((qid, vars) => sendToSer(vars, qid, 0, 0, !ctx.isInternalBot, ctx.fetchInstance), pid);
    }
  };
}

export const getRikmaContextTool = createTool({
  id: 'getRikmaContext',
  description:
    "The working context of one rikma, cut around what the user is about to do - call it before any piece of work in a " +
    'rikma, coding or not. Always returns: who the rikma is (description, values, links, members, roles, its consent ' +
    'clock), and "the world now" (what waits for the user there, what is new, how busy it is). Plus ONE focus, the ' +
    'most specific you can name: leadId (preparing a meeting with a customer: the lead, their log, what they wanted ' +
    "and today's prices - no phone/email), roleId (working in a role: who holds it, its missions), processId (a thread " +
    'the rikma is pursuing), actId (a task: same as getTaskContextTool, plus its role), missionId, productId (with ' +
    'delivery), or topic (free text, searched across the rikma). Every list is a summary; `more` names the tool and ' +
    'arguments for the full version. Members only. Read-only.',
  inputSchema: z.object({
    projectId: z.string().describe('Rikma (project) id, from findUserProjectsTool.'),
    leadId: z.string().optional().describe('A lead of this rikma, from listRikmaLeadsTool.'),
    roleId: z.string().optional().describe("A role (tafkid) id of this rikma."),
    processId: z.string().optional().describe('A process of this rikma, from listRikmaProcessesTool.'),
    actId: z.string().optional().describe('A task (act) of this rikma, from listMyTasksTool.'),
    missionId: z.string().optional().describe('A mission in progress of this rikma.'),
    productId: z.string().optional().describe('A product of this rikma, from listRikmaProductsTool.'),
    topic: z.string().max(200).optional().describe('Free text when no id fits, e.g. "refund policy" or "mobile checkout".')
  }),
  execute: async ({ projectId, ...focus }) => {
    const ctx = getMcpContext();
    if (!ctx?.userId || !ctx.fetchInstance) return { success: false, message: 'Not authenticated.' };
    try {
      return await buildRikmaContext(String(projectId), focus, liveLoaders());
    } catch (error) {
      console.error('[getRikmaContext] failed:', error);
      return { success: false, message: 'Could not assemble the rikma context right now. Try again shortly.' };
    }
  }
});
