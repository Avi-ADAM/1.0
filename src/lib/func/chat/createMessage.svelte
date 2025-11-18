<script module>
  import { sendApi } from "$lib/send/sendApi.svelte";
  import {sendToSer} from "$lib/send/sendToSer.js";
  import { nowId, updSend } from "$lib/stores/pendMisMes";

    export async function createMessage(id=0,mes="",md={},un=""){
      const da = new Date()
      const dai = da.toISOString()
     let d = await sendToSer({fid:id,fidn:Number(id),da:dai,mes,idL:0},'1chatsend',null,null,false,fetch).then(d=> d = d)
     if(d != null){
      //message sended
      nowId.set(d.data.createMessage.data.id)
      updSend(id,0)
      //nutify all subscribers and nutify
      console.log("createMessage md:", md);
      const notificationData = {
        pid: md.pid,
        title: {
          "he": (md.projectName || "") + "-" + (md.mesimaName || md.transferDetails || "") + ": הודעה חדשה",
          "en": (md.projectName || "") + "-" + (md.mesimaName || md.transferDetails || "") + " new Message:"
        },
        body: {"he": un + ": " + mes, "en": un + ": " + mes}
      };
      
      // אם יש participants (רשימת משתתפים ספציפית), נשלח רק אליהם
      if (md.participants && Array.isArray(md.participants)) {
        console.log("Adding userIds to notification:", md.participants);
        notificationData.userIds = md.participants;
      } else {
        console.log("No participants found in md, sending to all project users");
      }
      
      sendApi(notificationData, "nutifyPm")
      return "sucsses"
      }else{
      console.error(d)
      return "error"
     }
  
    }
</script>
