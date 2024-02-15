<script context="module">
  import { sendApi } from "$lib/send/sendApi.svelte";
  import {sendToSer} from "$lib/send/sendToSer.svelte";
  import { nowId, updSend } from "$lib/stores/pendMisMes";

    export async function createMessage(id=0,mes="",md={},un=""){
      const da = new Date()
      const dai = da.toISOString()
     let d = await sendToSer({fid:id,fidn:Number(id),da:dai,mes,idL:0},'1chatsend').then(d=> d = d)
     if(d != null){
      //message sended
      nowId.set(d.data.createMessage.data.id)
      updSend(id,0)
      //nutify all subscribers and nutify
      sendApi({pid:md.pid,
        title:{"he":md.projectName+"-"+md.mesimaName+": הודעה חדשה","en":md.projectName+"-"+md.mesimaName+"new Messaage:"},
      body:{"he":un+": "+mes,"en":un+": "+mes}},"nutifyPm")
      return "sucsses"
      }else{
      console.error(d)
      return "error"
     }
  
    }
</script>