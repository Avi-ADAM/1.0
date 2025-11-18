<script module>
  import {sendToSer} from "$lib/send/sendToSer.js";

    export async function createForum(pid=0,mbId=0,halukId=null,participants=null){
      const da = new Date()
      const dai = da.toISOString()
      
      // אם יש halukId, יוצרים פורום עבור haluka
      if(halukId !== null && halukId !== undefined){
        let d = await sendToSer({pid,da:dai,halukId,participants},'2forumCrHaluka',null,null,false,fetch).then(d=> d = d)
        if(d.data != null){
          return d
        }else{
          console.error(d)
          return "error"
        }
      }
      
      // אחרת, יוצרים פורום עבור mesimabetahalich
      let d = await sendToSer({pid,da:dai,mbId},'2forumCr',null,null,false,fetch).then(d=> d = d)
      if(d.data != null){
        return d
      }else{
        console.error(d)
        return "error"
      }
    }
</script>
