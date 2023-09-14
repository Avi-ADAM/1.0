<script context="module">
     import { SendTo } from '$lib/send/sendTo.svelte';
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;
//get by id
//calculate votes
//if no no create open mission 
//archive pend
//else 
export async function Pend(id,taid){
    console.log(id)
      let qu = `{
  pendm (id:${id}) {data{ id attributes{
   rishon  archived 
}}} 
 }`;
    try {
      let res = await SendTo(qu, VITE_ADMINMONTHER).then((res) => (res = res));
      console.log(res);
      if (res.data != null) {
        console.log(res.data, 'pip');
        if(res.data.pendm.data.attributes.archived != true && res.data.pendm.data.attributes.rishon != true){
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
        let d = new Date()
         const date = (res2.data.pendm.data.attributes.sqadualed !== undefined && res2.data.pendm.data.attributes.sqadualed !== "undefined" && res2.data.pendm.data.attributes.sqadualed !== null) ? `start: "${res2.data.pendm.data.attributes.sqadualed}",` : ``;
        const dates = (res2.data.pendm.data.attributes.dates !== undefined && res2.data.pendm.data.attributes.dates !== "undefined" && res2.data.pendm.data.attributes.dates !== null) ? `admaticedai: "${res2.data.pendm.data.attributes.sqadualed.dates}",` : ``;
                let qub = `mutation { createOpenMission(
      data: {project: "${res2.data.pendm.data.attributes.project.data.id}",
             mission:  "${res2.data.pendm.data.attributes.mission.data.id}",
             work_ways: [${res2.data.pendm.data.attributes.work_ways.map(c => c.data.id)}],
             hearotMeyuchadot: "${res2.data.pendm.data.attributes.hearotMeyuchadot}",
             name: "${res2.data.pendm.data.attributes.name}",
                     publishedAt: "${d.toISOString()}",
             descrip: "${res2.data.pendm.data.attributes.descrip}",
             skills: [${res2.data.pendm.data.attributes.skills.map(c => c.data.id)}], 
             tafkidims: [${res2.data.pendm.data.attributes.tafkidims.map(c => c.data.id)}],
             vallues:  [${res2.data.pendm.data.attributes.work_ways.map(c => c.data.id)}],
             noofhours: ${res2.data.pendm.data.attributes.noofhours},
             perhour: ${res2.data.pendm.data.attributes.perhour},   
             privatlinks: "${res2.data.pendm.data.attributes.privatlinks}",
             publicklinks: "${res2.data.pendm.data.attributes.publicklinks}",
            ${date}
            ${dates}
            }
  ) {data{attributes {project{data{ id} }}}}
  updatePendm(
   id: ${res2.data.pendm.data.id}
      data: { 
 archived: true
 }
  ){data{id}}
 } `   
     try {
      let res3 = await SendTo(qu, VITE_ADMINMONTHER).then((res3) => (res3 = res3));
            if (res3.data != null) {
              console.log(res3)
              //update timegrama to done
              let que4 = `mutation { 
             updateTimegrama(
     id: ${taid}
             data:{
              done: true
             }){
              data{id}
             }
              `
               try {
      let res4 = await SendTo(qu, VITE_ADMINMONTHER).then((res4) => (res4 = res4));
            if (res4.data != null) {
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
        }
    }
    
    } catch (e) {
      console.error(e);
    }
    return id
} 
</script>