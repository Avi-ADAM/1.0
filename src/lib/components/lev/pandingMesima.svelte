<script>
  import Chaticon from '../../celim/chaticon.svelte'
  import ProgressBar from "@okrad/svelte-progressbar";
    import { clickOutside } from './outsidclick.js';
    import {  fly } from 'svelte/transition';
   import { createEventDispatcher, onMount } from 'svelte';
  import Nego from '../prPr/negoM.svelte';
 import { goto } from '$app/navigation';
import { idPr } from '../../stores/idPr.js';
 import Diun from './diun.svelte';
import { RingLoader
} from 'svelte-loading-spinners';
import Lowbtn from '$lib/celim/lowbtn.svelte'
 const dispatch = createEventDispatcher();
 export let coinlapach;
 export let isVisible = false;
 export let mypos = null;
     export let low = false;
        export let restime;
        let dialogOpen = false
        export let negopendmissions= [];

        export let modal = false
    export let messege = [];
    export let descrip = "";
    export let projectName = "";
    export let name = "";
    export let hearotMeyuchadot = "";
    export let noofhours = 0;
    export let src = "coin.png";
    export let perhour = 0;
    export let projectId;
    export let uids = [];
    export let what = [];
    export let noofusersOk;
    export let noofusersNo;
    export let noofusersWaiting;
    export let total = 0;
    export let noofusers ;
    export let already = false;
    export let missionId;
    export let skills = [];
    export let tafkidims = [];
    export let workways = [];
    export let vallues;
    export let publicklinks;
    export let privatlinks;
    export let mdate;
    export let isKavua = false
        export let mdates;
        export let timegramaDate
         export let timegramaId                     
        export let createdAt;
    export let pendId;
    export let users;
     export let mysrc;
    export let diun = [];
    export let order = diun.length;
    let miDatan = [];
    let error1;
    let bearer1;
    let token;
    let idL;
    let no = false;
    let masa = false;
 let why = "";
let isOpen = false;
let loading = false;

onMount(()=>{
  skills = oneLangAdj({data: skills},$lang,"skillName").data || []
  tafkidims = oneLangAdj({data: tafkidims},$lang,"roleDescription").data || []
  workways = oneLangAdj({data: workways},$lang,"workWayName").data || []
})
    function percentage(partialValue, totalValue) {
   return (100 * partialValue) / totalValue;
} 
let diunm = false;
let ok;
let nook;
let nut;
let tryo = "116%";
let tryot = "-10.5%";
let tryoti = "-5.25%";
async function xyz (){

ok =  percentage(noofusersOk, noofusers)
nook = percentage(noofusersNo, noofusers) 
nut = percentage(noofusersWaiting, noofusers) 
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


function coinLapach() {
        dispatch('coinLapach', {
     ani: "pendmi",
                coinlapach: coinlapach
    } );
};

function objToString (obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
        
     const length = Object.keys(obj[i]).length;
        let t = 0;
    for (const [p, val] of Object.entries(obj[i])) {
      const last = t === length - 1; 
      if (t == 0){
      str += "{"
    }
        t++;
        if (typeof(val) == "string") {
        str += `${p}:"${val}"\n`;
    } else if (typeof(val) == "number" || typeof(val) =="boolean") {
        str += `${p}:${val}\n`;
    } else if (typeof(val) == 'null'|| typeof(val) ==="object"){
      str += `${p}:${val?.data ? '"'+ val?.data?.id + '"': val}\n`;

    }else{
      str += `${p}:${val}\n`
    }
        if (last) {
          str += "},"
    }
    if (t == 0){
      str += "{"
    }
    }
  }
    return str;
}
function objToStringC (obj) {
   const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    let str = '';
    for (let i = 0; i < obj.length; i++) {
      if(obj[i].users_permissions_user.id == idL) {
        obj[i].order = 1
      }
        const length = Object.keys(obj[i]).length;
        let t = 0;
    for (const [p, val] of Object.entries(obj[i])) {
      const last = t === length - 1; 
        t++;
        if (typeof(val) == "string") {
        str += `${p}:"${val}"\n`;
    } else if (typeof(val) == "number"|"boolean") {
        str += `${p}:${val}\n`;
    } else if (typeof(val) == 'null'){
      str += `${p}:${val.map(c => c.id)}\n`;
    }
        if (last) {
          str += "},"
    }
    if (t == 1){
      str += "{"
    }
    }}
    return str;
}
let whyy = ``;
let allr = false;
export let ordern = 0;
const baseUrl = import.meta.env.VITE_URL

let linkg = baseUrl+'/graphql';
let userss = objToString(users);
async function agree(alr) {
  let d = new Date
  if  (alr == "alr"){
        allr = true;
           already = true;
       noofusersOk += 1;
  noofusersNo -= 1;
  ser = xyz();
    userss = objToStringC(users)
      } else{
   already = true;
   noofusersOk += 1;
  noofusersWaiting -= 1;
  ser = xyz();
      }
    const date = (mdate !== undefined && mdate !== null) ? ` sqadualed: "${mdate.toISOString()}"` : ``;

    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    token  = cookieValue; 
     bearer1 = 'bearer' + ' ' + token;
          if (noofusersOk === noofusers){
            console.log(skills)
              const skillsa = skills.data.map(c => c.id);
             const tafkidimsa = tafkidims.data.map(c => c.id);
              const workwaysa = workways.data.map(c => c.id);
              const valluesa = vallues.data.map(c => c.id);
    try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        //TODO: isMust isYesod isshift howMeny
        JSON.stringify({query:
          `mutation { createOpenMission(
      data: {project: "${projectId}",
             mission:  "${missionId}",
             iskvua: ${isKavua},
             work_ways: [${workwaysa}],
             hearotMeyuchadot: "${hearotMeyuchadot}",
             name: "${name}",
                     publishedAt: "${d.toISOString()}",
             descrip: "${descrip}",
             skills: [${skillsa}], 
             tafkidims: [${tafkidimsa}],
             vallues:  [${valluesa}],
             noofhours: ${noofhours},
             perhour: ${perhour},   
             privatlinks: "${privatlinks}",
             publicklinks: "${publicklinks}",
             ${date}
    }
  ) {data{attributes {project{data{ id} }}}}
  updatePendm(
   id: ${pendId}
      data: { users:[  ${userss}, 
         
     {
      what: true
      users_permissions_user: "${idL}"
      order: ${ordern}
      ide: ${idL}
      zman: "${d.toISOString()}"
    }
  ],
 archived: true
 }
  ){data{attributes{ users { users_permissions_user {data{ id}}}}}}
 } `   
 //update pendm add consent from second and  archived,,, make coin desapire
 } )})
  .then(r => r.json())
  .then(data => miDatan = data); 
        console.log(miDatan)
        coinLapach()
        } catch (e) {
            error1 = e
            console.log(error1)
        toast.warning(er[$lang])
        }
          
        console.log("will create mission")

          } else {
              console.log("will add vote")
 try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { updatePendm(
     id: ${pendId}
      data: { users:[  ${userss}, 
         
     {
      what: true
      users_permissions_user: "${idL}"
      order:${ordern}
      ide: ${idL}
      zman:"${d.toISOString()}"
    }
  ]}
  ){data {attributes{ users { users_permissions_user{data { id}}}}}}
 } `   
 // make coin desapire
 } )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
        } catch (e) {
            error1 = e
            console.log(error1)
       toast.warning(er[$lang])
        }
       

          }
};
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';

function tochat (){
   no = false;
         masa = false;
         diunm = true
         loading = false;
            isOpen = true;
}
let masaalr = false;
async function nego(alr) {
  if (alr == "alr"){
    allr = true;
     no = false;
         masa = true;
            isOpen = true;
            masaalr = true;
  } else{
  already = true;
        no = false;
         masa = true;
            isOpen = true;
  console.log(masa)
  }
}
let archivedtru = ``
function decline(alr) {
      if  (alr == "alr"){
        allr = true;
        isOpen = true
        already = true;
        noofusersNo += 1;
        noofusersOk -= 1;
        ser = xyz();
        userss = objToStringC(users)
      //  ordern = `order: 2`
        if (noofusersNo === noofusers){
            archivedtru  = `archived: true,`;
          }
        afterwhy() 
      } else{
      already = true;
      no = true;
      diunm = true
      isOpen = true;
	}
}
async function afterwhy (event){
  if (event){
  why = event.detail.why
  whyy = `why: "${why}"`
  }
  loading = true;
  noofusersNo += 1;
  noofusersWaiting -= 1;
  ser = xyz();    
      const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    token  = cookieValue; 
     bearer1 = 'bearer' + ' ' + token;
        try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { updatePendm(
     id: ${pendId}
      data: { 
       ${archivedtru}
        users:[  ${userss}, 
     {
      what: false
      ${whyy}
      users_permissions_user: "${idL}"
    }
  ]}
  ){data {attributes{ users { users_permissions_user{data { id}}}}}}
} `   
// make coin desapire
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
                 coinLapach()
        } catch (e) {
            error1 = e
            toast.warning(er[$lang])
            console.log(error1)
 }
        }
const close = () => {
    isOpen = false;
    if (no === true){
      already = false
    }
    no = false; 
    masa = false;
    allr = false;
};

function afternego (event) {
  isOpen = false;
  loading = false;
    no = false; 
    masa = false;
    //dispach or update  coin to negotiable state 
    coinLapach()
}
  let rect = false;
async function react (){
     allr = true;
      rect = true;
      isOpen = true;
}
async function afreact (event){
  
  let diunim = ``;
  if (diun !== null){
 const diu =  objToString(diun)
 diunim = `${diu}`
  }
   why = event.detail.why
  console.log(why)
  let d = new Date()
         //  loading = true;
       const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    token  = cookieValue; 
     bearer1 = 'bearer' + ' ' + token;
     let dataa = {
          data: { 
        diun:[...diun,{
      what: mypos,
      users_permissions_user:idL,
      why:why,
      order:order+=1,
      zman:d.toISOString(),
      ide:idL
    }
  ]
}  
 }
    try {
             await fetch(`${baseUrl}/api/pendms/${pendId}?populate=*`, {
              method: 'PUT',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: JSON.stringify(dataa),
      })
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
      nowId.set(miDatan.data.attributes.diun[miDatan.data.attributes.diun.length -1].id)       
         diun.push({
                   what: mypos,
                      users_permissions_user:idL,
                      why:why,
                      order:order+=1,
                      zman:d.toISOString(),
                      ide:idL
                 })
           diun = diun  
           clicked = false   
      //   loading = false;
        } catch (e) {
            error1 = e
            console.log(error1)
            toast.warning(er[$lang])
        }
}
  const er = {"he": "אם הבעיה נמשכת baruch@1lev1.com שגיאה יש לנסות שנית, ניתן ליצור קשר במייל ","en":"error: please try again, if the problem continue contact at baruch@1lev1.com"}

  let clicked = false
$: pcli = 0
$: pmcli = 0
function linke (s){
 
    pcli += 1;
    if(pcli >= 2){
        dispatch("proj", {id: projectId});
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
  if(index){
    swiperRef.slideTo(index , 400);
  }
  };
function toggleShow (){
  slideTo(0)
}
$: w = 0;
 let u = "הצבעה על פרסום הצעת משימה לריקמה"
let hovered = false;
function hover (id){
  if (id == "0"){
 u = "הצבעה על פרסום הצעת משימה לריקמה"
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
 u = "הצבעה על פרסום הצעת משימה לריקמה"
  }
  dispatch("hover", {id: u});
}

function hoverc (event){
   if (event.detail.x == "0"){
 u = "הצבעה על פרסום הצעת משימה לריקמה"
  } else {
    u = event.detail.x
  }
    dispatch("hover", {id: u});
}
 import Cards from './cards/pending.svelte'
  import {oneLangAdj} from '$lib/func/oneLangAdj.svelte';
  import { lang } from '$lib/stores/lang';
  import { nowId } from '$lib/stores/pendMisMes';
  import { toast } from 'svelte-sonner';
  import { Drawer } from 'vaul-svelte';
export let cards = false;
function claf (event){
  let o = event.detail.alr
  let d = event.detail.y
  console.log(o,d)
  if (d=="a"){
    console.log("agree")
    agree(o)
  } else if (d=="d"){
    decline(o)
  }else if (d=="n"){
    nego(o)
  }
  console.log(o,d)
}
</script>
{#await ser}
<h1>..</h1>
{:then ser}


 <DialogOverlay {isOpen} onDismiss={close} class="overlay" >
        <div transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
{#if masa === true}
          <DialogContent aria-label="form" class="nego d">
          <div dir="rtl" class="grid items-center justify-center text-center">
                        <button style="margin: 0 auto;" on:click={close} class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
          title="ביטול"
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
            <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
          </svg></button>
  {#if loading === true}
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  {:else}
      <Nego
      {masaalr} {mypos}
      on:load={()=>loading = true}
              on:close={afternego}
              {timegramaId}
  {negopendmissions}
        descrip ={descrip}
        projectName ={projectName}
        name1 ={name}
        hearotMeyuchadot = {hearotMeyuchadot}
        noofhours ={noofhours}
        perhour = {perhour}
        projectId = {projectId}
        total ={total}
        {ordern}
        noofusers={noofusers}
        missionId={missionId}
        skills = {skills}
        tafkidims = {tafkidims}
        workways ={workways}
        mdate={mdate}
        {mdates}
        {isKavua}
        {publicklinks}
        {privatlinks}
           {restime}
        pendId={pendId}
        users={users}
      />
  {/if}
      </div>
  </DialogContent>
{:else}
          <DialogContent aria-label="form" class="chat d">
      <div dir="rtl" class="grid items-center justify-center text-center">
              <button style="margin: 0 auto;" on:click={close} class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
      title="ביטול"
      ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
      </svg></button>
  {#if loading === true}
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  {:else}
    <Diun 
    on:rect={afreact} 
    on:no={afterwhy} 
    {no} 
    bind:clicked
    rect={noofusersOk > 0 && noofusersNo > 0 ? true : false} 
    smalldes={projectName} 
    nameChatPartner={`הצבעה על ${name}`} 
    {mypos} 
    profilePicChatPartner={src}
     messages={messege}
     {pendId}
     ani="pendM"
     />
  {/if}
      </div>
  </DialogContent>
{/if}
  </div>
</DialogOverlay>
{#if cards == false}
<div
role="contentinfo"
style="position: relative;" 
on:click={()=>{modal = true
  dispatch("modal")
dialogOpen = true
}}
style:z-index={hovered === false ? 11 : 16}  
on:mouseenter={()=> hoverede()} 
on:mouseleave={()=> hoverede()}
use:clickOutside on:click_outside={toggleShow} 
class="hover:scale-290 duration-1000 ease-in" transition:fly|local={{y:450, duration: 2200, opacity: 0.5}}>
<Swiper  dir="rtl"
  on:swiper={setSwiperRef}
  effect={"flip"}

  grabCursor={true}
  modules={[EffectFlip, Navigation]}
  flipEffect={{ slideShadows: false}}
  class="mySwiper swiperg"
  navigation={{
    nextEl: `.normSml${pendId}`,
    prevEl: `.normSmll${pendId}`,
  }}
>
<div bind:clientWidth={w} style:width={tryo} style:top={tryot} style:left={tryoti} style="position:absolute;">
  <ProgressBar cls="transition: all 1000ms ease-in-out;" series={ser} width={w} textSize={0}  thickness={4}   style="radial"/>  
</div>
  <SwiperSlide class="swiper-slideg"
    ><div
	 id="normSml" 
>
 <button on:click={()=>project()} on:mouseenter={()=>hover(` לחיצה למעבר למוח הריקמה ${projectName}`)} on:mouseleave={()=>hover("0")} >
        <img class="img"
         src={src}  alt="projectlogo" >
 </button>
    <div class="{`normSml${pendId}`}"></div>
        <h1 on:mouseenter={()=>hover("שם המשימה")} on:mouseleave={()=>hover("0")} class="mn">{name}</h1>
       <p class="p"><span on:mouseenter={()=>hover("שווי לשעה")} on:mouseleave={()=>hover("0")} style="color:var(--gold)" >{perhour}</span> * <span on:mouseenter={()=>hover("כמות השעות")} on:mouseleave={()=>hover("0")} style="color: aqua" >{noofhours}</span> = <span on:mouseenter={()=>hover("סך הכל")} on:mouseleave={()=>hover("0")}>{noofhours * perhour} </span></p>
       <p class="p"><span on:mouseenter={()=>hover("סך ההצבעות בעד")} on:mouseleave={()=>hover("0")}  style="color:#7EE081;" >{noofusersOk} </span> <span on:mouseenter={()=>hover("לא הצביעו")} on:mouseleave={()=>hover("0")}  style="color:#0000cc;" >  {noofusersWaiting} </span><span on:mouseenter={()=>hover("כמות ההצבעות נגד")} on:mouseleave={()=>hover("0")}  style="color:#80037e;" >{noofusersNo} </span></p>
</div>
</SwiperSlide
  ><SwiperSlide class="swiper-slideg"
    ><div id="normSmll"
><div class="{`normSmll${pendId}`} "></div>
<button on:click={()=>linke()} class="ab na" >
	         <h3 class="ab na"
 on:mouseenter={()=>hover("לחיצה לצפיה בעמוד הציבורי של הריקמה")} on:mouseleave={()=>hover("0")}>{projectName}</h3>
</button>   
 <p on:mouseenter={()=>hover("תיאור")} on:mouseleave={()=>hover("0")} class="pnn bc d">{descrip !== undefined && descrip != null  && descrip != "null" ? descrip : ""}</p>
   {#if hearotMeyuchadot}
     <p on:mouseenter={()=>hover("הערות")} on:mouseleave={()=>hover("0")} class="pnn cd d">{hearotMeyuchadot !== undefined && hearotMeyuchadot != null && hearotMeyuchadot !== "undefined" ? hearotMeyuchadot : ""}</p>
     {/if}
    {#if low == false}
      {#if already === false && allr === false}
                  
   <button on:mouseenter={()=>hover("אישור")} on:mouseleave={()=>hover("0")}  on:click={agree} style="margin: 0;" class = "btn a" name="requestToJoin" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
   <button on:mouseenter={()=>hover("משא ומתן")} on:mouseleave={()=>hover("0")} on:click= {nego} style="margin: 0;" class = "btn c" name="negotiate" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
  <!--- <button on:mouseenter={()=>hover("התנגדות")} on:mouseleave={()=>hover("0")}  on:click={decline} style="margin: 0;" class = "btn c" name="decline" title="התנגדות"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>-->
      <!--- {:else if already === true && mypos === true && noofusersNo > 0 && allr === false}
       <button on:mouseenter={()=>hover("משא ומתן")} on:mouseleave={()=>hover("0")}  on:click={() => nego("alr")} style="margin: 0;" class = "btn a" name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
       <button on:mouseenter={()=>hover("התנגדות")} on:mouseleave={()=>hover("0")}  on:click={() => decline("alr")} style="margin: 0;" class = "btn b" name="decline" title="התנגדות"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>-->
      <!--- <button on:mouseenter={()=>hover("תגובה")} on:mouseleave={()=>hover("0")}  class="text-barbi btn j c " on:click={() => tochat()}><Chaticon class="btin"/></button>
       {:else if already === true && mypos === false && noofusersOk > 0  && allr === false}
 <button on:mouseenter={()=>hover("אישור")} on:mouseleave={()=>hover("0")}   on:click={() => agree("alr")} style="margin: 0;" class = "btn a" name="requestToJoin" title="אישור"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
        <button on:mouseenter={()=>hover("משא ומתן")} on:mouseleave={()=>hover("0")}  on:click={() => nego("alr")} style="margin: 0;" class = "btn b" name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
        <button on:mouseenter={()=>hover("תגובה")} on:mouseleave={()=>hover("0")}  class="text-barbi btn j c" on:click={() => tochat()}><Chaticon class="btin"/></button>
      --> {:else}
               <button on:mouseenter={()=>hover("לצפיה בדיון")} on:mouseleave={()=>hover("0")}  class="text-barbi btn re" on:click={() => tochat()}><Chaticon/></button>

        {/if}
     {:else if low == true}
          <Lowbtn/>
        {/if}
</div>
</SwiperSlide
  >
</Swiper>
</div>

{#if modal}
<div data-vaul-drawer-wrapper>
<Drawer.Root bind:open={dialogOpen} direction="right" shouldScaleBackground>
	<Drawer.Trigger/>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/40 " />
		<Drawer.Content class="fixed bottom-0 top-0 right-0 max-h-[96%] rounded-t-[10px] z-[1000] flex flex-row-reverse">
			<div class="swiper-slidec mx-auto ">
        
<Cards 
 on:agree={claf}
  on:decline={claf}
  on:hover={hoverc}
  on:tochat={tochat}
  {isVisible}
{skills}
  {timegramaDate}
    {tafkidims}
    {workways}
  {low}
   {isKavua}
  {noofhours}
  {perhour}
  {hearotMeyuchadot}
  {already} 
  {projectName}
   {src} 
   {noofusersWaiting} 
   {noofusersOk} 
   {name} 
   {restime}
   {createdAt}
   {descrip} {mypos} {allr} {noofusersNo}
   on:nego={claf}
   />
   </div>
   </Drawer.Content>
   </Drawer.Portal>
   </Drawer.Root>
   </div>
{/if}
{:else}
<Cards 
 on:agree={claf}
  on:decline={claf}
  on:hover={hoverc}
  on:tochat={tochat}
{skills}
  {timegramaDate}
    {tafkidims}
    {workways}
  {low}
   {isKavua}
  {noofhours}
  {perhour}
  {hearotMeyuchadot}
  {already} 
  {projectName}
   {src} 
   {noofusersWaiting} 
   {noofusersOk} 
   {name} 
   {restime}
   {createdAt}
   {descrip} {mypos} {allr} {noofusersNo}
   on:nego={claf}
   />
{/if}
{/await}

<style>
  .swiper-slidec {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px !important;
  border: 1px solid var(--barbi-pink);
  font-size: 22px;
  font-weight: bold;
  min-height:100vh;
  min-width: 25vw !important;
  max-width: 80vw !important;
  }
   .re{
    grid-column: 2/3;
  }
  .j{
  font-size:12px;
  }
 .btin{
    width:13px;
     height:13px;
  }
    .ab{
        grid-column: 1/4;
        grid-row: 1/ 2;
    }
    .bc{
        grid-column: 1/4;
        grid-row: 2/ 3;

    }
      .cd{
        grid-column: 1/4;
        grid-row: 3/ 4;

    }
      .de{
        grid-column: 1/4;
        grid-row: 4/ 5;

    }
  .a{
        grid-column: 1/2;
    }
    .b{
        grid-column: 2/3;
    }
      .b{
        grid-column: 3/4;
    }
   #normSmll{

        white-space: normal;
        text-align: center; 
        align-items: center;
        justify-content: safe center;
        color: var(--barbi-pink);
      min-height: 75px;
    min-width: 75px;
   max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1 /1;
         border-radius: 50%;
         text-shadow: 1px 1px  rgb(63, 56, 18);
         background: url(https://res.cloudinary.com/love1/image/upload/v1643838503/pink_qfdffz.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    display: grid;
    grid-template-columns: auto auto auto auto;
    grid-template-rows: auto auto auto auto auto;
    }
  .pnn{
  color:rgb(233, 239, 239);
   margin: 2px;
    font-size: 8px; 
   line-height: 0.7; 
    max-height: 100%;
    overflow-y: auto;
  }
  .pn{
     margin: 2px; 
     font-size: 8px; 
     line-height: 1; 
     font-weight: bold;
     color: rgb(233, 239, 239);
  }
  .p{
    margin: 2px;
    font-size: 9px;
  }
  .mn{
  margin: 2px;
   font-size: 9px;
    font-weight: bold;
     color: rgb(233, 239, 239); 
    line-height: 0.7; 
  }
  .na{
    color:rgb(233, 239, 239);
      font-size: 8px;
       line-height: 1;
     font-weight: bold;
  }
  .img{
    margin-top: 0px;
     margin-bottom: 0px;
      margin-right:auto;
       margin-left: auto;
     border-radius: 50%;
     width: 22px;
      height : 22px;
  }
    input[type=text]{
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
     border: 1px solid var(--lturk);
     width: 250px;
     height: 30px;
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
   width: 250px;
     height: 30px;
    color: red;
     padding-left: 10px;
     padding-right: 10px;
}
	#normSml{
        
        text-align: center; 
        line-height: 0.8;
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
         text-shadow: 1px 1px  rgb(63, 56, 18);

         background: url(https://res.cloudinary.com/love1/image/upload/v1643838503/pink_qfdffz.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;

    }
	
    .btn{ 
         display: grid;
        align-items: center;
        justify-content: center;
        background-color: rgb(87, 208, 248);
        border-radius: 50%;
        color: var(--barbi-pink);
        text-align: center;
        opacity: 0.6;
  transition: 0.3s;
  padding: 2px;
  margin-right: 4px;
  margin-left: 4px;
          grid-row: 5/ 6;
    }
    

.btn:hover {
    opacity: 1;
    padding: 6px;
    }
    @media  (min-width: 550px) {
       .pnn{
   margin: 7px;
    font-size: 13px; 
    
  }
  .pn{
     margin: 2px; 
     font-size: 13px; 
    
  }
      .p{
    margin: 7px;
    font-size: 13px;
  }
      .mn{
  margin: 7px;
   font-size: 13px;
  }
      .na{
     margin: 2px;
      font-size: 13px;
      
  }
  .img{
     width: 32px;
      height : 32px;
  }
	#normSml{
     
      max-width: 94%;
    max-height: 94%;
  }
}
   :global([data-svelte-dialog-content].chat) {
       z-index: 1000;
      padding: 0px;
      background-color: #242526;
          margin: 0px;
                height: 70vh; 
      aspect-ratio: 1/1.7;
          margin-top: 30vh;
                          border-radius: 10%;
      overflow-y: auto;
        }
        :global([data-svelte-dialog-content].nego) {
       z-index: 1000;
      padding: 15px;
      background-color: #242526;
          margin: 0px;
                margin-right: 25px;

                height: 70vh; 
      width: fit-content;
          margin-top: 30vh;
          border-radius: 5%;
      overflow-y: auto;
        border-top-right-radius: 2%;
          border-bottom-right-radius: 2%;
        }
    :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
 @media (max-width: 450px){
        :global([data-svelte-dialog-content].chat) {
              width: 80vw;
        }
      }
  @media (min-width: 600px){
        :global([data-svelte-dialog-content].chat) {
                overflow-y: auto;
       z-index: 1000;
      padding: 0px;
      background-color: #242526;
      margin: 0px;
                      height: 80vh; 
                margin-top: 20vh;
                border-radius: 5%;
              width: auto !important;
        }
          :global([data-svelte-dialog-content].nego) {
                overflow: auto;
              
       z-index: 1000;
      padding: 15px;
      margin-right: 25px;
      background-color: #242526;
      margin: 0px;
                margin-top: 20vh;
                height: 80vh;
                max-width: 100vw;
                border-radius: 5%;
                border-top-right-radius: 2%;
                 border-bottom-right-radius: 2%;
        }
          :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
    .btin{
  width: 24px;
  height: 24px;
  }
    
  }

</style>