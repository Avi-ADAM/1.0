/**
 * Closing the books before an hourly value changes
 * (PLAN_OBJECT_ARCHIVAL — hourly-value changes).
 *
 * An approved `editObject` that moves a mission's `perhour` splits the mission
 * into two rate eras. Everything already logged belongs to the old one, so it
 * is sent to approval **first**, at the old value, and only then does the new
 * value take effect. A timer that was running is stopped and restarted at the
 * same instant, stamped with the new rate: the member loses no seconds and the
 * hours on either side of the change can never be confused for each other.
 *
 * The rest of the rate machinery is `src/lib/timers/rate.ts`; this module is
 * the one moment where the two eras are actually cut apart.
 *
 * Runs over `Exec`, so the vote path, the timegrama cron and the single-member
 * fast path all get the identical effect — the same rule the applier follows.
 */

import { dateField, fields, gqlStr, numField, run, strField, type Exec } from '../archive/gql.js';
import { calcDeadlineMs } from '../actions/configs/actionUtils.js';
import { hoursInMonth } from '$lib/recurring/missionMonths.js';
import { pickRateRow, resolveRate, rowRate, segmentHours, type RateRow } from '$lib/timers/rate.js';

export interface FlushResult {
  /** False when there was nothing accrued to close — the common case. */
  flushed: boolean;
  timerId?: string;
  /** Hours sent to approval (or credited outright in a rikma of one). */
  hours?: number;
  /** The value they were sent at — the *old* one. */
  rate?: number;
  finiapruvalId?: string;
  finnishedMissionId?: string;
  /** Set when the timer was running and was handed straight back. */
  restartedTimerId?: string;
}

interface TimerSegment {
  start?: string | null;
  stop?: string | null;
}

const MISSION_QUERY = (id: string) => `{ mesimabetahalich(id: ${gqlStr(id)}) { data { id attributes {
  name perhour howmanyhoursalready totalHoursSaved
  users_permissions_user { data { id } }
  mission { data { id } }
  project { data { id attributes { restime user_1s { data { id } } } } }
  activeTimer { data { id attributes { rate isActive saved totalHours timers { start stop } } } }
  finnished_missions(filters: { isNotFinished: { eq: true } }) {
    data { id attributes { noofhours perhour } }
  }
} } } }`;

export interface FlushInput {
  missionId: string;
  /** The value about to be written. The new timer is stamped with it. */
  newRate: number;
  /** Free text for the approval / credited row. */
  why?: string | null;
  /** Milliseconds since epoch — injectable so the tests are not clock-bound. */
  now?: number;
  /** Deadline for the approval vote; falls back to the rikma's restime. */
  restimeMs?: number | null;
}

function dateOnly(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** `[{ start: "…", stop: "…" }]` as a GraphQL component list literal. */
function segmentList(segments: TimerSegment[]): string {
  const items = segments
    .filter((s) => s?.start)
    .map((s) => `{ ${fields(dateField('start', s.start), dateField('stop', s.stop))} }`);
  return `[${items.join(', ')}]`;
}

/**
 * Send everything accrued so far to approval at the current (old) value, then
 * hand a running timer back stamped with `newRate`.
 *
 * Never throws: a mission whose books cannot be closed must still be able to
 * carry the decision the rikma just approved. A failure here leaves the hours
 * on an unsaved timer — recoverable — while throwing would leave a matured
 * Decision half-applied.
 */
export async function flushHoursBeforeRateChange(
  exec: Exec,
  { missionId, newRate, why = null, now = Date.now(), restimeMs = null }: FlushInput,
): Promise<FlushResult> {
  try {
    const data = await run(exec, MISSION_QUERY(missionId), 'flushRate:read');
    const node = data?.mesimabetahalich?.data;
    if (!node) return { flushed: false };
    const at = node.attributes ?? {};

    const timerNode = at.activeTimer?.data;
    if (!timerNode?.id) return { flushed: false };
    const ta = timerNode.attributes ?? {};

    const wasRunning = ta.isActive === true;
    const nowISO = new Date(now).toISOString();

    // Close the open segment at `now`; a paused timer already has all of its
    // segments closed and is left exactly as it is.
    const segments: TimerSegment[] = (ta.timers ?? []).map((s: TimerSegment) => ({
      start: s?.start ?? null,
      stop: s?.stop ?? (s?.start ? nowISO : null),
    }));

    // `totalHours` is written by timerStop and is authoritative when it is
    // ahead; the segments cover the stretch since the last stop.
    const hours = Math.max(Number(ta.totalHours ?? 0), segmentHours(segments, now));
    if (!(hours > 0)) return { flushed: false };

    const rate = resolveRate(ta.rate, at.perhour);
    const projectId = at.project?.data?.id ? String(at.project.data.id) : null;
    const memberIds: string[] = (at.project?.data?.attributes?.user_1s?.data ?? []).map((u: any) =>
      String(u.id),
    );
    const ownerId = at.users_permissions_user?.data?.id
      ? String(at.users_permissions_user.data.id)
      : null;
    const reason = (why ?? '').trim() || 'שינוי שווי שעה — סגירת שעות בתעריף הקודם';

    // 1. The timer is closed and saved. Its stamp keeps the price of the hours
    //    on it whatever the mission becomes next.
    await run(
      exec,
      `mutation { updateTimer(id: ${gqlStr(timerNode.id)}, data: { ${fields(
        'saved: true',
        'isActive: false',
        numField('totalHours', hours),
        numField('rate', rate),
        `timers: ${segmentList(segments)}`,
      )} }) { data { id } } }`,
      'flushRate:closeTimer',
    );

    // 2. The mission's monthly counter absorbs this month's share, and the
    //    active-timer link is released so a new one can take it.
    const d = new Date(now);
    const thisMonth = hoursInMonth(segments, d.getFullYear(), d.getMonth(), now);
    await run(
      exec,
      `mutation { updateMesimabetahalich(id: ${gqlStr(missionId)}, data: { ${fields(
        numField('howmanyhoursalready', Number(at.howmanyhoursalready ?? 0) + thisMonth),
        'activeTimer: null',
        'stname: "saved"',
      )} }) { data { id } } }`,
      'flushRate:missionCounter',
    );

    const result: FlushResult = { flushed: true, timerId: String(timerNode.id), hours, rate };

    if (memberIds.length <= 1) {
      // A rikma of one approves by existing — the hours land straight on the
      // row of their own rate era.
      result.finnishedMissionId = await creditDirectly(exec, {
        missionId,
        at,
        rate,
        hours,
        why: reason,
        nowISO,
        projectId,
        ownerId,
      });
    } else {
      result.finiapruvalId = await openApproval(exec, {
        missionId,
        at,
        rate,
        hours,
        why: reason,
        nowISO,
        now,
        projectId,
        ownerId,
        timerId: String(timerNode.id),
        restimeMs: restimeMs ?? calcDeadlineMs(at.project?.data?.attributes?.restime ?? 'feh'),
      });
    }

    // 3. Hand the timer back at the same instant it was taken, at the new
    //    value. Anything else would charge the member for the interruption.
    if (wasRunning) {
      const created = await run(
        exec,
        `mutation { createTimer(data: { ${fields(
          strField('activeMesimabetahalich', missionId),
          strField('mesimabetahalich', missionId),
          ownerId ? strField('users_permissions_user', ownerId) : null,
          projectId ? strField('project', projectId) : null,
          dateField('start', nowISO),
          numField('rate', newRate),
          'isActive: true',
          'totalHours: 0',
          `timers: [{ ${dateField('start', nowISO)} }]`,
        )} }) { data { id } } }`,
        'flushRate:restart',
      );
      const newId = created?.createTimer?.data?.id;
      if (newId) result.restartedTimerId = String(newId);
    }

    return result;
  } catch (e) {
    console.error('[flushRate] closing the books before the rate change failed:', e);
    return { flushed: false };
  }
}

async function creditDirectly(
  exec: Exec,
  args: {
    missionId: string;
    at: any;
    rate: number;
    hours: number;
    why: string;
    nowISO: string;
    projectId: string | null;
    ownerId: string | null;
  },
): Promise<string | undefined> {
  const { missionId, at, rate, hours, why, nowISO, projectId, ownerId } = args;

  const rows: RateRow[] = (at.finnished_missions?.data ?? []).map((fm: any) => ({
    id: String(fm.id),
    noofhours: Number(fm.attributes?.noofhours ?? 0),
    perhour: fm.attributes?.perhour == null ? null : Number(fm.attributes.perhour),
  }));
  const target = pickRateRow(rows, rate);

  let id: string | undefined;
  if (target) {
    const grown = target.noofhours + hours;
    await run(
      exec,
      `mutation { updateFinnishedMission(id: ${gqlStr(target.id)}, data: { ${fields(
        numField('noofhours', grown),
        numField('total', grown * rowRate(target, rate)),
      )} }) { data { id } } }`,
      'flushRate:growRow',
    );
    id = target.id;
  } else {
    const created = await run(
      exec,
      `mutation { createFinnishedMission(data: { ${fields(
        strField('missionName', at.name),
        numField('noofhours', hours),
        strField('mesimabetahalich', missionId),
        at.mission?.data?.id ? strField('mission', String(at.mission.data.id)) : null,
        projectId ? strField('project', projectId) : null,
        ownerId ? strField('users_permissions_user', ownerId) : null,
        numField('perhour', rate),
        numField('total', hours * rate),
        strField('why', why),
        dateField('publishedAt', nowISO),
        'isNotFinished: true',
        'isFinished: false',
      )} }) { data { id } } }`,
      'flushRate:createRow',
    );
    const newId = created?.createFinnishedMission?.data?.id;
    id = newId ? String(newId) : undefined;
  }

  await run(
    exec,
    `mutation { updateMesimabetahalich(id: ${gqlStr(missionId)}, data: { ${numField(
      'totalHoursSaved',
      Number(at.totalHoursSaved ?? 0) + hours,
    )} }) { data { id } } }`,
    'flushRate:totalHoursSaved',
  ).catch((e) => console.warn('[flushRate] totalHoursSaved update failed (non-fatal):', e));

  return id;
}

async function openApproval(
  exec: Exec,
  args: {
    missionId: string;
    at: any;
    rate: number;
    hours: number;
    why: string;
    nowISO: string;
    now: number;
    projectId: string | null;
    ownerId: string | null;
    timerId: string;
    restimeMs: number;
  },
): Promise<string | undefined> {
  const { missionId, at, rate, hours, why, nowISO, now, projectId, ownerId, timerId, restimeMs } =
    args;

  // The standing yes is the member whose hours these are — the same signature
  // a save of their own timer carries. Nobody else is signed for them.
  const vots = ownerId ? `[{ what: true, users_permissions_user: ${gqlStr(ownerId)} }]` : '[]';

  const created = await run(
    exec,
    `mutation { createFiniapruval(data: { ${fields(
      strField('missname', at.name),
      numField('noofhours', hours),
      strField('mesimabetahalich', missionId),
      projectId ? strField('project', projectId) : null,
      ownerId ? strField('users_permissions_user', ownerId) : null,
      strField('timer', timerId),
      numField('perhour', rate),
      strField('why', why.slice(0, 250)),
      strField('month', dateOnly(now)),
      'isTimerSave: true',
      `vots: ${vots}`,
      dateField('publishedAt', nowISO),
    )} }) { data { id } } }`,
    'flushRate:approval',
  );

  const id = created?.createFiniapruval?.data?.id;
  if (!id) return undefined;

  // Silence still matures it, at the rikma's own pace.
  await run(
    exec,
    `mutation { createTimegrama(data: { ${fields(
      dateField('date', new Date(now + restimeMs).toISOString()),
      'whatami: "finiapruval"',
      strField('finiapruval', String(id)),
      'done: false',
    )} }) { data { id } } }`,
    'flushRate:timegrama',
  ).catch((e) => console.warn('[flushRate] approval deadline not scheduled (non-fatal):', e));

  return String(id);
}
