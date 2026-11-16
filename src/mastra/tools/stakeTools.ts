/**
 * "What do I own here" for an outside agent — PLAN_MCP_PARTNER_INTEGRATION P0.7.
 *
 * Every share comes from `memberShares` (src/lib/revenue/memberShares.ts) — the
 * same function the split page and the sales page's split preview run, fed
 * the same rows (qid getProjectFinancials: finished missions, received
 * resources, CONFIRMED stipend payments). Nothing is recomputed here; the tool
 * only lists, next to each member's percentage, what it is made of.
 *
 * Members only: the manifest entry is `project: 'member'`, so the guard refuses
 * any rikma the key's owner is not in before this runs. No sales or split
 * figures yet — that is P1.6, with the effective-sale rule.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getMcpContext } from '../../lib/server/mcpContext.js';
import { memberShares } from '../../lib/revenue/memberShares';

const SITE = 'https://www.1lev1.com';
const rows = (rel: any): any[] => (Array.isArray(rel?.data) ? rel.data : []);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');
const ownerOf = (node: any): string | null => {
  const id = node?.attributes?.users_permissions_user?.data?.id;
  return id != null ? String(id) : null;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Pure: the two qid payloads → each member's share and what stands behind it.
 * `peopleData` is getProjectPeopleAndRoles, `financialsData` getProjectFinancials.
 */
export function shapeStake(peopleData: any, financialsData: any, callerId: string) {
  const project = peopleData?.project?.data;
  const users = rows(project?.attributes?.user_1s);
  const fin = financialsData?.project?.data?.attributes ?? {};
  const fmiData = rows(fin.finnished_missions);
  const rikmashes = rows(fin.rikmashes);
  const stipendPayments = rows(fin.stipend_payments);

  const { net, rows: shares, others } = memberShares({ users, fmiData, rikmashes, stipendPayments });

  const members = shares.map((s) => {
    const uid = String(s.uid);
    const missions = fmiData
      .filter((f) => ownerOf(f) === uid)
      .map((f) => ({
        name: text(f.attributes?.missionName),
        hours: Number(f.attributes?.noofhours) || 0,
        hourlyRate: Number(f.attributes?.perhour) || 0,
        value: Number(f.attributes?.total) || 0
      }));
    const resources = rikmashes
      .filter((r) => ownerOf(r) === uid)
      .map((r) => ({ name: text(r.attributes?.name), value: Number(r.attributes?.total) || 0 }));
    return {
      userId: uid,
      username: s.username,
      isYou: uid === String(callerId),
      sharePercent: round2(s.p),
      value: round2(s.total),
      approvedHours: round2(missions.reduce((t, m) => t + m.hours, 0)),
      finishedMissions: missions,
      resources
    };
  });

  const you = members.find((m) => m.isYou) ?? null;
  return {
    rikmaId: project?.id ? String(project.id) : null,
    rikmaName: text(project?.attributes?.projectName),
    totalValue: round2(net),
    // Value held by people who are no longer members still counts in the total,
    // so the members' shares sum to less than 100% by exactly this much.
    formerMembersValue: round2(others),
    you: you ? { sharePercent: you.sharePercent, value: you.value, approvedHours: you.approvedHours } : null,
    members
  };
}

export const getMyStakeTool = createTool({
  id: 'getMyStake',
  description:
    "The user's share in one of their rikmas, and every member's share, exactly as the rikma's split page computes " +
    'them: value from finished missions (approved hours x rate), resources the rikma received, and confirmed ' +
    'stipend payments - with the missions and resources behind each share. Members only. Read-only; it shows no ' +
    'sales or profit-split figures.',
  inputSchema: z.object({
    projectId: z.string().min(1).describe('The rikma id (findUserProjectsTool).')
  }),
  execute: async ({ projectId }) => {
    const ctx = getMcpContext();
    if (!ctx?.userId) return { success: false, message: 'Not authenticated.' };
    try {
      const { strapiClient } = await import('../../lib/server/actions/index.js');
      const [people, financials] = await Promise.all([
        strapiClient.execute('getProjectPeopleAndRoles', { pid: String(projectId) }, undefined, ctx.fetchInstance),
        strapiClient.execute('getProjectFinancials', { pid: String(projectId) }, undefined, ctx.fetchInstance)
      ]);
      if (!people?.data?.project?.data) {
        return { success: false, message: `Rikma ${projectId} was not found.` };
      }
      const stake = shapeStake(people.data, financials?.data, ctx.userId);
      return {
        success: true,
        ...stake,
        currencyNote: "Values are in the rikma's own currency.",
        splitPageUrl: `${SITE}/moach/${projectId}/split`
      };
    } catch (error) {
      console.error('[getMyStake] failed:', error);
      return { success: false, message: 'Could not read the shares right now. Try again shortly.' };
    }
  }
});
