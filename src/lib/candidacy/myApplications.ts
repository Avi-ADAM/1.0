/**
 * The caller's own open candidacies — missions they offered to take (Ask) and
 * resources they offered to bring (Askm) — shaped from qid `mcpMyApplications`.
 *
 * Pure, and shared by the two surfaces that show them: the MCP
 * `listMyApplicationsTool` and the heart's "my requests" cards (action
 * `getMyApplications`, `?focus=myapp`). A candidate who is not a member yet
 * cannot open the rikma's vote page, so every row also carries the opening's
 * own public page (`openingPath`), where they can see it and withdraw.
 */
import { voteHref } from '$lib/notices/links';

const rows = (rel: any): any[] => (Array.isArray(rel?.data) ? rel.data : []);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');
const idOf = (rel: any): string | null => (rel?.data?.id != null ? String(rel.data.id) : null);
const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export interface RoundRow {
  order: number;
  proposedBy: string | null;
  status: string | null;
  hours: number | null;
  rate: number | null;
}

export type ApplicationKind = 'mission' | 'resource';

export interface MyApplication {
  applicationId: string;
  kind: ApplicationKind;
  openingId: string | null;
  name: string;
  projectId: string | null;
  rikmaName: string;
  terms: { hours: number | null; rate: number | null };
  countered: boolean;
  lastProposedBy: string;
  rounds: number;
  signedBy: string[];
  waitingFor: string[];
  deadline: string | null;
  silenceApproves: boolean;
  createdAt: string | null;
  /** The rikma's vote page — members only. */
  votePath: string | null;
  /** The opening's public page — reachable by an outside candidate too. */
  openingPath: string | null;
}

/** The round on the table: the last one that was not withdrawn. */
export function standingRound(rounds: RoundRow[]): RoundRow | null {
  const live = rounds.filter((r) => r.status !== 'withdrawn');
  return live.length ? live.reduce((a, b) => (b.order >= a.order ? b : a)) : null;
}

function signers(vots: any[], callerId: string) {
  const list: any[] = Array.isArray(vots) ? vots.filter(Boolean) : [];
  const round = list.reduce((m, v) => Math.max(m, Number(v.order) || 0), 0);
  const ids = new Set<string>();
  for (const v of list) {
    if (v.what === true && (Number(v.order) || 0) === round) {
      const uid = idOf(v.users_permissions_user);
      if (uid && uid !== String(callerId)) ids.add(uid);
    }
  }
  return ids;
}

function shapeOne(node: any, kind: ApplicationKind, callerId: string, now: Date): MyApplication {
  const a = node?.attributes ?? {};
  const project = a.project?.data;
  const members = rows(project?.attributes?.user_1s).map((u) => ({ id: String(u.id), username: text(u.attributes?.username) }));
  const signedIds = signers(a.vots, callerId);

  const target = kind === 'mission' ? a.open_mission?.data : a.open_mashaabim?.data;
  const t = target?.attributes ?? {};
  const rounds: RoundRow[] = rows(kind === 'mission' ? a.negopendmissions : a.nego_mashes).map((r) => {
    const ra = r.attributes ?? {};
    return {
      order: Number(ra.ordern) || 0,
      proposedBy: ra.proposedBy ?? null,
      status: ra.status ?? null,
      hours: num(kind === 'mission' ? ra.noofhours : ra.hm),
      rate: num(kind === 'mission' ? ra.perhour : ra.price)
    };
  });
  const standing = standingRound(rounds);
  const original = { hours: num(kind === 'mission' ? t.noofhours : t.hm), rate: num(kind === 'mission' ? t.perhour : t.price) };

  const tg = a.timegrama?.data?.attributes;
  const deadline = tg?.date && tg.done !== true ? String(tg.date) : null;
  const projectId = project?.id ? String(project.id) : null;
  const voteKind = kind === 'mission' ? 'ask' : 'askm';
  const openingId = target?.id ? String(target.id) : null;

  return {
    applicationId: String(node.id),
    kind,
    openingId,
    name: text(t.name),
    projectId,
    rikmaName: text(project?.attributes?.projectName),
    // A counter-proposal replaces the original: the terms on the table are the
    // last round's, not the opening's.
    terms: standing ? { hours: standing.hours, rate: standing.rate } : original,
    countered: !!standing && standing.order > 0,
    lastProposedBy: standing?.proposedBy ?? 'candidate',
    rounds: rounds.length,
    signedBy: members.filter((m) => signedIds.has(m.id)).map((m) => m.username),
    waitingFor: members.filter((m) => m.id !== String(callerId) && !signedIds.has(m.id)).map((m) => m.username),
    deadline,
    silenceApproves: !!deadline && new Date(deadline).getTime() > now.getTime(),
    createdAt: a.createdAt ? String(a.createdAt) : null,
    votePath: projectId ? voteHref(projectId, voteKind, String(node.id)) : null,
    openingPath: openingId
      ? kind === 'mission'
        ? `/availableMission/${openingId}`
        : `/availiableResorce/${openingId}`
      : null
  };
}

/**
 * qid `mcpMyApplications` → the caller's open candidacies, newest first. A
 * lapsed Ask (its clock ran out unanswered) is not open any more: it is the
 * rikma's to revive, and the caller cannot withdraw it.
 */
export function shapeApplications(data: any, callerId: string, now: Date = new Date()): MyApplication[] {
  return [
    ...rows(data?.asks)
      .filter((n) => !n?.attributes?.lapsedAt)
      .map((n) => shapeOne(n, 'mission', callerId, now)),
    ...rows(data?.askms).map((n) => shapeOne(n, 'resource', callerId, now))
  ].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
}
