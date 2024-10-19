//TODO: security check is that realy the month first day and is it the first run this month
//TODO: find way for implamenting user specific time zone
 //stracture: get all the monthly missions and resorces
 // for each reset the timers and hours count 
 // create an approve request for each.
 function formatDate(date = new Date()) {
   const year = date.toLocaleString('default', { year: 'numeric' });
   const month = date.toLocaleString('default', {
     month: '2-digit'
   });
   const day = date.toLocaleString('default', { day: '2-digit' });

   return [year, month, day].join('-');
 }
import { calcX } from '$lib/func/calcX.svelte';
import { objToString } from '$lib/func/objToString.svelte';
import {SendTo} from '$lib/send/sendTo.svelte';
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER
let que3 = ``
let suc = []
export async function GET(req) {
      //get mesimabetahalich sort by iskvua
 let que = `{
  mesimabetahaliches (filters:{iskvua:{eq: true},forappruval: { eq: false },finnished:{ eq: false }}) {data{ id}} 
 }
    `; 
 try{
 let res = await SendTo(que,VITE_ADMINMONTHER)
 .then (res => res = res);
  if(res.data !=null){
    console.log(res.data ,"pip")
    //for each  creat finiapruval
  //for each update hours
  for (let i = 0; i < res.data.mesimabetahaliches.data.length; i++) {
    const element = res.data.mesimabetahaliches.data[i];
    console.log(element.id);
    const id = element.id;
    //TODO: check if timer not on
    let que2 = `{
  mesimabetahalich (id:${id}) {data{ attributes{admaticedai mission{data{id}} dates hearotMeyuchadot timer monter{monthStart hours isDone hoursDone } project{data{id attributes{restime user_1s{data{id}}}}} howmanyhoursalready name 
  finnished_missions{data{id attributes{noofhours}}} hoursassinged perhour users_permissions_user{data{id}}}}} 
 }
    `; 
   try{
 let resi = await SendTo(que2,VITE_ADMINMONTHER)
 .then (resi => resi = resi);
  if(resi.data != null){
    const resisi = resi.data;
    let d = new Date();
    const at = resisi?.mesimabetahalich.data.attributes;
    console.log(resi.data ,"pip2",at)
   
    //if sdate/admaticedai not passed upd mtaha cr finiappru/fini 
    if(at.dates < d){
    //monther
    let fm = ``
    if (at.howmanyhoursalready != null && at.howmanyhoursalready > 0){
      //TODO: sheirut users
      if (at.project.data.attributes.user_1s.data.length > 1) {
        fm = `
createFiniapruval(
     data: {
      iskvua: true,
      month:"${formatDate(d)}",
      missname: "${at.name}",
      why: "auto monthly appruval",
      noofhours: ${at.howmanyhoursalready},
      mesimabetahalich: ${id},
      project: "${at.project.data.id}",
      publishedAt: "${d.toISOString()}",
      users_permissions_user: "${at.users_permissions_user.data.id}"
}){data {id }}`;
      } else {
        let hr = 0
        if (at.finnished_missions.data != null){
          hr = at.finnished_missions.data.attributes.noofhours;
        }
          fm = `createFinnishedMission(
             data: {
              missionName: "${at.name}",
              why: "auto monthly appruval",
              noofhours: ${hr + at.howmanyhoursalready},
              mesimabetahalich: ${id},
              perhour: ${at.perhour},
              total: ${at.perhour * at.howmanyhoursalready},
              project: ${at.project.data.id},
              descrip: "${at.hearotMeyuchadot}",
              users_permissions_user: "${at.users_permissions_user.data.id}",
              publishedAt: "${d.toISOString()}", 
              mission: ${at.mission.data.id}
   }
){data {id }}`;
      }
    let q = new Date()
    let monter = objToString(at.monter)
  
   que3 = `
    mutation
    {updateMesimabetahalich(
  id: "${id}"
  data: {
    monter: [
      ${monter}
      {
      monthStart: "${formatDate(q)}",
      hours: ${at.hoursassinged},
      isDone: false,
      hoursDone: ${at.howmanyhoursalready}
      }
    ],
    howmanyhoursalready: 0}
) {data{id}}
${fm}
    }
    `;
  console.log(que3)
    try {
      let resis = await SendTo(que3, VITE_ADMINMONTHER) 
      .then (resis => resis = resis);
      if (resis.data != null) {
        console.log('Sucsses! ', resis.data);
        suc.push(id);
        suc = suc;
        if(at.project.data.attributes.user_1s.data.length > 1){
          let x = calcX(at.project.data.attributes.restime)
          let fd = new Date(Date.now() + x)
          let hiluzId = resis.data.createFiniapruval.data.id;
          let quee = `mutation 
                            {createTimegrama(
                 data:{
                   date: "${fd.toISOString()}",
                   whatami: "finiapruval",
                   finiapruval: ${hiluzId},
                 }
               ){
                 data {id}
               }
             }`;
         let resis2 = await SendTo(quee,VITE_ADMINMONTHER)
         .then (resis2 => resis2 = resis2);
         if(resis2.data != null){
          console.log("timegrama created",resis2.data)
         }
        }
      } else{
        //telegram id error
        console.log(resis)
      }
    } catch (e) {
      console.error(e);
    }
  }else{
    console.log("still 0")
  }
  }else{
      console.log("overdated");

  }
   
  }else{
    //telegram nutifi null
  }
} catch (e) {
  console.error(e)
  }
}
}
} catch (e) {
  console.error(e)
  }
    return new Response(Array(suc));
}