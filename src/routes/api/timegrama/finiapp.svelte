<script module>
  // Automatic finiapruval close after timegrama deadline passes

  import { SendToAdmin } from '$lib/server/sendToAdmin.js';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { ADMINMONTHER } from '$env/static/private';
  import { blendedRate, pickRateRow, resolveRate, rowRate, sumRowsValue } from '$lib/timers/rate.js';

  // Free-text the user typed (`why`, `missname`) goes into an inline mutation
  // string, so it has to be escaped. An unescaped quote or newline breaks the
  // whole mutation — and because the input never changes, the retry breaks
  // again every hour, forever. Same helper decision.svelte:17 already makes.
  function gqlStr(s) {
    return JSON.stringify(String(s ?? ''));
  }

  /** Close the clock. Every path that decides not to act ends here. */
  async function markDone(taid, why) {
    try {
      await SendToAdmin(
        `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
        ADMINMONTHER
      );
      console.log(`[timegrama/finiapp] closed #${taid} — ${why}`);
    } catch (e) {
      console.error('[timegrama/finiapp] markDone failed:', e);
    }
  }

  export async function finiapp(id, taid) {
    console.log('finiapp auto-close', id);
    const d = new Date();

    // Fetch finiapruval with all data needed to decide close path
    const qu = `{ finiapruval(id: ${id}) { data { id attributes {
      archived isTimerSave noofhours missname why iskvua month perhour
      timer { data { id attributes { rate } } }
      vots { what users_permissions_user { data { id } } }
      mesimabetahalich { data { id attributes {
        perhour totalHoursSaved
        mission { data { id } }
        project { data { id attributes { user_1s { data { id } } } } }
        finnished_missions(filters: { isNotFinished: { eq: true } }) {
          data { id attributes { noofhours perhour } }
        }
      }}}
      project { data { id } }
      users_permissions_user { data { id } }
      what { data { id } }
    }}}}`;

    try {
      const res = await SendToAdmin(qu, ADMINMONTHER);
      if (!res?.data?.finiapruval?.data) return markDone(taid, `finiapruval ${id} not found`);

      const fini = res.data.finiapruval.data;
      const fa = fini.attributes;

      // Already resolved by an explicit vote. Nothing left to mature — this is
      // how tg#127 sat in the queue for 522 days.
      if (fa.archived) return markDone(taid, `finiapruval ${id} already archived`);

      // Check that all votes are yes (auto-close: no new vote added, just trigger deadline)
      const vots = fa.vots ?? [];
      const hasNo = vots.some(v => v.what === false);
      if (hasNo) {
        // An objection is an answer, and the window it had is over. The clock
        // has nothing more to do; resuming the discussion opens a fresh one.
        return markDone(taid, `finiapruval ${id} has a negative vote`);
      }

      const isTimerSave = fa.isTimerSave === true;
      const mba = fa.mesimabetahalich.data;
      const mbaa = mba.attributes;
      const noofhours = fa.noofhours ?? 0;
      // The rate the hours were worked at, not the mission's value now — the
      // whole reason silence-maturation can fire months later
      // (src/lib/timers/rate.ts).
      const perhour = resolveRate(fa.perhour, fa.timer?.data?.attributes?.rate, mbaa.perhour);
      const fmRows = (mbaa.finnished_missions?.data ?? []).map((fm) => ({
        id: String(fm.id),
        noofhours: Number(fm.attributes?.noofhours ?? 0),
        perhour: fm.attributes?.perhour == null ? null : Number(fm.attributes.perhour)
      }));
      const projectId = fa.project.data.id;
      const userId = fa.users_permissions_user.data.id;

      let finnishedMissionMutation = '';

      if (isTimerSave) {
        // Timer save: accumulate into the active FinnishedMission of this rate era
        const targetRow = pickRateRow(fmRows, perhour);
        const existingFm = targetRow
          ? mbaa.finnished_missions?.data?.find((fm) => String(fm.id) === targetRow.id)
          : null;

        if (existingFm && targetRow) {
          const newHours = (existingFm.attributes.noofhours ?? 0) + noofhours;
          finnishedMissionMutation = `
            updateFinnishedMission(id: "${existingFm.id}", data: {
              noofhours: ${newHours},
              total: ${newHours * rowRate(targetRow, perhour)}
            }) { data { id } }
            updateMesimabetahalich(id: "${mba.id}", data: {
              totalHoursSaved: ${(mbaa.totalHoursSaved ?? 0) + noofhours}
            }) { data { id } }
          `;
        } else {
          finnishedMissionMutation = `
            createFinnishedMission(data: {
              missionName: ${gqlStr(fa.missname)},
              why: ${gqlStr(fa.why ?? 'timer save')},
              noofhours: ${noofhours},
              mesimabetahalich: "${mba.id}",
              mission: "${mbaa.mission.data.id}",
              perhour: ${perhour},
              total: ${noofhours * perhour},
              project: "${projectId}",
              users_permissions_user: "${userId}",
              isNotFinished: true,
              isFinished: false,
              publishedAt: "${d.toISOString()}"
            }) { data { id } }
            updateMesimabetahalich(id: "${mba.id}", data: {
              totalHoursSaved: ${(mbaa.totalHoursSaved ?? 0) + noofhours}
            }) { data { id } }
          `;
        }
      } else {
        // Mission completion: create final FinnishedMission + mark mission done.
        // Every accumulated row keeps its own rate; collapsing them at the
        // mission's current value would re-price the whole history.
        const accumulated = sumRowsValue(fmRows, perhour);
        const totalHours = accumulated.hours + noofhours;
        const totalValue = accumulated.value + noofhours * perhour;

        finnishedMissionMutation = `
          createFinnishedMission(data: {
            missionName: ${gqlStr(fa.missname)},
            why: ${gqlStr(fa.why ?? '')},
            noofhours: ${totalHours},
            mesimabetahalich: "${mba.id}",
            mission: "${mbaa.mission.data.id}",
            perhour: ${blendedRate(totalHours, totalValue, perhour)},
            total: ${totalValue},
            project: "${projectId}",
            users_permissions_user: "${userId}",
            isFinished: true,
            finiapruvals: "${id}",
            publishedAt: "${d.toISOString()}"
          }) { data { id } }
          updateMesimabetahalich(id: "${mba.id}", data: { finnished: true }) { data { id } }
        `;
      }

      const closeMutation = `mutation {
        ${finnishedMissionMutation}
        updateFiniapruval(id: "${id}", data: { archived: true }) { data { id } }
        updateTimegrama(id: ${taid}, data: { done: true }) { data { id } }
      }`;

      const res2 = await SendToAdmin(closeMutation, ADMINMONTHER);
      console.log('finiapp close result', res2);
      if (res2?.data) return 'sucsses' + id;

    } catch (e) {
      console.error('finiapp error', e);
    }
  }
</script>
