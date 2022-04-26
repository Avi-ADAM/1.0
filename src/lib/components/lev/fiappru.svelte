<script>
      import Tooltip from './../../celim/tooltip.svelte';
  import ProgressBar from "@okrad/svelte-progressbar";
import {
    clickOutside
} from './outsidclick.js';
import {
    fly
} from 'svelte/transition';
import {
    createEventDispatcher
} from 'svelte';
  import { DialogOverlay, DialogContent 
} from 'svelte-accessible-dialog';
 import { goto } from '$app/navigation';
import { idPr } from './../../stores/idPr.js';

const dispatch = createEventDispatcher();
export let mId;
export let why;
export let what;
export let shows = false;
export let deadline;
export let projectName = "ONE";
export let missionBName = "do x";
export let role = "programer";
export let skills = ["html", "css"];
export let useraplyname = "do x like y in z";
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
export let whatt;
export let noofusersOk;
export let noofusersNo;
export let already;
let resP = [];
let lang;
export let stylef = '24px';
export let askId;
export let users;
    
let idL;
let bearer1; 
let token;
 function percentage(partialValue, totalValue) {
   return (100 * partialValue) / totalValue;
} 
let ok;
let nook;
let nut;
let tryo = "116%";
let tryot = "-10.5%";
let tryoti = "-5.25%";

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
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
    uids.push(userId);
    uids = uids;
    console.log(uids);
    //add rating for app +5 for declin -5, nego mean demends for apruval
     if (noofpu === noofusersOk) {
            console.log("create new finnished and add vote and archive fiapp")
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        { createFinnishedMission(
           input: { 
             data: {
              missionName: "${missionBName}",
              why: "${why}",
              noofhours: ${nhours},
              mesimabetahalich: ${mId},
              perhour: ${valph},
              total: ${valph*nhours},
              project: ${projectId},
              hearotMeyuchadot: "${hearotMeyuchadot}",
              descrip: "${missionDetails}",
              users_permissions_user: "${userId}",
              finiapruval: "${askId}",
              mission: ${missId}
   }
}){finnishedMission {id }}
updateMesimabetahalich(
  input:  {
    where: {id: "${mId}"}
  data: {finnished: true}
}
) {mesimabetahalich{id finnished}}
 updateFiniapruval(
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
    ){finiapruval{id}}
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
                            updateFiniapruval(
                            input:{
                                where: {id: "${askId}" }
                                data: { vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){finiapruval{id}}
                     
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
        already = true;

    console.log("nego")
    // text and more hours if needed ,
    masa = true;
        no = false;
        isOpen = true;
}

async function decline() {
        already = true;

        console.log("decline0");
    // negativ rating and reason text!! בועה שמראה לאחרחם את ההתנגדות הסיבה ואפשרות להגיב      
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
    const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    idL = cookieValueId;
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
updateFiniapruval(
  input: {
    where: {id: "${askId}"}
  data: {vots: [${userss}, 
                                       {
                                           why: "${whyy}"
                                        what: false
                                        users_permissions_user: "${idL}"
                                      }
                                    ] }
}
) {finiapruval {id vots {id}}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            isOpen = false;
            dispatch('decline', {
                asked: id
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }
        
}
function open () {
        masa = false;
        no = true;
        isOpen = true;
    console.log("if another uprove explain why you decline")
}
let isOpen = false;
let whyy = " ";
let no;
let masa;
function close() {
     isOpen = false;
    no = false; 
    masa = false;
}


$: w = 0;
 let u ="בקשה לאישור ביצוע משימה בהצלחה";

let hovered = false;
function hoverede(){
   hovered = !hovered
    if (hovered == false){
    u = "לב המערכת"
  } else {
u ="בקשה לאישור ביצוע משימה בהצלחה";
  }
  dispatch("hover", {id: u});
 }
function hover (id){
  if (id == "0"){
u ="בקשה לאישור ביצוע משימה בהצלחה"
  } else {
    u = id
  }
    dispatch("hover", {id: u});
}
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
</script>
{#await ser}
<h1>..</h1>
{:then ser}

 <DialogOverlay {isOpen} onDismiss={close} class="overlay" >
        <div transition:fly|local|local={{y: 450, opacity: 0.5, duration: 1000}}>
  <DialogContent class="content" aria-label="form">
      <div dir="rtl" class="flex items-center flex-col" >
              <button on:click={close} class=" hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
title="ביטול"
><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
{#if no === true}
<h1 style="font-size:2em;">יש לנמק מדוע </h1>
      <input  minlength="26"  type="text" bind:value={whyy} placeholder=" מדוע המשימה לא הושלמה">
         <br/>   <button class="add" disabled={whyy.length < 26} on:click={decline}>אישור</button>
{:else if masa === true}
      <input minlength="26"  type="text" bind:value={whyy} placeholder="יש לנמק מדוע ההצעה נדחית על ידך">
<input type="number" placeholder="add moree hours">
 
{/if}
      </div>
  </DialogContent>
  </div>
</DialogOverlay>

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
    nextEl: `.normSml${mId}-oo`,
    prevEl: `.normSmll${mId}-oo`,
  }}
>
<div bind:clientWidth={w} style:width={tryo} style:top={tryot} style:left={tryoti} style="position:absolute;">
  <ProgressBar cls="transition: all 1000ms ease-in-out;" series={ser} width={w} textSize={0}  thickness={4}   style="radial"/>  
</div>
  <SwiperSlide
    ><div
 id="normSml" 
>
<div
    style="--the:{stylef};"
    >
        <svg  version="1.1"  viewBox="-106 -106 212 212" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="lg" x1="1" y1="1" spreadMethod="pad">
                    <stop offset="0" style="stop-color: rgb(100, 71, 105);"/>
                        <stop offset="1" style="stop-color: rgb(54, 241, 155);"/>
                            </linearGradient>
                            <linearGradient id="lgb" x1="1" y1="1">
                                <stop offset="0" style="stop-color: rgb(125, 105, 155);"/>
                                    <stop offset="1" style="stop-color: rgb(0, 100, 120);"/>
                                        </linearGradient>
                                        </defs>
           <circle stroke-opacity="0.01" r="100" fill-opacity="0.01" fill="url(#lg)" transform="rotate(135)" stroke="url(#lgb)" stroke-width="6" style="fill-rule: nonzero; paint-order: fill;"/>
            <circle r="80" fill-opacity="0.01" fill="url(#lg)" transform="rotate(315)" stroke="none"/>
                  
                            <g  on:click={()=>linke("u")} on:touchstart={()=>linke("u")} on:mouseenter={()=>hover(`לחיצה כפולה לצפיה בעמוד הפרופיל של ${useraplyname}`)} on:mouseleave={()=>hover("0")}  x='0' y='40' style="margin-top: 2px; margin-bottom: 2px" >
                   <foreignObject x='0' y='0' width='56px' height='56px' transform="translate(-28,-28)" >
                    <span 	class="{`normSml${mId}-oo`}"></span> 
                    <img
                           width='56px'
                           height='56px'
                           alt={useraplyname}
                           src={src}
                           style="border-radius: 50%;"    
                           /> 
                        </foreignObject>     
                               <text fill="#FF0092" text-anchor="middle" x='0' y='46' style="margin: 2px; font-size: 24px; line-height: 1; font-weight: bold;">{useraplyname}</text>
                      </g>   
                   <path id="curve" fill-opacity="0.01"  d="M -79.587 0 C -81.732 -2.923 -75.008 -81.366 0 -80.446 C 74.342 -79.534 81.282 -3.522 80.257 0"/>
                       <text color="#EEE8AA" width="208.55" x="-90" y="-90" style="white-space: pre-wrap;">
                           <textPath on:mouseenter={()=>hover("שם המשימה")} on:mouseleave={()=>hover("0")} font-weight="bold" color="#FF0092" x="-90" y="-90" class="curved-text" startOffset={st} xlink:href="#curve">
                               {missionBName}
                           </textPath>
                       </text>
                 <g on:click={()=>linke("p")} on:touchstart={()=>linke("p")} on:mouseenter={()=>hover("לחיצה כפולה לצפיה בעמוד הציבורי של הריקמה")} on:mouseleave={()=>hover("0")}  x="0" y="-40">
                       <text fill="#FF0092" text-anchor="middle"  x="0" y="-29"   style="font-size: 15px; line-height: 1; font-weight: bold; white-space: pre;">{projectName}</text>
                 </g>  
                       <foreignObject x='0' y='-60 ' width='40px' height='40px' transform="translate(-20,-20)" >
                      <button on:click={()=>project(projectId)} on:mouseenter={()=>hover(` לחיצה כפולה למעבר למוח הריקמה ${projectName}`)} on:mouseleave={()=>hover("0")}>
                        <img style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src2} width="40" height="40" alt="projectlogo" >
                       </button>
                   </foreignObject>
               
                                                </svg>
                                                    </div>

</div>
</SwiperSlide
  ><SwiperSlide
    ><div  id="normSmll"
><div class="{`normSmll${mId}-oo`}" 
></div>
       <p class="ab pnn"><span on:mouseenter={()=>hover("סך ההצבעות בעד")} on:mouseleave={()=>hover("0")}  style="color:#7EE081;" >{noofusersOk} </span> <span on:mouseenter={()=>hover("לא הצביעו")} on:mouseleave={()=>hover("0")}  style="color:#0000cc;" >  {noofusersWaiting} </span><span on:mouseenter={()=>hover("כמות ההצבעות נגד")} on:mouseleave={()=>hover("0")}  style="color:#80037e;" >{noofusersNo} </span></p>

            <h5 on:mouseenter={()=>hover("טקסט אישור של סיום משימה")} on:mouseleave={()=>hover("0")}  class="bc pnn" >{why}</h5>
          {#if missionDetails}  <h6 class="cd pnn" on:mouseenter={()=>hover("פרטי משימה")} on:mouseleave={()=>hover("0")}  >{missionDetails}</h6>{/if}
         
            {#if !already}
            <button on:mouseenter={()=>hover(" אישור")} on:mouseleave={()=>hover("0")}  on:click={agree} style="margin: 0;" class = "btn ga" name="requestToJoin"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
        <!--   <button on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button>--> 
            <button on:mouseenter={()=>hover(" התנגדות")} on:mouseleave={()=>hover("0")}  on:click={open} style="margin: 0;" class = "btn gb"name="decline"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
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
 
  .ga{
        grid-column: 1/2;
    }
    .gb{
        grid-column: 2/3;
    }
   #normSmll{

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
    background: url(https://res.cloudinary.com/love1/image/upload/v1643838283/newcoin_mxgoxa.svg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    display: grid;
    grid-template-columns: auto auto;
    grid-auto-rows: auto auto auto auto ;
    }
    input[type=text]{
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
     border: 1px solid var(--lturk);
     padding-left: 10px;
     padding-right: 10px;
    }
    
input[type=text]:focus {
     outline: none;
     border: 2px solid var(--lturk);
     color: #2d9fd9;
}
  
input[type=text]:invalid {
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
  border: 2px dashed var(--lturk);
    color: red;
     padding-left: 10px;
     padding-right: 10px;
}
    .add{
        color : var(--barbi-pink);
        background-color: var(--gold);
        padding: 0.5em;
         -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
    }
    .add:hover {
        color: var(--gold);
        background-color: var(--barbi-pink);
                padding: 0.5em;
                 -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
    }
    .add:disabled{
        color: red;
        background-color: grey;
                padding: 0.5em;
                 -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
    }
#curve {
    fill: transparent;
}

.curved-text {
    fill: #99039e;
    text-align: center;
    font-size: var(--the, 24px);
}

#normSml {

    text-align: center;
    line-height: 0.5;
    align-items: center;
    justify-content:  center;
    color: var(--barbi-pink);
    min-height: 75px;
    min-width: 75px;
    max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1 /1;

    background-color: rgb(100, 224, 137);
    border-radius: 50%;

    background: url(https://res.cloudinary.com/love1/image/upload/v1643838283/newcoin_mxgoxa.svg);
    background-position: center;
    background-repeat: no-repeat;

}

.btn {

    background-color: rgb(87, 208, 248);
    border-radius: 50%;
    color: var(--barbi-pink);
    text-align: center;
    opacity: 0.6;
    transition: 0.3s;
    padding: 2px;
    margin-right: 4px;
    margin-left: 4px;
            grid-row: 4/ 5;

}

.btn:hover {
    opacity: 1;
    padding: 6px;
}
  :global([data-svelte-dialog-content].content) {
      width: 80vw;
      z-index: 60;
  }
    :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
  @media (min-width: 568px){
        :global([data-svelte-dialog-content].content) {
width:50vw;
      z-index: 60;

        }
          :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
          .pnn{
   margin: 3px;
    font-size: 10px; 
    
  }
       #normSmll{
           
              max-width: 94%;
        max-height: 94%;
       }
}
</style>
