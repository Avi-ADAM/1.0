// Monthly reset server: at the start of each month, record how many hours were done
// and reset howmanyhoursalready to 0 for each active monthly mission.
// Approval/FinnishedMission creation is now handled by the timerSave action flow.

import { objToString } from '$lib/func/objToString.svelte';
import { SendToAdmin } from '$lib/server/sendToAdmin.js';
// Server-only secret — never exposed to the client bundle (no VITE_ prefix).
import { ADMINMONTHER } from '$env/static/private';

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

// The cycle window [start,end] containing `ref`, anchored to the engine `start`
// and stepping by `size` units. cycleSize lets a resource run e.g. bi-monthly:
// one cycle every `size` months instead of every month (size=1 ⇒ monthly/yearly
// as before). The window is anchored to `anchor` so cycles stay aligned to the
// resource's start date across runs.
function cycleWindow(unit, anchor, size, ref = new Date()) {
  const step = Math.max(1, Number(size) || 1);
  if (unit === 'year') {
    const since = ref.getFullYear() - anchor.getFullYear();
    const idx = Math.max(0, Math.floor(since / step));
    const y = anchor.getFullYear() + idx * step;
    return {
      cycleStart: new Date(y, 0, 1),
      cycleEnd: new Date(y + step - 1, 11, 31, 23, 59, 59)
    };
  }
  const since =
    (ref.getFullYear() - anchor.getFullYear()) * 12 + (ref.getMonth() - anchor.getMonth());
  const idx = Math.max(0, Math.floor(since / step));
  const m = anchor.getMonth() + idx * step;
  return {
    cycleStart: new Date(anchor.getFullYear(), m, 1),
    cycleEnd: new Date(anchor.getFullYear(), m + step, 0, 23, 59, 59)
  };
}

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

// Render the activation email and post it to the existing sendMail endpoint.
async function sendActivationEmail(fetchFn, user, payload) {
  if (!user?.email || user?.noMail === true) return;
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
    await fetchFn('/api/sendMail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        emailHtml,
        previewText,
        emailText: previewText
      })
    });
  } catch (e) {
    console.error('monthi: failed to send activation email', e);
  }
}

// Hours from timer segments that fall within the given year+month
function hoursInMonth(timers, year, month) {
  if (!timers || !Array.isArray(timers)) return 0;
  const monthStart = new Date(year, month, 1).getTime();
  const monthEnd = new Date(year, month + 1, 1).getTime();
  let total = 0;
  for (const seg of timers) {
    if (!seg.start) continue;
    const start = new Date(seg.start).getTime();
    const stop = seg.stop ? new Date(seg.stop).getTime() : Date.now();
    const s = Math.max(start, monthStart);
    const e = Math.min(stop, monthEnd);
    if (e > s) total += (e - s) / 1000 / 3600;
  }
  return total;
}

let suc = [];

export async function GET({ fetch }) {
  console.log('monthi api called');
  suc = [];

  const que = `{
    mesimabetahaliches(filters: {
      iskvua: { eq: true },
      forappruval: { eq: false },
      finnished: { eq: false }
    }) { data { id } }
  }`;

  try {
    const res = await SendToAdmin(que, ADMINMONTHER);
    if (!res?.data) return new Response(JSON.stringify(suc));

    for (const element of res.data.mesimabetahaliches.data) {
      const id = element.id;

      const que2 = `{
        mesimabetahalich(id: ${id}) { data { attributes {
          name dates hoursassinged howmanyhoursalready
          monter { monthStart hours isDone hoursDone }
          activeTimer { data { attributes { timers { start stop } isActive } } }
        }}}
      }`;

      try {
        const resi = await SendToAdmin(que2, ADMINMONTHER);
        if (!resi?.data?.mesimabetahalich?.data) continue;

        const at = resi.data.mesimabetahalich.data.attributes;
        const now = new Date();

        let targetMonth = now.getMonth();
        let targetYear = now.getFullYear();

        if (now.getDate() < 28) {
          targetMonth -= 1;
          if (targetMonth < 0) {
            targetMonth = 11;
            targetYear -= 1;
          }
        }
        
        let targetDate = new Date(targetYear, targetMonth, 1);

        if (at.dates && new Date(at.dates) > now) {
          console.log('mission not started yet, skipping', id);
          continue;
        }

        // Add hours from still-running activeTimer that fall in the target month
        const activeTimerSegments = at.activeTimer?.data?.attributes?.timers ?? [];
        const activeHrsThisMonth = at.activeTimer?.data?.attributes?.isActive
          ? hoursInMonth(activeTimerSegments, targetYear, targetMonth)
          : 0;

        const monthTotal = (at.howmanyhoursalready ?? 0) + activeHrsThisMonth;

        if (monthTotal === 0) {
          console.log('no hours this month for', id, '— skipping');
          continue;
        }

        const monter = objToString(at.monter);
        const mutation = `mutation {
          updateMesimabetahalich(id: "${id}", data: {
            monter: [
              ${monter}
              {
                monthStart: "${formatDate(targetDate)}",
                hours: ${at.hoursassinged ?? 0},
                isDone: false,
                hoursDone: ${monthTotal}
              }
            ],
            howmanyhoursalready: 0
          }) { data { id } }
        }`;

        const resis = await SendToAdmin(mutation, ADMINMONTHER);
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
  const sucRes = await runRecurringResources(fetch);

  return new Response(JSON.stringify({ missions: suc, resources: sucRes }));
}

// For every active recurring resource, open a Maap cycle for the current month
// (unless one already exists or the resource ended), and email the responsible
// user to confirm the amount spent. Past-end resources are closed.
async function runRecurringResources(fetchFn) {
  const opened = [];

  const listQue = `query MrGetRecurringForMonthi {
    mashabetahaliches(
      filters: { recurring: { eq: true }, status_mashab: { eq: "active" }, finnished: { eq: false } }
      pagination: { limit: 300 }
    ) {
      data { id attributes {
        name pricePerUnit start end cycleSize kindOf
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

      if (end && now > end) {
        // Past the end date — close the engine so no further cycles open.
        const closeMut = `mutation { updateMashabetahalich(id: "${id}", data: { status_mashab: "closed", finnished: true }) { data { id } } }`;
        await SendToAdmin(closeMut, ADMINMONTHER);
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

      // Open the cycle WITHOUT quantityDelivered — it stays null until the
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
      const created = await SendToAdmin(createMut, ADMINMONTHER);
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
        const tg = await SendToAdmin(tgMut, ADMINMONTHER);
        const tgId = tg?.data?.createTimegrama?.data?.id;
        if (tgId) {
          await SendToAdmin(
            `mutation { updateMaap(id: "${newMaapId}", data: { timegrama: "${tgId}" }) { data { id } } }`,
            ADMINMONTHER
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
      });

      console.log('monthi: opened cycle', nextIndex, 'for resource', id);
      opened.push(id);
    } catch (e) {
      console.error('monthi: error processing recurring resource', id, e);
    }
  }

  return opened;
}
