<script>
    import { pinch } from 'svelte-gestures';
  import * as animateScroll from "svelte-scrollto";

  import ProgressBar from "@okrad/svelte-progressbar";
 import { goto } from '$app/navigation';
 import { lang } from '$lib/stores/lang.js';
import Close from '../../celim/close.svelte'
import { onMount }from 'svelte'
import {
    clickOutside
} from './outsidclick.js';
import {
    fly
} from 'svelte/transition';
import {
    createEventDispatcher
} from 'svelte';
import Lowbtn from '$lib/celim/lowbtn.svelte'

const dispatch = createEventDispatcher();
    export let low = false, kind, messege, myid, userId,spdata;
    export let newpicid;  
export let coinlapach;
export let deadline;
export let projectName;
export let openmissionName;
export let src = "coin.png";
export let src2 = " ";
export let projectId;
export let created_at;
export let missionDetails = "";
export let noofpu = 0;
export let id;
export let openMid;
export let st = 205;
export let declined = [];
export let noofusersWaiting;
export let uids;
export let noofusersOk;
export let noofusersNo;
export let already = false;
export let pid
export let stylef = '24px';
export let askId;
export let users;
export let timegramaDate, restime,timegramaId
    const baseUrl = import.meta.env.VITE_URL

onMount(async () => {
  console.log("HACHLATA!!!")
  if (kind == "pic"){
    openmissionName = {"he": `הצבעה על שינוי הלוגו`, "en": "vote on Logo change"}
    st = 115
  }else{
        openmissionName = { "he":"הצבעה על יצירת שירות חדש",
            "en":"vote on creating new service"
        }
            st = 115

  }
})
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
let linkg = baseUrl+'/graphql';

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
    let update = ``
    let d = new Date()
  if (kind == 'pic'){
    update = `ProfilePic: "${newpicid}"`
  }
    console.log(uids);
 if (noofpu === noofusersOk) {   
  let que = `` 
      if(kind != "sheirutpends"){
        `updateSheirutpends(id:"${projectId}"
        data:{
          archived: true,
           vots: [${userss}, 
              {
               what: true
               ide:${idL}
               zman: "${d.toISOString()}"
               order:0
               users_permissions_user: "${idL}"
             }
           ]}          
        }){data{id}}
        updateSheirut(id:"${spdata.sheirut.data.id}"
        data:{
          isApruved:true
        }){data{id}}
        `
      }else{
        que `    updateProject(
     id: "${projectId}"
      data: {
        ${update}
                  }
  ) {data{id }}
 updateDecision(
              id: "${askId}"
       data: { archived: true,
           vots: [${userss}, 
              {
                ide:${idL}
               zman: "${d.toISOString()}"
               order:0
              what: true
              users_permissions_user: "${idL}"
            }
          ]}
         ){data{id}}`
      }
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation {
                     ${que}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            if(miDatan.data != null){
             let que4 = `mutation { 
             updateTimegrama(
     id: ${timegramaId}
             data:{
              done: true
             }){
              data{id}
             }
            }
              `
               try {
      let res4 = await SendTo(que4, VITE_ADMINMONTHER).then((res4) => (res4 = res4));
      console.log(res4,"ask res4 ")      
      if (res4.data != null) {
              console.log(res4.data,"ask res4 ")      
 dispatch('acsept', {
                ani: "askedma",
                coinlapach: coinlapach 
            })
               }
 } catch (e) {
      console.error(e);
    }
  }

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
                            updateDecision(
id: "${askId}" 
                                data: { vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                        ){data{id}}
                     
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

async function decline() {
        already = true;
     noofusersNo += 1;
  noofusersWaiting -= 1;
  ser = xyz();

   
}

let hovered = false;
function tochat () {
  dispatch("chat");
}
 $: w = 0;
 $:h = 0
 let u ={"he": "הצבעה על שינוי לוגו הריקמה", "en":"vote on changing FreeMates logo"}

function hover (id){
  if (id == "0"){
 u = {"he": "הצבעה על שינוי לוגו הריקמה", "en":"vote on changing FreeMates logo"}
  } else {
    u = id
  }
    dispatch("hover", {id: u[$lang]});

}
function hoverede(){
   hovered = !hovered
    if (hovered == false){
    u = {"he":"לב המערכת","en":"heart of 1💗1"}
  } else {
 u ={"he": "הצבעה על שינוי לוגו הריקמה", "en":"vote on changing FreeMates logo"}

  }
  dispatch("hover", {id: u[$lang]});
 }
 
function hoverc (event){
   if (event.detail.x == "0"){
 u ={"he": "הצבעה על שינוי לוגו הריקמה", "en":"vote on changing FreeMates logo"}
  } else {
    u = event.detail.x
  }
    dispatch("hover", {id: u[$lang]});
}
 import Card from './cards/hachlata.svelte'
  import {SendTo} from '$lib/send/sendTo.svelte';
export let cards = false;
export let tx = 200;
const newlogo = {"he":"הלוגו החדש שמוצע","en":"new Logo offered"}
const oldob = {"he":"הלוגו העכשווי", "en":"old Logo"}
let modal = true;
let top;
function tomodal(){
  modal = false;
  animateScroll.scrollToTop()
  dispatch("modal")
console.log("oh")
}
function handler (event){
  console.log(event.detail)
}
$: ww = 0
  let scale = 1
 $: if (ww < h){
    if(ww < 380){
      scale = ww/92
    } else if(ww < 430){
      scale = ww/102
    } else if(ww < 470){
      scale = ww/112
    } else {
      scale = ww/132
    } 
  } else {
    if(ww < 380){
      scale = h/92
    } else if(ww < 430){
      scale = h/102
    } else if(ww < 470){
      scale = h/112
    } else {
      scale = h/132
    } 
  }

</script>
{#await ser}
<h1>loop</h1>
{:then ser}
{#if cards == false}

<div 
role="contentinfo"
on:dblclick={tomodal}
 bind:clientWidth={ww}
 bind:clientHeight={h}
use:pinch 
  on:pinch="{handler}"
class:coinmodal={modal == false}
style="position: relative;" 
style:z-index={hovered === false && modal == true ? 11 : 58}  
on:mouseenter={()=> hoverede()} 
on:mouseleave={()=> hoverede()}
use:clickOutside on:click_outside={toggleShow}
class:hover:scale-290={modal == true}
class=" duration-1000 ease-in"  transition:fly|local={{y: 250, opacity: 0.9, duration: 2000} }>
<div bind:this={top}
 class="top"></div>
{#if modal == false}
<div 
 style="position: absolute; top: 24px; left:50%; transform: translate(-50%,-50%); z-index:99999;">
  <button  class="text-barbi hover:text-gold" on:click={()=> modal = true}><Close /></button>
</div>
{/if}
<span use:clickOutside on:click_outside={() =>modal = true}
 style:transform={modal == false ? `scale(${scale})` : ""}>
<Swiper  dir="rtl"
  on:swiper={setSwiperRef}
  effect={"flip"}
  grabCursor={true}
  modules={[EffectFlip, Navigation]}
  flipEffect={{ slideShadows: false}}
  class="mySwiper swiperg"
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
  <SwiperSlide class="swiper-slideg"
    ><div
    
	 id="normSml" 
>
<div
    style="--the:{stylef};"
    >
<svg version="1.1" id="desLayer_1" x="0px" y="0px" viewBox="1194.702695 779.45875 162.446096 162.190653" enable-background="new 0 0 2103.3203 1667.9167" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:bx="https://boxy-svg.com">
        <defs>
                <bx:grid x="-23.43558" y="159.787667" width="100" height="100"/>
                <linearGradient id="deslinearGradient4172">
                        <stop style="stop-opacity: 1; stop-color: rgb(105, 197, 209);" offset="0" id="desstop4174"/>
                        <stop offset="0.083" style="stop-color: rgb(255, 172, 64);"/>
                        <stop offset="0.181" style="stop-color: rgb(107, 99, 228);"/>
                        <stop offset="0.307" style="stop-color: rgb(228, 105, 250);"/>
                        <stop offset="0.517" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.669" style="stop-color: rgb(242, 133, 220);"/>
                        <stop offset="0.915" style="stop-color: rgb(47, 225, 184);"/>
                        <stop style="stop-opacity: 0; stop-color: rgb(16, 255, 191);" offset="1" id="desstop4176"/>
                </linearGradient>
                <path id="destext-path-0" d="M 262.9292457252741 724.03125 Q 374.44947788864374 615.765625 485.9697100520134 724.03125"/>
                <path id="destext-path-1" d="M 229.6546981483698 748.2107315063477 Q 374.4493424668908 640.0388565063477 519.2439867854118 748.2107315063477"/>
                <linearGradient id="desgradient-8">
                        <stop offset="0" style="stop-color: rgb(65, 21, 136);"/>
                        <stop offset="0.2072" style="stop-color: rgb(255, 163, 4);"/>
                        <stop offset="0.4213" style="stop-color: rgb(161, 254, 208);"/>
                        <stop offset="0.641" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.7258" style="stop-color: rgb(255, 199, 253);"/>
                        <stop offset="1" style="stop-color: #4bc0c8;"/>
                </linearGradient>
                <linearGradient id="desgradient-8-0" gradientUnits="userSpaceOnUse" x1="-11.410587" y1="-74.731157" x2="-11.410587" y2="125.268835" gradientTransform="matrix(-0.754888680208, -0.655853626728, 0.701070978292, -0.790485016248, -26.552696643615, 20.378790698498)" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-1" gradientUnits="userSpaceOnUse" x1="0" y1="-80" x2="0" y2="80" gradientTransform="matrix(0.726894335271, 0.686750080346, -0.804564100907, 0.856592964427, -11.269566742122, 8.384562548277)" xlink:href="#desgradient-8"/>
                <linearGradient id="deslinearGradient4172-2" gradientUnits="userSpaceOnUse" x1="0" y1="-80" x2="0" y2="80" xlink:href="#deslinearGradient4172"/>
                <linearGradient id="deslinearGradient4172-4" gradientUnits="userSpaceOnUse" x1="0" y1="-100" x2="0" y2="100" xlink:href="#deslinearGradient4172"/>
                <linearGradient x1="-0.028894" x2="-0.028894" y1="-0.221767" y2="0.778233" id="desgradient-0" gradientTransform="matrix(-0.223797066, 2.807657279324, -0.735254724459, -0.142553470129, 0.630090949504, 0.682546054271)">
                        <stop offset="0" style="stop-color: rgb(254, 172, 94);"/>
                        <stop offset="0.2037" style="stop-color: rgb(231, 7, 252);"/>
                        <stop offset="0.5881" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="1" style="stop-color: rgb(75, 192, 200);"/>
                </linearGradient>
                <linearGradient x1="0" x2="0" y1="0" y2="1" id="desgradient-19" gradientTransform="matrix(0.999989392915, -0.00690363767, -7.381e-9, 1.392766101665, 0.508886933327, 0.051793377846)">
                        <stop offset="0" style="stop-color: rgb(105, 197, 209);"/>
                        <stop offset="0.083" style="stop-color: rgb(255, 172, 64);"/>
                        <stop offset="0.181" style="stop-color: rgb(107, 99, 228);"/>
                        <stop offset="0.307" style="stop-color: rgb(228, 105, 250);"/>
                        <stop offset="0.517" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.669" style="stop-color: rgb(242, 133, 220);"/>
                        <stop offset="0.915" style="stop-color: rgb(47, 225, 184);"/>
                        <stop offset="1" style="stop-color: rgb(16, 255, 191); stop-opacity: 0"/>
                </linearGradient>
                <linearGradient id="desgradient-8-2" gradientUnits="userSpaceOnUse" x1="62.5" y1="100" x2="62.5" y2="124" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-3" gradientUnits="userSpaceOnUse" x1="60.899998" y1="101.699997" x2="60.899998" y2="122.299995" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-4" gradientUnits="userSpaceOnUse" x1="58.896753" y1="104.634323" x2="58.896753" y2="113.276024" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-5" gradientUnits="userSpaceOnUse" x1="49.499998" y1="20.399998" x2="49.499998" y2="34.899998" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-6" gradientUnits="userSpaceOnUse" x1="79.39999" y1="4" x2="79.39999" y2="88.5" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-7" gradientUnits="userSpaceOnUse" x1="60.584377" y1="4.2" x2="60.584377" y2="88.504451" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-8" gradientUnits="userSpaceOnUse" x1="48.602041" y1="8.267158" x2="48.602041" y2="27.711257" xlink:href="#desgradient-8"/>
                <linearGradient x1="0" x2="0" y1="0" y2="1" id="desgradient-2">
                        <stop offset="0" style="stop-color: rgb(105, 197, 209);"/>
                        <stop offset="0.083" style="stop-color: rgb(255, 172, 64);"/>
                        <stop offset="0.181" style="stop-color: rgb(107, 99, 228);"/>
                        <stop offset="0.307" style="stop-color: rgb(228, 105, 250);"/>
                        <stop offset="0.4967" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.669" style="stop-color: rgb(242, 133, 220);"/>
                        <stop offset="0.915" style="stop-color: rgb(47, 225, 184);"/>
                        <stop offset="1" style="stop-color: rgb(16, 255, 191); stop-opacity: 0"/>
                </linearGradient>
                <linearGradient x1="0" x2="0" y1="0" y2="1" id="desgradient-3">
                        <stop offset="0" style="stop-color: rgb(254, 172, 94);"/>
                        <stop offset="0.2037" style="stop-color: rgb(231, 7, 252);"/>
                        <stop offset="0.5881" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="1" style="stop-color: rgb(75, 192, 200);"/>
                </linearGradient>
                <linearGradient x1="0" x2="0" y1="0" y2="1" id="desgradient-4">
                        <stop offset="0" style="stop-color: rgb(105, 197, 209);"/>
                        <stop offset="0.083" style="stop-color: rgb(255, 172, 64);"/>
                        <stop offset="0.181" style="stop-color: rgb(107, 99, 228);"/>
                        <stop offset="0.307" style="stop-color: rgb(228, 105, 250);"/>
                        <stop offset="0.517" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.669" style="stop-color: rgb(242, 133, 220);"/>
                        <stop offset="0.915" style="stop-color: rgb(47, 225, 184);"/>
                        <stop offset="1" style="stop-color: rgb(16, 255, 191); stop-opacity: 0"/>
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1277.371582" y1="878.059692" x2="1277.371582" y2="915.86908" id="desgradient-1" gradientTransform="matrix(0.999842524528, 0.017750786617, -4.8996e-7, 0.817124962807, -0.436929970915, 144.130935668888)">
                        <stop offset="0" style="stop-color: rgb(254, 172, 94);"/>
                        <stop offset="0.2037" style="stop-color: rgb(231, 7, 252);"/>
                        <stop offset="0.7503" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="1" style="stop-color: rgb(75, 192, 200);"/>
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1275.92572" y1="887.198853" x2="1275.92572" y2="918.401733" id="desgradient-10" gradientTransform="matrix(1.966910847481, -0.012811510475, 0.103871255342, 1.227695672948, -1325.221774444, -198.180313027092)">
                        <stop offset="0" style="stop-color: rgb(254, 172, 94);"/>
                        <stop offset="0.2037" style="stop-color: rgb(231, 7, 252);"/>
                        <stop offset="0.5881" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="1" style="stop-color: rgb(75, 192, 200);"/>
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1213.250004" y1="793.897034" x2="1213.250004" y2="811.712948" id="desgradient-8-12" gradientTransform="matrix(0.99953350807, 0.023905547683, 0.051217046866, 3.148688275153, -40.09509024791, -1734.840653697257)" xlink:href="#desgradient-8"/>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1212.220001" y1="792.222473" x2="1212.220001" y2="811.472059" id="desgradient-5" gradientTransform="matrix(0.998129736518, -0.048505495716, -0.047405668989, 1.195203713433, 40.735545945283, -99.603026110877)">
                        <stop offset="0" style="stop-color: rgb(254, 172, 94);"/>
                        <stop offset="0.2037" style="stop-color: rgb(231, 7, 252);"/>
                        <stop offset="0.6763" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="1" style="stop-color: rgb(75, 192, 200);"/>
                </linearGradient>
                <radialGradient gradientUnits="userSpaceOnUse" cx="272.799042" cy="690.554321" r="14.029419" id="desgradient-6">
                        <stop offset="0" style="stop-color: rgb(105, 197, 209);"/>
                        <stop offset="0.083" style="stop-color: rgb(255, 172, 64);"/>
                        <stop offset="0.181" style="stop-color: rgb(107, 99, 228);"/>
                        <stop offset="0.307" style="stop-color: rgb(228, 105, 250);"/>
                        <stop offset="0.517" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.669" style="stop-color: rgb(242, 133, 220);"/>
                        <stop offset="0.915" style="stop-color: rgb(47, 225, 184);"/>
                        <stop offset="1" style="stop-color: rgb(16, 255, 191); stop-opacity: 0"/>
                </radialGradient>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1212.219936" y1="792.332458" x2="1212.219936" y2="811.325251" id="desgradient-8-9" xlink:href="#desgradient-8"/>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1213.249935" y1="793.903076" x2="1213.249935" y2="811.70492" id="desgradient-8-10" xlink:href="#desgradient-8"/>
        </defs>
        <g transform="matrix(19.066547393799, 0, 0, 19.066547393799, 1419.042602539063, 424.105255126953)" style="">
                <circle r="111.181753" transform="matrix(-0.026223942637, 0.026223942637, -0.026223942637, -0.026223942637, -7.506175056504, 22.850618366566)" style="fill: url(#desgradient-8-0); stroke: url(#deslinearGradient4172-4); stroke-linecap: round; stroke-width: 4.24264px; stroke-miterlimit: 13;"/>
                <circle r="82.529025" transform="matrix(0.026223942637, -0.026223942637, 0.026223942637, 0.026223942637, -7.506175056504, 22.850618366566)" style="fill: url(#desgradient-8-1); stroke: url(#deslinearGradient4172-2);"/>
        </g>
        <g transform="matrix(-26.963636398315, -0.16880223155, 0.16880223155, -26.963636398315, 2040.875854492188, 769.663757324219)"/>
        <path d="M 258.769635 678.009259 H 273.142181 L 263.421941 634.502746 L 286.828448 690.554332 L 263.421941 746.605918 L 273.142181 703.099404 H 258.769635 V 678.009259 Z" style="fill: url(#desgradient-0); stroke-linejoin: bevel; stroke-linecap: round; stroke: url(#desgradient-6); stroke-opacity: 0.15; stroke-width: 50px;" transform="matrix(0.015224737447, 0.999884096968, -0.999884097408, 0.015224708582, 1962.671874999992, 567.42761230469)" bx:shape="arrow 258.769635 634.502746 28.058813 112.103172 25.090145 23.406507 9.72024 1@cd22d2f5"/>
        <path d="M 1272.445046 869.363904 Q 1275.925773 868.86837 1279.4065 869.363904 L 1287.25665 870.481493 Q 1290.737377 870.977027 1293.616254 872.377948 L 1300.109042 875.537473 Q 1302.987919 876.938394 1304.767164 879.002469 L 1308.779927 883.657619 Q 1310.559171 885.721694 1310.931135 888.092027 L 1311.770031 893.437884 Q 1312.141994 895.808217 1311.042361 898.074955 L 1308.562336 903.187172 Q 1307.462703 905.45391 1305.081609 907.225113 L 1299.711484 911.219742 Q 1297.33039 912.990946 1294.079549 913.960357 L 1286.747866 916.14669 Q 1283.497025 917.116102 1279.938536 917.116102 L 1271.91301 917.116102 Q 1268.354521 917.116102 1265.10368 916.14669 L 1257.771997 913.960357 Q 1254.521156 912.990946 1252.140062 911.219742 L 1246.769937 907.225113 Q 1244.388843 905.45391 1243.28921 903.187172 L 1240.809185 898.074955 Q 1239.709552 895.808217 1240.081515 893.437884 L 1240.920411 888.092027 Q 1241.292375 885.721694 1243.071619 883.657619 L 1247.084382 879.002469 Q 1248.863627 876.938394 1251.742504 875.537473 L 1258.235292 872.377948 Q 1261.114169 870.977027 1264.594896 870.481493 Z" style="stroke: url(#desgradient-19); fill: url(#desgradient-10); stroke-miterlimit: 7; stroke-width: 5px; stroke-opacity: 0.51;" bx:shape="n-gon 1275.925773 893.25873 36.41571 24.39036 15 0.235 1@3e6751a7"/>
        <g transform="matrix(0.288743883371, 0, 0, 0.21300779283, 1258.6982421875, 838.323364257813)" style="">
                <g>
                        <circle style="fill: rgb(189, 189, 189); stroke: url(#desgradient-8-2);" cx="62.5" cy="112" r="12"/>
                        <circle style="fill: rgb(224, 224, 224); stroke: url(#desgradient-8-3);" cx="60.9" cy="112" r="10.3"/>
                        <path style="fill: rgb(255, 255, 255); stroke: url(#desgradient-8-4);" d="M55.1,108.4c1.2-1.8,3.8-3.3,6.5-3.7c0.7-0.1,1.3-0.1,1.9,0.1c0.4,0.2,0.8,0.6,0.5,1 c-0.2,0.4-0.7,0.5-1.1,0.6c-2.5,0.7-4.8,2.4-6.2,4.4c-0.5,0.8-1.4,2.9-2.4,2.4C53.3,112.5,53.5,110.6,55.1,108.4z"/>
                        <path style="fill: rgb(189, 189, 189); stroke: url(#desgradient-8-5);" d="M46.1,24.3c-2.1,2-3.4,4.4-4,7.4c-0.3,1.9-2,3.2-3.9,3.2h6.9c1.9,0,3.6-1.3,3.9-3.2 c0.5-3,1.9-5.4,4-7.4c2.1-1.9,4.7-3.1,7.8-3.6c-1.1-0.2-2.3-0.3-3.5-0.3C52.7,20.5,49,21.8,46.1,24.3z"/>
                        <path style="fill: rgb(189, 189, 189); stroke: url(#desgradient-8-6);" d="M89.5,12.2C83.4,6.7,75,4,64.2,4c-1.2,0-2.3,0-3.4,0.1c9.1,0.5,16.4,3.2,21.8,8.1 c6.1,5.5,9.1,13.2,9.1,23c0,8.8-4.1,17.4-12.2,25.9l-9.8,9.6c-0.1,0.1-0.2,0.2-0.3,0.3c-2.9,3.4-4.6,8-5.2,13.9 c-0.2,2-1.9,3.6-4,3.6h6.9c2,0,3.8-1.6,4-3.6c0.5-5.9,2.3-10.5,5.2-13.9c0.1-0.1,0.2-0.2,0.3-0.3l9.8-9.6 c8.2-8.5,12.2-17.1,12.2-25.9C98.5,25.4,95.5,17.7,89.5,12.2z"/>
                        <path style="fill: rgb(224, 224, 224); stroke: url(#desgradient-8-7); stroke-width: 4.2069px;" d="M64.2,85c0.5-5.9,2.3-10.5,5.2-13.9c0.1-0.1,0.2-0.2,0.3-0.3l9.8-9.6c8.2-8.5,12.2-17.1,12.2-25.9 c0-9.8-3-17.5-9.1-23C77.2,7.4,70,4.7,60.8,4.2c-8.9,0.5-16.2,3.3-21.9,8.2C33.6,17,30.4,23,29.5,30.5c-0.3,2.4,1.6,4.4,4,4.4h4.8 c1.9,0,3.6-1.3,3.9-3.2c0.5-3,1.9-5.4,4-7.4c2.8-2.6,6.6-3.9,11.2-3.9c1.2,0,2.4,0.1,3.5,0.3c1.1-0.2,2.2-0.3,3.4-0.3 c4.8,0,8.5,1.3,11,4s3.8,6.5,3.8,11.5c0,3.8-1.1,7.4-3.2,10.6c-1.4,2.2-4.7,5.8-10,10.9c-5.2,5.1-8.8,9.8-10.5,14 c-1.4,3.4-2.3,7.7-2.5,12.9c-0.1,2.3,1.7,4.2,4,4.2l0,0h3.5C62.2,88.6,64,87,64.2,85z"/>
                        <path style="fill: rgb(255, 255, 255); stroke: url(#desgradient-8-8);" d="M39.6,15.9C43,11.7,49.5,8.7,56,8.3c1.6-0.1,3.2,0,4.5,0.7c1,0.5,1.7,1.6,1,2.6 c-0.6,0.8-1.8,1.1-2.8,1.3c-6.1,1.2-12,4.7-15.9,9.3c-1.5,1.8-4,6.8-6.2,5.2C34.3,25.5,35.4,21,39.6,15.9z"/>
                </g>
        </g>
        <path d="M 1275.254748 881.616379 Q 1277.371544 881.308248 1279.48834 881.616379 L 1280.975819 881.832903 Q 1283.092615 882.141034 1285.002205 883.035265 L 1286.344079 883.663644 Q 1288.253668 884.557875 1289.769127 885.950672 L 1290.834044 886.929395 Q 1292.349503 888.322192 1293.322488 890.077219 L 1294.006207 891.310481 Q 1294.979191 893.065508 1295.314459 895.010971 L 1295.550052 896.378053 Q 1295.88532 898.323515 1295.550052 900.268977 L 1295.314459 901.636059 Q 1294.979191 903.581522 1294.006207 905.336549 L 1293.322488 906.569811 Q 1292.349503 908.324838 1290.834044 909.717635 L 1289.769127 910.696358 Q 1288.253668 912.089155 1286.344079 912.983386 L 1285.002205 913.611765 Q 1283.092615 914.505996 1280.975819 914.814127 L 1279.48834 915.030651 Q 1277.371544 915.338782 1275.254748 915.030651 L 1273.767269 914.814127 Q 1271.650473 914.505996 1269.740883 913.611765 L 1268.399009 912.983386 Q 1266.48942 912.089155 1264.973961 910.696358 L 1263.909044 909.717635 Q 1262.393585 908.324838 1261.4206 906.569811 L 1260.736881 905.336549 Q 1259.763897 903.581522 1259.428629 901.636059 L 1259.193036 900.268977 Q 1258.857768 898.323515 1259.193036 896.378053 L 1259.428629 895.010971 Q 1259.763897 893.065508 1260.736881 891.310481 L 1261.4206 890.077219 Q 1262.393585 888.322192 1263.909044 886.929395 L 1264.973961 885.950672 Q 1266.48942 884.557875 1268.399009 883.663644 L 1269.740883 883.035265 Q 1271.650473 882.141034 1273.767269 881.832903 Z" style="stroke: url(#desgradient-2); stroke-miterlimit: 17; fill: url(#desgradient-1); stroke-width: 2px;" transform="matrix(-1, 1e-12, 2e-12, -1, 2553.297363280778, 1717.467407226184)" bx:shape="n-gon 1277.371544 898.323515 18.513776 17.015267 20 0.37 1@f7764595"/>
           <foreignObject role="button" tabindex="0" on:click={()=>linke("u")} on:keypress={()=>linke("u")} on:mouseenter={()=>hover({"he":"הלוגו העכשווי", "en":"old Logo"})} on:mouseleave={()=>hover("0")} x='1276' y='820' width='38px' height='38px' transform="translate(-19,-19)" >
                                                  <span class="{`normSml${askId}-noo`}"></span>
                                                    <img
                                                        width='38px'
                                                        height='38px'
                                                        alt="{oldob[$lang]}"
                                                        src={src}
                                                        style="border-radius: 50%;"
                                                        /> 
                          </foreignObject> 
                        {#if kind == "pic"} 
             <foreignObject x='1276' y='892' width='50px' height='50px' transform="translate(-25,-25)" >
              <img on:mouseenter={()=>hover(newlogo[$lang])} on:mouseleave={()=>hover("0")} style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src2} width="50" height="50" alt="new project logo" >
            </foreignObject>
            {/if}
        <path transform="matrix(0.90,0,0,0.90,1275,872)" id="curveeuu" d="M -79.587 0 C -81.732 -2.923 -75.008 -81.366 0 -80.446 C 74.342 -79.534 81.282 -3.522 80.257 0"/>
        <text  style="fill: url(#desgradient-5); font-family: &quot;hooge 05_55&quot;; paint-order: stroke; stroke: url(#desgradient-8-9); stroke-linecap: round; stroke-linejoin: round; stroke-miterlimit: 1; stroke-width: 1.26413px; text-anchor: middle; white-space: pre;" >
            <textPath role="contentinfo" on:mouseenter={()=>hover({"he": `הצבעה על שינוי הלוגו`, "en": "vote on Logo change"})} on:mouseleave={()=>hover("0")} style="fill: url(#desgradient-5); font-family: &quot;hooge 05_55&quot;; paint-order: stroke; stroke: url(#desgradient-8-9); stroke-linecap: round; stroke-linejoin: round; stroke-miterlimit: 1; stroke-width: 1.26413px; text-anchor: middle; white-space: pre;"  class="curved-text" startOffset={st} xlink:href="#curveeuu">
                {openmissionName[$lang]}
            </textPath>
        </text>
            <path transform="matrix(0.4, 0, 0, 0.4 , 1195, 860)" fill="transparent" stroke="transparent" id="curv" d=" M 0 0 A 200 200 0 0 0 400 0" />
            <text  x="{tx}">
            <textPath  xlink:href="#curv">
                  <tspan  dy="-5">{projectName}</tspan>
                </textPath>
        </text> 
      </svg>

       <!--- <svg  version="1.1" viewBox="-106 -106 212 212" xmlns="http://www.w3.org/2000/svg">
            <defs>
              style="fill: url(#desgradient-8-12); font-family: &quot;Bodoni MT&quot;; paint-order: stroke; stroke: url(#desgradient-8-10); stroke-dashoffset: 6px; stroke-miterlimit: 3; stroke-width: 1.25454px; text-anchor: middle; white-space: pre;" 
                <linearGradient id="lggm" x1="1" y1="1" spreadMethod="pad">
                   <stop offset="0" style="stop-color: rgb(100, 71, 105);"/>
                        <stop offset="1" style="stop-color: rgb(54, 241, 155);"/>
                            </linearGradient>
                            <linearGradient id="desrrr" x1="1" y1="1">
                                <stop offset="0" style="stop-color: rgb(100, 100, 10);"/>
                                    <stop offset="1" style="stop-color: rgb(10, 10, 13);"/>
                                        </linearGradient>
                                        </defs>
                                        <circle r="100" fill="url(#desrrr)" transform="rotate(135)" stroke="url(#desrrr)" stroke-width="6" style="fill-rule: nonzero; paint-order: fill;"/>
                                         <circle r="80" fill="url(#desrrr)" transform="rotate(315)" stroke="none"/>
                                               
                                                         <g on:click={()=>linke("u")} on:mouseenter={()=>hover(` `)} on:mouseleave={()=>hover("0")} x='0' y='40' style="margin-top: 2px; margin-bottom: 2px" >
                                                <foreignObject x='50' y='0' width='56px' height='56px' transform="translate(-28,-28)" >
                                                  <span class="{`normSml${askId}-noo`}"></span>
                                                    <img
                                                        width='56px'
                                                        height='56px'
                                                        alt=""
                                                        src={src}
                                                        style="border-radius: 50%;"
                                                        /> 
                                                     </foreignObject>     
                                                            <text fill="#EEE8AA " text-anchor="middle" x='0' y='46' style="margin: 2px; font-size: 24px; line-height: 1; font-weight: bold;"></text>
                                                    </g>         
                                                <path id="curvee" d="M -79.587 0 C -81.732 -2.923 -75.008 -81.366 0 -80.446 C 74.342 -79.534 81.282 -3.522 80.257 0"/>
                                                    <text color="#EEE8AA" width="208.55" x="-90" y="-90" style="white-space: pre-wrap;">
                                                        <textPath on:mouseenter={()=>hover("שם המשאב")} on:mouseleave={()=>hover("0")} color="#EEE8AA" x="-90" y="-90" class="curved-text" startOffset={st} xlink:href="#curvee">
                                                            {openmissionName[$lang]}
                                                        </textPath>
                                                    </text>
                                              <g on:click={()=>linke("p")} on:mouseenter={()=>hover("לחיצה למעבר לעמוד הציבורי של הריקמה")} on:mouseleave={()=>hover("0")}  data-sveltekit-prefetch x="0" y="-40" >
                                                    <text fill="#FF0092" text-anchor="middle"  x="0" y="-29"   style="font-size: 15px; line-height: 1; font-weight: bold; white-space: pre;">{projectName}</text>
                                              </g>  
                                                    <foreignObject x='-50' y='0 ' width='56px' height='56px' transform="translate(-28,-28)" >
                                                   <button on:click={()=>project()} on:mouseenter={()=>hover(newlogo[$lang])} on:mouseleave={()=>hover("0")}>
                                                        <img style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src2} width="40" height="40" alt="projectlogo" title={projectName}>
                                                   </button>

                                                </foreignObject>
                                                                                                    <foreignObject x='0' y='-60 ' width='40px' height='40px' transform="translate(-20,-20)" >
                                                   <button on:click={()=>project()} on:mouseenter={()=>hover(` לחיצה למעבר למוח הריקמה ${projectName}`)} on:mouseleave={()=>hover("0")}>
                                                        <img style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src} width="40" height="40" alt="projectlogo" title={projectName}>
                                                   </button>

                                                </foreignObject>
                            <foreignObject x='-25' y='55' width='50px' height='20px' >
                                             <p style="margin-top: 10px;"><span on:mouseenter={()=>hover("בעד")} on:mouseleave={()=>hover("0")} style="color:var(--gold)" >{noofusersOk} </span><span on:mouseenter={()=>hover("לא הצביעו")} on:mouseleave={()=>hover("0")} style="color:aqua">{noofusersWaiting} </span><span on:mouseenter={()=>hover("נגד")} on:mouseleave={()=>hover("0")} style="color:var(--barbi-pink)" title="נגד">{noofusersNo} </span></p>

                            </foreignObject>

                                                  </svg> --> 
                                                    </div>

</div>
</SwiperSlide
  ><SwiperSlide class="swiper-slideg"
    ><div  id="normSmll"
>

<div class="{`normSmll${askId}-noo`}"></div>
             <p style="margin-top: 10px;">
              <span role="contentinfo"
               on:mouseenter={()=>hover({"he":"בעד", "en":"in favor"})} 
               on:mouseleave={()=>hover("0")} style="color:var(--gold)" 
               >{noofusersOk} </span><span 
               on:mouseenter={()=>hover({"he":"לא הצביעו","en":"not voted yet"})} 
               on:mouseleave={()=>hover("0")} 
               role="contentinfo"
               style="color:aqua">{noofusersWaiting} </span><span 
               on:mouseenter={()=>hover({"he":"נגד","en": "against"})} 
               on:mouseleave={()=>hover("0")} 
               role="contentinfo"
               style="color:var(--barbi-pink)" >{noofusersNo} </span></p>

                    <!--  <button on:click={tochat}><Chaticon/></button>-->
                 {#if deadline}    <p on:mouseenter={()=>hover({"he":"תאריך הביצוע", "en": "date"})} on:mouseleave={()=>hover("0")}  class="hslink ab">{new Date(deadline).toLocaleDateString("he-IL")}</p>{/if}
              {#if low == false}
                 {#if already === false}
            <button on:mouseenter={()=>hover({"he":"אישור", "en":"approve"})} on:mouseleave={()=>hover("0")} on:click={agree}  class = "btn ga" name="requestToJoin"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
          <!-- <button3 on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button3>--> 
            <button on:mouseenter={()=>hover({"he":"דחיה","en": "reject"})} on:mouseleave={()=>hover("0")} on:click={decline}  class = "btn gb"name="decline"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
        {/if}
         {:else if low == true}
          <Lowbtn/>
        {/if}
        </div>
       
</SwiperSlide
  >
</Swiper>
</span>
</div>
{:else}
<Card
  on:agree={()=>agree()}
  on:decline={()=>decline()}
  on:hover={hoverc} 
  {already} 
  {projectName}
   {src} 
   {src2}
   {low}
   {kind}
   {spdata}
   {timegramaDate} 
   {restime}
   {deadline}
   {noofusersWaiting} 
   {noofusersOk} 
   {openmissionName} 
   {missionDetails} 
   {noofusersNo}/>
{/if}
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
    #curveeuu {
    fill: transparent;
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
