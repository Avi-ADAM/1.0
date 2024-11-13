<script module>
  import { sanitizeUserInput } from '$lib/func/uti/sanitizeUserInput.svelte';
     import { SendTo } from '$lib/send/sendTo.svelte';
  const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;
//get by id
//calculate votes
//if no no create open mission 
//archive pend
//else 
export async function Pend(id,taid){
    console.log(id, "pend compo started")
      let qu = `{
  pendm (id:${id}) {data{ id attributes{
   rishon{data{id}}  archived 
  }}} 
    }`;
    try {
      let res = await SendTo(qu, VITE_ADMINMONTHER).then((res) => (res = res));
      console.log(res,"pend first res", id);
      if (res.data != null) {
        console.log(res.data,"pend first res data");
        if(res.data.pendm.data.attributes.archived != true && res.data.pendm.data.attributes.rishon != true){
                //cr openm
                let qua = `{
  pendm (id:${id}) {data{ id attributes{
    name hearotMeyuchadot descrip noofhours perhour sqadualed privatlinks publicklinks
    iskvua isMust isYesod isshift howMeny
        project{data{id}}
      skills {data{ id}}
                            tafkidims {data{id }}
                            work_ways {data{id }}
                            mission {data{ id}}
                            vallues {data{ id}}
  }}}
                }`
                console.log("we go second pend", id)
 try {
      let res2 = await SendTo(qua, VITE_ADMINMONTHER).then((res2) => (res2 = res2));
      console.log(res2,"pend  res2");
      if (res2.data != null) {
        console.log(res2.data,"pend  res2 data");
        let d = new Date()
         const date = (res2.data.pendm.data.attributes.sqadualed !== undefined && res2.data.pendm.data.attributes.sqadualed !== "undefined" && res2.data.pendm.data.attributes.sqadualed !== null) ? `sqadualed: "${res2.data.pendm.data.attributes.sqadualed}",` : ``;
        const dates = (res2.data.pendm.data.attributes.dates !== undefined && res2.data.pendm.data.attributes.dates !== "undefined" && res2.data.pendm.data.attributes.dates !== null) ? `dates: "${res2.data.pendm.data.attributes.sqadualed.dates}",` : ``;
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
 console.log(qub,"queri2")
     try {
      let res3 = await SendTo(qub, VITE_ADMINMONTHER).then((res3) => (res3 = res3));
      console.log(res3,"pend res3 ",res?.errors?.locations)     
      if (res3.data != null) {
              console.log(res3.data,"pend res3 data ,pend line 83 ")
              //update timegrama to done
              let que4 = `mutation { 
             updateTimegrama(
     id: ${taid}
             data:{
              done: true
             }){
              data{id}
             }
            }
              `
               try {
      let res4 = await SendTo(que4, VITE_ADMINMONTHER).then((res4) => (res4 = res4));
      console.log(res4,"pend res4 ")      
      if (res4.data != null) {
              console.log(res4.data,"pend res4 ")      

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