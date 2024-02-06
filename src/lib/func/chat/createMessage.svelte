<script context="module">
  import {sendToSer} from "$lib/send/sendToSer.svelte";
  import { updSend } from "$lib/stores/pendMisMes";

    export async function createMessage(id=0,mes=""){
      const da = new Date()
      const dai = da.toISOString()
     let d = await sendToSer({fid:id,da:dai,mes,idL:0},'1chatsend').then(d=> d = d)
     if(d != null){
          //message sended
      updSend(id,0)
      return "sucsses"
      }else{
      console.error(d)
      return "error"
     }
  
    }
</script>