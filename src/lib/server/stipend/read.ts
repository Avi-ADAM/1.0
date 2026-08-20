/**
 * Reading the stipend world back out of Strapi (docs/PLAN_STIPEND.md).
 *
 * Everything here speaks the injected `Exec` from the archival module, so the
 * same code runs from an action (caller's JWT) and from the timegrama cron
 * (service account) — the two routes must never be able to mature a proposal
 * differently.
 */

import { gqlStr, run, type Exec } from '$lib/server/archive/gql.js';
import type {
  StipendMode,
  StipendPolicy,
  StipendRecourse,
  StipendScope,
  StipendTerms
} from '$lib/stipend/types.js';

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * One mission a stipend can be about.
 *
 * The mission is not decoration on a stipend — it is its **meter**. Each cycle
 * pays `hours approved on this mission that month × the stipend rate`, so a
 * stipend with no mission has no way to compute what is owed. Every stipend
 * therefore names one (PLAN_STIPEND §6).
 *
 * The *performer* is a different question and a softer one: an open mission
 * has nobody on it yet. Then the stipend rides on the mission itself and the
 * person who takes it signs the pledge (see ./fromMission.ts) — which is why
 * `userId` is nullable while the mission never is.
 */
export interface StipendMissionRow {
  /** `inProgress` = a mesimabetahalich with someone on it; `open` = nobody yet. */
  kind: 'inProgress' | 'open';
  id: string;
  name: string;
  descrip: string | null;
  /** The market rate — the ceiling a stipend rate may never exceed. */
  perhour: number | null;
  hours: number | null;
  hoursDone: number | null;
  recurring: boolean;
  /** Who is doing it, when anyone is — the recipient of a stipend for it. */
  userId: string | null;
  username: string | null;
  /** An open mission that already advertises a stipend need. */
  stipendRate: number | null;
}

/**
 * Every mission in the rikma a stipend could be attached to: the ones in
 * progress (someone is on them) and the ones still open (nobody is). Finished,
 * for-approval and archived rows are left out — a stipend pays for work that is
 * still ahead. `isStipend`-style filtering is not needed here: a stipend engine
 * is a *resource*, not a mission.
 */
export async function fetchProjectStipendMissions(
  exec: Exec,
  projectId: string
): Promise<StipendMissionRow[]> {
  const data = await run(
    exec,
    `{
      mesimabetahaliches(filters: {
        project: { id: { eq: ${gqlStr(projectId)} } },
        finnished: { ne: true },
        forappruval: { ne: true },
        or: [{ lifecycle: { null: true } }, { lifecycle: { ne: "archived" } }]
      }, pagination: { limit: 200 }, sort: "createdAt:desc") {
        data { id attributes {
          name descrip perhour hoursassinged howmanyhoursalready iskvua
          users_permissions_user { data { id attributes { username } } }
        } }
      }
      openMissions(filters: {
        project: { id: { eq: ${gqlStr(projectId)} } },
        archived: { eq: false },
        or: [{ lifecycle: { null: true } }, { lifecycle: { ne: "archived" } }]
      }, pagination: { limit: 200 }, sort: "createdAt:desc") {
        data { id attributes { name descrip perhour noofhours iskvua stipendRate } }
      }
    }`,
    'projectStipendMissions'
  );

  const inProgress = (data?.mesimabetahaliches?.data ?? []).map((row: any): StipendMissionRow => {
    const a = row.attributes ?? {};
    const user = a.users_permissions_user?.data;
    return {
      kind: 'inProgress',
      id: String(row.id),
      name: String(a.name ?? ''),
      descrip: a.descrip ?? null,
      perhour: num(a.perhour),
      hours: num(a.hoursassinged),
      hoursDone: num(a.howmanyhoursalready),
      recurring: a.iskvua === true,
      userId: user?.id ? String(user.id) : null,
      username: user?.attributes?.username ?? null,
      stipendRate: null
    };
  });

  const open = (data?.openMissions?.data ?? []).map((row: any): StipendMissionRow => {
    const a = row.attributes ?? {};
    return {
      kind: 'open',
      id: String(row.id),
      name: String(a.name ?? ''),
      descrip: a.descrip ?? null,
      perhour: num(a.perhour),
      hours: num(a.noofhours),
      hoursDone: null,
      recurring: a.iskvua === true,
      userId: null,
      username: null,
      stipendRate: num(a.stipendRate)
    };
  });

  return [...inProgress, ...open];
}

export interface StipendProjectContext {
  projectId: string;
  projectName: string;
  restime: string | null;
  policy: StipendPolicy | null;
  defaultCostShare: number | null;
  defaultRate: number | null;
  memberIds: string[];
  members: Array<{ id: string; username: string }>;
}

/** The rikma's stipend settings + its member list (for scope and quorum). */
export async function fetchProjectContext(
  exec: Exec,
  projectId: string
): Promise<StipendProjectContext | null> {
  const data = await run(
    exec,
    `{ project(id: ${gqlStr(projectId)}) { data { id attributes {
      projectName restime stipendPolicy stipendDefaultCostShare stipendDefaultRate
      user_1s { data { id attributes { username } } }
    } } } }`,
    'project'
  );
  const p = data?.project?.data;
  if (!p) return null;
  const a = p.attributes ?? {};
  const members = (a.user_1s?.data ?? []).map((u: any) => ({
    id: String(u.id),
    username: String(u.attributes?.username ?? '')
  }));
  return {
    projectId: String(p.id),
    projectName: String(a.projectName ?? ''),
    restime: a.restime ?? null,
    policy: (a.stipendPolicy ?? null) as StipendPolicy | null,
    defaultCostShare: num(a.stipendDefaultCostShare),
    defaultRate: num(a.stipendDefaultRate),
    memberIds: members.map((m: { id: string }) => m.id),
    members
  };
}

export interface StipendProgramRow {
  id: string;
  projectId: string | null;
  funderId: string | null;
  name: string;
  mode: StipendMode;
  costShare: number;
  equityMultiplier: number;
  stipendRate: number;
  totalCap: number | null;
  monthlyCap: number | null;
  spent: number;
  status: string;
  seekingFunder: boolean;
  remainingCap: number | null;
}

const PROGRAM_FIELDS = `
  name mode costShare equityMultiplier stipendRate totalCap monthlyCap spent status
  seekingFunder
  project { data { id } }
  funder { data { id } }`;

function toProgram(row: any): StipendProgramRow | null {
  if (!row?.id) return null;
  const a = row.attributes ?? {};
  const totalCap = num(a.totalCap);
  const spent = num(a.spent) ?? 0;
  return {
    id: String(row.id),
    projectId: a.project?.data?.id ? String(a.project.data.id) : null,
    funderId: a.funder?.data?.id ? String(a.funder.data.id) : null,
    name: String(a.name ?? ''),
    mode: (a.mode ?? 'equity') as StipendMode,
    costShare: num(a.costShare) ?? 1,
    equityMultiplier: num(a.equityMultiplier) ?? 1,
    stipendRate: num(a.stipendRate) ?? 0,
    totalCap,
    monthlyCap: num(a.monthlyCap),
    spent,
    status: String(a.status ?? 'proposed'),
    seekingFunder: a.seekingFunder === true,
    remainingCap: totalCap == null ? null : Math.max(0, totalCap - spent)
  };
}

export async function fetchProgram(exec: Exec, programId: string): Promise<StipendProgramRow | null> {
  const data = await run(
    exec,
    `{ stipendProgram(id: ${gqlStr(programId)}) { data { id attributes { ${PROGRAM_FIELDS} } } } }`,
    'program'
  );
  return toProgram(data?.stipendProgram?.data);
}

/** Active programs of a rikma — the envelopes a new pledge may sit inside. */
export async function fetchActivePrograms(
  exec: Exec,
  projectId: string
): Promise<StipendProgramRow[]> {
  const data = await run(
    exec,
    `{ stipendPrograms(filters: { project: { id: { eq: ${gqlStr(projectId)} } }, status: { in: ["proposed","active"] } }, pagination: { limit: 50 }) {
      data { id attributes { ${PROGRAM_FIELDS} } } } }`,
    'programs'
  );
  return (data?.stipendPrograms?.data ?? []).map(toProgram).filter(Boolean) as StipendProgramRow[];
}

export interface StipendPledgeRow {
  id: string;
  projectId: string | null;
  programId: string | null;
  funderId: string | null;
  funderName: string;
  recipientId: string | null;
  recipientName: string;
  terms: StipendTerms;
  status: string;
  paidTotal: number;
  lastSettledAt: string | null;
  mashabetahalichId: string | null;
  /** Missions in progress — what a cycle meters approved hours against. */
  missionIds: string[];
  /**
   * Open missions the stipend is attached to but nobody has taken yet. They
   * carry no approved hours, so they never meter a payment — they are what
   * `carryStipendToMission` looks the pledge up by when the work is taken.
   */
  openMissionIds: string[];
  matbeaId: string | null;
  decisionId: string | null;
}

const PLEDGE_FIELDS = `
  mode costShare equityMultiplier stipendRate monthlyCap totalCap paidTotal
  noticeCycles revenueTrigger recourse scope status descrip start end cycleSize
  lastSettledAt
  project { data { id } }
  stipend_program { data { id } }
  funder { data { id attributes { username } } }
  recipient { data { id attributes { username } } }
  mashabetahalich { data { id } }
  mesimabetahaliches { data { id } }
  open_missions { data { id attributes { name } } }
  matbea { data { id } }
  decision { data { id } }`;

export function toPledge(row: any): StipendPledgeRow | null {
  if (!row?.id) return null;
  const a = row.attributes ?? {};
  return {
    id: String(row.id),
    projectId: a.project?.data?.id ? String(a.project.data.id) : null,
    programId: a.stipend_program?.data?.id ? String(a.stipend_program.data.id) : null,
    funderId: a.funder?.data?.id ? String(a.funder.data.id) : null,
    funderName: String(a.funder?.data?.attributes?.username ?? ''),
    recipientId: a.recipient?.data?.id ? String(a.recipient.data.id) : null,
    recipientName: String(a.recipient?.data?.attributes?.username ?? ''),
    terms: {
      mode: (a.mode ?? 'equity') as StipendMode,
      costShare: num(a.costShare) ?? 1,
      equityMultiplier: num(a.equityMultiplier) ?? 1,
      stipendRate: num(a.stipendRate) ?? 0,
      monthlyCap: num(a.monthlyCap),
      totalCap: num(a.totalCap),
      noticeCycles: num(a.noticeCycles) ?? 1,
      revenueTrigger: num(a.revenueTrigger),
      recourse: (a.recourse ?? 'nonRecourse') as StipendRecourse,
      scope: (a.scope ?? 'allMissions') as StipendScope,
      start: a.start ?? null,
      end: a.end ?? null,
      cycleSize: num(a.cycleSize) ?? 1
    },
    status: String(a.status ?? 'proposed'),
    paidTotal: num(a.paidTotal) ?? 0,
    lastSettledAt: a.lastSettledAt ?? null,
    mashabetahalichId: a.mashabetahalich?.data?.id ? String(a.mashabetahalich.data.id) : null,
    missionIds: (a.mesimabetahaliches?.data ?? []).map((m: any) => String(m.id)),
    openMissionIds: (a.open_missions?.data ?? []).map((m: any) => String(m.id)),
    matbeaId: a.matbea?.data?.id ? String(a.matbea.data.id) : null,
    decisionId: a.decision?.data?.id ? String(a.decision.data.id) : null
  };
}

export async function fetchPledge(exec: Exec, pledgeId: string): Promise<StipendPledgeRow | null> {
  const data = await run(
    exec,
    `{ stipendPledge(id: ${gqlStr(pledgeId)}) { data { id attributes { ${PLEDGE_FIELDS} } } } }`,
    'pledge'
  );
  return toPledge(data?.stipendPledge?.data);
}

/** Every pledge of a rikma — the moach tab and the settlement sweep read this. */
export async function fetchProjectPledges(
  exec: Exec,
  projectId: string,
  statuses: string[] = ['proposed', 'active']
): Promise<StipendPledgeRow[]> {
  const list = statuses.map((s) => gqlStr(s)).join(', ');
  const data = await run(
    exec,
    `{ stipendPledges(filters: { project: { id: { eq: ${gqlStr(projectId)} } }, status: { in: [${list}] } }, pagination: { limit: 100 }) {
      data { id attributes { ${PLEDGE_FIELDS} } } } }`,
    'pledges'
  );
  return (data?.stipendPledges?.data ?? []).map(toPledge).filter(Boolean) as StipendPledgeRow[];
}

export interface ApprovedHoursRow {
  hours: number;
  approvedAt: string;
  perhour: number | null;
  mesimabetahalichId: string | null;
  total: number;
}

/**
 * Hours the rikma has **approved** for one member — the only hours a stipend
 * may ever be paid against (§6). A `finnished-mission` row exists once the
 * approval closed, which is exactly the event we want; `month`/`createdAt` is
 * when it landed.
 */
export async function fetchApprovedHours(
  exec: Exec,
  projectId: string,
  recipientId: string,
  since?: string | null
): Promise<ApprovedHoursRow[]> {
  const sinceFilter = since ? `, createdAt: { gte: ${gqlStr(since)} }` : '';
  const data = await run(
    exec,
    `{ finnishedMissions(filters: {
        project: { id: { eq: ${gqlStr(projectId)} } },
        users_permissions_user: { id: { eq: ${gqlStr(recipientId)} } }${sinceFilter}
      }, pagination: { limit: 200 }, sort: "createdAt:asc") {
      data { id attributes {
        noofhours perhour total createdAt month
        mesimabetahalich { data { id } }
      } } } }`,
    'approvedHours'
  );
  return (data?.finnishedMissions?.data ?? []).map((row: any) => {
    const a = row.attributes ?? {};
    return {
      hours: num(a.noofhours) ?? 0,
      approvedAt: String(a.createdAt ?? a.month ?? ''),
      perhour: num(a.perhour),
      total: num(a.total) ?? 0,
      mesimabetahalichId: a.mesimabetahalich?.data?.id ? String(a.mesimabetahalich.data.id) : null
    };
  });
}

export interface StipendPaymentRow {
  id: string;
  projectId: string | null;
  pledgeId: string | null;
  programId: string | null;
  funderId: string | null;
  recipientId: string | null;
  amount: number;
  hours: number;
  equityCredit: number;
  equityDebit: number;
  status: string;
  cycleStart: string | null;
  cycleEnd: string | null;
  halukaId: string | null;
  mode: StipendMode;
  timegramaId: string | null;
}

const PAYMENT_FIELDS = `
  amount hours stipendRate equityCredit equityDebit status mode costShare
  equityMultiplier cycleStart cycleEnd confirmedAt confirmedBy repaid
  project { data { id } }
  stipend_pledge { data { id } }
  stipend_program { data { id } }
  funder { data { id attributes { username } } }
  recipient { data { id attributes { username } } }
  haluka { data { id } }
  timegrama { data { id } }`;

function toPayment(row: any): StipendPaymentRow | null {
  if (!row?.id) return null;
  const a = row.attributes ?? {};
  return {
    id: String(row.id),
    projectId: a.project?.data?.id ? String(a.project.data.id) : null,
    pledgeId: a.stipend_pledge?.data?.id ? String(a.stipend_pledge.data.id) : null,
    programId: a.stipend_program?.data?.id ? String(a.stipend_program.data.id) : null,
    funderId: a.funder?.data?.id ? String(a.funder.data.id) : null,
    recipientId: a.recipient?.data?.id ? String(a.recipient.data.id) : null,
    amount: num(a.amount) ?? 0,
    hours: num(a.hours) ?? 0,
    equityCredit: num(a.equityCredit) ?? 0,
    equityDebit: num(a.equityDebit) ?? 0,
    status: String(a.status ?? 'pending'),
    cycleStart: a.cycleStart ?? null,
    cycleEnd: a.cycleEnd ?? null,
    halukaId: a.haluka?.data?.id ? String(a.haluka.data.id) : null,
    mode: (a.mode ?? 'equity') as StipendMode,
    timegramaId: a.timegrama?.data?.id ? String(a.timegrama.data.id) : null
  };
}

export async function fetchPayment(exec: Exec, paymentId: string): Promise<StipendPaymentRow | null> {
  const data = await run(
    exec,
    `{ stipendPayment(id: ${gqlStr(paymentId)}) { data { id attributes { ${PAYMENT_FIELDS} } } } }`,
    'payment'
  );
  return toPayment(data?.stipendPayment?.data);
}

export async function fetchProjectPayments(
  exec: Exec,
  projectId: string
): Promise<StipendPaymentRow[]> {
  const data = await run(
    exec,
    `{ stipendPayments(filters: { project: { id: { eq: ${gqlStr(projectId)} } } }, pagination: { limit: 200 }, sort: "createdAt:desc") {
      data { id attributes { ${PAYMENT_FIELDS} } } } }`,
    'payments'
  );
  return (data?.stipendPayments?.data ?? []).map(toPayment).filter(Boolean) as StipendPaymentRow[];
}
