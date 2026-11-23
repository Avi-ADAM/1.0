/**
 * Rikma playbooks — the written layer of the rikma context
 * (docs/tbd/PLAN_AGENT_WORK.md, AW2).
 *
 * Most of what an agent needs is derived from the data and never written down.
 * A playbook holds what the data cannot say: how things are done here, why,
 * and what is not done. One rikma-wide playbook (no role) plus at most one per
 * role. Every agent of every member trusts it, so it changes only by consent:
 * a `kind: playbook` Decision that matures on everyone's yes or on restime
 * silence — or directly in a rikma of one.
 *
 * Pure: shapes rows from the qids in qidsPlaybooks.js, and decides which
 * playbook a focus reads.
 */

/** Longest playbook body accepted; a playbook is read whole, so it stays readable. */
export const PLAYBOOK_MAX = 20_000;
/** What the rikma context carries of one playbook before pointing at getPlaybookTool. */
export const PLAYBOOK_EXCERPT = 4_000;

export interface Playbook {
  docId: string;
  projectId: string | null;
  /** null = the rikma-wide playbook. */
  roleId: string | null;
  roleName: string | null;
  title: string;
  body: string;
  updatedAt: string | null;
  by: string | null;
}

export interface PlaybookProposal {
  decisionId: string;
  docId: string | null;
  roleId: string | null;
  roleName: string | null;
  title: string;
  body: string;
  createdAt: string | null;
  deadline: string | null;
  timegramaId: string | null;
  proposerId: string | null;
  yes: string[];
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const idOf = (rel: any): string | null => (rel?.data?.id != null ? String(rel.data.id) : null);

export function playbookOf(node: any): Playbook | null {
  const a = node?.attributes;
  if (!a || node?.id == null || a.kind !== 'playbook' || a.archived === true) return null;
  return {
    docId: String(node.id),
    projectId: idOf(a.project),
    roleId: idOf(a.tafkidim),
    roleName: str(a.tafkidim?.data?.attributes?.roleDescription) || null,
    title: str(a.name),
    body: str(a.body),
    updatedAt: a.updatedAt ?? null,
    by: str(a.uploadedBy?.data?.attributes?.username) || null
  };
}

export function playbooksOf(nodes: unknown): Playbook[] {
  return (Array.isArray(nodes) ? nodes : []).map(playbookOf).filter((p): p is Playbook => !!p);
}

export function proposalOf(node: any): PlaybookProposal | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const vots: any[] = Array.isArray(a.vots) ? a.vots : [];
  const yes = vots.filter((v) => v?.what === true).map((v) => idOf(v.users_permissions_user)).filter((x): x is string => !!x);
  const clock = a.timegrama?.data?.attributes;
  return {
    decisionId: String(node.id),
    docId: idOf(a.playbookDoc),
    roleId: idOf(a.playbookRole),
    roleName: str(a.playbookRole?.data?.attributes?.roleDescription) || null,
    title: str(a.decisionName),
    body: str(a.newPlaybook),
    createdAt: a.createdAt ?? null,
    deadline: clock && clock.done !== true ? (clock.date ?? null) : null,
    timegramaId: idOf(a.timegrama),
    // The proposer is the first yes on the Decision (they sign by proposing).
    proposerId: yes[0] ?? null,
    yes
  };
}

export function proposalsOf(nodes: unknown): PlaybookProposal[] {
  return (Array.isArray(nodes) ? nodes : []).map(proposalOf).filter((p): p is PlaybookProposal => !!p);
}

/** The rikma-wide playbook and the one for a role. The newest wins if a rikma somehow has two. */
export function pickPlaybooks(list: Playbook[], roleId?: string | null): { general: Playbook | null; role: Playbook | null } {
  const newest = (xs: Playbook[]) =>
    [...xs].sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))[0] ?? null;
  return {
    general: newest(list.filter((p) => p.roleId == null)),
    role: roleId ? newest(list.filter((p) => p.roleId === String(roleId))) : null
  };
}

/** Same slot = same playbook: a doc id, or (for a new one) the same role / the rikma-wide slot. */
export function sameSlot(p: PlaybookProposal, slot: { docId: string | null; roleId: string | null }): boolean {
  if (slot.docId && p.docId) return slot.docId === p.docId;
  if (slot.docId || p.docId) return false;
  return (p.roleId ?? null) === (slot.roleId ?? null);
}

/** Normalises a proposed body: plain text, line endings unified, trimmed. */
export function cleanBody(raw: unknown): string {
  return str(raw).replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
}

export function bodyProblem(body: string): 'empty' | 'tooLong' | null {
  if (!body) return 'empty';
  if (body.length > PLAYBOOK_MAX) return 'tooLong';
  return null;
}

/** A playbook as the rikma context carries it: whole when short, an excerpt otherwise. */
export function excerptOf(p: Playbook | null) {
  if (!p) return null;
  const cut = p.body.length > PLAYBOOK_EXCERPT;
  return {
    docId: p.docId,
    roleId: p.roleId,
    updatedAt: p.updatedAt,
    truncated: cut,
    memberWritten: {
      title: p.title,
      roleName: p.roleName ?? '',
      body: cut ? p.body.slice(0, PLAYBOOK_EXCERPT) : p.body
    }
  };
}

/**
 * The sections a first playbook usually needs, with the facts the rikma
 * already holds, so whoever writes it starts from the data instead of a blank
 * page. The words are the writer's — in the rikma's language.
 */
export function playbookOutline(input: {
  roleName?: string | null;
  restimeLabel?: string | null;
  values?: string[];
  roles?: string[];
  products?: Array<{ name: string; price: number | null }>;
  shippingConfigured?: boolean | null;
}) {
  const facts = (xs: Array<string | null | false | undefined>) => xs.filter((x): x is string => !!x);
  const products = (input.products ?? []).slice(0, 8).map((p) => (p.price != null ? `${p.name}: ${p.price}` : p.name));
  const common = [
    { heading: 'What the rikma does and why', facts: facts([input.values?.length ? `values: ${input.values.join(', ')}` : null]) },
    { heading: 'Who to turn to for what', facts: facts([input.roles?.length ? `roles: ${input.roles.join(', ')}` : null]) },
    {
      heading: 'How decisions are made here',
      facts: facts([input.restimeLabel ? `consent clock (restime): ${input.restimeLabel} - silence approves when it runs out` : null])
    },
    { heading: 'Hours and money', facts: ['time goes on the timer of a running mission; what costs money is brought as a resource'] },
    { heading: 'What we do not do', facts: [] as string[] }
  ];
  if (!input.roleName) return common;
  return [
    { heading: `How ${input.roleName} works here`, facts: [] as string[] },
    { heading: 'What may be promised without a vote, and what needs one', facts: facts([products.length ? `products: ${products.join('; ')}` : null]) },
    {
      heading: 'Tools, channels and where things live',
      facts: facts([input.shippingConfigured != null ? `delivery set up: ${input.shippingConfigured ? 'yes' : 'no'}` : null])
    },
    { heading: 'Examples of good work', facts: [] as string[] },
    { heading: 'What not to touch', facts: [] as string[] }
  ];
}
