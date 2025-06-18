<<<<<<< HEAD
<script module>
    import {sendToSer} from "$lib/send/sendToSer.svelte";
=======
<script context="module">
    import {sendToSer} from "$lib/send/sendToSer.js";
>>>>>>> main
    export async function crTask(pid=0,mbId,assignedId,pendm,open_mission,dateS,dateF,myIshur,shem,des,link,askId){
      const da = new Date()
      const dai = da.toISOString()
     let d = await sendToSer({pid,mbId :mbId ? [mbId] : null,pendm ,open_mission,dateS,dateF,myIshur ,shem,des,link,askId, assignedId: assignedId ? [assignedId] : null,  publishedAt: dai  },'4crtask',null,null,false,fetch).then(d=> d = d)
     if(d.data != null){
      return d
      }else{
      console.error(d)
      return "error"
     }
  
    }
</script>
