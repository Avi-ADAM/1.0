//get this hour timegramas
//set timeOut for the exsact time of each
//do verious task base on timegrama kind
import {Pend} from './pend.svelte'
import { PendM } from './pendM.svelte';

import {finiapp} from './finiapp.svelte'
import { Ask } from './ask.svelte';
//ask need to creater 0on first vote or on request if the requester is project member4
//מעביר ראשון ראשון ברסק , אם מישהו ביקש מחכים למענה בעניינו ורק לאחר שיש כן 1 לפחות או לא 1 לפחות  ניתן לקבלו או לא 1 לפחות וניתן להציע לאנשים נוספים, בקשה של הקודם כאשר יש לא נשארת אך ניתן להוסיף עוד סקשות 
import { SendTo } from '$lib/send/sendTo.svelte';
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;
async function x(id,kind,taid, fetch){
    console.log(id,kind,"13 server")
    if (kind == "ask"){
              console.log('here');
      await Ask(id,taid, fetch)
     // console.log("here")
    } else if (kind == 'pendm') {
              await Pend(id,taid);

    }else if(kind == "pmash"){
      await PendM(id,taid)
    }else if(kind == "finiapruval"){
      await finiapp(id,taid)
    }
    
}
export async function GET({ fetch }) {
    let d = new Date();
    let oneHourFromNow = new Date(d.getTime() + 60 * 60 * 1000);
       console.log(oneHourFromNow, 'oneHourFromNow');

    let qu = `{
  timegramas (filters:{done:{ne: true},date: { lte: "${oneHourFromNow.toISOString()}" }}) {data{ id attributes{
    whatami date 
    ask{data{id}} 
    askm{data{id}} 
    askwant{data{id}}
    decision{data{id}}
    finiapruval{data{id}} 
    maap{data{id}} 
    mesimabetahalich{data{id}} 
    pendm{data{id}} 
    tosplit{data{id}} 
    pmash{data{id}} 
    act{data{id}} 
    actt{data{id}} 
    sheirutpend{data{id}}
}}} 
 }
    `; 
 try {
   let res = await SendTo(qu, VITE_ADMINMONTHER).then((res) => (res = res));
   console.log(res,"start 49")
   if (res.data != null) {
     console.log(res.data, 'pip');
     //TODO: check if already worked for this hour --why? if is archived/done it  will not do again
     const all = res.data.timegramas.data;
     if (all.length > 0)
       await Promise.all(all.map(async (element) =>{
        console.log(element, 'element line52');
        const dateof = new Date(element.attributes.date)
        const myid = element.attributes[element.attributes.whatami].data.id;
        const tgid = element.id;
        console.log(dateof,myid, " line56");
        if (d >= dateof) {
          // targetDate has passed, execute function x immediately
          x(myid, element.attributes.whatami, tgid, fetch);
        } else {
          // Calculate the time difference in milliseconds
          const timeDifference = dateof.getTime() - d.getTime();
            console.log(myid, element.attributes.whatami, timeDifference, "line 63 ");
          // Set a timeout to execute function x after the time difference
          setTimeout(function () {
            x(myid, element.attributes.whatami, tgid, fetch);
          }, timeDifference);
        }
       }
       ))
   }
 } catch (e) {
   console.error(e);
 }

  return new Response('Hello Cron!');
}

