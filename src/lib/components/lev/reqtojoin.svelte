<script>
  import ProgressBar from "@okrad/svelte-progressbar";
 import { goto, prefetch } from '$app/navigation';

  import {
    clickOutside
} from './outsidclick.js';

import {
    fly
} from 'svelte/transition';
import {
    createEventDispatcher
} from 'svelte';

const dispatch = createEventDispatcher();
export let shows = false;
export let deadline;
export let projectName;
export let openmissionName;
export let role;
export let skills;
export let useraplyname;
export let src = "coin.png";
export let src2 = " ";
export let projectId;
export let link = "/project/";
export let linkU = "/user/";
export let userId;
export let missionDetails = "";
export let name;
export let noofpu = 0;
export let publicklinks;
export let privatlinks;
export let hearotMeyuchadot;
export let nhours = 0;
export let valph = 0;
export let missId;
export let id;
export let openMid;
export let st = 188;
export let declined = [];
export let noofusersWaiting;
export let uids;
export let what;
export let noofusersOk;
export let noofusersNo;
export let already = false;
let resP = [];
let lang;
export let stylef = '24px';
export let askId;
export let users;
     function percentage(partialValue, totalValue) {
   return (100 * partialValue) / totalValue;
} 
let ok;
let nook;
let tryo = "115%";
let tryot = "-10.5%";
let tryoti = "-5.25%";
let nut;
async function xyz (){

ok =  percentage(noofusersOk, noofpu)
nook = percentage(noofusersNo, noofpu) 
nut = percentage(noofusersWaiting, noofpu) 

let ser = [];
 ser.push({
perc: ok,
color: '#7EE081'
}) 

if (nut > 0){
  ser.push({
perc: nut,
color: '#0000cc'
}) 
}
if (nook > 0){
  ser.push({
 perc: nook,
  color: '#80037e'
}) 
}
if (nut > 0 && nook > 0){
  tryo = "129%"
  tryot = "-17%"
  tryoti = "-11.5%"
}
ser = ser
return ser
}

let ser = xyz();
    

let idL;
let bearer1; 
let token;
  
$: ucli = 0
$: pcli = 0
$: pmcli = 0
function linke (s){
 if (s == "u"){
 ucli += 1
 if(ucli >= 2){
  dispatch("user", {id: userId});
   }
  }else if (s == "p"){
    pcli += 1;
    if(pcli >= 2){
        dispatch("proj", {id: projectId});
    }
  }
}
  function project (id) {
      pmcli += 1;
    if(pmcli >= 2){
    idPr.set(id);
    goto("/moach")
    }
  };
import { Swiper, SwiperSlide } from "swiper/svelte";

  // Import Swiper styles
  import "swiper/css";

  import "swiper/css/effect-flip";
  import "./style.css";

  // import required modules
  import { EffectFlip, Navigation } from "swiper";
   let swiperRef = null;

  const setSwiperRef = ({ detail }) => {
    const [swiper] = detail;
    // set swiper instance
    setTimeout(() => {
      swiperRef = swiper;
    });
  };

  
  const slideTo = (index) => {
    swiperRef.slideTo(index , 400);
  };
 function toggleShow (){
  slideTo(0)
 }
let error1;
let miDatan = [];
let linkg = 'https://onelovevone.onrender.com/graphql';

function objToString (obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
        
    for (const [p, val] of Object.entries(obj[i])) {
        if (typeof(val) == "string"|"number"|"boolean") {
        str += `{${p}:${val}\n},`;
    } else if (typeof(val) == 'null'){
                str += `{${p}:${val.map(c => c.id)}\n},`;
    }
    }}
    return str;
}
    const userss = objToString(users)
let welcome = ``;
let adduser = ``;
let adduser2 = ``;
async function agree() {
    already = true;
     noofusersOk += 1;
  noofusersWaiting -= 1;
  ser = xyz();
    const date = (deadline !== undefined) ? ` admaticedai: ${deadline}` : ``;
        const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
    const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    idL = cookieValueId;
     console.log(idL);
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
    uids.push(userId);
    uids = uids;
    console.log(uids);
    if (uids.includes(userId)){
        welcome = ``;
        adduser2 = ``;
        adduser = ``;
        console.log(welcome, "member");
    } else {
        welcome = `createWelcomTop(
  input: {
    data: {users_permissions_user: "${userId}",
          project: "${projectId}"}
        }
) {welcomTop{id}}`;
adduser = `updateProject(
input: {
  where: {id: "${projectId}"}
 data: {user_1s: ["${idL}","${userId}"]}
}
  ){project {user_1s {id}}}`;
        adduser2 = `updateProject(
input: {
  where: {id: "${projectId}"}
 data: {user_1s: ${uids}}
}
  ){project {user_1s {id}}}`
        console.log(welcome, "not member");

    }
    //add to pr users create missioninprogres, create welcom ballun;  first check for no of pr users and full consent ,(delete or save for refernce but put archive ) openM and asked 
    if (noofpu === 1) {
        console.log("agree, ecsepted")
        
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        { createMesimabetahalich(
    input: {
      data: {project: "${projectId}",
             mission:  "${missId}",
             hearotMeyuchadot: "${hearotMeyuchadot}",
             name: "${openmissionName}",
             descrip: "${missionDetails}",
             hoursassinged: ${nhours},
             perhour: ${valph},   
             privatlinks: "${privatlinks}",
             publicklinks: "${publicklinks}", 
             users_permissions_user: "${userId}",
            ${date}
                  }
    }
  ) {mesimabetahalich{project{id }}}

updateOpenMission(
  input:  {
    where: {id: "${openMid}"}
  data: {archived: true}
}
) {openMission{id archived}}
${welcome}
${adduser}
 updateAsk(
                            input:{
                                where: {id: "${askId}" }
                                data: { archived: true,
                                    vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){ask{id}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('acsept', {
                asked: id
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }

    } else if (noofpu - 1 === noofusersOk) {
            console.log("create new as above and add vote and archive asked")
    
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        { createMesimabetahalich(
    input: {
      data: {project: "${projectId}",
             mission:  "${missId}",
             hearotMeyuchadot: "${hearotMeyuchadot}",
             name: "${openmissionName}",
             descrip: "${missionDetails}",
             hoursassinged: ${nhours},
             perhour: ${valph},   
             privatlinks: "${privatlinks}",
             publicklinks: "${publicklinks}", 
             users_permissions_user: "${userId}",
            ${date}
                  }
    }
  ) {mesimabetahalich{project{id }}}

updateOpenMission(
  input:  {
    where: {id: "${openMid}"}
  data: {archived: true}
}
) {openMission{id archived}}
${welcome}
${adduser2}
 updateAsk(
                            input:{
                                where: {id: "${askId}" }
                                data: { archived: true,
                                    vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){ask{id}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('acsept', {
                asked: id
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }
        } else {

        console.log("just add vote to asked and update to not show for me again")
         try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        {
                            updateAsk(
                            input:{
                                where: {id: "${askId}" }
                                data: { vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){ask{id}}
                     
                    }
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('acsept', {
                asked: id
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }

    }
    }
;

function ask() {
    console.log("nego")
    // plain text? list? terms???
}

async function decline() {
        already = true;
 noofusersNo += 1;
  noofusersWaiting -= 1;
  ser = xyz();
const declineda = declined.map(c => c.id)
    declineda.push(userId)
        console.log("decline1");

    // delete asked coin forever but keep asked on user ////matrix(1, 0, 0, 1, -61.718609, -47.72295)
        if (noofpu === 1) {
    console.log("decline2");
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
    const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    idL = cookieValueId;
    console.log(idL);
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    //add already declined ids
                    body: JSON.stringify({
                        query: `mutation 
                        { 
updateOpenMission(
  input: {
    where: {id: "${openMid}"}
  data: {declined: [${declineda}]}
}
) {openMission{id declined {id}}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('decline', {
                asked: id
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }
        } else if (noofpu > 1 ) { 
    console.log("if another uprove explain why you decline")

        }
}
let hovered = false;

 $: w = 0;
 let   u = " הצבעה על בקשה לביצוע משימה והצטרפות לרקמה"
function hover (id){
  if (id == "0"){
 u = " הצבעה על בקשה לביצוע משימה והצטרפות לרקמה"
  } else {
    u = id
  }
    dispatch("hover", {id: u});

}
function hoverede(){
   hovered = !hovered
    if (hovered == false){
    u = "לב המערכת"
  } else {
 u = " הצבעה על בקשה לביצוע משימה והצטרפות לרקמה"
  }
  dispatch("hover", {id: u});
 }
</script>
{#await ser}
<h1>..</h1>
{:then ser}
<div 
style="position: relative;" 
style:z-index={hovered === false ? 1 : 6} 
on:mouseenter={()=> hoverede()} 
on:mouseleave={()=> hoverede()}
use:clickOutside on:click_outside={toggleShow} 
class="hover:scale-290 duration-1000 ease-in"  transition:fly|local={{y: 250, opacity: 0.9, duration: 2000} }>

<Swiper  dir="rtl"
  on:swiper={setSwiperRef}
  effect={"flip"}

  grabCursor={true}
  modules={[EffectFlip, Navigation]}
  flipEffect={{ slideShadows: false}}
  class="mySwiper"
  navigation={{
    nextEl: `.normSml${askId}-noo`,
    prevEl: `.normSmll${askId}-noo`,
  }}
>
<div
 bind:clientWidth={w}
  style:width={tryo}
   style:top={tryot}
    style:left={tryoti}
     style="position:absolute;">
  <ProgressBar cls="transition: all 1000ms ease-in-out;" 
  series={ser} 
  width={w} 
  textSize={0}  
  thickness={4}  
  style="radial"/>  
</div>
  <SwiperSlide ><div id="normSml" >
<div
    style="--the:{stylef};">
        <svg  version="1.1" viewBox="-106 -106 212 212" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="lgg" x1="1" y1="1" spreadMethod="pad">
                    <stop offset="0" style="stop-color: rgb(243, 71, 255);"/>
                        <stop offset="1" style="stop-color: rgb(173, 241, 255);"/>
                            </linearGradient>
                            <linearGradient id="lgbg" x1="1" y1="1">
                                <stop offset="0" style="stop-color: rgb(185, 185, 255);"/>
                                    <stop offset="1" style="stop-color: rgb(0, 170, 170);"/>
                                        </linearGradient>
                                        </defs>
                                        <circle r="100" fill="url(#lgg)" transform="rotate(135)" stroke="url(#lgbg)" stroke-width="6" style="fill-rule: nonzero; paint-order: fill;"/>
                                         <circle r="80" fill="url(#lgg)" transform="rotate(315)" stroke="none"/>
                                               
                                                         <g on:click={()=>linke("u")} on:mouseenter={()=>hover(` לחיצה כפולה לצפיה בעמוד הפרופיל של ${useraplyname}`)} on:mouseleave={()=>hover("0")} x='0' y='40' style="margin-top: 2px; margin-bottom: 2px" >
                                                <foreignObject  x='0' y='0' width='56px' height='56px' transform="translate(-28,-28)" >
                                                   <span class="{`normSml${askId}-noo`}"></span>
                                                    <img
                                                        width='56px'
                                                        height='56px'
                                                        alt={useraplyname}
                                                        src={src}
                                                        style="border-radius: 50%;"
                                                        /> 
                                                     </foreignObject>     
                                                            <text fill="#EEE8AA " text-anchor="middle" x='0' y='46' style="margin: 2px; font-size: 24px; line-height: 1; font-weight: bold;">{useraplyname}</text>
                                                    </g>        

                                            
                                                <path id="curvee" d="M -79.587 0 C -81.732 -2.923 -75.008 -81.366 0 -80.446 C 74.342 -79.534 81.282 -3.522 80.257 0"/>
                                                    <text color="#EEE8AA" width="208.55" x="-90" y="-90" style="white-space: pre-wrap;">
                                                        <textPath on:mouseenter={()=>hover("שם המשימה")} on:mouseleave={()=>hover("0")} font-family="Rubik" color="#EEE8AA" x="-90" y="-90" class="curved-text" startOffset={st} xlink:href="#curvee">
                                                            {openmissionName}
                                                        </textPath>
                                                    </text>
                                              <g on:click={()=>linke("p")} on:mouseenter={()=>hover("לחיצה כפולה לצפיה בעמוד הציבורי של הריקמה")} on:mouseleave={()=>hover("0")}  x="0" y="-40" >
                                                    <text fill="#FF0092" text-anchor="middle"  x="0" y="-29"   style="font-size: 15px; line-height: 1; font-weight: bold; white-space: pre;">{projectName}</text>  </g>  
                                                    <foreignObject x='0' y='-60 ' width='40px' height='40px' transform="translate(-20,-20)" >
                                                        <button on:click={()=>project()} on:mouseenter={()=>hover(` לחיצה כפולה למעבר למוח ריקמת ${projectName}`)} on:mouseleave={()=>hover("0")}>
                                                    <img style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src2} width="40" height="40" alt="projectlogo" >
                                                        </button>
                                                </foreignObject>
                                              
                                         <!--     <g  x='-90' y='0' width="29" height="29">
<path fill="currentColor" d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 48c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m140.204 130.267l-22.536-22.718c-4.667-4.705-12.265-4.736-16.97-.068L215.346 303.697l-59.792-60.277c-4.667-4.705-12.265-4.736-16.97-.069l-22.719 22.536c-4.705 4.667-4.736 12.265-.068 16.971l90.781 91.516c4.667 4.705 12.265 4.736 16.97.068l172.589-171.204c4.704-4.668 4.734-12.266.067-16.971z"></path>
                                                  </g> -->   
                                                </svg>
                                               
                                                    </div>

</div>
</SwiperSlide
  > <SwiperSlide
    > <div  id="normSmll"
>
        {#if deadline}    <h5 on:mouseenter={()=>hover("תאריך הביצוע")} on:mouseleave={()=>hover("0")} class="hslink ab {`normSmll${askId}-noo`}">{deadline.toLocaleDateString()}</h5>{/if}
         {#if missionDetails}   <h6 on:mouseenter={()=>hover("פרטי המשימה")} on:mouseleave={()=>hover("0")} class="hslink bc">{missionDetails}</h6>{/if}
        
  <h5 on:mouseenter={()=>hover("תפקיד")} on:mouseleave={()=>hover("0")} class="hslink cd">{role}</h5>

            <h6 on:mouseenter={()=>hover("כישורים נדרשים")} on:mouseleave={()=>hover("0")} class="hslink de">{skills}</h6>
                   <p class="vo ef"><span on:mouseenter={()=>hover("סך ההצבעות בעד")} on:mouseleave={()=>hover("0")}  style="color:#7EE081;" >{noofusersOk} </span> <span on:mouseenter={()=>hover("לא הצביעו")} on:mouseleave={()=>hover("0")}  style="color:#0000cc;" >  {noofusersWaiting} </span><span on:mouseenter={()=>hover("כמות ההצבעות נגד")} on:mouseleave={()=>hover("0")}  style="color:#80037e;" >{noofusersNo} </span></p>
              {#if already === false}
            <button on:mouseenter={()=>hover("אישור")} on:mouseleave={()=>hover("0")} on:click={agree}  class = "btn ga" name="requestToJoin"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
          <!-- <button3 on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button3>--> 
            <button on:mouseenter={()=>hover("התנגדות")} on:mouseleave={()=>hover("0")} on:click={decline}  class = "btn gb" name="decline"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
        {/if}
        </div>
</SwiperSlide
  >
</Swiper>
</div>
{/await}
<style>
    .btin{
    width:13px;
     height:13px;
  }
   .pnn{
   margin: 2px;
    font-size: 8px; 
    font-weight: bold; 
   line-height: 0.7; 
  }
    .ab{
        grid-column: 1/3;
        grid-row: 1/ 2;

    }
    .bc{
        grid-column: 1/3;
        grid-row: 2/ 3;

    }
      .cd{
        grid-column: 1/3;
        grid-row: 3/ 4;

    }
 .de{
       grid-column: 1/3;
        grid-row: 4/ 5;

 }
  .ef{
       grid-column: 1/3;
        grid-row: 5/ 6;

 }
  .ga{
        grid-column: 1/2;
                margin-right: 20px;

    }
    .gb{
        grid-column: 2/3;
                margin-left: 20px;

    }
   #normSmll{
    background: url(https://res.cloudinary.com/love1/image/upload/v1643838617/coin_ngsrxn.svg);

        white-space: normal;
        text-align: center; 
        align-items: center;
        justify-content:  center;
        color: var(--barbi-pink);
      min-height: 75px;
    min-width: 75px;
    max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1 /1;
         border-radius: 50%;
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    display: grid;
    grid-template-columns: auto auto;
    grid-auto-rows: auto auto auto auto ;
    }
    .a{
        margin-right: 20px;
    }
    .b{
        margin-left: 20px;
    }
    .vo{
   margin: 1px;
   font-size: 8px;
    }
    .hslink{
        margin: 0px;
         font-size: 8px;
          line-height: 1;
         font-weight: bold;
    }
    .slink{
        margin-top: 0px;
         margin-bottom: 0px
    }
    .seimg{
        margin-top: 0px;
         margin-bottom: 0px;
          margin-right:auto;
           margin-left: auto;
         border-radius: 50%;
          width: 22px;
       height: 22px;
    }
    .na{
        margin: 1px;
         font-size: 8px;
          font-weight: bold; 
          color: var(--gold); 
        line-height: 0.7;
    }
    .hflink{
        margin: 0px;
         font-size: 8px;
          line-height: 1;
         font-weight: bold;
    }
    .flink{
        margin-top: 0px;
         margin-bottom: 0px
    }
    .timg{
    margin-top: 0px;
     margin-bottom: 0px;
      margin-right:auto;
       margin-left: auto; 
       border-radius: 50%;
       width: 22px;
       height: 22px;
}
    #curvee {
    fill: transparent;
}

.curved-text {
    fill: #d0f5f6;
    text-align: center;
    font-size: var(--the, 24px);
}

#normSml {

    text-align: center;
    line-height: 0.5;
    align-items: center;
    justify-content: safe center;
    color: var(--barbi-pink);
    min-height: 75px;
    min-width: 75px;
    max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1 /1;
    background-color: rgb(100, 224, 137);
    border-radius: 50%;

    background: url(https://res.cloudinary.com/love1/image/upload/v1643838617/coin_ngsrxn.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;

}


.btn {

    background-color: rgb(87, 208, 248);
    border-radius: 50%;
    color: var(--barbi-pink);
    text-align: center;
    opacity: 0.6;
    transition: 0.3s;
    padding: 2px;
        grid-row: 6/ 7;

}

.btn:hover {
    opacity: 1;
    padding: 6px;
}
@media  (min-width: 550px) {
      .btin{
    width:24px;
     height:24px;
  }
     .ga{
        margin-right: 26px;
    }
    .gb{
        margin-left: 26px;
    }
     .vo{
   margin: 7px;
      font-size: 13px;
    }
     .hslink{
        margin: 2px;
         font-size: 13px;
          line-height: 1;
         font-weight: bold;
    }
     .slink{
        margin-top: 2px;
         margin-bottom: 2px
    }
    .seimg{
         width: 32px;
       height: 32px;
    }
     .na{
        margin: 7px;
         font-size: 13px;
          font-weight: bold; 
          color: var(--gold); 
        line-height: 0.7;
    }
  .hflink{
        margin: 2px;
         font-size: 13px;
          line-height: 1;
         font-weight: bold;
    }
    .flink{
        margin-top: 2px;
         margin-bottom: 2px
    }
	#normSml{
      
        max-width: 94%;
        max-height: 94%;
  }
 
   .timg{
       height: 32px;
       height: 32px;
   }
    }
</style>
