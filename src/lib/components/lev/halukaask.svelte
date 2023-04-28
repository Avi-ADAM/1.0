<script>
    import { clickOutside } from './outsidclick.js';
    import {  fly } from 'svelte/transition';
   import { createEventDispatcher } from 'svelte';
 import { goto } from '$app/navigation';
import { idPr } from '../../stores/idPr.js';
  import moment from 'moment'
  import ProgressBar from "@okrad/svelte-progressbar";
  import Lowbtn from '$lib/celim/lowbtn.svelte'

 const dispatch = createEventDispatcher();
     export let low = false;
    export let halukot = []
    export let hervach = []
    export let mypos = null;
    export let coinlapach;
    export let whyno = [];
    export let projectName = "";
    export let name = "";
    export let src = "coin.png";
    export let projectId;
    export let noofusersOk;
    export let noofusersNo;
    export let noofusersWaiting;
    export let noofusers ;
    export let already = false;
    export let created_at;
    export let pendId;
    export let users;
    export let diun = [];
    export let order = diun.length;
    let miDatan = [];
    let error1;
    let bearer1;
    let token;
    let idL;
    let no = false;
    let masa = false;
function percentage(partialValue, totalValue) {
   return (100 * partialValue) / totalValue;
  } 
let ok;
let nook;
let tryo = "116%";
let tryot = "-10.5%";
let tryoti = "-5.25%";
let nut;
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
  tryoti = "-11.5%"    }
    ser = ser
    return ser
}

let ser = xyz();

function coinLapach() {
             isOpen = false;
        dispatch('coinLapach', {
     ani: "halu",
                coinlapach: coinlapach
    } );
};

function objToString (obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
        
    for (const [p, val] of Object.entries(obj[i])) {
        if (typeof(val) == "number"|"boolean") {
        str += `{${p}:${val}\n},`;
        } else if (typeof(val) == "string"){
                  str += `{${p}:"${val}"\n},`;
    } else if (typeof(val) == 'null'){
                str += `{${p}:${val.map(c => c.id)}\n},`;
    }
    }}
    return str;
}
let linkg = 'https://beosher.onrender.com/graphql';
  
async function agree(alr) {
  if  (alr == "alr"){
        alert("soon")
      } else{
        let miDatani = []
  already = true;
  noofusersOk += 1;
  noofusersWaiting -= 1;
  ser = xyz();
    const userss = objToString(users);
    const diunim = objToString(diun);
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
if (noofusersOk  === noofusers){
    try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
            //create splits coin for each giver and reciver, archive haluask.
          `mutation { 
  updateTosplit(
      id: ${pendId}
      data: { vots:[  ${userss},      
     {
      what: true
      users_permissions_user: "${idL}"
    }
  ],
 finished: true
 }
  ){data {attributes{ vots { users_permissions_user {data{ id}}}}}}
 } `   
 } )})
  .then(r => r.json())
  .then(data => miDatan = data); 
        console.log(miDatan)
        for (let t = 0; t < halukot.length; t++) {
          const idd = halukot[t].id;
          //send apruved for each haluka
         const qurer =  `  
updateHaluka( id:${idd}
      data: { ushar:true
      }
    
    ){data{ id  }} `
         
 try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation 
          { ${qurer}
}`   
} )})
  .then(r => r.json())
  .then(data => miDatani = data);
            console.log(miDatani)
        } catch (e) {
            error1 = e
            console.log(error1)
}
//if hervach has user with resiv and giv fls then update his hervachti
for (let o = 0; o < hervach.length; o++) {
  const element = hervach[o];
  console.log(element.noten,element.mekabel,element.users_permissions_user.data.id,element.users_permissions_user.data.attributes.hervachti,element.amount)
  if (element.noten != true && element.mekabel != true){
    const iduse = element.users_permissions_user.data.id
    const amount = element.users_permissions_user.data.attributes.hervachti + element.amount
     try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation 
          { updateUsersPermissionsUser(
    id:${iduse} 
      data: { hervachti: ${amount} }
    
  ){
      data {
        id
  }
}
}`   
} )})
  .then(r => r.json())
  .then(data => miDatani = data);
            console.log(miDatani)
        } catch (e) {
            error1 = e
            console.log(error1)
}
  }
}

        }
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
          `mutation {  updateTosplit(
      input: {
      where: {id: ${pendId}}
      data: { vots:[  ${userss},      
     {
      what: true
      users_permissions_user: "${idL}"
    }
  ],
 }
  ){data { vots { users_permissions_user {data{ id}}}}}
 } `   
// make coin desapire
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
        } catch (e) {
            error1 = e
            console.log(error1)
        }
       
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
    function decline(alr) {
      if  (alr == "alr"){
        alert("soon")
      } else{

      already = true;

      no = true;
            isOpen = true;
        //create why alert (from smui) add validation for minimum 
        // send why with userss, create way to show why for all agreed users and for them to response.
	}
}
  let why;
let isOpen = false;

async function afterwhy (){
        if (why.length > 20) {
          
    isOpen = false;
  already = true;
   noofusersNo += 1;
  noofusersWaiting -= 1;
  ser = xyz();      
    const userss = objToString(users);
    const diunim = objToString(diun);  
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
          `mutation {  updateTosplit(
id: ${pendId}
      data: { vots:[  ${userss},      
     {
      what: false
      why: "${why}"
      users_permissions_user: "${idL}"
    }
  ],
 }
  ){data { vots { users_permissions_user {data{ id}}}}}
} `   
// make coin desapire
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
                 coinLapach()
        } catch (e) {
            error1 = e
            console.log(error1)
        }
    } else{
          console.log("decline",why)
            alert("מינימום 20 תווים")
            already = false;
        }
           

}
const close = () => {
    isOpen = false;
    no = false; 
    masa = false;
    already = false;
    allr = false;
          rect = false;
};

function afternego (event) {
  isOpen = false;
    no = false; 
    masa = false;
    //dispach or update  coin to negotiable state 
}


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
async function afreact (){
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
id: ${pendId}
      data: { diun:[  ${diunim}, 
         
     {
      what: ${mypos}
      users_permissions_user: "${idL}"
      why: "${why}"
      order: ${order+=1}
    }
  ]}
  ){data {  id}}
} `   
// make coin desapire
 } )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
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
  if (swiperRef !== null){
    swiperRef.slideTo(index , 400);
  }
};
function toggleShow (){
  slideTo(0)
}
 $: w = 0;
 let u = "הצבעה על בקשה לחלוקת הרווחים שנצברו לריקמה"
let hovered = false;
function hover (id){
  if (id == "0"){
 u = "הצבעה על בקשה לחלוקת הרווחים שנצברו לריקמה"
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
   u = "הצבעה על בקשה לחלוקת הרווחים שנצברו לריקמה"
  }
  dispatch("hover", {id: u});
}
  function hoverc (event){
   if (event.detail.x == "0"){
   u = "הצבעה על בקשה לחלוקת הרווחים שנצברו לריקמה"
  } else {
    u = event.detail.x
  }
    dispatch("hover", {id: u});
}
   import Cards from './cards/haluka.svelte'
export let cards = false;
function claf (event){
  let o = event.detail.alr
  let d = event.detail.y
  console.log(o,d)
}
</script>
{#await ser}
<h1>..</h1>
{:then ser}

    <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent class="content" aria-label="form">
      <div dir="rtl" class="grid items-center justify-center aling-center">
              <button on:click={close} style="margin: 0 auto;"class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
title="ביטול"
><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
{#if no === true}
      <input minlength="26"  type="text" bind:value={why} placeholder="יש לנמק מדוע ההצעה נדחית על ידך">
            <button on:click={afterwhy}>אישור</button>
            {:else if rect === true}
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
            <button on:click={afreact}>אישור</button>  </div> 
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
 
{/if}
      </div>
  </DialogContent>
  </div>
</DialogOverlay>
{#if cards == false}

<div 
use:clickOutside
on:click_outside={toggleShow} 
style="position: relative;" 
style:z-index={hovered === false ? 11 : 16}  
on:mouseenter={()=> hoverede()} 
on:mouseleave={()=> hoverede()}
class="hover:scale-290 duration-1000 ease-in" 
transition:fly|local={{y:450, duration: 2200, opacity: 0.5}}>
 
<Swiper  dir="rtl" 
  on:swiper={setSwiperRef}
  effect={"flip"}
  grabCursor={true}
  modules={[EffectFlip, Navigation]}
  flipEffect={{ slideShadows: false}}
  class="mySwiper swiperg"
  navigation={{
    nextEl: `.normSml${pendId}-${projectId}-hdh`,
    prevEl: `.normSmll${pendId}-${projectId}-hdh`,
  }}
>
<div bind:clientWidth={w} style:width={tryo} style:top={tryot} style:left={tryoti} style="position:absolute;">
  <ProgressBar cls="transition: all 1000ms ease-in-out;" series={ser} width={w} textSize={0}  thickness={4}   style="radial"/>  
</div>
  <SwiperSlide class="swiper-slideg"
    >  

    <div
	 id="normSml" 
> 

 <button on:click={()=>project()} on:mouseenter={()=>hover(` לחיצה למעבר למוח הריקמה ${projectName}`)} on:mouseleave={()=>hover("0")}  >  
      <img class="img"
         src={src}  alt="projectlogo" >
 </button>
           <h1 class="{`normSml${pendId}-${projectId}-hdh`} pn" >{name == null ? "" : name} בקשת חלוקה </h1>
        


       <p class="p">
         <span on:mouseenter={()=>hover("בעד")} 
          on:mouseleave={()=>hover("0")} 
          style="color:#7EE081;" >{noofusersOk} </span>
          <span on:mouseenter={()=>hover("לא הצביעו")} 
            on:mouseleave={()=>hover("0")} 
            style="color:#0000cc;" >{noofusersWaiting} </span>
          <span on:mouseenter={()=>hover("נגד")} 
            on:mouseleave={()=>hover("0")}  style="color:#80037e;" >{noofusersNo} </span></p>
   
</div>

</SwiperSlide
  ><SwiperSlide class="swiper-slideg"
    ><div  id="normSmll"
 >

       <button on:click={()=>linke()}
        on:mouseenter={()=>hover("לחיצה למעבר לדף הציבורי של הריקמה")} 
            on:mouseleave={()=>hover("0")}   class="ab pn" 
        ><h3 class="ab pn pt-8 px-2">{projectName}</h3></button>
        <div class="{`normSmll${pendId}-${projectId}-hdh`}">    </div>

    {#if whyno.length > 0}<h4
     class="bc"
      style:visibility={whyno.length > 0 ? "hidden"  : "visible"}
       style="color:var(--barbi); font-size:10px; font-weight:bold;"
       on:mouseenter={()=>hover("טענת הנגד האחרונה שעלתה")} 
            on:mouseleave={()=>hover("0")} 
       >{whyno.join(' ~ ')}</h4>{/if} 
   {#if low == false}
     {#if already === false}
   <button on:mouseenter={()=>hover("אישור")} 
            on:mouseleave={()=>hover("0")}  on:click={agree} style="margin: 0;" class = "btn a" name="requestToJoin" title="אישור"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
   <button on:mouseenter={()=>hover("משא ומתן")} 
            on:mouseleave={()=>hover("0")} on:click= {nego} style="margin: 0;" class = "btn b" name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
   <button on:mouseenter={()=>hover("התנגדות")} 
            on:mouseleave={()=>hover("0")} on:click={decline} style="margin: 0;" class = "btn c" name="decline" title="התנגדות"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
       {:else if already === true && mypos === true && whyno.length > 0 && allr === false}
       <button on:mouseenter={()=>hover("אישור")} 
            on:mouseleave={()=>hover("0")} on:click={() => nego("alr")} style="margin: 0;" class = "btn a" name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
       <button on:mouseenter={()=>hover("התנגדות")} 
            on:mouseleave={()=>hover("0")} on:click={() => decline("alr")} style="margin: 0;" class = "btn b" name="decline" title="התנגדות"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
       <button on:mouseenter={()=>hover("תגובה")} 
            on:mouseleave={()=>hover("0")} class="text-barbi bg-gold j c" on:click={() => react()}>תגובה</button>
       {:else if already === true && mypos === false && diun.length > 0  && allr === false}
 <button on:mouseenter={()=>hover("אישור")} 
            on:mouseleave={()=>hover("0")} on:click={() => agree("alr")} style="margin: 0;" class = "btn a" name="requestToJoin" title="אישור"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
        <button on:mouseenter={()=>hover("משא ומתן")} 
            on:mouseleave={()=>hover("0")}  on:click={() => nego("alr")} style="margin: 0;" class = "btn b" name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
        <button on:mouseenter={()=>hover("תגובה")} 
            on:mouseleave={()=>hover("0")} class="c" on:click={() => react()}>תגובה</button>
        {/if}
     {:else if low == true}
          <Lowbtn/>
        {/if}
</div>
</SwiperSlide
  >
</Swiper>
</div>
{:else}

<Cards 
 on:agree={claf}
  on:decline={claf}
  on:hover={hoverc}
  {why}
  {already} 
  {projectName}
   {src} 
   {noofusersWaiting} 
   {noofusersOk} 
   {noofusersNo}
   />
{/if}
{/await}
<style>
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
  color:var(--gold);

    font-weight: bold; 
   line-height: 0.7; 
  }
  .pn{
             text-shadow: 1px 1px  var(--gold);

     font-weight: bold;
     color: var(--barbi-pink);
  }
  .p{
    font-weight: bold;
    font-size: 18px;
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

         background: url(https://res.cloudinary.com/love1/image/upload/v1650291863/Prismatic-Low-Poly-Sphere-4_smpaxv.svg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;

    }
	
    #normSml{
              font-size: 9px;

         text-shadow: 1px 1px  rgb(1, 1, 1);
        color: var(--barbi-pink);
         min-height: 75px;
    min-width: 75px;
    max-width: 94%;
    max-height: 94%;
    aspect-ratio: 1/ 1;
        border-radius: 50%;
        line-height: normal;
        text-align: center;
        background: url(https://res.cloudinary.com/love1/image/upload/v1650291863/Prismatic-Low-Poly-Sphere-4_smpaxv.svg);
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
  
   :global([data-svelte-dialog-overlay].overlay) {
    z-index: 100;
  }
  :global([data-svelte-dialog-content].content) {
      width: 80vw;
      z-index: 299;
  }
  @media (min-width: 568px){
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
  
      .p{
    font-size: 26px;
  }
      .mn{
   font-size: 13px;
  }
      .na{
      font-size: 13px;
      
  }
  .img{
     width: 46px;
      height : 46px;
  }
	.normSml{
        min-height: 125px;
        min-width: 125px;
        max-width: 125px;
        max-height: 125px;
  }
   .normSmlHover{

        height: 195px;
        width: 195px;
   }
    }
    
</style>