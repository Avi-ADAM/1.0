/**
 * Edit a standing profit-split proposal: reconcile its transfers with a freshly
 * computed split, and pull in the sales that arrived since.
 *
 * This ran in the browser (`whowhat.svelte` → updateTosplit) as a dozen writes
 * straight through /api/send — `70updateHaluka`, `69createHaluka`,
 * `68updateTosplit`, `71updateSaleSplited` — so nothing checked that the caller
 * was a member, that the split was still open, or that the transfers belonged
 * to it, and no open screen heard about it (PLAN_REALTIME_MIGRATION B9). The
 * rules are the ones the client applied, moved here unchanged:
 *
 * - a transfer still produced by the split keeps its row; its amount follows
 *   the new figure only while it is unconfirmed (a confirmed one is a fact);
 * - a confirmed transfer the split no longer produces is kept anyway;
 * - an unconfirmed one it no longer produces is unlinked (not deleted);
 * - site-share legs (the platform's line) are reconciled the same way, but
 *   linked through `siteShareHalukas`, never the gating `halukas` set.
 *
 * `68updateTosplit` writes `sales` as a SET, so the sales already linked are
 * re-sent with the new ones, or they would silently drop off the proposal.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

export interface WantedTransfer {
  from: string;
  to: string;
  amount: number;
}

export interface ExistingTransfer {
  id: string;
  from: string;
  to: string;
  amount: number;
  confirmed: boolean;
}

export interface TransferPlan {
  /** Rows that stay linked, in order (updated ones included). */
  keep: string[];
  /** Unconfirmed rows whose amount moved by more than a cent. */
  update: Array<{ id: string; amount: number }>;
  /** Transfers no existing row covers. */
  create: WantedTransfer[];
}

/** The client's reconciliation, pure — see the header for the rules. */
export function planTransfers(existing: ExistingTransfer[], wanted: WantedTransfer[]): TransferPlan {
  const remaining = wanted.map((w) => ({ ...w, from: String(w.from), to: String(w.to) }));
  const plan: TransferPlan = { keep: [], update: [], create: [] };
  for (const ex of existing) {
    const idx = remaining.findIndex((w) => w.from === String(ex.from) && w.to === String(ex.to));
    if (idx !== -1) {
      const match = remaining[idx];
      if (!ex.confirmed && Math.abs(Number(ex.amount ?? 0) - match.amount) > 0.01) {
        plan.update.push({ id: String(ex.id), amount: match.amount });
      }
      plan.keep.push(String(ex.id));
      remaining.splice(idx, 1);
    } else if (ex.confirmed) {
      plan.keep.push(String(ex.id));
    }
  }
  plan.create = remaining;
  return plan;
}

const rows = (list: any): ExistingTransfer[] =>
  (list?.data ?? []).map((h: any) => ({
    id: String(h.id),
    from: String(h.attributes?.usersend?.data?.id ?? ''),
    to: String(h.attributes?.userrecive?.data?.id ?? ''),
    amount: Number(h.attributes?.amount ?? 0),
    confirmed: h.attributes?.confirmed === true
  }));

const validTransfers = (v: unknown) =>
  Array.isArray(v) &&
  v.every(
    (t: any) =>
      t && t.from != null && t.to != null && String(t.from) !== String(t.to) &&
      Number.isFinite(Number(t.amount)) && Number(t.amount) > 0
  );

const money = (n: unknown) => Math.round(Number(n) * 100) / 100;

const updateTosplitProposalHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { tosplitId, projectId } = params;
  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);

  const res = await run('getTosplitForUpdate', { id: String(tosplitId) });
  const tosplit = res?.data?.tosplit?.data;
  if (!tosplit) throw new Error('Split proposal not found');
  const a = tosplit.attributes ?? {};
  if (String(a.project?.data?.id) !== String(projectId)) throw new Error('The split does not belong to this rikma');
  if (a.finished === true) throw new Error('This split is already settled');

  const publishedAt = new Date().toISOString();
  const wanted = (params.transfers as WantedTransfer[]).map((t) => ({ ...t, amount: money(t.amount) }));

  // Partner transfers — the gating set.
  const partners = planTransfers(rows(a.halukas), wanted);
  for (const u of partners.update) await run('70updateHaluka', { id: u.id, amount: u.amount });
  const halukaIds = [...partners.keep];
  for (const t of partners.create) {
    const created = await run('69createHaluka', {
      data: {
        project: String(projectId), usersend: t.from, userrecive: t.to, amount: t.amount,
        matbea: '2', confirmed: false, publishedAt
      }
    });
    const id = created?.data?.createHaluka?.data?.id;
    if (id) halukaIds.push(String(id));
  }

  // Site-share legs — linked through siteShareHalukas, outside the gate.
  const ss = params.siteShare as
    | { active?: boolean; transfers?: WantedTransfer[]; reciveProject?: string; proposedAmount?: number | null; adjustDirection?: string | null; adjustReason?: string | null }
    | undefined;
  const existingPlatform = rows(a.siteShareHalukas);
  const platformHalukaIds: string[] = [];
  if (ss?.active) {
    const plan = planTransfers(existingPlatform, (ss.transfers ?? []).map((t) => ({ ...t, amount: money(t.amount) })));
    for (const u of plan.update) await run('70updateHaluka', { id: u.id, amount: u.amount });
    platformHalukaIds.push(...plan.keep);
    for (const t of plan.create) {
      const created = await run('69createHaluka', {
        data: {
          project: String(projectId), usersend: t.from, userrecive: t.to, amount: t.amount,
          matbea: '2', confirmed: false, publishedAt,
          isSiteShare: true,
          recive_project: String(ss.reciveProject ?? ''),
          proposedAmount: ss.proposedAmount ?? null,
          adjustDirection: ss.adjustDirection ?? null,
          adjustReason: ss.adjustReason || null,
          autoApproved: true
        }
      });
      const id = created?.data?.createHaluka?.data?.id;
      if (id) platformHalukaIds.push(String(id));
    }
  }

  const existingSaleIds = (a.sales?.data ?? []).map((s: any) => String(s.id));
  const saleIds = [...new Set([...existingSaleIds, ...((params.newSaleIds as unknown[]) ?? []).map(String)])];

  const updated = await run('68updateTosplit', {
    id: String(tosplitId),
    data: {
      halukas: halukaIds,
      hervachti: params.hervachti,
      sales: saleIds,
      ...(ss?.active ? { siteShareHalukas: platformHalukaIds } : {})
    }
  });
  if (updated?.errors?.length) throw new Error(`Failed to update the split: ${JSON.stringify(updated.errors)}`);

  // Every linked sale waits for this proposal's vote.
  for (const saleId of saleIds) {
    await run('71updateSaleSplited', { id: saleId, pending: true, tosplits: [String(tosplitId)] });
  }

  return {
    success: true,
    data: {
      tosplitId: String(tosplitId),
      halukaIds,
      platformHalukaIds,
      hadPlatformBefore: existingPlatform.length > 0
    }
  };
};

export const updateTosplitProposalConfig: ActionConfig = {
  key: 'updateTosplitProposal',
  description: 'Reconcile a standing profit-split proposal with a recomputed split and new sales',
  graphqlOperation: updateTosplitProposalHandler,
  paramSchema: {
    tosplitId: { type: 'string', required: true, description: 'The standing tosplit' },
    projectId: { type: 'string', required: true, description: 'Its rikma' },
    transfers: { type: 'array', required: true, validate: validTransfers, description: 'Partner transfers of the recomputed split: { from, to, amount }' },
    hervachti: {
      type: 'array',
      required: true,
      validate: (v: unknown) => Array.isArray(v) && v.length > 0,
      description: 'Who earned what — the hervachti component list'
    },
    newSaleIds: { type: 'array', required: false, description: 'Sales not yet in any split, to add to this one' },
    siteShare: {
      type: 'object',
      required: false,
      validate: (v: any) => v == null || !v.active || validTransfers(v.transfers ?? []),
      description: 'Site-share legs: { active, transfers, reciveProject, proposedAmount, adjustDirection, adjustReason }'
    }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' }, errorMessage: 'Only members of the rikma can edit its split' }
  ],
  updateStrategy: { type: 'refetchScope', config: { dataKeys: ['halukas'] } },
  realtime: {
    scopes: (p) => scopeList([scope('project', p.projectId), decisionScope('tosplit', p.tosplitId)])
  }
};
