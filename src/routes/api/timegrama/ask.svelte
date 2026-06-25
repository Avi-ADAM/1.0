<script module>
  import { SendTo } from '$lib/send/sendTo.svelte';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { ADMINMONTHER } from '$env/static/private';
  import { computeNegoGate, normId } from '$lib/server/nego/negoGate';

  export async function Ask(id, taid, fetch) {
    console.log(id, taid, 'ask compo started');
    let d = new Date();
    // Fetch the candidacy: vots (with order, for the round gate), the taker, the
    // project members, and the negotiation rounds (latest first) — everything the
    // shared bilateral gate needs.
    let qu = `{
  ask (id:${id}) {data{ id attributes{
    archived
    vots{what order users_permissions_user {data {id}}}
    project{data{id attributes{ user_1s{data{id}}}}}
    users_permissions_user{data{id attributes{username}}}
    negopendmissions(sort: "ordern:desc"){data{attributes{
      ordern proposedBy name descrip hearotMeyuchadot noofhours perhour date dates
      tafkidims{data{id}}
    }}}
}}}
 }`;
    try {
      let res = await SendTo(qu, ADMINMONTHER).then((res) => (res = res));
      if (res.data == null || res.data.ask?.data == null) return;
      const a = res.data.ask.data.attributes;

      // Already resolved → just close the timegrama.
      if (a.archived === true) {
        await markDone(taid);
        return;
      }

      const vots = (a.vots || []).map((v) => ({
        what: v.what,
        order: v.order,
        users_permissions_user: normId(v.users_permissions_user),
      }));
      const rounds = (a.negopendmissions?.data || []).map((r) => ({
        ordern: r.attributes?.ordern,
        proposedBy: r.attributes?.proposedBy,
      }));
      const takerId = normId(a.users_permissions_user);
      const memberIds = (a.project?.data?.attributes?.user_1s?.data || []).map((m) => String(m.id));

      const gate = computeNegoGate({ rounds, vots, takerId, memberIds });
      if (!gate.approvable) {
        // Not agreed by both sides (member objection, or a project counter
        // awaiting the candidate's consent, or a candidate counter awaiting a
        // member's yes). Don't materialize; close — a resuming action recreates
        // a fresh timegrama.
        console.log('ask finalizer: not approvable, closing', id, gate);
        await markDone(taid);
        return;
      }

      // Latest negotiated round (ordern:desc → [0]) overrides the OpenMission
      // baseline for the materialized Mesimabetahalich.
      const latest = a.negopendmissions?.data?.[0]?.attributes ?? null;

      let qua = `{ask (id:${id}) {data{ id attributes{
    open_mission{data{id attributes{hearotMeyuchadot
       tafkidims{data{id}} name privatlinks sqadualed dates howMeny publicklinks descrip noofhours perhour iskvua mission{data{id}}}}}
        }}}
         }`;
      let res2 = await SendTo(qua, ADMINMONTHER).then((res2) => (res2 = res2));
      if (res2.data == null) return;
      const om = res2.data.ask.data.attributes.open_mission.data.attributes;
      const omId = res2.data.ask.data.attributes.open_mission.data.id;

      // Resolve final terms: round value when present, else OpenMission baseline.
      let fName = om.name;
      let fDescrip = om.descrip;
      let fHearot = om.hearotMeyuchadot;
      let fHours = om.noofhours;
      let fPer = om.perhour;
      let fTafkidims = (om.tafkidims?.data || []).map((c) => c.id);
      let fStart = om.sqadualed;
      let fDates = om.dates;
      if (latest) {
        if (latest.name != null) fName = latest.name;
        if (latest.descrip != null) fDescrip = latest.descrip;
        if (latest.hearotMeyuchadot != null) fHearot = latest.hearotMeyuchadot;
        if (latest.noofhours != null) fHours = latest.noofhours;
        if (latest.perhour != null) fPer = latest.perhour;
        if (latest.tafkidims?.data?.length > 0) fTafkidims = latest.tafkidims.data.map((c) => c.id);
        if (latest.date != null) fStart = latest.date;
        if (latest.dates != null) fDates = latest.dates;
      }

      const projectId = res.data.ask.data.attributes.project.data.id;
      const takerUser = res.data.ask.data.attributes.users_permissions_user.data;
      const isMember = memberIds.includes(String(takerUser.id));

      let welcome = ``;
      let adduser = ``;
      if (!isMember) {
        welcome = `createWelcomTop(
            data: {users_permissions_user: "${takerUser.id}",
                  project: "${projectId}"
                  publishedAt: "${d.toISOString()}",
                }
        ) {data{id}}`;
        adduser = `updateProject(
          id: "${projectId}"
         data: {user_1s: [${[...memberIds, takerUser.id]}]}
          ){data{attributes {user_1s{data {id attributes{ email lang}}}}}}`;
      }

      let qub = `mutation
                {
                  createMesimabetahalich(
      data: {project: "${projectId}",
             mission:  "${om.mission.data.id}",
             hearotMeyuchadot: """${fHearot}""",
             name: """${fName}""",
             descrip: """${fDescrip}""",
             hoursassinged: ${fHours},
             perhour: ${fPer},
             iskvua:${om.iskvua},
             privatlinks: """${om.privatlinks}""",
             publicklinks: """${om.publicklinks}""",
             users_permissions_user: "${takerUser.id}",
             tafkidims: [${fTafkidims}],
             publishedAt: "${d.toISOString()}",
             open_missions:[${omId}],
             ${fStart != null ? `start: "${fStart}"` : ''}
             ${fDates != null ? `admaticedai: "${fDates}"` : ''}
                  }
  ) {data{id attributes{project{data{attributes{projectName profilePic{data{attributes{url}}}}}}}}}
                  ${welcome}
                  ${adduser}
updateOpenMission(
  id: "${omId}"
  data: {archived: true}
) {data{id attributes{ archived asks{data{id}}}}}

 updateAsk(
            id: "${id}"
                                data: { archived: true}
                        ){data{id}}

}
`;
      let res3 = await SendTo(qub, ADMINMONTHER).then((res3) => (res3 = res3));
      if (res3.data == null) return;
      let chiluzh = res3.data.createMesimabetahalich.data.id;

      // Recurring mission → spin up its Monter.
      if (om.iskvua == true) {
        const startDate = fStart != null && new Date(fStart) > d ? fStart : d.toISOString();
        let monti = `mutation{
            createMonter(
              data:{
                mesimabetahalich: "${chiluzh}",
                ani: "mesimabetahalich"
                start: "${startDate}"
                ${fDates != null ? `finish: "${fDates}"` : ''}
              }
            ){data{id}}
            }`;
        await SendTo(monti, ADMINMONTHER).catch((e) => console.error(e));
      }

      // Onboarding email to a freshly-joined (non-member) candidate.
      if (!isMember) {
        try {
          let ema = res3.data.updateProject.data.attributes.user_1s.data;
          let emailt, la;
          for (let i = 0; i < ema.length; i++) {
            if (ema[i].id == takerUser.id) {
              emailt = ema[i].attributes.email;
              la = ema[i].attributes.lang;
            }
          }
          let langi = la == 'he' || la == 'en' ? la : 'he';
          let data = {
            user: takerUser.attributes.username,
            projectName: res3.data.createMesimabetahalich.data.attributes.project.data.attributes.projectName,
            projectSrc:
              res3.data.createMesimabetahalich.data.attributes.project.data.attributes.profilePic.data.attributes.url,
            missionName: fName,
            email: emailt,
            lang: langi,
            kind: 'exeptedMission',
          };
          const response = await fetch('/api/sma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          console.log('Success:', response);
        } catch (e) {
          console.error(e);
        }
      }

      // Archive the other (losing) candidates' asks on this mission.
      const otherasks = res3.data.updateOpenMission.data.attributes.asks.data;
      if (otherasks.length > 1) {
        for (let i = 0; i < otherasks.length; i++) {
          if (String(otherasks[i].id) === String(id)) continue;
          let nextquery = `mutation {
                updateAsk(
                       id: "${otherasks[i].id}"
                                data: { archived: true
                            }
                        ){data{id}}
                          }`;
          await SendTo(nextquery, ADMINMONTHER).catch((e) => console.error(e));
        }
      }

      await markDone(taid);
      return 'sucsses' + id;
    } catch (e) {
      console.error(e);
    }
  }

  async function markDone(taid) {
    let que4 = `mutation {
             updateTimegrama(
     id: ${taid}
             data:{
              done: true
             }){
              data{id}
             }
            }`;
    try {
      await SendTo(que4, ADMINMONTHER);
    } catch (e) {
      console.error(e);
    }
  }
</script>
