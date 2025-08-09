<script module>
     import { SendTo } from '$lib/send/sendTo.svelte';
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;
//get by id
//calculate votes
//if no no create open mission 
//archive pend
//else 
export async function PendM(id,taid){
    console.log(id,taid)
      let qu = `{
  pmash (id:${id}) {data{ id attributes{
     archived 
}}} 
 }`;
    try {
      let res = await SendTo(qu, VITE_ADMINMONTHER).then((res) => (res = res));
      console.log(res);
      if (res.data != null) {
        console.log(res.data, 'pip');
        if(res.data.pmash.data.attributes.archived != true){// && res.data.pendm.data.attributes.rishon != true){
                //cr openm
                let qua = `{
  pmash (id:${id}) {data{ id attributes{
   isYesod isMust name spnot kindOf linkto price descrip easy hm sqadualed sqadualedf
        project{data{id}}
                            mashaabim {data{ id}}
  }}}
                }`
 try {
      let res2 = await SendTo(qua, VITE_ADMINMONTHER).then((res2) => (res2 = res2));
      console.log(res2);
      if (res2.data != null) {
        console.log(res2.data,"res2 data")
        let d = new Date()
         const date = (res2.data.pmash.data.attributes.sqadualed !== undefined && res2.data.pmash.data.attributes.sqadualed !== "undefined" && res2.data.pmash.data.attributes.sqadualed !== null) ? `sqadualed: "${res2.data.pmash.data.attributes.sqadualed}",` : ``;
        const dates = (res2.data.pmash.data.attributes.sqadualedf !== undefined && res2.data.pmash.data.attributes.sqadualedf !== "undefined" && res2.data.pmash.data.attributes.sqadualedf !== null) ? `sqadualedf: "${res2.data.pmash.data.attributes.sqadualedf}",` : ``;
                let qub = `mutation { createOpenMashaabim(
      data: {project: "${res2.data.pmash.data.attributes.project.data.id}",
             spnot: """${res2.data.pmash.data.attributes.spnot}""",
             name: """${res2.data.pmash.data.attributes.name}""",
             descrip: """${res2.data.pmash.data.attributes.descrip}""",
             kindOf: ${res2.data.pmash.data.attributes.kindOf},
             hm: ${res2.data.pmash.data.attributes.hm},
             price: ${res2.data.pmash.data.attributes.price},
             easy: ${res2.data.pmash.data.attributes.easy},
             linkto: "${res2.data.pmash.data.attributes.linkto}",
             pmash: "${res2.data.pmash.data.id}",
             publishedAt: "${d.toISOString()}",
             isYesod:${res2.data.pmash.data.attributes.isYesod || false},
             isMust:${res2.data.pmash.data.attributes.isMust || false},
             mashaabim: "${res2.data.pmash.data.attributes.mashaabim.data.id}"
             ${date} 
             ${dates}
            }
  ) {data{attributes {project{data{ id} }}}}
  updatePmash(
   id: ${res2.data.pmash.data.id}
      data: { 
 archived: true
 }
  ){data{id}}
 } `   
 console.log(qub)
     try {
      let res3 = await SendTo(qub, VITE_ADMINMONTHER).then((res3) => (res3 = res3));
      console.log(res3,"res3",id,taid)      
      if (res3.data != null) {
              console.log(res3.data,"res3 data")
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
            if (res4.data != null) {
              console.log("succses",id," ",res4.data )
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