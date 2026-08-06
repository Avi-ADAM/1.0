/**
 * Reading an archival target (PLAN_OBJECT_ARCHIVAL).
 *
 * Five collections can be archived and each has its own field names, so this
 * module is the single place that knows how to read one and flatten it into
 * the shape the proposal validator, the card and the applier all consume.
 */

import { run, type Exec } from './gql.js';

export type TargetKind =
  | 'openMission'
  | 'missionInProgress'
  | 'openResource'
  | 'resourceInProgress'
  | 'matanot';

export type Lifecycle = 'active' | 'archiveProposed' | 'archived' | 'released';

export const TARGET_KINDS: readonly TargetKind[] = [
  'openMission',
  'missionInProgress',
  'openResource',
  'resourceInProgress',
  'matanot',
];

/** GraphQL entry point + the Decision relation that points back at each kind. */
export const TARGET_META: Record<
  TargetKind,
  { query: string; mutation: string; decisionField: string; inProgress: boolean }
> = {
  openMission: {
    query: 'openMission',
    mutation: 'updateOpenMission',
    decisionField: 'archOpenMission',
    inProgress: false,
  },
  missionInProgress: {
    query: 'mesimabetahalich',
    mutation: 'updateMesimabetahalich',
    decisionField: 'archMesimabetahalich',
    inProgress: true,
  },
  openResource: {
    query: 'openMashaabim',
    mutation: 'updateOpenMashaabim',
    decisionField: 'archOpenMashaabim',
    inProgress: false,
  },
  resourceInProgress: {
    query: 'mashabetahalich',
    mutation: 'updateMashabetahalich',
    decisionField: 'archMashabetahalich',
    inProgress: true,
  },
  matanot: {
    query: 'matanot',
    mutation: 'updateMatanot',
    decisionField: 'archMatanot',
    inProgress: false,
  },
};

export interface ArchiveTarget {
  kind: TargetKind;
  id: string;
  name: string;
  lifecycle: Lifecycle | null;
  archiveEffectiveFrom: string | null;
  dormancyDays: number | null;
  /** Rikma context — null for a personal product with no rikma. */
  projectId: string | null;
  projectRestime: string | null;
  projectDormancyDays: number | null;
  memberIds: string[];
  /** Who carries the commitment: the assignee, or the product's owner. */
  ownerId: string | null;
  /** Accrued value (in-progress objects). */
  hoursAlready: number;
  perhour: number | null;
  hoursAssigned: number | null;
  finnishedMissionIds: string[];
  hasActiveTimer: boolean;
  lastActivityAt: string | null;
  /** Where a released mission goes back to, and what it was cut from. */
  openMissionId: string | null;
  missionId: string | null;
  /** Recurring commitments cannot be cut mid-cycle. */
  recurring: boolean;
  cycleEnd: string | null;
  /** Open offers that must be closed when the need disappears. */
  openOfferIds: string[];
  /** Recurring cycles opened but not yet delivered (resource settlement). */
  openCycleIds: string[];
  /** An already-running archive/edit Decision blocks a second proposal. */
  openDecisionIds: string[];
  /** Personal products stay sovereign — no rikma vote. */
  origin: string | null;
}

const PROJECT_FRAGMENT = `project { data { id attributes {
  restime dormancyDays user_1s { data { id } }
} } }`;

const QUERIES: Record<TargetKind, (id: string) => string> = {
  openMission: (id) => `{ openMission(id: ${id}) { data { id attributes {
    name lifecycle archiveEffectiveFrom dormancyDays updatedAt
    mission { data { id } }
    asks(filters: { archived: { eq: false } }) { data { id } }
    ${PROJECT_FRAGMENT}
    archive_decisions(filters: { archived: { eq: false } }) { data { id } }
  } } } }`,

  missionInProgress: (id) => `{ mesimabetahalich(id: ${id}) { data { id attributes {
    name lifecycle archiveEffectiveFrom dormancyDays updatedAt
    howmanyhoursalready hoursassinged perhour totalHoursSaved finnished
    users_permissions_user { data { id } }
    activeTimer { data { id } }
    finnished_missions { data { id } }
    mission { data { id } }
    open_missions { data { id } }
    ${PROJECT_FRAGMENT}
    archive_decisions(filters: { archived: { eq: false } }) { data { id } }
  } } } }`,

  openResource: (id) => `{ openMashaabim(id: ${id}) { data { id attributes {
    name lifecycle archiveEffectiveFrom dormancyDays updatedAt
    recurring sqadualedf
    mashaabim { data { id } }
    askms(filters: { archived: { eq: false } }) { data { id } }
    ${PROJECT_FRAGMENT}
    archive_decisions(filters: { archived: { eq: false } }) { data { id } }
  } } } }`,

  resourceInProgress: (id) => `{ mashabetahalich(id: ${id}) { data { id attributes {
    name lifecycle archiveEffectiveFrom dormancyDays updatedAt
    howmanyhoursalready hoursassigned perhour finnished
    recurring cycleSize end
    users_permissions_user { data { id } }
    mashaabim { data { id } }
    maaps(filters: { archived: { ne: true } }) { data { id attributes { quantityDelivered } } }
    ${PROJECT_FRAGMENT}
    archive_decisions(filters: { archived: { eq: false } }) { data { id } }
  } } } }`,

  matanot: (id) => `{ matanot(id: ${id}) { data { id attributes {
    name lifecycle archiveEffectiveFrom origin kindOf finnishDate updatedAt
    owner_user { data { id } }
    projectcreates { data { id attributes {
      restime dormancyDays user_1s { data { id } }
    } } }
    archive_decisions(filters: { archived: { eq: false } }) { data { id } }
  } } } }`,
};

function num(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ids(node: any): string[] {
  return (node?.data ?? []).map((d: any) => String(d.id));
}

function firstId(node: any): string | null {
  const d = node?.data;
  if (Array.isArray(d)) return d.length ? String(d[0].id) : null;
  return d?.id ? String(d.id) : null;
}

/**
 * Load one target. Returns null when it does not exist — callers turn that
 * into a user-facing error, since a missing target and an unreadable one are
 * the same thing from here.
 */
export async function fetchTarget(
  exec: Exec,
  kind: TargetKind,
  id: string,
): Promise<ArchiveTarget | null> {
  const meta = TARGET_META[kind];
  const data = await run(exec, QUERIES[kind](String(id)), `fetch:${kind}`);
  const node = data?.[meta.query]?.data;
  if (!node) return null;
  const a = node.attributes ?? {};

  // matanot hangs off projects through a many-to-many; everything else has a
  // single `project` relation.
  const projectNode =
    kind === 'matanot' ? a.projectcreates?.data?.[0] : a.project?.data;
  const pa = projectNode?.attributes ?? {};

  const openOffers = kind === 'openMission' ? a.asks : kind === 'openResource' ? a.askms : null;

  return {
    kind,
    id: String(node.id),
    name: a.name ?? '',
    lifecycle: (a.lifecycle ?? null) as Lifecycle | null,
    archiveEffectiveFrom: a.archiveEffectiveFrom ?? null,
    dormancyDays: num(a.dormancyDays),
    projectId: projectNode?.id ? String(projectNode.id) : null,
    projectRestime: pa.restime ?? null,
    projectDormancyDays: num(pa.dormancyDays),
    memberIds: (pa.user_1s?.data ?? []).map((u: any) => String(u.id)),
    ownerId: firstId(a.users_permissions_user ?? a.owner_user),
    hoursAlready: num(a.howmanyhoursalready) ?? 0,
    perhour: num(a.perhour),
    hoursAssigned: num(a.hoursassinged ?? a.hoursassigned),
    finnishedMissionIds: ids(a.finnished_missions),
    hasActiveTimer: !!a.activeTimer?.data?.id,
    lastActivityAt: a.updatedAt ?? null,
    openMissionId: firstId(a.open_missions),
    missionId: firstId(a.mission ?? a.mashaabim),
    recurring: !!a.recurring,
    cycleEnd: a.end ?? a.sqadualedf ?? a.finnishDate ?? null,
    openOfferIds: ids(openOffers),
    // A cycle with nothing delivered is one the rikma has not received; a
    // waive settlement archives exactly those.
    openCycleIds: (a.maaps?.data ?? [])
      .filter((m: any) => !(Number(m?.attributes?.quantityDelivered ?? 0) > 0))
      .map((m: any) => String(m.id)),
    openDecisionIds: ids(a.archive_decisions),
    origin: a.origin ?? null,
  };
}
