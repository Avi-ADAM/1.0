<script>
import {
    clickOutside
} from './outsidclick.js';
import {
    scale,
    fly
} from 'svelte/transition';
import {
    createEventDispatcher
} from 'svelte';
  import { DialogOverlay, DialogContent 
} from 'svelte-accessible-dialog';
 import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
import { idPr } from './../../stores/idPr.js';
  import { onMount } from 'svelte'; 
  import moment from 'moment';
const dispatch = createEventDispatcher();
export let mId;
export let kindOf;
export let myp = 0;
export let projectName = "ONE";
export let missionBName = "do x";
export let useraplyname = "do x like y in z";
export let src = "coin.png";
export let src2 = " ";
export let projectId;
export let link = "/project/";
export let linkU = "/user/";
export let userId;
export let name;
export let spid;
export let hm = 1;
export let noofpu = 0;
export let spnot;
export let price = 0;
export let easy = 0;
export let agprice = (myp+easy) / 2;
export let missId;
export let id;
export let openMid;
export let st = 188;
export let declined = [];
export let noofusersWaiting;
export let uids;
export let noofusersOk;
export let noofusersNo;
export let already;
let resP = [];
let lang;
export let stylef = '24px';
export let askId;
export let users;
export let sqadualed;
export let sqadualedf;    

let idL;
let bearer1; 
let token;
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
  slideTo(1)
 }
let error1;
let miDatan = [];
let linkg = 'https://onelovevone.onrender.com/graphql';


let monts = 0
let total;
let yers
    onMount(async () => {
var a = moment(sqadualedf);
var b = moment(sqadualed);
yers = a.diff(b, 'years', true).toFixed(2); 
monts = a.diff(b, 'months', true).toFixed(2); 
console.log(yers,monts)
})


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

async function agree() {
         if (kindOf === "perUnit"){
       total = agprice * hm } 
   else if (kindOf === "total" || kindOf === "rent")
       {total = agprice}
          else if (kindOf === "monthly")
 {total = agprice * monts} 
          else if (kindOf === "yearly")
    {total = agprice * yers} 

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
        const date = (sqadualed !== undefined) ? `sqadualed: "${new Date(sqadualed).toISOString()}",` : ``;
        const sdate = (sqadualedf !== undefined) ? `sqadualef: "${new Date(sqadualedf).toISOString()}",` : ``;
    //add rating for app +5 for declin -5, nego mean demends for apruval
     if (noofpu - 1 === noofusersOk) {
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
                        { createRikmash(
           input: { 
             data: {
                 total: ${total},
              name: "${missionBName}",
              kindOf: ${kindOf},
              price: ${price},
              agprice: ${agprice},
              project: ${projectId},
              hm: ${hm},
              open_mashaabim: "${openMid}",
              spnot: "${spnot}",
              maap: "${askId}",
              users_permissions_user: "${userId}",
              sp: "${spid}",
              ${date}
               ${sdate}

   }
}){rikmash {id }}
updateMaap(
  input:  {
    where: {id: "${askId}"}
  data: {archived: true,
vots: [${userss}, 
       {
        what: true
        users_permissions_user: "${idL}"
      }
    ]}
}
) {maap{id archived}}
updateSp( input:  {
    where: {id: "${spid}"}
  data: {panui: false}}
){sp{id}}
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
                            updateMaap(
                            input:{
                                where: {id: "${askId}" }
                                data: { vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){maap{id}}
                     
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
    // text and more hours if needed ,
    masa = true;
        no = false;
        isOpen = true;
}

async function decline() {
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
updateMaap(
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
) {maap {id vots {id}}}
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
  function project (id) {
    idPr.set(id);
    goto("/moach", );
  };

</script>

 <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly={{y: 450, opacity: 0.5, duration: 1000}}>
  <DialogContent aria-label="form">
      <div dir="rtl" class="flex items-center flex-col" >
              <button on:click={close} class=" hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
title="ביטול"
><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
{#if no === true}
<h1 style="font-size:2em;">יש לנמק</h1>
      <input  minlength="26"  type="text" bind:value={whyy} placeholder="מה חסר בכדי שניתן יהיה לאשר שהמשאב התקבל">
         <br/>   <button class="add" disabled={whyy.length < 26} on:click={decline}>אישור</button>
{:else if masa === true}
      <input minlength="26"  type="text" bind:value={whyy} placeholder="יש לנמק  ההצעה  על ">
<input type="number" placeholder="add moree hours">
 
{/if}
      </div>
  </DialogContent>
  </div>
</DialogOverlay>


<div 
use:clickOutside on:click_outside={toggleShow} 
class="hover:scale-150 duration-1000 ease-in"  transition:fly={{y: 250, opacity: 0.9, duration: 2000} }>
<Swiper
  on:swiper={setSwiperRef}
  effect={"flip"}
    loop={true}
  loopFillGroupWithBlank={true}
  grabCursor={true}
  modules={[EffectFlip, Navigation]}
  flipEffect={{ slideShadows: false}}
  class="mySwiper"
  navigation={{
    nextEl: `.normSml${spid}-opo`,
    prevEl: `.normSmll${spid}-opo`,
  }}
>
  <SwiperSlide
    ><div
	class="{`normSml${spid}-opo`}" id="normSml" 
>
<div
    style="--the:{stylef};"
    >
        <svg  version="1.1"  viewBox="-106 -106 212 212" xmlns="http://www.w3.org/2000/svg">
            <title>בקשה לאישור קבלת משאב בהצלחה</title>
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
                  
                            <a sveltekit:prefetch x='0' y='40' style="margin-top: 2px; margin-bottom: 2px" href={`${linkU}${userId}`}>
                   <foreignObject x='0' y='0' width='56px' height='56px' transform="translate(-28,-28)" >
                       <img
                           width='56px'
                           height='56px'
                           alt={useraplyname}
                           src={src}
                           style="border-radius: 50%;"
                           title={useraplyname}
                           /> 
                        </foreignObject>     
                               <text fill="#FF0092" text-anchor="middle" x='0' y='46' style="margin: 2px; font-size: 24px; line-height: 1; font-weight: bold;">{useraplyname}</text>
                           </a>   
                   <path id="curve" fill-opacity="0.01"  d="M -79.587 0 C -81.732 -2.923 -75.008 -81.366 0 -80.446 C 74.342 -79.534 81.282 -3.522 80.257 0"/>
                       <text color="#EEE8AA" width="208.55" x="-90" y="-90" style="white-space: pre-wrap;">
                           <textPath color="#EEE8AA" x="-90" y="-90" class="curved-text" startOffset={st} xlink:href="#curve">
                               {missionBName}
                           </textPath>       
                       </text>
                 <a sveltekit:prefetch x="0" y="-40"   xlink:href="{`${link}${projectId}`}">
                       <text fill="#FF0092" text-anchor="middle"  x="0" y="-29"   style="font-size: 15px; line-height: 1; font-weight: bold; white-space: pre;">{projectName}</text>
                       <foreignObject x='0' y='-60 ' width='40px' height='40px' transform="translate(-20,-20)" >
                       <img style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src2} width="40" height="40" alt="projectlogo" title={projectName}>
                       
                   </foreignObject>
                   </a>  
               
                                                </svg>
                                                  
                                                    </div>

</div>
</SwiperSlide
  ><SwiperSlide
    ><div class="{`normSmll${spid}-opo`}" id="normSmll"
>
            <p class="ab pnn" ><span style="color:green" title="בעד">{noofusersOk} </span><span style="color:aqua" title="לא הצביעו">{noofusersWaiting} </span><span style="color:var(--barbi-pink)" title="נגד">{noofusersNo} </span></p>
         <h2 class="text-barbi bc">{spnot}</h2>
           {#if kindOf === "perUnit"}
       <p class="p cd"><span style="color:var(--gold)" title="שווי ליחידה">{agprice}</span> * <span style="color: aqua" title="כמות ">{hm}</span> = {agprice * hm} </p>
   {:else if kindOf === "total" || kindOf === "rent"}
       <p class="p cd"><span class="text-barbi" title="שווי">{agprice}</span></p>
          {:else if kindOf === "monthly"}
       <p class="p cd"><span style="color:var(--gold)" title="שווי ">{agprice}</span> * <span style="color: aqua" title="כמות חודשים">{monts}</span> = {agprice * monts} </p>
          {:else if kindOf === "yearly"}
       <p class="p cd"><span style="color:var(--gold)" title="שווי">{agprice}</span> * <span style="color: aqua" title="כמות חודשים">{yers}</span> = {agprice * yers} </p>
{/if}
            {#if !already}
            <button on:click={agree} style="margin: 0;" class = "btn ga" name="requestToJoin"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
        <!--   <button on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button>--> 
            <button on:click={open} style="margin: 0;" class = "btn gb"name="decline"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
        {/if}
          </div>
</SwiperSlide
  >
</Swiper>
</div>


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
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 /1;
         border-radius: 50%;
    background: url(https://res.cloudinary.com/love1/image/upload/v1647379261/FLOWER-032-1_1_1_zk45tv.svg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: 125% 125%;
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
    fill: #1b0813;
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
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 /1;

    border-radius: 50%;
    background: url(https://res.cloudinary.com/love1/image/upload/v1647379261/FLOWER-032-1_1_1_zk45tv.svg);
   background-position: center;
    background-repeat: no-repeat;
    background-size: 125% 125%;
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
@media (min-width: 550px){
          .pnn{
   margin: 3px;
    font-size: 10px; 
    
  }
       #normSmll{
           min-width: 125px;
           min-height: 125px;
              max-width: 100%;
        max-height: 100%;
       }
}
</style>
