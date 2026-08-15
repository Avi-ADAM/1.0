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
  missionIds: string[];
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
