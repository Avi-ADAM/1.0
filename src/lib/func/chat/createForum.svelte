<script context="module">
  import {sendToSer} from "$lib/send/sendToSer.js";

    export async function createForum(pid=0,mbId=0){
      const da = new Date()
      const dai = da.toISOString()
     let d = await sendToSer({pid,da:dai,mbId},'2forumCr',null,null,false,fetch).then(d=> d = d)
     if(d.data != null){
      return d
      }else{
      console.error(d)
      return "error"
     }
  
    }
</script>
