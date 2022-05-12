<script>
  import Diun from './diun.svelte';
import { RingLoader
} from 'svelte-loading-spinners'
   import Chaticon from '../../celim/chaticon.svelte'
    import { clickOutside } from './outsidclick.js';
    import {  fly } from 'svelte/transition';
   import { createEventDispatcher } from 'svelte';
  import Nego from '../prPr/negoM.svelte';
  import { goto, prefetch } from '$app/navigation';
import { idPr } from '../../stores/idPr.js';
  import moment from 'moment'
  import ProgressBar from "@okrad/svelte-progressbar";
 import { onMount } from 'svelte';
  const dispatch = createEventDispatcher();
    export let mypos = null;
    export let messege = [];
    export let whyno = [];
	export let shows = true;
    export let descrip = "";
    export let projectName = "";
    export let name = "";
    export let hearotMeyuchadot = "";
    export let kindOf = "";
    export let src = "coin.png";
    export let projectId;
    export let link = "https://onelovevone.onrender.com/project/";
    export let uids = [];
    export let what = [];
    export let noofusersOk;
    export let noofusersNo;
    export let noofusersWaiting;
    export let total = 0;
    export let noofusers ;
    export let already = false;
    export let created_at;
    export let mshaabId;
    export let hm;
    export let price;
    export let easy;
    export let sqadualed;
    export let sqadualedf;
    export let pendId;
    export let users;
    export let linkto;
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
let monts = 0
let diunm = false;
function tochat (){
   no = false;
         masa = false;
         diunm = true
            isOpen = true;
}

    function percentage(partialValue, totalValue) {
   return (100 * partialValue) / totalValue;
} 
let ok;
let nook;
let tryo = "116%";
let tryot = "-10.5%";
let tryoti = "-5.25%";
let nut;
let yers;
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
if (nut > 0 && nook > 0 ){
  tryo = "129%"
  tryot = "-17%"
  tryoti = "-11.5%"
}

ser = ser
console.log(pendId,ser)
return ser
}

let ser = xyz();

    onMount(async () => {
var a = moment(sqadualedf);
var b = moment(sqadualed);
yers = a.diff(b, 'years', true).toFixed(2); 
monts = a.diff(b, 'months', true).toFixed(2); 

})

function coinLapach() {
             isOpen = false;
        dispatch('coinLapach', {
    data: pendId
    } );
};

function objToString (obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
        
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
let whyy = ``
let ordern = ``;
    let linkg = 'https://onelovevone.onrender.com/graphql';
    let userss = objToString(users);
    const diunim = objToString(diun);
async function agree(alr) {
  if  (alr == "alr"){
        allr = true;
       noofusersOk += 1;
  noofusersNo -= 1;
  ser = xyz();
    userss = objToStringC(users)
    ordern = `order: 2`
      } else{
  already = true;
   noofusersOk += 1;
  noofusersWaiting -= 1;
  ser = xyz();
      }
    const date = (sqadualed !== undefined) ? `sqadualed: "${new Date(sqadualed).toISOString()}",` : ``;
        const sdate = (sqadualedf !== undefined) ? `sqadualedf: "${new Date(sqadualedf).toISOString()}",` : ``;
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
    try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { createOpenMashaabim(
    input: {
      data: {project: "${projectId}",
             spnot: "${hearotMeyuchadot}",
             name: "${name}",
             descrip: "${descrip}",
             kindOf: ${kindOf},
             hm: ${hm},
             price: ${price},
             easy: ${easy},
             linkto: "${linkto}",
             pmash: "${pendId}",
             mashaabim: "${mshaabId}"
             ${date} 
             ${sdate}
      }
    }
  ) {openMashaabim {project{id }}}
  updatePmash(
      input: {
      where: {id: ${pendId}}
      data: { users:[  ${userss}, 
     {
      what: true
      users_permissions_user: "${idL}"
      ${ordern}
    }
  ],
archived: true
}
      }
  ){pmash { users { users_permissions_user { id}}}}
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
        }
          } else {
 try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { updatePmash(
      input: {
      where: {id: ${pendId}}
      data: { users:[  ${userss}, 
         
     {
      what: true
      users_permissions_user: "${idL}"
            ${ordern}
    }
  ]}
      }
  ){pmash { users { users_permissions_user { id}}}}
} `   
// make coin desapire
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
        dispatch("coinLapach")
        } catch (e) {
            error1 = e
            console.log(error1)
        }
       
      }
          };
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
async function nego(alr) {
  already = true;
        console.log("nego")   
        no = false;
         masa = true;
            isOpen = true;
            console.log(no)
}
let archivedtru = ``;

function decline(alr) {
      if  (alr == "alr"){
                  allr = true;
        isOpen = true
              already = true;
         noofusersNo += 1;
  noofusersOk -= 1;
  ser = xyz();
   userss = objToStringC(users)
    ordern = `order: 2`
    if (noofusersNo === noofusers){
   archivedtru  = `archived: true,`;
  }
      afterwhy() 
      } else{
      already = true;
      no = true;
                  diunm = true
            isOpen = true;
        //create why alert (from smui) add validation for minimum 
        // send why with userss, create way to show why for all agreed users and for them to response.
	}
}
  let why = "";
let isOpen = false;
let loading = false;
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
          `mutation { updatePmash(
      input: {
      where: {id: ${pendId}}
      data: { 
        ${archivedtru}
        users:[  ${userss}, 
     {
      what: false
      ${whyy}
      users_permissions_user: "${idL}"
                  ${ordern}
    }
  ]}
      }
  ){pmash { users { users_permissions_user { id}}}}
} `   
// make coin desapire
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
         loading = false
         isOpen = false
                 coinLapach()
        } catch (e) {
            error1 = e
            console.log(error1)
        }
}
     const close = () => {
    isOpen = false;
    no = false; 
    masa = false;
    allr = false;
          rect = false;
  };

  function afternego (event) {
  isOpen = false;
    no = false; 
    masa = false;
    //dispach or update  coin to negotiable state 
  }

 
$: ucli = 0
$: pcli = 0
$: pmcli = 0
function linke (){
 
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
  let rect = false;
  let allr = false;
async function react (){
     allr = true;
      rect = true;
      isOpen = true;
}
async function afreact (event){
   why = event.detail.why
  console.log(why)
           loading = true;
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
          `mutation { updatePmash(
      input: {
      where: {id: ${pendId}}
      data: { diun:[  ${diunim}, 
         
     {
      what: ${mypos}
      users_permissions_user: "${idL}"
      why: "${why}"
      order: ${order+=1}
    }
  ]}
      }
  ){pmash { users { users_permissions_user { id}}}}
 } `   
 // make coin desapire
 } )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
         messege.push({
                    message: why,
                    what: mypos,
                    pic:mysrc,
                    sentByMe: true,       
                  })
            messege = messege     
         loading = false;
        } catch (e) {
            error1 = e
            console.log(error1)
        }
}

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
 $: w = 0;
 let u = "הצבעה על בקשת משאב לריקמה"
let hovered = false;
function hover (id){
  if (id == "0"){
 u = "הצבעה על בקשת משאב לריקמה"
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
 u = "הצבעה על בקשת משאב לריקמה"
  }
  dispatch("hover", {id: u});
 }
</script>
{#await ser}
<h1>..</h1>
{:then ser}

    <DialogOverlay {isOpen} onDismiss={close} class="overlay">
        <div transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent class="chat" aria-label="form" >
      <div dir="rtl" class="grid items-center justify-center aling-center">
              <button on:click={close} style="margin: 0 auto;"class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
title="ביטול"
><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
{#if loading === true}
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         <!--   {:else if rect === true}
            <div class="text-center">
  <h1>  ניתן להגיב ולנמק מדוע 
    {mypos === false ? "לדחות" : " לאשר "}  
     את ההצעה
                     <br>
                        נא להתייחס לתגובה הקודמת ולהשיב על הטענות שעלו בה
                        </h1>
                        <small style="color: red;">התגובה הקודמת</small>
    {#if whyno.length > 0}<h4 style="color:var(--barbi-pink); font-size: 13px;">{whyno.join(' ~ ')}</h4>{/if}
    <br> 
    <lebel for="yu">התגובה שלך</lebel>   
    <input id="yu" minlength="26"  type="text" bind:value={why} placeholder="התשובה שלך">
            <button on:click={afreact}>אישור</button>  </div> -->
{:else if masa === true}
<h2 class="bg-gold text-barbi text-center">   .יבנה במהרה בימינו אמן 
בנתיים יש להגיב לא ולנמק ואז ליצור משאב חדש עם המאפיינים הרצויים </h2>
<!--
<Nego
        on:close={afternego}
  descrip ={descrip}
  projectName ={projectName}
  name1 ={name}
  hearotMeyuchadot = {hearotMeyuchadot}
  kindOf ={kindOf}
  hm = {hm}
  projectId = {projectId}
  total ={total}
  noofusers={noofusers}
  price={price}
  easy = {easy}
  linkto = {linkto}
  pendId ={pendId}
  mshaabId={mshaabId}
  sqadualedf={sqadualedf}
  sqadualed={sqadualed}
  users={users}
/>-->
  {:else if diunm === true}
 <Diun on:rect={afreact} on:no={afterwhy} {no} rect={noofusersOk > 0 && noofusersNo > 0 ? true : false} smalldes={projectName} nameChatPartner={`הצבעה על ${name}`} {mypos} profilePicChatPartner={src} messages={messege}/>
{/if}
      </div>
  </DialogContent>
  </div>
</DialogOverlay>

<div 
use:clickOutside
on:click_outside={toggleShow} 
style="position: relative;" 
style:z-index={hovered === false ? 1 : 6} 
on:mouseenter={()=> hoverede()} 
on:mouseleave={()=> hoverede()}
class="hover:scale-290 duration-1000 ease-in" 
transition:fly|local={{y:450, duration: 2200, opacity: 0.5}}
>
 
<Swiper  dir="rtl" 
  on:swiper={setSwiperRef}
  effect={"flip"}

  grabCursor={true}
  modules={[EffectFlip, Navigation]}
  flipEffect={{ slideShadows: false}}
  class="mySwiper"
  navigation={{
    nextEl: `.normSml${pendId}-${projectId}-hh`,
    prevEl: `.normSmll${pendId}-${projectId}-hh`,
  }}
>
<div bind:clientWidth={w} style:width={tryo} style:top={tryot} style:left={tryoti} style="position:absolute;">
  <ProgressBar cls="transition: all 1000ms ease-in-out;" series={ser} width={w} textSize={0}  thickness={4}   style="radial"/>  
</div>
  <SwiperSlide>  
<div id="normSml" > 

 <button on:click={()=>project()} on:mouseenter={()=>hover(` לחיצה למעבר למוח הריקמה ${projectName}`)} on:mouseleave={()=>hover("0")} >
        <img class="img"
         src={src}  alt="projectlogo" >
 </button>
           <h1 on:mouseenter={()=>hover("שם המשאב")} on:mouseleave={()=>hover("0")} class=" pn" >{name}</h1>
        {#if kindOf === "perUnit"}
       <p class="p"><span on:mouseenter={()=>hover(" שווי ליחידה")} on:mouseleave={()=>hover("0")} style="color:var(--gold)" >{easy > 0 ? easy : price}</span> * <span on:mouseenter={()=>hover("כמות")} on:mouseleave={()=>hover("0")} style="color: aqua" >{hm}</span> = <span on:mouseenter={()=>hover("סך הכל")} on:mouseleave={()=>hover("0")} >{easy > 0 ? easy * hm : price * hm}</span> </p>
   {:else if kindOf === "total" || kindOf === "rent"}
       <p class="p"><span on:mouseenter={()=>hover("שווי מוצע")} on:mouseleave={()=>hover("0")} style="color:var(--gold)" >{easy > 0 ? easy : price}</span></p>
          {:else if kindOf === "monthly"}
       <p class="p"><span on:mouseenter={()=>hover("שווי לחודש")} on:mouseleave={()=>hover("0")}  style="color:var(--gold)" >{easy > 0 ? easy : price}</span> * <span on:mouseenter={()=>hover("כמות חודשים")} on:mouseleave={()=>hover("0")}  style="color: aqua" >{monts}</span> = <span on:mouseenter={()=>hover("סך הכל")} on:mouseleave={()=>hover("0")} >{easy > 0 ? easy * monts : price * monts}</span> </p>
          {:else if kindOf === "yearly"}
       <p class="p"><span on:mouseenter={()=>hover("שווי לשנה")} on:mouseleave={()=>hover("0")}  style="color:var(--gold)" >{easy > 0 ? easy : price}</span> * <span on:mouseenter={()=>hover("מספר שנים")} on:mouseleave={()=>hover("0")}  style="color: aqua" >{yers}</span> = <span on:mouseenter={()=>hover("סך הכל")} on:mouseleave={()=>hover("0")} >{easy > 0 ? easy * yers : price * yers}</span> </p>
{/if}
       <p class="p"><span on:mouseenter={()=>hover("סך ההצבעות בעד")} on:mouseleave={()=>hover("0")}  style="color:#7EE081;" >{noofusersOk} </span> <span on:mouseenter={()=>hover("לא הצביעו")} on:mouseleave={()=>hover("0")}  style="color:#0000cc;" >  {noofusersWaiting} </span><span on:mouseenter={()=>hover("כמות ההצבעות נגד")} on:mouseleave={()=>hover("0")}  style="color:#80037e;" >{noofusersNo} </span></p>
<div class={`normSml${pendId}-${projectId}-hh`}></div>
      </div>

</SwiperSlide
  ><SwiperSlide
    ><div  id="normSmll"
 >

       <button  class="ab pn" on:click={() =>linke()}
        ><h3 on:mouseenter={()=>hover("לחיצה למעבר לעמוד הציבורי של הריקמה")} on:mouseleave={()=>hover("0")}  class="ab pn">{projectName}</h3></button>
        <div class="{`normSmll${pendId}-${projectId}-hh`}">    </div>

    {#if whyno.length > 0}<h4 on:mouseenter={()=>hover("טענת הנגד האחרונה שהוצגה")} on:mouseleave={()=>hover("0")}  class="bc" style:visibility={whyno.length > 0 ? "hidden"  : "visible"} style="color:var(--barbi); font-size:10px; font-weight:bold;">{whyno.join(' ~ ')}</h4>{/if} 
 {#if descrip !== undefined || null}<h5 style:visibility={descrip !== undefined || null ? "hidden"  : "visible"} on:mouseenter={()=>hover("תיאור")} on:mouseleave={()=>hover("0")} class="pnn cd">{descrip}</h5>{/if}
    {#if hearotMeyuchadot !== undefined || null || "undefined"}<h6  style:visibility={hearotMeyuchadot !== undefined || null || "undefined"  ? "hidden"  : "visible"} on:mouseenter={()=>hover("הערות מיוחדות")} on:mouseleave={()=>hover("0")} class="pnn de">{hearotMeyuchadot}</h6>{/if}

     {#if already === false && allr === false}
                  
   <button on:mouseenter={()=>hover("אישור")} on:mouseleave={()=>hover("0")}  on:click={agree} style="margin: 0;" class = "btn a" name="requestToJoin" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
   <button on:mouseenter={()=>hover("משא ומתן")} on:mouseleave={()=>hover("0")} on:click= {nego} style="margin: 0;" class = "btn b" name="negotiate" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
   <button on:mouseenter={()=>hover("התנגדות")} on:mouseleave={()=>hover("0")}  on:click={decline} style="margin: 0;" class = "btn c" name="decline" title="התנגדות"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
       {:else if already === true && mypos === true && noofusersNo > 0 && allr === false}
       <button on:mouseenter={()=>hover("משא ומתן")} on:mouseleave={()=>hover("0")}  on:click={() => nego("alr")} style="margin: 0;" class = "btn a" name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
       <button on:mouseenter={()=>hover("התנגדות")} on:mouseleave={()=>hover("0")}  on:click={() => decline("alr")} style="margin: 0;" class = "btn b" name="decline" title="התנגדות"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
       <button on:mouseenter={()=>hover("תגובה")} on:mouseleave={()=>hover("0")}  class="text-barbi btn j c" on:click={() => tochat()}><Chaticon/></button>
       {:else if already === true && mypos === false && noofusersOk > 0  && allr === false}
 <button on:mouseenter={()=>hover("אישור")} on:mouseleave={()=>hover("0")}   on:click={() => agree("alr")} style="margin: 0;" class = "btn a" name="requestToJoin" title="אישור"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
        <button on:mouseenter={()=>hover("משא ומתן")} on:mouseleave={()=>hover("0")}  on:click={() => nego("alr")} style="margin: 0;" class = "btn b" name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
        <button on:mouseenter={()=>hover("תגובה")} on:mouseleave={()=>hover("0")}  class="text-barbi btn j c" on:click={() => tochat()}><Chaticon/></button>
        {:else}
               <button on:mouseenter={()=>hover("לצפיה בדיון")} on:mouseleave={()=>hover("0")}  class="text-barbi btn re flex items-center" on:click={() => tochat()}><Chaticon/></button>

        {/if}
    
</div>
</SwiperSlide
  >
</Swiper>
</div>
{/await}
<style>
  .re{
    grid-column: 2/3;
  }
  .j{
  font-size:12px;
  }
  .btin{
  width: 13px;
  height: 13px;
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
    }
  .a{
              grid-row: 5/ 6;
        grid-column: 1/2;
    }
    .b{
                grid-row: 5/ 6;

        grid-column: 2/3;
    }
    .c{
              grid-column: 3/4;
          grid-row: 5/ 6;

    }
  .pnn{
  color:aqua;

    font-weight: bold; 
   line-height: 0.7; 
  }
  .pn{
      padding: 0 9px;

     font-weight: bold;
     color: aqua;
  }
  .p{
    font-weight: bold;

  }
  .mn{
    font-weight: bold;
     color: rgb(87, 208, 248 ); 
    line-height: 0.7; 
  }
  .na{
    color:aqua;
       line-height: 1;
     font-weight: bold;
  }
  .img{
      margin-right:auto;
       margin-left: auto;
     border-radius: 50%;
     width: 25px;
      height : 25px;
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
   #normSmll{
     display: grid;
        font-size: 9px;
        text-align: center; 
        line-height: 0.8;
        align-items: center;
        justify-content:  center;
        color: var(--barbi-pink);
       min-height: 75px;
    min-width: 75px;
    max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1 /1;
    grid-template-rows: repeat(4, 1fr);
    grid-template-columns: repeat(3, 1fr);
         border-radius: 50%;
         text-shadow: 1px 1px  rgb(63, 56, 18);

         background: url(https://res.cloudinary.com/love1/image/upload/v1646078558/niceCoin_usali2.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;

    }
	
    #normSml{
              font-size: 9px;

         text-shadow: 1px 1px  rgb(63, 56, 18);
        color: var(--barbi-pink);
         min-height: 75px;
    min-width: 75px;
    max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1/ 1;
        border-radius: 50%;
        line-height: normal;
        text-align: center;
        background: url(https://res.cloudinary.com/love1/image/upload/v1646078558/niceCoin_usali2.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    }
    .btn{ 
        
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
  
   :global([data-svelte-dialog-content].chat) {
 width: fit-content;
       z-index: 1000;
      padding: 0px;
      background-color: #242526;
          margin: 0px;
          max-width: 70vw;
          margin-top: 20vh;
                          border-radius: 10%;

        }
    :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
  @media (min-width: 600px){
        :global([data-svelte-dialog-content].chat) {
 width: fit-content;
       z-index: 1000;
      padding: 0px;
      background-color: #242526;
      margin: 0px;
      max-width: 50vw;
                margin-top: 10vh;
                border-radius: 15%;
        }
          :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
    .btin{
  width: 24px;
  height: 24px;
  }
        :global([data-svelte-dialog-content].content) {
width:50vw;
        }
  }
    @media  (min-width: 550px) {
       #normSml{
      font-size: 13px; 
      }
       #normSmll{
     display: grid;
        font-size: 13px;
        text-align: center; 
        line-height: 0.8;
       }
        
       .pnn{
    font-size: 13px; 
    
  }
  .pn{
    padding: 0 15px;
  }
      .p{
    font-size: 13px;
  }
      .mn{
   font-size: 13px;
  }
      .na{
      font-size: 13px;
      
  }
  .img{
     width: 32px;
      height : 32px;
  }
	.normSml{
        min-height: 125px;
        min-width: 125px;
      
  }
   .normSmlHover{

        height: 195px;
        width: 195px;
   }
    }
    
</style>