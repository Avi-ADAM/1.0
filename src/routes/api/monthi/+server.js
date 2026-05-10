// Monthly reset server: at the start of each month, record how many hours were done
// and reset howmanyhoursalready to 0 for each active monthly mission.
// Approval/FinnishedMission creation is now handled by the timerSave action flow.

import { objToString } from '$lib/func/objToString.svelte';
import { SendTo } from '$lib/send/sendTo.svelte';

const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;

function formatDate(date = new Date()) {
  const year = date.toLocaleString('default', { year: 'numeric' });
  const month = date.toLocaleString('default', { month: '2-digit' });
  const day = date.toLocaleString('default', { day: '2-digit' });
  return [year, month, day].join('-');
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

export async function GET() {
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
    const res = await SendTo(que, VITE_ADMINMONTHER);
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
        const resi = await SendTo(que2, VITE_ADMINMONTHER);
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

        const resis = await SendTo(mutation, VITE_ADMINMONTHER);
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

  return new Response(JSON.stringify(suc));
}
