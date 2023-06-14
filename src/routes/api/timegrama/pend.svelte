<script context="module">
     import { SendTo } from '$lib/send/sendTo.svelte';
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;
//get by id
//calculate votes
//if no no create open mission 
//archive pend
//else 
export async function Pend(id){
    console.log(id)
      let qu = `{
  pendm (id:${id}) {data{ id attributes{
     users { what order why id users_permissions_user {data{id }}}
    nego { noofhours perhour users_permissions_user {data {id}}}
    diun {what why id order users_permissions_user {data{ id}}}  archived 
}}} 
 }`;
    try {
      let res = await SendTo(qu, VITE_ADMINMONTHER).then((res) => (res = res));
      console.log(res);
      if (res.data != null) {
        console.log(res.data, 'pip',res.data.pendm.data.attributes.diun);
        if(res.data.pendm.data.attributes.archived != true){
            if(!res.data.pendm.data.attributes.users?.map(c => c.what).includes(false) && res.data.pendm.data.attributes.users.length  > 0 && !res.data.pendm.data.attributes.nego.length  > 0){
                //cr openm
                let qua = `{
  pendm (id:${id}) {data{ id attributes{
    name hearotMeyuchadot descrip noofhours perhour sqadualed privatlinks publicklinks
        project{data{id}}
      skills {data{ id}}
                            tafkidims {data{id }}
                            work_ways {data{id }}
                            mission {data{ id}}
                            vallues {data{ id}}
  }}}
                }`
 try {
      let res2 = await SendTo(qua, VITE_ADMINMONTHER).then((res2) => (res2 = res2));
      console.log(res2);
      if (res2.data != null) {
                let qub = `mutation { createOpenMission(
      data: {project: "${res2.data.pendm.data.attributes.project.data.id}",
             mission:  "${res2.data.pendm.data.attributes.mission.data.id}",
             work_ways: [${res2.data.pendm.data.attributes.work_ways.map(c => c.data.id)}],
             hearotMeyuchadot: "${hearotMeyuchadot}",
             name: "${name}",
                     publishedAt: "${d.toISOString()}",
             descrip: "${descrip}",
             skills: [${res2.data.pendm.data.attributes.skills.map(c => c.data.id)}], 
             tafkidims: [${res2.data.pendm.data.attributes.tafkidims.map(c => c.data.id)}],
             vallues:  [${res2.data.pendm.data.attributes.work_ways.map(c => c.data.id)}],
             noofhours: ${noofhours},
             perhour: ${perhour},   
             privatlinks: "${privatlinks}",
             publicklinks: "${publicklinks}",
             ${date} 
    }
  ) {data{attributes {project{data{ id} }}}}
  updatePendm(
   id: ${pendId}
      data: { 
 archived: true
 }
  ){data{id}}
 } `   
            }
            
    } catch (e) {
      console.error(e);
    }
        }
    }
    }
    } catch (e) {
      console.error(e);
    }
    return id
} 
</script>