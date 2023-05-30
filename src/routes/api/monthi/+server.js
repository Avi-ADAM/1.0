//TODO: security check is that realy the month first day and is it the first run this month
//TODO: find way for implamenting user specific time zone
 //stracture: get all the monthly missions and resorces
 // for each reset the timers and hours count 
 // create an approve request for each.
import {SendTo} from '$lib/send/sendTo.svelte';
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER

export async function GET(req) {
      //get mesimabetahalich sort by iskvua
 let que = `{
  mesimabetahaliches (filters:{iskvua:{eq: true}}) {data{ id}} 
 }
    ` 
 try{
 let res = await SendTo(que,VITE_ADMINMONTHER)
 .then (res => res = res);
  if(res.data !=null){
    console.log(res.data ,"pip")
    //for each  creat finiapruval
  //for each update hours
  for (let i = 0; i < res.data.length; i++) {
    const element = res.data[i];
    console.log(element.id);
  }
  }else{
  }
}  catch (e) {
  console.error(e)
  }
    return new Response;
}
