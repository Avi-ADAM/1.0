<script module>
  import { sanitizeUserInput } from '$lib/func/uti/sanitizeUserInput.svelte';
     import { SendToAdmin } from '$lib/server/sendToAdmin.js';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { ADMINMONTHER } from '$env/static/private';
  import { strapiClient } from '$lib/server/actions/index.js';
  import { matchOpenMissionToUsers } from '$lib/server/matching/engine';
  import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';
//get by id
//calculate votes
//if no no create open mission
//archive pend
//else
export async function Pend(id,taid,fetchFn){
    console.log(id, "pend compo started")
      let qu = `{
  pendm (id:${id}) {data{ id attributes{
   rishon{data{id}}  archived
   users{ what order users_permissions_user{data{id}} }
  }}}
    }`;
    try {
      let res = await SendToAdmin(qu, ADMINMONTHER).then((res) => (res = res));
      console.log(res,"pend first res", id);
      if (res.data != null) {
        console.log(res.data,"pend first res data");
        const pendAttrs = res.data.pendm?.data?.attributes ?? null;
        if (pendAttrs == null) return id;

        // Already resolved (voted through / declined) → just close the clock,
        // otherwise this timegrama is re-picked by every cron run forever.
        if (pendAttrs.archived === true) {
          await markDone(taid);
          return id;
        }

        // `rishon` is a relation, not a boolean: a pendm proposed FOR a specific
        // person. The rikma's silence matures the proposal, but the mission is
        // still only offered to them — it must not become a public open mission,
        // and it may not be registered on their name without their own yes.
        const assigneeId = pendAttrs.rishon?.data?.id ?? null;

                //cr openm
                let qua = `{
  pendm (id:${id}) {data{ id attributes{
    name hearotMeyuchadot descrip noofhours perhour sqadualed privatlinks publicklinks
    iskvua isMust isYesod isshift howMeny
        project{data{id attributes{restime}}}
      skills {data{ id}}
                            tafkidims {data{id }}
                            work_ways {data{id }}
                            mission {data{ id}}
                            vallues {data{ id}}
  }}}
                }`
                console.log("we go second pend", id)
 try {
      let res2 = await SendToAdmin(qua, ADMINMONTHER).then((res2) => (res2 = res2));
      console.log(res2,"pend  res2");
      if (res2.data != null) {
        console.log(res2.data,"pend  res2 data");
        let d = new Date()
         const date = (res2.data.pendm.data.attributes.sqadualed !== undefined && res2.data.pendm.data.attributes.sqadualed !== "undefined" && res2.data.pendm.data.attributes.sqadualed !== null) ? `sqadualed: "${res2.data.pendm.data.attributes.sqadualed}",` : ``;
        const dates = (res2.data.pendm.data.attributes.dates !== undefined && res2.data.pendm.data.attributes.dates !== "undefined" && res2.data.pendm.data.attributes.dates !== null) ? `dates: "${res2.data.pendm.data.attributes.sqadualed.dates}",` : ``;
        // An assigned proposal keeps its offer closed (archived) and carries the
        // assignment onto the OpenMission, exactly like createMission branch 2.
        const assigned = assigneeId != null
          ? `isRishon: true, rishon: "${assigneeId}", archived: true,`
          : ``;
                let qub = `mutation { createOpenMission(
      data: {
        howMeny:${res2.data.pendm.data.attributes.howMeny ?? 1},
        iskvua:${res2.data.pendm.data.attributes.iskvua ?? false},
         isMust :${res2.data.pendm.data.attributes.isMust ?? false},
         isYesod :${res2.data.pendm.data.attributes.isYesod ?? false},
         isshift:${res2.data.pendm.data.attributes.isshift ?? false},
            pendm: "${res2.data.pendm.data.id}",
            project: "${res2.data.pendm.data.attributes.project.data.id}",
             mission:  "${res2.data.pendm.data.attributes.mission.data.id}",
             work_ways: [${res2.data.pendm.data.attributes.work_ways.data.map(c => c.id)}],
             hearotMeyuchadot: """${res2.data.pendm.data.attributes.hearotMeyuchadot}""",
             name: """${sanitizeUserInput(res2.data.pendm.data.attributes.name)}""",
             publishedAt: "${d.toISOString()}",
             descrip: """${res2.data.pendm.data.attributes.descrip}""",
             skills: [${res2.data.pendm.data.attributes.skills.data.map(c => c.id)}],
             tafkidims: [${res2.data.pendm.data.attributes.tafkidims.data.map(c => c.id)}],
             vallues:  [${res2.data.pendm.data.attributes.vallues.data.map(c => c.id)}],
             noofhours: ${res2.data.pendm.data.attributes.noofhours},
             perhour: ${res2.data.pendm.data.attributes.perhour},
             privatlinks: """${sanitizeUserInput(res2.data.pendm.data.attributes.privatlinks)}""",
             publicklinks: """${sanitizeUserInput(res2.data.pendm.data.attributes.publicklinks)}""",
            ${assigned}
            ${date}
            ${dates}
            }
  ) {data{ id attributes {project{data{ id} }}}}
  updatePendm(
   id: ${res2.data.pendm.data.id}
      data: {
 archived: true
 }
  ){data{id}}
 } `
 console.log(qub,"queri2")
     try {
      let res3 = await SendToAdmin(qub, ADMINMONTHER).then((res3) => (res3 = res3));
      console.log(res3,"pend res3 ",res?.errors?.locations)
      if (res3.data != null) {
              console.log(res3.data,"pend res3 data ,pend line 83 ")

              const newOpenMissionId = res3.data?.createOpenMission?.data?.id;

              if (assigneeId != null) {
                // Offer it to the assignee: an Ask carrying the rikma's yes
                // votes, plus its own response window. Nothing is registered on
                // their name until they agree (see nego/askAcceptance.ts).
                if (newOpenMissionId) {
                  await offerToAssignee({
                    openMissionId: newOpenMissionId,
                    projectId: res2.data.pendm.data.attributes.project.data.id,
                    assigneeId,
                    restime: res2.data.pendm.data.attributes.project.data.attributes?.restime,
                    votes: pendAttrs.users || [],
                    now: d
                  });
                }
              } else if (newOpenMissionId) {
                // Silence-approved pendm became a real open mission — tag
                // matching users with match-suggestions and email them.
                await matchOpenMissionToUsers(String(newOpenMissionId), 'missionCreated', {
                  strapi: strapiClient,
                  fetch: fetchFn || fetch
                });
              }

              //update timegrama to done
              await markDone(taid);
              return "sucsses" + id
            }
 } catch (e) {
      console.error(e);
    }

            }

    } catch (e) {
      console.error(e);
    }
    }

    } catch (e) {
      console.error(e);
    }
    return id
}

/**
 * Open the assignee's candidacy on a freshly matured, assigned OpenMission:
 * an Ask seeded with the rikma's approving votes (so the members' side is
 * already on the table) and a fresh timegrama. The bilateral gate
 * (computeNegoGate with takerApplied:false) then holds it until the assignee
 * says yes, counters, or the window closes.
 */
async function offerToAssignee({ openMissionId, projectId, assigneeId, restime, votes, now }) {
  try {
    const round = (votes || []).reduce((max, v) => Math.max(max, Number(v?.order ?? 0)), 0);
    const yesVoters = [
      ...new Set(
        (votes || [])
          .filter((v) => v?.what === true && Number(v?.order ?? 0) === round)
          .map((v) => v?.users_permissions_user?.data?.id)
          .filter(Boolean)
          .map(String)
      )
    ];
    const vots = yesVoters
      .map(
        (uid) =>
          `{what: true, users_permissions_user: ${uid}, order: 0, ide: ${uid}, zman: "${now.toISOString()}"}`
      )
      .join(',');
    const deadline = new Date(Date.now() + calcDeadlineMs(restime ?? 'feh')).toISOString();

    const que = `mutation {
      createAsk(data: {
        open_mission: "${openMissionId}",
        project: "${projectId}",
        users_permissions_user: "${assigneeId}",
        publishedAt: "${now.toISOString()}",
        vots: [${vots}]
      }) {data{id}}
    }`;
    const res = await SendToAdmin(que, ADMINMONTHER);
    const askId = res?.data?.createAsk?.data?.id;
    if (!askId) return;

    await SendToAdmin(
      `mutation {
        createTimegrama(data: { date: "${deadline}", whatami: "ask", ask: "${askId}" }) {data{id}}
      }`,
      ADMINMONTHER
    );
  } catch (e) {
    console.error('pend: failed to open the assignee candidacy', e);
  }
}

async function markDone(taid) {
  try {
    await SendToAdmin(
      `mutation {
        updateTimegrama(id: ${taid} data: { done: true }) {data{id}}
      }`,
      ADMINMONTHER
    );
  } catch (e) {
    console.error(e);
  }
}
</script>
