/**
 * The events clock (docs/inprogress/PLAN_EVENTS_WEBINARS.md §5.2, W3) —
 * `/api/cron/events`, every 5 minutes.
 *
 * One pass:
 *  1. every published event that still has something to say (a date ahead, or
 *     one that ended in the last days);
 *  2. per date, moves people off the waiting list into free seats (`promotions`);
 *  3. per registration, the one mail it is owed now (`planMail` / `planNewDate`);
 *  4. sends, most urgent first, until the time budget runs out — the rest wait
 *     for the next run. The mailer sends 20 a minute (`mailer.js`), so a
 *     budget of under a minute keeps the request short and the windows in
 *     `reminders.ts` are wide enough for the backlog to drain.
 *
 * Every mail is claimed (its `sent` patch written) before it is sent. Pure of
 * SvelteKit: the route passes the runner, the sender and the clock, so the
 * whole pass is tested without Strapi or SMTP.
 */

import { toSessionView, type SessionView } from '$lib/events/model';
import { openSessions } from '$lib/events/sessions';
import { eventPath, withEventRef } from '$lib/events/model';
import {
  URGENCY,
  parseSent,
  planMail,
  notifyBatch,
  planNewDate,
  promotions,
  type MailKind,
  type PlannedMail,
  type SentLog
} from '$lib/events/reminders';
import { buildReminder, type BuiltMail } from './reminderMail';
import type { Run } from './store';

export interface CronDeps {
  run: Run;
  send: (to: string, mail: BuiltMail) => Promise<{ ok: boolean }>;
  /** The members' batched "N new registrations" notice (W4). */
  notify?: (event: { id: string; projectId: string; title: string; hostId: string | null }, count: number) => Promise<void>;
  /** Best effort: a line on the person's lead (came / did not come). */
  logLead?: (leadId: string, body: string, actorId: string | null) => Promise<void>;
  origin: string;
  now?: () => Date;
  budgetMs?: number;
  /** Plan and claim nothing; report what would be sent. */
  dry?: boolean;
}

export interface CronReport {
  events: number;
  promoted: number;
  planned: number;
  sent: Partial<Record<MailKind, number>>;
  failed: number;
  deferred: number;
  /** Events whose members were told about new registrations this run. */
  notified: number;
  errors: string[];
}

interface Reg {
  id: string;
  sessionKey: string | null;
  name: string;
  email: string;
  status: string;
  joinedAt: string | null;
  createdAt: string | null;
  lang: string | null;
  token: string;
  leadId: string | null;
  sent: SentLog;
}

interface CronEvent {
  id: string;
  title: string;
  tagline: string | null;
  afterUrl: string | null;
  slug: string;
  projectId: string;
  projectSlug: string | null;
  hostId: string | null;
  sessions: SessionView[];
}

const DAY = 24 * 3600_000;

function toCronEvent(node: any): CronEvent | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  if (a.lifecycle === 'archived' || a.lifecycle === 'released') return null;
  const projectId = a.project?.data?.id;
  if (projectId == null) return null;
  return {
    id: String(node.id),
    title: String(a.title ?? ''),
    tagline: a.tagline ?? null,
    afterUrl: a.afterUrl ?? null,
    slug: String(a.slug ?? node.id),
    projectId: String(projectId),
    projectSlug: a.project?.data?.attributes?.slug ?? null,
    hostId: a.hosts?.data?.[0]?.id != null ? String(a.hosts.data[0].id) : null,
    sessions: ((a.sessions ?? []) as any[]).map((s) => toSessionView(s, false)).filter((s): s is SessionView => !!s)
  };
}

function toReg(node: any): Reg | null {
  const a = node?.attributes;
  if (!a || node?.id == null || !a.token || !a.email) return null;
  return {
    id: String(node.id),
    sessionKey: a.sessionKey ?? null,
    name: String(a.name ?? ''),
    email: String(a.email),
    status: String(a.status ?? 'registered'),
    joinedAt: a.joinedAt ?? null,
    createdAt: a.createdAt ?? null,
    lang: a.lang ?? null,
    token: String(a.token),
    leadId: a.lead?.data?.id != null ? String(a.lead.data.id) : null,
    sent: parseSent(a.sent)
  };
}

/** Anything left to do: a date ahead, or one that ended inside the "after" window. */
export function eventIsActive(e: Pick<CronEvent, 'sessions'>, now: Date): boolean {
  const t = now.getTime();
  return e.sessions.some((s) => Date.parse(s.startsAt) + s.durationMin * 60_000 + 4 * DAY > t);
}

interface Job {
  event: CronEvent;
  reg: Reg;
  session: SessionView | null;
  plan: PlannedMail;
}

export async function runEventsCron(deps: CronDeps): Promise<CronReport> {
  const now = deps.now ?? (() => new Date());
  const started = Date.now();
  const budget = deps.budgetMs ?? 45_000;
  const report: CronReport = { events: 0, promoted: 0, planned: 0, sent: {}, failed: 0, deferred: 0, notified: 0, errors: [] };

  const res = await deps.run('eventsForCron', {});
  const events = ((res?.data?.rikmaEvents?.data ?? []) as any[])
    .map(toCronEvent)
    .filter((e): e is CronEvent => !!e && eventIsActive(e, now()));
  report.events = events.length;

  const jobs: Job[] = [];
  const regsOf = new Map<string, Reg[]>();
  for (const event of events) {
    let regs: Reg[];
    try {
      const r = await deps.run('eventRegistrationsForCron', { eid: event.id });
      regs = ((r?.data?.eventRegistrations?.data ?? []) as any[]).map(toReg).filter((x): x is Reg => !!x);
    } catch (e) {
      report.errors.push(`event ${event.id}: ${(e as Error).message}`);
      continue;
    }
    regsOf.set(event.id, regs);

    // A seat that opened goes to the earliest person waiting for it.
    for (const session of event.sessions) {
      for (const reg of promotions(session, regs, now())) {
        if (!deps.dry) {
          try {
            await deps.run('eventRegistrationUpdate', { id: reg.id, data: { status: 'registered' } });
          } catch (e) {
            report.errors.push(`promote ${reg.id}: ${(e as Error).message}`);
            continue;
          }
        }
        reg.status = 'registered';
        // Their confirmation said "waiting list"; planMail now owes them "a seat opened".
        reg.sent = { ...reg.sent, confirmedAs: reg.sent.confirmedAs ?? 'waitlist' };
        report.promoted++;
      }
    }

    const openKeys = openSessions(event.sessions, now()).map((s) => s.key);
    for (const reg of regs) {
      if (!reg.sessionKey) {
        const plan = planNewDate(reg, openKeys, now());
        if (plan) jobs.push({ event, reg, session: event.sessions.find((s) => s.key === openKeys[0]) ?? null, plan });
        continue;
      }
      const session = event.sessions.find((s) => s.key === reg.sessionKey);
      if (!session) continue;
      const plan = planMail(reg, session, now());
      if (plan) jobs.push({ event, reg, session, plan });
    }
  }

  report.planned = jobs.length;
  jobs.sort((a, b) => URGENCY.indexOf(a.plan.kind) - URGENCY.indexOf(b.plan.kind));

  for (const job of jobs) {
    if (Date.now() - started > budget) {
      report.deferred++;
      continue;
    }
    const { event, reg, session, plan } = job;
    if (deps.dry) {
      report.sent[plan.kind] = (report.sent[plan.kind] ?? 0) + 1;
      continue;
    }
    const sent = { ...reg.sent, ...plan.sent };
    try {
      await deps.run('eventRegistrationUpdate', {
        id: reg.id,
        data: { sent, ...(plan.status ? { status: plan.status } : {}) }
      });
    } catch (e) {
      report.errors.push(`claim ${reg.id}: ${(e as Error).message}`);
      continue;
    }
    // Later writes in this run (the members' notice) build on what was just claimed.
    reg.sent = sent;

    const origin = deps.origin.replace(/\/+$/, '');
    const mail = buildReminder({
      kind: plan.kind,
      registrationId: reg.id,
      name: reg.name,
      lang: reg.lang,
      // The signup link carries this registrant's token, so an account opened from the mail is linked back (W4).
      event: { title: event.title, tagline: event.tagline, afterUrl: withEventRef(event.afterUrl, reg.token) },
      session: session
        ? { startsAt: session.startsAt, durationMin: session.durationMin, timezone: session.timezone, recordingUrl: session.recordingUrl }
        : null,
      pageUrl: `${origin}/e/${reg.token}`,
      eventUrl: `${origin}${eventPath({ slug: event.projectSlug, id: event.projectId }, event.slug)}`,
      origin,
      seq: sent.seq ?? 0,
      waitlist: sent.confirmedAs === 'waitlist' && reg.status === 'waitlist'
    });
    const out = await deps.send(reg.email, mail);
    if (out.ok) report.sent[plan.kind] = (report.sent[plan.kind] ?? 0) + 1;
    else report.failed++;

    // The lead remembers whether they came — it is where the follow-up starts.
    if ((plan.kind === 'thanks' || plan.kind === 'missed') && reg.leadId && deps.logLead) {
      try {
        await deps.logLead(reg.leadId, `${event.title} · ${plan.kind === 'thanks' ? '✓' : '✗'}`, null);
      } catch (e) {
        report.errors.push(`lead ${reg.leadId}: ${(e as Error).message}`);
      }
    }
  }

  // The members' notice: one per event per hour, "N new registrations",
  // never one buzz per sign-up. Claimed on the rows before it is sent.
  if (deps.notify && !deps.dry) {
    const nowIso = now().toISOString();
    for (const event of events) {
      const batch = notifyBatch(regsOf.get(event.id) ?? [], now());
      if (batch.length === 0) continue;
      let claimed = 0;
      for (const reg of batch) {
        try {
          const sent = { ...reg.sent, notified: nowIso };
          await deps.run('eventRegistrationUpdate', { id: reg.id, data: { sent } });
          reg.sent = sent;
          claimed++;
        } catch (e) {
          report.errors.push(`notify-claim ${reg.id}: ${(e as Error).message}`);
        }
      }
      if (claimed === 0) continue;
      try {
        await deps.notify({ id: event.id, projectId: event.projectId, title: event.title, hostId: event.hostId }, claimed);
        report.notified++;
      } catch (e) {
        report.errors.push(`notify ${event.id}: ${(e as Error).message}`);
      }
    }
  }

  return report;
}