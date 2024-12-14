<script context="module">
  //archive finniapruval
  //else

  import { SendTo } from '$lib/send/sendTo.svelte';
  const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;
  export async function finiapp(id, taid) {
    console.log(id);
    //get by id

    let d = new Date();
    let qu = `{
  finiapruval (id:${id}) {data{ id attributes{
    vots{what users_permissions_user {data {id}}} 
    archived noofhours missname why iskvua
    mesimabetahalich{data{id attributes{ perhour mission{data{id}}}}}
    project{data{id}}
    what{data{id}}
    users_permissions_user{data{id}}
    month
    finnished_mission{data{id attributes{ noofhours perhour total isFinished iskvua}}}
}}} 
 }`;
    try {
      let res = await SendTo(qu, VITE_ADMINMONTHER).then((res) => (res = res));
      console.log(res);
      if (res.data != null) {
        console.log(res.data, 'pip');
        if (res.data.finiapruval.data.attributes.archived != true) {
          //calculate votes if there is false
          if (res.data.finiapruval.data.attributes.vots.length > 0) {
            if (
              !res.data.finiapruval.data.attributes.vots
                .map((c) => c.what)
                .includes(false)
            ) {
              //if no no
              //check for finished mision and update it if no create finnished mission
          
                let qub2 = `mutation {
                                  createFinnishedMission(
                                    data: {
                                    publishedAt: "${d.toISOString()}",
                                      finiapruvals: "${res.data.finiapruval.data.id}",
                                      missionName: "${res.data.finiapruval.data.attributes.missname}",
                                      project: "${res.data.finiapruval.data.attributes.project.data.id}",
                                      perhour: ${res.data.finiapruval.data.attributes.mesimabetahalich.data.attributes.perhour},
                                      noofhours: ${res.data.finiapruval.data.attributes.noofhours ?? 0},
                                      total: ${(res.data.finiapruval.data.attributes.noofhours * res.data.finiapruval.data.attributes.mesimabetahalich.data.attributes.perhour) ?? 0},
                                     ${res.data.finiapruval.data.attributes.iskvua === true ? `iskvua: true
                                      isFinished: false,
                                      month: "${res.data.finiapruval.data.attributes.month}",` : ``} 
                                      mission: "${res.data.finiapruval.data.attributes.mesimabetahalich.data.attributes.mission.data.id}",
                                      why: "${res.data.finiapruval.data.attributes.why}",
                                      mesimabetahalich: "${res.data.finiapruval.data.attributes.mesimabetahalich.data.id}",
                                      users_permissions_user: "${res.data.finiapruval.data.attributes.users_permissions_user.data.id}",
                                      ${res.data.finiapruval.data.attributes.what.data?.id ? `what: ${res.data.finiapruval.data.attributes.what.data.id}` : ``},
                                    }
                                  ){data{id}}
                                  updateFiniapruval(
                                    id: "${id}"
                                    data: {
                                      archived: true
                                    }
                                  ){data{id}}
                                  updateTimegrama(
                                    id: ${taid}
                                    data: {
                                      done: true
                                    }
                                  ){data{id}}
                                }`;
                    try {
                      let res3 = await SendTo(qub2, VITE_ADMINMONTHER).then(
                        (res3) => (res3 = res3)
                      );
                      console.log(res3, 'finiapp res3');
                     
                      if (res3.data != null) {
                        return 'sucsses' + id;
                      }
                    } catch (e) {
                      console.error(e);
                    }
              }
            }
          }
        }
      
    } catch (e) {
      console.error(e);
    }
  }
</script>
