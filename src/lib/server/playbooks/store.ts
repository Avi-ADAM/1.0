/**
 * Reading and writing rikma playbooks (docs/tbd/PLAN_AGENT_WORK.md, AW2).
 *
 * `applyPlaybookDecision` is the one applier: the last yes (voteOnDecision)
 * and restime silence (/api/timegrama/decision) both end here, so the two
 * routes cannot write different things. It re-checks everything — the
 * playbook may have been archived, or moved, while the clock ran.
 *
 * Runs on the service token (`Run` = qid → result): the qids are serviceAdmin,
 * and the caller has already checked membership.
 */

import { playbooksOf, proposalsOf, playbookOf, type Playbook, type PlaybookProposal } from '$lib/playbooks/playbook';

export type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

export async function loadPlaybooks(run: Run, projectId: string): Promise<Playbook[]> {
  const res = await run('playbooksOfProject', { pid: String(projectId) });
  if (res?.errors?.length) throw new Error(`playbooksOfProject: ${JSON.stringify(res.errors).slice(0, 300)}`);
  return playbooksOf(res?.data?.spaceDocs?.data).filter((p) => p.projectId === String(projectId));
}

export async function loadOpenProposals(run: Run, projectId: string): Promise<PlaybookProposal[]> {
  const res = await run('playbookOpenDecisions', { pid: String(projectId) });
  if (res?.errors?.length) throw new Error(`playbookOpenDecisions: ${JSON.stringify(res.errors).slice(0, 300)}`);
  return proposalsOf(res?.data?.decisions?.data);
}

/** Writes a playbook: the existing doc's body, or a new doc for the slot. Returns its id. */
export async function writePlaybook(
  run: Run,
  w: { projectId: string; docId: string | null; roleId: string | null; title: string; body: string; byUserId: string | null }
): Promise<string> {
  if (w.docId) {
    const res = await run('playbookUpdate', { id: w.docId, data: { body: w.body, ...(w.title ? { name: w.title } : {}) } });
    if (!res?.data?.updateSpaceDoc?.data?.id) throw new Error(`playbookUpdate failed: ${JSON.stringify(res?.errors ?? 'no answer')}`);
    return w.docId;
  }
  const res = await run('playbookCreate', {
    data: {
      project: w.projectId,
      kind: 'playbook',
      name: w.title || 'Playbook',
      body: w.body,
      ...(w.roleId ? { tafkidim: w.roleId } : {}),
      ...(w.byUserId ? { uploadedBy: w.byUserId } : {}),
      archived: false
    }
  });
  const id = res?.data?.createSpaceDoc?.data?.id;
  if (!id) throw new Error(`playbookCreate failed: ${JSON.stringify(res?.errors ?? 'no answer')}`);
  return String(id);
}

export type ApplyOutcome =
  | { applied: true; docId: string; projectId: string; roleId: string | null }
  | { applied: false; reason: 'notFound' | 'notPlaybook' | 'otherRikma' | 'empty' | 'docGone' };

/**
 * Applies a matured playbook proposal. Does not archive the Decision or close
 * its clock — each route does that the way it does for every kind.
 */
export async function applyPlaybookDecision(run: Run, decisionId: string, projectId: string): Promise<ApplyOutcome> {
  const res = await run('playbookDecision', { id: String(decisionId) });
  const node = res?.data?.decision?.data;
  const a = node?.attributes;
  if (!a) return { applied: false, reason: 'notFound' };
  if (a.kind !== 'playbook') return { applied: false, reason: 'notPlaybook' };
  const onRikma = (a.projects?.data ?? []).some((p: any) => String(p.id) === String(projectId));
  if (!onRikma) return { applied: false, reason: 'otherRikma' };
  const body = String(a.newPlaybook ?? '');
  if (!body.trim()) return { applied: false, reason: 'empty' };

  const docNode = a.playbookDoc?.data;
  let docId: string | null = null;
  if (docNode) {
    const doc = playbookOf(docNode);
    // Archived, or no longer this rikma's: never write into it. The members propose again.
    if (!doc || doc.projectId !== String(projectId)) return { applied: false, reason: 'docGone' };
    docId = doc.docId;
  }
  const roleId = a.playbookRole?.data?.id != null ? String(a.playbookRole.data.id) : null;
  if (!docId) {
    // A new playbook for a slot that got one meanwhile writes into it, never a second one beside it.
    const existing = (await loadPlaybooks(run, String(projectId))).find((p) => (p.roleId ?? null) === roleId);
    if (existing) docId = existing.docId;
  }
  const proposer = (a.vots ?? []).find((v: any) => v?.what === true)?.users_permissions_user?.data?.id;

  const written = await writePlaybook(run, {
    projectId: String(projectId),
    docId,
    roleId,
    title: String(a.decisionName ?? ''),
    body,
    byUserId: proposer != null ? String(proposer) : null
  });
  return { applied: true, docId: written, projectId: String(projectId), roleId };
}
