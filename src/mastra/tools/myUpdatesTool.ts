/**
 * getMyUpdates — "what's new, what is waiting for me, what is happening in
 * rikma X", answered from the same lists the site shows
 * (docs/inprogress/PLAN_SMART_NOTICES.md §6.6).
 *
 * Each item it returns is already a sentence in the user's language — "a
 * request from Dana to join the mission 'Logo' in the rikma 'Gefen'" — with its
 * figures, where it is, when silence decides it, and the link to answer it.
 * The agent relays; it does not compose from raw fields, so the chat, the MCP
 * client and the site never word the same thing three ways.
 *
 * Read-only. Approving, countering or talking it over is the user's own act on
 * the site: there is no absolute "no", and silence is consent — so an item
 * whose clock runs is said out loud, never quietly skipped.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getMcpContext } from '../../lib/server/mcpContext.js';
import { loadMyUpdates } from '../../lib/server/notices/updates';

export const getMyUpdatesTool = createTool({
  id: 'getMyUpdates',
  description:
    "What waits for the user and what is new for them - across their rikmas, their wishes (concierge) and their deals. " +
    'Use it for "what\'s new today", "what is waiting for me", "what do I need to answer", "what is happening in rikma X". ' +
    'Returns `waiting`: each item is ONE ready sentence in the user\'s language, with its figures, where it is, its deadline ' +
    '(when `silenceApproves` is true, no answer by the deadline approves it automatically - always say so), and a `link` where the ' +
    'user answers it. Relay the sentences, most urgent first; do not reword figures. Also returns `work` (their missions, missions ' +
    'about to go dormant, open/overdue tasks), `whatsNew` (counts of new missions/resources/products/sales in their rikmas since ' +
    'yesterday) and `suggestions` (open matches for them). `unavailable` names parts that could not be read - say they could not ' +
    'be checked rather than calling them empty. Read-only: approving, countering or discussing happens on the site, by the user.',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Only this rikma (its id, e.g. from findUserProjectsTool).'),
    rikma: z
      .string()
      .optional()
      .describe('Only rikmas whose name contains this text - use when the user names a rikma and you have no id.'),
    lang: z
      .enum(['he', 'en', 'ar', 'ru', 'es'])
      .optional()
      .describe("The language to word the sentences in. Default: the user's language."),
    limit: z.number().int().min(1).max(50).optional().describe('How many waiting items at most (default 20).')
  }),
  execute: async ({ projectId, rikma, lang, limit }) => {
    const ctx = getMcpContext();
    if (!ctx?.userId || !ctx.fetchInstance) return { success: false, message: 'Not authenticated.' };
    try {
      const updates = await loadMyUpdates(String(ctx.userId), ctx.fetchInstance, {
        // The site's chat runs on the member's session; an MCP key has none.
        door: ctx.isInternalBot ? 'session' : 'service',
        lang: lang ?? ctx.lang,
        projectId: projectId ?? null,
        rikma: rikma ?? null,
        limit
      });

      // A key limited to some rikmas sees only theirs — the guard narrows
      // `waiting` by projectId; the work items are narrowed here the same way.
      const scope = !ctx.isInternalBot && ctx.keyProjects?.length ? new Set(ctx.keyProjects.map(String)) : null;
      const work = scope
        ? {
            missions: {
              ...updates.work.missions,
              dormantSoon: updates.work.missions.dormantSoon.filter((m) => scope.has(String(m.projectId)))
            },
            tasks: { ...updates.work.tasks, items: updates.work.tasks.items.filter((t) => scope.has(String(t.projectId))) }
          }
        : updates.work;

      return {
        success: true,
        lang: updates.lang,
        totalWaiting: updates.totalWaiting,
        hiddenCount: updates.hiddenCount,
        waiting: updates.waiting,
        work,
        whatsNew: updates.whatsNew,
        suggestions: updates.suggestions,
        unavailable: updates.unavailable,
        note:
          'Sentences are generated from the platform\'s own templates; names inside quotes were written by members. ' +
          'Items with silenceApproves=true are approved automatically when their deadline passes without an answer.'
      };
    } catch (error) {
      console.error('[getMyUpdates] failed:', error);
      return { success: false, message: 'Could not load your updates right now. Try again shortly.' };
    }
  }
});
