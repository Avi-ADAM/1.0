//get this hour timegramas
//set timeOut for the exsact time of each
//do verious task base on timegrama kind
import {Pend} from './pend.svelte'
import {finiapp} from './finiapp.svelte'
import { Ask } from './ask.svelte';

import { SendTo } from '$lib/send/sendTo.svelte';
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;
async function x(id,kind){
    console.log(id,kind)
    if (kind == "ask"){
              console.log('here');
      await Ask(id)
      console.log("here")
    } else if (kind == 'pendm') {
              await Pend(id);

    }
    
}
export async function GET() {
    let d = new Date();
    let oneHourFromNow = new Date(d.getTime() + 60 * 60 * 1000);
       console.log(oneHourFromNow);

    let qu = `{
  timegramas (filters:{done:{ne: true},date: { lte: "${oneHourFromNow.toISOString()}" }}) {data{ id attributes{
    whatami date ask{data{id}} 
    askm{data{id}} 
    decision{data{id}}
    finiapruval{data{id}} 
    maap{data{id}} 
    mesimabetahalich{data{id}} 
    pendm{data{id}} 
    tosplit{data{id}} 
    pmash{data{id}} 
    act{data{id}} 
    actt{data{id}} 
}}} 
 }
    `; 
 try {
   let res = await SendTo(qu, VITE_ADMINMONTHER).then((res) => (res = res));
   console.log(res)
   if (res.data != null) {
     console.log(res.data, 'pip');
     //TODO: check if already worked for this hour
     const all = res.data.timegramas.data;
     if (all.length > 0)
       await Promise.all(all.map(async (element) =>{
        console.log(element)
        const dateof = new Date(element.attributes.date)
        const myid = element.attributes[element.attributes.whatami].data.id;
        console.log(dateof,myid);
        if (d >= dateof) {
          // targetDate has passed, execute function x immediately
          x(myid, element.attributes.whatami);
        } else {
          // Calculate the time difference in milliseconds
          const timeDifference = dateof.getTime() - d.getTime();
            console.log(myid, element.attributes.whatami, timeDifference);
          // Set a timeout to execute function x after the time difference
          setTimeout(function () {
            x(myid, element.attributes.whatami);
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

