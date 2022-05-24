<script>
  import ProgressBar from "@okrad/svelte-progressbar";
 import { goto, prefetch } from '$app/navigation';
import Chaticon from '../../celim/chaticon.svelte'
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
export let coinlapach;
export let deadline;
export let projectName;
export let openmissionName;
export let myp;
export let easy;
export let price;
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
export let pid
export let stylef = '24px';
export let askId;
export let users;
export let spid;  
    

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
    if (swiperRef !== null){
    swiperRef.slideTo(index , 400);
    }
  };
 function toggleShow (){
  slideTo(0)
 }
let error1;
let miDatan = [];
let linkg = 'https://onelovevone.onrender.com/graphql';

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
  
    console.log(uids);
    if (pid.includes(userId)){
        welcome = ``;
        adduser2 = ``;
        adduser = ``;
        console.log(welcome, "member");
    } else {
        pid.push(userId);
    pid = pid;
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
 data: {user_1s: [${pid}]}
}
  ){project {user_1s {id}}}`
        console.log(welcome, "not member");

    }
    //add to pr users create missioninprogres, create welcom ballun;  first check for no of pr users and full consent ,(delete or save for refernce but put archive ) openM and asked 
if (noofpu === 1) {
        
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        query: `mutation 
                        { createMaap(
    input: {
      data: {project: "${projectId}",
             name: "${openmissionName}",
             sp: "${spid}",
             open_mashaabim: ${omid}
                  }
    }
  ) {maap{project{id }}}

  updateOpenMashaabim(
  input:  {
    where: {id: "${openMid}"}
  data: {archived: true}
 }
 ) {openMashaabim{id archived}}
 ${welcome}
 ${adduser}
 updateAskm(
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
                        ){askm{id}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('acsept', {
 ani: "askedma",
                coinlapach: coinlapach            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }

} else if (noofpu === noofusersOk) {
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
                        { createMaap(
    input: {
      data: {project: "${projectId}",
             name: "${openmissionName}",
             sp: "${spid}",
             open_mashaabim: ${openMid}
                  }
    }
  ) {maap{project{id }}}

updateOpenMashaabim(
  input:  {
    where: {id: "${openMid}"}
  data: {archived: true}
}
) {openMashaabim{id archived}}
${welcome}
${adduser2}
 updateAskm(
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
                        ){askm{id}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('acsept', {
                ani: "askedma",
                coinlapach: coinlapach 
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
                            updateAskm(
                            input:{
                                where: {id: "${askId}" }
                                data: { vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){askm{id}}
                     
                    }
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('acsept', {
               ani: "askedma",
                coinlapach: coinlapach 
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }

    }
    }
;

function ask() {
    // plain text? list? terms???
}

async function decline() {
        already = true;
     noofusersNo += 1;
  noofusersWaiting -= 1;
  ser = xyz();
const declineda = declined.map(c => c.id)
    declineda.push(userId)

    // delete asked coin forever but keep asked on user ////matrix(1, 0, 0, 1, -61.718609, -47.72295)
        if (noofpu === 1) {
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
updateAskm(
  input: {
    where: {id: "${id}"}
  data: {vots: [${userss}, 
                                       {
                                        what: false
                                        users_permissions_user: "${idL}"
                                      }
                                    ],
                                  archived: true
}
}
) {askm{id }}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('decline', {
               ani: "askedma",
                coinlapach: coinlapach 
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
function tochat () {
  dispatch("chat");
}
 $: w = 0;
 let  u = "הצבעה על בקשה להצטרפות לרקמה"
function hover (id){
  if (id == "0"){
 u = "הצבעה על בקשה להצטרפות לרקמה"
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
 u = "הצבעה על בקשה להצטרפות לרקמה"
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
  <SwiperSlide
    ><div
	 id="normSml" 
>
<div
    style="--the:{stylef};"
    >
        <svg  version="1.1" viewBox="-106 -106 212 212" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="lggm" x1="1" y1="1" spreadMethod="pad">
                   <stop offset="0" style="stop-color: rgb(100, 71, 105);"/>
                        <stop offset="1" style="stop-color: rgb(54, 241, 155);"/>
                            </linearGradient>
                            <linearGradient id="lgbgm" x1="1" y1="1">
                                <stop offset="0" style="stop-color: rgb(125, 105, 155);"/>
                                    <stop offset="1" style="stop-color: rgb(0, 100, 120);"/>
                                        </linearGradient>
                                        </defs>
                                        <circle r="100" fill="url(#lggm)" transform="rotate(135)" stroke="url(#lgbgm)" stroke-width="6" style="fill-rule: nonzero; paint-order: fill;"/>
                                         <circle r="80" fill="url(#lggm)" transform="rotate(315)" stroke="none"/>
                                               
                                                         <g on:click={()=>linke("u")} on:mouseenter={()=>hover(` לחיצה למעבר לעמוד הפרופיל של ${useraplyname}`)} on:mouseleave={()=>hover("0")} x='0' y='40' style="margin-top: 2px; margin-bottom: 2px" >
                                                <foreignObject x='0' y='0' width='56px' height='56px' transform="translate(-28,-28)" >
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
                                                        <textPath on:mouseenter={()=>hover("שם המשאב")} on:mouseleave={()=>hover("0")} color="#EEE8AA" x="-90" y="-90" class="curved-text" startOffset={st} xlink:href="#curvee">
                                                            {openmissionName}
                                                        </textPath>
                                                    </text>
                                              <g on:click={()=>linke("p")} on:mouseenter={()=>hover("לחיצה למעבר לעמוד הציבורי של הריקמה")} on:mouseleave={()=>hover("0")} sveltekit:prefetch x="0" y="-40" >
                                                    <text fill="#FF0092" text-anchor="middle"  x="0" y="-29"   style="font-size: 15px; line-height: 1; font-weight: bold; white-space: pre;">{projectName}</text>
                                              </g>  
                                                    <foreignObject x='0' y='-60 ' width='40px' height='40px' transform="translate(-20,-20)" >
                                                   <button on:click={()=>project()} on:mouseenter={()=>hover(` לחיצה למעבר למוח הריקמה ${projectName}`)} on:mouseleave={()=>hover("0")}>
                                                        <img style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src2} width="40" height="40" alt="projectlogo" title={projectName}>
                                                   </button>

                                                </foreignObject>
                            <foreignObject x='-25' y='55' width='50px' height='20px' >
                                             <p style="margin-top: 10px;"><span on:mouseenter={()=>hover("בעד")} on:mouseleave={()=>hover("0")} style="color:var(--gold)" >{noofusersOk} </span><span on:mouseenter={()=>hover("לא הצביעו")} on:mouseleave={()=>hover("0")} style="color:aqua">{noofusersWaiting} </span><span on:mouseenter={()=>hover("נגד")} on:mouseleave={()=>hover("0")} style="color:var(--barbi-pink)" title="נגד">{noofusersNo} </span></p>

                            </foreignObject>

                                                  </svg>  
                                                    </div>

</div>
</SwiperSlide
  ><SwiperSlide
    ><div  id="normSmll"
>

<div class="{`normSmll${askId}-noo`}"></div>
                    <!--  <button on:click={tochat}><Chaticon/></button>-->
                 {#if deadline}    <p on:mouseenter={()=>hover("תאריך הביצוע")} on:mouseleave={()=>hover("0")}  class="hslink ab">{new Date(deadline).toLocaleDateString("he-IL")}</p>{/if}
       <p on:mouseenter={()=>hover("שווי")} on:mouseleave={()=>hover("0")} class="hslink bc" >{price}</p>
        <p class="hslink cd" ><span on:mouseenter={()=>hover("ההצעה שהתקבלה")} on:mouseleave={()=>hover("0")} style="color: var(--gold)" >{myp}</span> /<span on:mouseenter={()=>hover("ההצעה של הריקמה")} on:mouseleave={()=>hover("0")} > {easy}</span> </p>
                 {#if missionDetails !== null}   <p on:mouseenter={()=>hover("פרטי הצעת ההשקעה")} on:mouseleave={()=>hover("0")}  class="hslink de d">{missionDetails}</p>{/if}   
                 {#if already === false}
            <button on:mouseenter={()=>hover("אישור")} on:mouseleave={()=>hover("0")} on:click={agree}  class = "btn ga" name="requestToJoin"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
          <!-- <button3 on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button3>--> 
            <button on:mouseenter={()=>hover("דחיה")} on:mouseleave={()=>hover("0")} on:click={decline}  class = "btn gb"name="decline"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
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
      max-height: 55px;
      overflow-y: auto;
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
    background: url(https://res.cloudinary.com/love1/image/upload/v1650979768/coinnn_oatfhw.svg);

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
    background-size: 125% 125%;
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

    background: url(https://res.cloudinary.com/love1/image/upload/v1647261055/spare_gv0gui.svg);
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
