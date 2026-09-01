// Monthly reset server: at the start of each month, record how many hours were done
// and reset howmanyhoursalready to 0 for each active monthly mission.
// Approval/FinnishedMission creation is now handled by the timerSave action flow.

import { objToString } from '$lib/func/objToString.svelte';
import { SendToAdmin } from '$lib/server/sendToAdmin.js';
import { sendToSer } from '$lib/send/sendToSer.js';
// Server-only secret — never exposed to the client bundle (no VITE_ prefix).
import { ADMINMONTHER } from '$env/static/private';
import { cycleWindow } from '$lib/recurring/recurringPlan.js';
import { monthKeyOf, normalizeRows, reconcileMonter } from '$lib/recurring/missionMonths.js';

function formatDate(date = new Date()) {
  const year = date.toLocaleString('default', { year: 'numeric' });
  const month = date.toLocaleString('default', { month: '2-digit' });
  const day = date.toLocaleString('default', { day: '2-digit' });
  return [year, month, day].join('-');
}

// Project governance window (restime) → milliseconds. Mirrors actionUtils.
const RESTIME_HOURS = { feh: 48, sth: 72, nsh: 96, sevend: 168 };
function calcDeadline(restime, ref = new Date()) {
  const hours = RESTIME_HOURS[restime] ?? 48;
  return new Date(ref.getTime() + hours * 3600000);
}

// cycleWindow (imported): the window containing `ref`, anchored to the engine
// `start` and stepping by cycleSize units — shared with resource creation and
// askm acceptance so cycle #1 lands on the same window monthi would compute.

// Does a cycle already exist for this window? Includes archived cycles: with a
// multi-month cycleSize the same window spans several monthi runs, and once its
// cycle is settled (archived) we must NOT open a duplicate for the same window.
// Distinct windows have distinct start months, so the next window still opens.
function hasOpenCycleFor(maaps, cycleStart) {
  const y = cycleStart.getFullYear();
  const m = cycleStart.getMonth();
  return (maaps || []).some((mp) => {
    const a = mp.attributes ?? mp;
    if (!a.cycleStart) return false;
    const d = new Date(a.cycleStart);
    return d.getFullYear() === y && d.getMonth() === m;
  });
}

/**
 * Every mutation monthi makes goes through here, so `?dry=1` can describe a run
 * instead of performing it.
 *
 * The month-close touches every kvua mission on the platform, opens resource
 * and standing-order cycles and mails real members — there was no way to see
 * what a run would do before it did it. /api/fixer has had that from the start;
 * this is the same idea. The stub answer carries the id shapes the callers read
 * back (`createMaap`, `createTimegrama`, …) so the rest of the run still walks
 * its own path and logs the follow-up writes it would make.
 */
async function writeAdmin(mutation, label, dry) {
  if (dry) {
    console.log(`[monthi:dry] would ${label}:`, mutation.replace(/\s+/g, ' ').trim());
    return {
      data: {
        __dry: true,
        updateMesimabetahalich: { data: { id: 'dry' } },
        updateMashabetahalich: { data: { id: 'dry' } },
        createMaap: { data: { id: 'dry-maap' } },
        createTimegrama: { data: { id: 'dry-timegrama' } },
        updateMaap: { data: { id: 'dry' } }
      }
    };
  }
  return SendToAdmin(mutation, ADMINMONTHER);
}

// Render the activation email and post it to the existing sendMail endpoint.
async function sendActivationEmail(fetchFn, user, payload, dry) {
  if (!user?.email || user?.noMail === true) return;
  if (dry) {
    console.log('[monthi:dry] would email resource cycle to', user.email, payload);
    return;
  }
  try {
    const { render } = await import('svelty-email');
    const mod = await import('$lib/components/mail/monthlyResourceActive.svelte');
    const lang = ['he', 'en', 'ar'].includes(user.lang) ? user.lang : 'he';
    const previewText =
      lang === 'en'
        ? `Log this month's expense for ${payload.resourceName}`
        : `עדכון ההוצאה החודשית עבור ${payload.resourceName}`;
    const emailHtml = await render(mod.default, {
      username: user.username || '',
      resourceName: payload.resourceName,
      projectName: payload.projectName,
      plannedAmount: payload.plannedAmount,
      monthLabel: payload.monthLabel,
      lang,
      previewText
    });
    const res = await fetchFn('/api/sendMail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        emailHtml,
        previewText,
        emailText: previewText
      })
    });
    // A refused send must be visible: the cycle is already open, so a silent
    // failure means nobody is told to report the month's spend.
    if (!res.ok) {
      console.error('monthi: activation email rejected for', user.email, res.status);
    }
  } catch (e) {
    console.error('monthi: failed to send activation email', e);
  }
}

// reconcileMonter / monthKeyOf / normalizeRows (imported): the month arithmetic
// is shared with /api/fixer, which rebuilds a whole ledger from the same rules.

/** Length-independent comparison, so the key cannot be probed byte by byte. */
function secretMatches(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string' || !expected) return false;
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

let suc = [];

export async function GET({ fetch, url, request }) {
  // The month close files hours for every kvua mission on the platform, opens
  // resource and standing-order cycles and mails members — and it answered to
  // anyone who knew the path. /api/fixer, which repairs the same ledger, has
  // always asked for this key; monthi never did. Send it as `x-monthi-key`
  // where possible; `?key=` is the fallback for a plain scheduler.
  const key = request?.headers?.get('x-monthi-key') ?? url?.searchParams?.get('key') ?? '';
  if (!secretMatches(key, ADMINMONTHER)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // `?dry=1` walks the whole run and logs every write it would make, touching
  // nothing and mailing nobody.
  const dry = ['1', 'true', 'yes'].includes((url?.searchParams?.get('dry') ?? '').toLowerCase());
  console.log(dry ? 'monthi api called (DRY RUN — nothing will be written)' : 'monthi api called');
  suc = [];
  /** Missions deliberately left alone this run, with the reason. */
  const skipped = [];

  const que = `{
    mesimabetahaliches(filters: { and: [
      { iskvua: { eq: true } },
      { forappruval: { eq: false } },
      { finnished: { eq: false } },
      { or: [{ lifecycle: { null: true } }, { lifecycle: { notIn: ["archived", "released"] } }] }
    ] }) { data { id } }
  }`;

  try {
    const res = await SendToAdmin(que, ADMINMONTHER);
    if (!res?.data) return new Response(JSON.stringify(suc));

    for (const element of res.data.mesimabetahaliches.data) {
      const id = element.id;

      // Every Timer is created with `mesimabetahalich` set (qid 33CreateTimer),
      // saved or not, so this is the full record of when the work happened —
      // the only month-aware source. `howmanyhoursalready` is a single scalar
      // with no month attached and cannot be trusted to describe the target
      // month; it is kept only as a fallback for legacy timer-less missions.
      const que2 = `{
        mesimabetahalich(id: ${id}) { data { attributes {
          name dates hoursassinged howmanyhoursalready
          monter { monthStart hours isDone hoursDone }
        }}}
        timers(filters: { mesimabetahalich: { id: { eq: "${id}" } } }, pagination: { limit: -1 }) {
          data { id attributes { isActive timers { start stop } } }
        }
      }`;

      try {
        const resi = await SendToAdmin(que2, ADMINMONTHER);
        if (!resi?.data?.mesimabetahalich?.data) continue;

        const at = resi.data.mesimabetahalich.data.attributes;
        const now = new Date();

        if (at.dates && new Date(at.dates) > now) {
          console.log('mission not started yet, skipping', id);
          continue;
        }

        // Segments from every timer of this mission, saved or running.
        const timerRows = resi.data.timers?.data ?? [];
        const segments = timerRows.flatMap((t) => t.attributes?.timers ?? []);
        const hasTimers = segments.length > 0;

        // An open interval is measured up to *now*, so it grows by 24 hours a
        // day. A timer running right now is the normal case and harmless: its
        // hours land in the open month, and the open month is never filed. The
        // danger is an interval left open in a month that has already **ended** —
        // it pours a runaway number into a month monthi is about to write, and a
        // filed month goes on into the approval chain. Reading that on a screen
        // is recoverable; filing it is not. A timer of 49 real hours read 390
        // exactly this way, so that mission is left alone and named instead.
        const openKey = monthKeyOf(now);
        const staleOpen = segments.filter(
          (s) => s?.start && !s.stop && (monthKeyOf(s.start) ?? openKey) < openKey
        );
        if (staleOpen.length) {
          console.error(
            '[monthi] mission ' + id + ' "' + at.name + '" SKIPPED — ' + staleOpen.length +
              ' interval(s) left open in a month that has already ended (' +
              staleOpen.map((s) => s.start).join(', ') + '). Close them, then re-run.'
          );
          skipped.push({ id, name: at.name, reason: 'openIntervalInClosedMonth', open: staleOpen.length });
          continue;
        }

        // An interval open on a timer that is *not* running is the same orphan,
        // caught early — it does no harm this month, but it will the moment the
        // month turns. Say so; do not block the run over it.
        const orphaned = timerRows.filter(
          (t) => t.attributes?.isActive !== true && (t.attributes?.timers ?? []).some((s) => s?.start && !s.stop)
        );
        if (orphaned.length) {
          console.warn(
            '[monthi] mission ' + id + ' "' + at.name + '" has an interval open on a stopped timer (' +
              orphaned.map((t) => t.id).join(', ') + ') — it will corrupt this month once the month turns.'
          );
        }

        // Every past month the timers can account for, not only the last one.
        // monthi used to look at a single target month, so a month that went by
        // without a run was never filed at all — and there is no scheduler,
        // monthi runs when somebody remembers. reconcileMonter is the rule
        // /api/fixer repairs with: approved rows are never touched, the open
        // month stays on the counter, duplicate rows for one month collapse,
        // and a month with no timer evidence keeps whatever was filed for it.
        const rows = normalizeRows(at.monter);
        const reconciled = reconcileMonter({
          rows,
          segments,
          hoursassinged: at.hoursassinged,
          now
        });

        let nextRows = reconciled.rows;
        let currentHours = reconciled.counter;
        const changes = [...reconciled.changes];

        if (!hasTimers) {
          // No timers = no evidence of *when* the work happened, so the
          // month-less counter is the only record there is. File it once under
          // the month that just ended and never rewrite it, and never reset it
          // on its own — that would throw the record away.
          const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const previousKey = monthKeyOf(previous);
          const counterHours = at.howmanyhoursalready ?? 0;
          const hasPreviousRow = rows.some((r) => monthKeyOf(r.monthStart) === previousKey);
          if (counterHours > 0 && !hasPreviousRow) {
            nextRows = [
              ...rows,
              { monthStart: formatDate(previous), hours: at.hoursassinged ?? 0, isDone: false, hoursDone: counterHours }
            ];
            currentHours = 0;
            changes.push({ month: previousKey, kind: 'added', to: counterHours });
          } else {
            nextRows = rows;
            currentHours = counterHours;
          }
        }

        // Chronological, so a rewritten row lands back in place instead of at the
        // end — otherwise every run would "differ" from the last and rewrite.
        nextRows = [...nextRows].sort((a, b) => String(a.monthStart).localeCompare(String(b.monthStart)));

        const monterChanged = JSON.stringify(nextRows) !== JSON.stringify(rows);
        const scalarIsStale = Math.abs((at.howmanyhoursalready ?? 0) - currentHours) > 1e-6;

        if (!monterChanged && !scalarIsStale) {
          console.log('nothing to do for', id, rows.length ? '(the ledger already agrees with the timers)' : '(no hours)');
          continue;
        }

        // What the counter claimed, against what the timers can actually show.
        // The two disagreeing is the signature of a drifted
        // `howmanyhoursalready`, and the difference used to vanish in silence.
        const counterGap = (at.howmanyhoursalready ?? 0) - currentHours;
        const gapNote =
          hasTimers && Math.abs(counterGap) > 0.01
            ? ' (the counter was ' + (counterGap > 0 ? 'ahead of' : 'behind') + ' the timers by ' +
              Math.abs(counterGap).toFixed(3) + 'h — the timers decide)'
            : '';
        const changeNote = changes.length
          ? changes
              .map((c) =>
                c.month + ': ' + c.kind +
                (c.from !== undefined ? ' ' + c.from + '→' + c.to : c.to !== undefined ? ' ' + c.to : '')
              )
              .join(', ')
          : 'no month changed';
        console.log(
          '[monthi] mission ' + id + ' "' + at.name + '" — counter ' + (at.howmanyhoursalready ?? 0) +
            ' → ' + currentHours.toFixed(3) + gapNote + '\n         ' + changeNote
        );

        const mutation = `mutation {
          updateMesimabetahalich(id: "${id}", data: {
            monter: [ ${objToString(nextRows)} ],
            howmanyhoursalready: ${currentHours}
          }) { data { id } }
        }`;

        const resis = await writeAdmin(mutation, `reconcile the ledger of mission ${id}`, dry);
        if (resis?.data) {
          console.log('monthly reset done for', id);
          suc.push(id);
        } else {
          console.error('monthly reset failed for', id, resis);
        }
      } catch (e) {
        console.error('error processing mission', id, e);
      }
    }
  } catch (e) {
    console.error('monthi top-level error', e);
  }

  // ── Recurring resources (mashabetahalich): open this month's cycle ─────────
  const sucRes = await runRecurringResources(fetch, dry);

  // ── Recurring sales (standing orders): open this month's report cycle ──────
  const sucSales = await runRecurringSaleCycles(fetch, dry);

  if (skipped.length) {
    console.error('[monthi] finished with', skipped.length, 'mission(s) skipped:', skipped);
  }
  return new Response(
    JSON.stringify({ dry, missions: suc, skipped, resources: sucRes, sales: sucSales })
  );
}

// For every active recurring resource, open a Maap cycle for the current month
// (unless one already exists or the resource ended), and email the responsible
// user to confirm the amount spent. Past-end resources are closed.
async function runRecurringResources(fetchFn, dry) {
  const opened = [];

  const listQue = `query MrGetRecurringForMonthi {
    mashabetahaliches(
      filters: { and: [
        { recurring: { eq: true } },
        { status_mashab: { eq: "active" } },
        { finnished: { eq: false } },
        { or: [{ lifecycle: { null: true } }, { lifecycle: { ne: "archived" } }] }
      ] }
      pagination: { limit: 300 }
    ) {
      data { id attributes {
        name pricePerUnit start end cycleSize kindOf lifecycle archiveEffectiveFrom
        project { data { id attributes { projectName restime } } }
        users_permissions_user { data { id attributes { username email lang noMail } } }
        maaps(pagination: { limit: 500 }) { data { id attributes { cycleIndex cycleStart cycleEnd archived } } }
      } }
    }
  }`;

  let list;
  try {
    list = await SendToAdmin(listQue, ADMINMONTHER);
  } catch (e) {
    console.error('monthi: failed to list recurring resources', e);
    return opened;
  }
  const engines = list?.data?.mashabetahaliches?.data ?? [];
  const now = new Date();

  for (const eng of engines) {
    const id = eng.id;
    const a = eng.attributes ?? {};
    try {
      const unit = a.kindOf === 'yearly' ? 'year' : 'month';
      const start = a.start ? new Date(a.start) : null;
      const end = a.end ? new Date(a.end) : null;

      if (start && now < start) continue; // not started yet

      // An archive agreed "at end of cycle" ends the engine on its date, the
      // same way the resource's own end date does (PLAN_OBJECT_ARCHIVAL).
      const effectiveFrom = a.archiveEffectiveFrom ? new Date(a.archiveEffectiveFrom) : null;
      if ((end && now > end) || (effectiveFrom && now >= effectiveFrom)) {
        // Past the end date — close the engine so no further cycles open.
        const closeMut = `mutation { updateMashabetahalich(id: "${id}", data: { status_mashab: "closed", finnished: true }) { data { id } } }`;
        await writeAdmin(closeMut, `close ended resource ${id}`, dry);
        continue;
      }

      // Anchor cycle windows to the resource start so cycleSize spacing (e.g.
      // bi-monthly) stays aligned; fall back to now when no start is set.
      const anchor = start ?? now;
      const { cycleStart, cycleEnd } = cycleWindow(unit, anchor, a.cycleSize, now);
      const maaps = a.maaps?.data ?? [];
      if (hasOpenCycleFor(maaps, cycleStart)) continue; // already opened this window

      const nextIndex =
        maaps.reduce((mx, mp) => Math.max(mx, mp.attributes?.cycleIndex ?? 0), 0) + 1;
      const projectId = a.project?.data?.id;
      const planned = a.pricePerUnit ?? 0;
      const name = (a.name ?? 'משאב').replace(/"/g, '\\"');

      // Open the cycle WITHOUT quantityDelivered - it stays null until the
      // responsible user reports the month's actual spend. The planned amount
      // lives on the engine (pricePerUnit) and is shown only as a preview.
      // Members can approve the cycle only once it's been reported.
      const createMut = `mutation {
        createMaap(data: {
          project: "${projectId}",
          name: "${name}",
          mashabetahalich: "${id}",
          cycleIndex: ${nextIndex},
          cycleStart: "${cycleStart.toISOString()}",
          cycleEnd: "${cycleEnd.toISOString()}",
          publishedAt: "${now.toISOString()}"
        }) { data { id } }
      }`;
      const created = await writeAdmin(createMut, `open cycle ${nextIndex} for resource ${id}`, dry);
      const newMaapId = created?.data?.createMaap?.data?.id;
      if (!newMaapId) {
        console.error('monthi: failed to open cycle for resource', id, created);
        continue;
      }

      // Attach a Timegrama (deadline) so the cycle auto-approves once the window
      // elapses (clients cast the YES) — and a counter-offer can reset the clock.
      try {
        const deadline = calcDeadline(a.project?.data?.attributes?.restime, now);
        const tgMut = `mutation {
          createTimegrama(data: { date: "${deadline.toISOString()}", done: false, whatami: "maap", maap: "${newMaapId}" }) { data { id } }
        }`;
        const tg = await writeAdmin(tgMut, `attach timegrama to maap ${newMaapId}`, dry);
        const tgId = tg?.data?.createTimegrama?.data?.id;
        if (tgId) {
          await writeAdmin(
            `mutation { updateMaap(id: "${newMaapId}", data: { timegrama: "${tgId}" }) { data { id } } }`,
            `link timegrama ${tgId} to maap ${newMaapId}`,
            dry
          );
        }
      } catch (e) {
        console.error('monthi: failed to attach timegrama for cycle', newMaapId, e);
      }

      // Email the responsible user to confirm this month's spend.
      const user = a.users_permissions_user?.data?.attributes;
      const monthLabel = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      await sendActivationEmail(fetchFn, user, {
        resourceName: a.name ?? '',
        projectName: a.project?.data?.attributes?.projectName ?? '',
        plannedAmount: planned,
        monthLabel
      }, dry);

      console.log('monthi: opened cycle', nextIndex, 'for resource', id);
      opened.push(id);
    } catch (e) {
      console.error('monthi: error processing recurring resource', id, e);
    }
  }

  return opened;
}

// Render the monthly recurring-sale email (holder or customer flavor) and post
// it to the existing sendMail endpoint.
async function sendRecurringSaleEmail(fetchFn, user, role, payload, dry) {
  if (!user?.email || user?.noMail === true) return;
  if (dry) {
    console.log('[monthi:dry] would email recurring sale to', user.email, role, payload);
    return;
  }
  try {
    const { render } = await import('svelty-email');
    const mod = await import('$lib/components/mail/monthlyRecurringSale.svelte');
    const lang = ['he', 'en', 'ar'].includes(user.lang) ? user.lang : 'he';
    const previewText =
      role === 'customer'
        ? lang === 'en'
          ? `Report this month's transfer for ${payload.productName}`
          : `עדכון ההעברה החודשית עבור ${payload.productName}`
        : lang === 'en'
          ? `Report this month's income from ${payload.productName}`
          : `דיווח ההכנסה החודשית מ-${payload.productName}`;
    const emailHtml = await render(mod.default, {
      username: user.username || '',
      productName: payload.productName,
      projectName: payload.projectName,
      expectedAmount: payload.expectedAmount,
      monthLabel: payload.monthLabel,
      role,
      lang,
      previewText
    });
    const res = await fetchFn('/api/sendMail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        emailHtml,
        previewText,
        emailText: previewText
      })
    });
    if (!res.ok) {
      console.error('monthi: recurring-sale email rejected for', user.email, res.status);
    }
  } catch (e) {
    console.error('monthi: failed to send recurring-sale email', e);
  }
}

// For every live recurring-sale engine (standing order / subscription —
// PLAN_RECURRING_SALES), open this month's report cycle: a child Sale
// (pending:true, holderStatus:'open') the money-holder settles by reporting
// how much actually came in. Past-end engines are closed. The holder — and
// the paying customer, when one is named — get a reminder email.
async function runRecurringSaleCycles(fetchFn, dry) {
  const opened = [];

  let list;
  try {
    list = await sendToSer({}, 'mrsListRecurringSaleEngines', 0, 0, true, fetchFn);
  } catch (e) {
    console.error('monthi: failed to list recurring-sale engines', e);
    return opened;
  }
  const engines = list?.data?.sales?.data ?? [];
  const now = new Date();

  for (const eng of engines) {
    const id = eng.id;
    const a = eng.attributes ?? {};
    try {
      const start = a.startDate ? new Date(a.startDate) : null;
      const end = a.finishDate ? new Date(a.finishDate) : null;

      if (start && now < start) continue; // not started yet

      if (end && now > end) {
        // Past the end date — stop opening cycles for this standing order.
        if (dry) console.log('[monthi:dry] would close ended sale engine', id);
        else await sendToSer({ id }, 'mrsCloseRecurringSale', 0, 0, true, fetchFn);
        continue;
      }

      const projectId = a.project?.data?.id;
      const holder = a.users_permissions_user?.data;
      if (!projectId || !holder?.id) {
        console.error('monthi: recurring sale engine missing project/holder', id);
        continue;
      }

      // Sale engines cycle monthly unless the product is a yearly subscription.
      const unit = a.matanot?.data?.attributes?.kindOf === 'yearly' ? 'year' : 'month';
      const anchor = start ?? now;
      const { cycleStart, cycleEnd } = cycleWindow(unit, anchor, 1, now);

      // Child cycles carry cycleStart, so the maap duplicate-check applies as-is.
      const children = a.recurringSales?.data ?? [];
      if (hasOpenCycleFor(children, cycleStart)) continue; // already opened this window

      const customer = a.customer?.data;
      // The engine's Sheirut is the standing-order record (the canonical
      // customer link) — attach each monthly cycle to it as well.
      const sheirutIds = (a.sheiruts?.data ?? []).map((s) => s.id);
      const vars = {
        project: projectId,
        matanot: a.matanot?.data?.id ?? null,
        users_permissions_user: holder.id,
        customer: customer?.id ?? null,
        sheiruts: sheirutIds.length > 0 ? sheirutIds : null,
        recurringSource: id,
        unit: a.unit ?? null,
        date: cycleStart.toISOString(),
        cycleStart: cycleStart.toISOString(),
        cycleEnd: cycleEnd.toISOString(),
        note: a.note ?? null,
        publishedAt: now.toISOString()
      };
      const created = dry
        ? (console.log('[monthi:dry] would open sale cycle for engine', id, vars),
          { data: { createSale: { data: { id: 'dry-sale' } } } })
        : await sendToSer(vars, 'mrsCreateCycleSale', 0, 0, true, fetchFn);
      const cycleId = created?.data?.createSale?.data?.id;
      if (!cycleId) {
        console.error('monthi: failed to open sale cycle for engine', id, created);
        continue;
      }

      const monthLabel = `${String(cycleStart.getMonth() + 1).padStart(2, '0')}/${cycleStart.getFullYear()}`;
      const payload = {
        productName: a.matanot?.data?.attributes?.name ?? '',
        projectName: a.project?.data?.attributes?.projectName ?? '',
        expectedAmount: a.in ?? 0,
        monthLabel
      };
      await sendRecurringSaleEmail(fetchFn, holder.attributes, 'holder', payload, dry);
      if (customer?.attributes) {
        await sendRecurringSaleEmail(fetchFn, customer.attributes, 'customer', payload, dry);
      }

      console.log('monthi: opened sale cycle', cycleId, 'for engine', id);
      opened.push(id);
    } catch (e) {
      console.error('monthi: error processing recurring sale engine', id, e);
    }
  }

  return opened;
}
