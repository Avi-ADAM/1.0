<script module>
  // Automatic finiapruval close after timegrama deadline passes

  import { SendToAdmin } from '$lib/server/sendToAdmin.js';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { ADMINMONTHER } from '$env/static/private';

  export async function finiapp(id, taid) {
    console.log('finiapp auto-close', id);
    const d = new Date();

    // Fetch finiapruval with all data needed to decide close path
    const qu = `{ finiapruval(id: ${id}) { data { id attributes {
      archived isTimerSave noofhours missname why iskvua month
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
      if (!res?.data?.finiapruval?.data) return;

      const fini = res.data.finiapruval.data;
      const fa = fini.attributes;

      if (fa.archived) return;

      // Check that all votes are yes (auto-close: no new vote added, just trigger deadline)
      const vots = fa.vots ?? [];
      const hasNo = vots.some(v => v.what === false);
      if (hasNo) {
        console.log('finiapp: has negative vote, skipping auto-close', id);
        return;
      }

      const isTimerSave = fa.isTimerSave === true;
      const mba = fa.mesimabetahalich.data;
      const mbaa = mba.attributes;
      const noofhours = fa.noofhours ?? 0;
      const perhour = mbaa.perhour ?? 0;
      const projectId = fa.project.data.id;
      const userId = fa.users_permissions_user.data.id;

      let finnishedMissionMutation = '';

      if (isTimerSave) {
        // Timer save: update or create the single active FinnishedMission (isNotFinished:true)
        const existingFm = mbaa.finnished_missions?.data?.[0];

        if (existingFm) {
          const newHours = (existingFm.attributes.noofhours ?? 0) + noofhours;
          finnishedMissionMutation = `
            updateFinnishedMission(id: "${existingFm.id}", data: {
              noofhours: ${newHours},
              total: ${newHours * perhour}
            }) { data { id } }
            updateMesimabetahalich(id: "${mba.id}", data: {
              totalHoursSaved: ${(mbaa.totalHoursSaved ?? 0) + noofhours}
            }) { data { id } }
          `;
        } else {
          finnishedMissionMutation = `
            createFinnishedMission(data: {
              missionName: "${fa.missname}",
              why: "${fa.why ?? 'timer save'}",
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
        // Mission completion: create final FinnishedMission + mark mission done
        const existingFms = mbaa.finnished_missions?.data ?? [];
        const accumulatedHours = existingFms.reduce((sum, fm) => sum + (fm.attributes?.noofhours ?? 0), 0);
        const totalHours = accumulatedHours + noofhours;

        finnishedMissionMutation = `
          createFinnishedMission(data: {
            missionName: "${fa.missname}",
            why: "${fa.why ?? ''}",
            noofhours: ${totalHours},
            mesimabetahalich: "${mba.id}",
            mission: "${mbaa.mission.data.id}",
            perhour: ${perhour},
            total: ${totalHours * perhour},
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
