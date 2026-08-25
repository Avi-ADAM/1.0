<script module>
     import { SendToAdmin } from '$lib/server/sendToAdmin.js';
     // Server-only secret — this module is imported only by timegrama/+server.js.
     import { ADMINMONTHER } from '$env/static/private';
     import { strapiClient } from '$lib/server/actions/index.js';
     import { matchOpenMashaabimToUsers } from '$lib/server/matching/engine';

/** Close the clock. Every path that decides not to act ends here. */
async function markDone(taid, why) {
  try {
    await SendToAdmin(
      `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
      ADMINMONTHER
    );
    console.log(`[timegrama/pendM] closed #${taid} — ${why}`);
  } catch (e) {
    console.error('[timegrama/pendM] markDone failed:', e);
  }
}
//get by id
//calculate votes
//if no no create open mission
//archive pend
//else
export async function PendM(id,taid,fetchFn){
    console.log(id,taid)
      let qu = `{
  pmash (id:${id}) {data{ id attributes{
     archived 
}}} 
 }`;
    try {
      let res = await SendToAdmin(qu, ADMINMONTHER).then((res) => (res = res));
      console.log(res);
      if (res.data == null) return markDone(taid, `pmash ${id}: empty response`);
      {
        // `?.` all the way down: a deleted pmash used to throw here, get
        // swallowed by the catch below, and leave the clock open forever.
        const pmashAttrs = res.data.pmash?.data?.attributes ?? null;
        if (pmashAttrs == null) return markDone(taid, `pmash ${id} no longer exists`);
        // Voted through or declined already — nothing left to mature. This is
        // the branch tg#17 and tg#18 fell into, and sat in for ~1040 days.
        if (pmashAttrs.archived === true) return markDone(taid, `pmash ${id} already archived`);
        {
                //cr openm
                let qua = `{
  pmash (id:${id}) {data{ id attributes{
   isYesod isMust name spnot kindOf linkto price descrip easy hm sqadualed sqadualedf recurring cycleSize
        project{data{id}}
                            mashaabim {data{ id}}
  }}}
                }`
 try {
      let res2 = await SendToAdmin(qua, ADMINMONTHER).then((res2) => (res2 = res2));
      console.log(res2);
      if (res2.data != null) {
        console.log(res2.data,"res2 data")
        let d = new Date()
         const date = (res2.data.pmash.data.attributes.sqadualed !== undefined && res2.data.pmash.data.attributes.sqadualed !== "undefined" && res2.data.pmash.data.attributes.sqadualed !== null) ? `sqadualed: "${res2.data.pmash.data.attributes.sqadualed}",` : ``;
        const dates = (res2.data.pmash.data.attributes.sqadualedf !== undefined && res2.data.pmash.data.attributes.sqadualedf !== "undefined" && res2.data.pmash.data.attributes.sqadualedf !== null) ? `sqadualedf: "${res2.data.pmash.data.attributes.sqadualedf}",` : ``;
        // Carry recurring-expense terms onto the auto-created OpenMashaabim so the
        // suggestion / available-resource views can flag it as recurring.
        const recur = (res2.data.pmash.data.attributes.recurring === true) ? `recurring: true, cycleSize: ${parseInt(res2.data.pmash.data.attributes.cycleSize ?? 1, 10) || 1},` : ``;
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
             ${recur}
            }
  ) {data{ id attributes {project{data{ id} }}}}
  updatePmash(
   id: ${res2.data.pmash.data.id}
      data: { 
 archived: true
 }
  ){data{id}}
 } `   
 console.log(qub)
     try {
      let res3 = await SendToAdmin(qub, ADMINMONTHER).then((res3) => (res3 = res3));
      console.log(res3,"res3",id,taid)      
      if (res3.data != null) {
              console.log(res3.data,"res3 data")

              // Silence-approved pmash became a real open resource request —
              // tag users who offer this mashaabim and email them.
              const newOpenMashaabimId = res3.data?.createOpenMashaabim?.data?.id;
              if (newOpenMashaabimId) {
                await matchOpenMashaabimToUsers(String(newOpenMashaabimId), 'resourceCreated', {
                  strapi: strapiClient,
                  fetch: fetchFn || fetch
                });
              }

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
      let res4 = await SendToAdmin(que4, ADMINMONTHER).then((res4) => (res4 = res4));
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