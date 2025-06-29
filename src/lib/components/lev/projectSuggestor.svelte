<script>
    import Tile from '$lib/celim/tile.svelte'
    	import { Drawer } from 'vaul-svelte';
import { page } from '$app/state';
  import {calcX} from '$lib/func/calcX.svelte'
  import {SendTo} from '$lib/send/sendTo.svelte'
     import { clickOutside } from './outsidclick.js';
    import { scale, fly } from 'svelte/transition';
  import { onMount } from 'svelte'
                   import { lang } from '$lib/stores/lang.js'
import Lowbtn from '$lib/celim/lowbtn.svelte'
	import dayjs from 'dayjs';
  import { nowId } from "$lib/stores/pendMisMes.js";
const baseUrl = import.meta.env.VITE_URL
    /**
     * @typedef {Object} ComponentProps
     * @property {function({ani: string, coinlapach: any}): void} [onLess] - Callback for less event
     * @property {function({id: string}): void} [onHover] - Callback for hover event
     * @property {function({id: number}): void} [onMesima] - Callback for mesima event
     * @property {function({id: any}): void} [onProj] - Callback for proj event
     * @property {boolean} [isVisible] - Visibility flag
     * @property {boolean} [low] - Low flag
     * @property {boolean} [alreadyi] - Already flag
     * @property {string} [timeToP] - Time to profit
     * @property {number} [hst] - HST value
     * @property {number} [stb] - STB value
     * @property {any} coinlapach - Coinlapach data
     * @property {any} deadLine - Deadline date
     * @property {any} restime - Restime data
     * @property {any} deadLinefi - Deadline FI data
     * @property {any} projectName - Project name
     * @property {any} missionName - Mission name
     * @property {any} [role] - Role data
     * @property {any} [skills] - Skills data
     * @property {any} [acts] - Acts data
     * @property {any} missionDetails - Mission details
     * @property {string} [src] - Source URL
     * @property {any} projectId - Project ID
     * @property {string} [linki] - Link URL
     * @property {number} [oid] - OID value
     * @property {any} [workways] - Workways data
     * @property {number} [noOfHours] - Number of hours
     * @property {number} [perhour] - Per hour rate
     * @property {number} [total] - Total value
     * @property {any} [askedarr] - Asked array
     * @property {any} [declineddarr] - Declined array
     * @property {any} hearotMeyuchadot - Hearot Meyuchadot data
     * @property {any} pid - PID value
     * @property {boolean} [cards] - Cards flag
     * @property {any} [chat] - Chat data
     * @property {any} askId - Ask ID
     * @property {any} order - Order data
     */
    /** @type {ComponentProps} */
    let {
        onLess, onHover, onMesima, onProj,
        isVisible = false,
        low = false,
        alreadyi = false,
        timeToP = "more",
        hst = 187,
        stb = 180,
        coinlapach,
        deadLine,
        restime,
        deadLinefi,
        projectName,
        missionName,
        role = $bindable([]),
        skills = $bindable([]),
        acts = [],
        missionDetails,
        src = "coin.png",
        projectId,
        linki = "/project/",
        oid = 0,
        workways = $bindable([]),
        noOfHours = 0,
        perhour = 0,
        total = 0,
        askedarr = [],
        declineddarr = [],
        hearotMeyuchadot,
        pid,
        cards = false,
        chat = $bindable([]),
        askId,
        order = $bindable()
    } = $props();
let already = $state(false);
    let token;
    let uId;


function less (oid) {
    console.log("less")
    onLess?.({ ani: "prsug", coinlapach: coinlapach });
}
let miData = [];

async function agree(oid) {
  already = true;
  let x = calcX(restime)
  let fd = new Date(Date.now() + x)
const as = askedarr;
 as.push(`${oid}`);
 console.log(as)
 let myvote = ``
  //todo if project member voted yes
const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  uId = cookieValueId;

    token  = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
        let d = new Date

    console.log(pid)
     if(pid.includes(uId)){
      myvote = `vots: [{
                        what: true
                        users_permissions_user: "${uId}"
                        ide:${uId}
                        zman:"${d.toISOString()}"
                          }
                        ]`
     }

    let link = baseUrl+'/graphql';
    try {
             await fetch(link, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body:
        JSON.stringify({query:
          `mutation { updateUsersPermissionsUser(
    id: "${uId}"
      data: { askeds: [${as}] }

  ){
      data {
        attributes{
          askeds{
            data{
              id
            }
          }
        }
      }
  }
  createAsk(
      data:{ open_mission: ${oid},
            project: ${projectId},
            users_permissions_user: ${uId},
            publishedAt: "${d.toISOString()}",
            ${myvote}
    }
  ){
    data {id}
  }

}`
} )})
  .then(r => r.json())
  .then(data => miData = data);
         console.log(miData)
         //TODO: not remove coin just move to chat mode
           let hiluzId = miData.data.createAsk.data.id
                        let quee = `mutation 
                        {createTimegrama(
    data:{
      date: "${fd.toISOString()}",
      whatami: "ask",
      ask: ${hiluzId},
    }
  ){
    data {id}
  }
}`
SendTo(quee)
         // שליחת התראה לחברי הפרויקט באמצעות שרת ה-nutifyPm שלנו
         sendApi({pid:projectId,
        title:{"he":projectName+" - "+missionName+": "+page.data.un + " רוצה לבצע את המשימה ","en":projectName+" - "+missionName+": "+page.data.un + "wants to do the mission"},
      body:{"he":page.data.un + " רוצה לבצע את המשימה "+ missionName + " .ביכולתך לאשר את הבקשה או לשוחח בצ'אט כדי לוודא את ההתאמה קודם ",
      "en":page.data.un + " wants to do the mission "+ missionName + ". You can approve the request or chat to make sure the match is right"}
      },
      "nutifyPm")
         less (oid);
        } catch (e) {
            error1 = e
        }
    };



function nego(oid) {
        console.log("nego", oid);
	}

async function decline(oid) {
  already = true;
        console.log("decline", oid);
       const ds = declineddarr;
 ds.push(`${oid}`);
 console.log(ds)
const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  uId = cookieValueId;
    token  = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
    let link =baseUrl+ '/graphql';
    try {
             await fetch(link, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body:
        JSON.stringify({query:
          `mutation { updateUsersPermissionsUser(
    id: "${uId}"
      data: {declined: [${ds}] }
  ){
      data {
        attributes{
          askeds{
            data{
              id
            }
          }
      }
  }
}
}`
} )})
  .then(r => r.json())
  .then(data => miData = data);
         console.log(miData)
         less (oid);
        } catch (e) {
            error1 = e
        }

	}
//out:fly={{duration: 2200, opacity: 0.5, y: 450}}

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
  import { Swiper, SwiperSlide } from "swiper/svelte";

  // Import Swiper styles
  import "swiper/css";

  import "swiper/css/effect-flip";
  import "./style.css";

  // import required modules
  import { EffectFlip, Navigation } from "swiper";
let u = {"he":"הצעה להצטרפות לריקמה", "en":"suggested FreeMates to join and do mission"}
let hovered = $state(false);
function hover (id){
  if (id == "0"){
     u = {"he":"הצעה להצטרפות לריקמה", "en":"suggested FreeMates to join and do mission"}
  } else {
    u = id
  }
    onHover?.({ id: u[$lang] });

}
function hoverede(){
   hovered = !hovered
    if (hovered == false){
    u = {"he":"לב המערכת","en": "heart of 1💗1"}
  } else {
     u = {"he":"הצעה להצטרפות לריקמה", "en":"suggested FreeMates to join and do mission"}
  }
  onHover?.({ id: u[$lang] });
 }
 let pclim = $state(0);
  
function mesima (){
  console.log("jjj")
    pclim += 1;
    setTimeout(function() {pclim = 0},6000)
    if(pclim >= 2){
        onMesima?.({ id: oid });
    }
}
let pcli = $state(0);
  
function linke (){
    pcli += 1;
    setTimeout(function() {pcli = 0},6000)
    if(pcli >= 2){
        onProj?.({ id: projectId });
    }
}
function project () {
        onProj?.({ id: projectId });
}
 onMount(function(){
 if ($lang != "en" ){
              for (let i = 0; i < skills.data.length; i++){
                if (skills.data[i].attributes.localizations.data.length > 0){
                skills.data[i].attributes.skillName = skills.data[i].attributes.localizations.data[0].attributes.skillName
                }
              }
              for (let i = 0; i < role.data.length; i++){
                if (role.data[i].attributes.localizations.data.length > 0){
                role.data[i].attributes.roleDescription = role.data[i].attributes.localizations.data[0].attributes.roleDescription
                }
              }
              console.log(workways)
              for (let i = 0; i < workways?.data.length; i++){
                if (workways.data[i].attributes.localizations.data.length > 0){
                workways.data[i].attributes.workWayName = workways.data[i].attributes.localizations.data[0].attributes.workWayName
                }
              }
            }
            role = role
            skills = skills
            workways = workways;
})
function hoverc (event){
   if (event.x == "0"){
     u = {"he":"הצעה להצטרפות לריקמה", "en":"suggested FreeMates to join and do mission"}
  } else {
    u = event.x
  }
    onHover?.({ id: u[$lang] });
}
 import Cards from './cards/sugestmi.svelte'
  import { DialogContent, DialogOverlay } from 'svelte-accessible-dialog';
  import Diun from './diun.svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { sendApi } from '$lib/send/sendApi.svelte';
function claf (event){
  let o = event.alr
  let d = event.y
  console.log(o,d)
  if (d == "a"){
    agree(oid)
  } else if (d == "d"){
    decline(oid)
  }
}
const ttal = {"he":"נכנס כבר כסף","en":"already has income"}
const ttwe = {"he":"צפי רווח: שבוע","en":"exp income: one week "}
const ttmo = {"he":"צפי רווח: חודש","en":"exp income: one month "}
const tt3mo = {"he":"צפי רווח: 3 חודשים","en":"exp income: three months"}
const tt6mo = {"he":"צפי רווח: חצי שנה","en":"exp income: 6 months "}
const tt1y = {"he":"צפי רווח: שנה","en":"exp income: 1 year"}
const tt2y = {"he":"צפי רווח: שנתיים","en":"exp income: 2 years "}
const ttmor = {"he":"צפי רווח: ארוך טווח","en":"exp income: long term"}
const ttne = {"he":"ללא רווח","en":"not profitable"}
let isOpen = $state(false), diunm = $state(false), loading = false 
const close = () => {
    isOpen = false;
    diunm = false;
};

let clicked = $state(false)
 
let miDatan = []
 async function afreact (event){
 
  let why = event.why
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
  let idL = cookieValueId;
   let token  = cookieValue; 
   let bearer1 = 'bearer' + ' ' + token;
     let dataa = {
          data: { 
        chat:[...chat,{
      what: true,
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
             await fetch(`${baseUrl}/api/asks/${askId}?populate=*`, {
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
       chat.push({
                  what: true,
                  users_permissions_user:idL,
                  why:why,
                  order:order+=1,
                  zman:d.toISOString(),
                  ide:idL
                  })
            chat = chat   
            clicked = false 
         nowId.set(miDatan.data.attributes.chat[miDatan.data.attributes.chat.length -1].id)
      //   loading = false;
        } catch (e) {
          let error1 = e
            console.log(error1)
        }
}
function tochat (){
    console.log("chat")
    isOpen = true
    diunm = true
}
let dialogOpen = $state(false)
function modal(){
  onModal?.();
  dialogOpen=true
}
const chatdes2 ={"he":"צ'אט על הצטרפות לריקמה" ,"en":"chat on joining"}

</script>
<DialogOverlay {isOpen} onDismiss={close} class="overlay">
        <div transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent class="chat" aria-label="form" >
      <div dir="rtl" class="grid items-center justify-center aling-center">
              <button onclick={close} style="margin: 0 auto;"class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
title="ביטול"
><svg style="width:24px;height:24px" viewBox="0 0 24 24"> 
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
{#if loading === true}
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  <!--   
{:else if masa === true}

<Nego
      onLoad={()=>loading = true}
        onClose={afternego}
  descrip ={descrip}
  projectName ={projectName}
  name1 ={name}
  spnot = {hearotMeyuchadot}
  kindOf ={kindOf}
  hm = {hm}
  {timegramaId}
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
{restime}
/>-->
  {:else if diunm === true}
 <Diun
  onRect={afreact} 
  smalldes={projectName+"-"+missionName} 
  nameChatPartner={`${chatdes2[$lang]} 
  ${projectName}`} 
  mypos={true}
  rect={true}
  {clicked}
  pendId={oid}
  profilePicChatPartner={src.length > 0 ? src : "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"} 
  ani="iaskedMi"/>
{/if}
      </div>
  </DialogContent>
  </div>
</DialogOverlay>
{#if cards == false}
<div
style="position: relative;"
style:z-index={hovered === false ? 11 : 16}
onmouseenter={()=> hoverede()}
onmouseleave={()=> hoverede()}
use:clickOutside onclick_outside={toggleShow}
onclick={modal}
class="hover:scale-290 duration-1000 ease-in"     
in:scale="{{ duration: 3200, opacity: 0.5, start: 1.56 }}"
>
<Swiper  dir="rtl"
  on:swiper={setSwiperRef}
  effect={"flip"}
  speed={1000}

  grabCursor={true}
  modules={[EffectFlip, Navigation]}
  flipEffect={{ slideShadows: false}}
  class="mySwiper swiperg"
  navigation={{
    nextEl: `.normSml${oid}-${projectId}`,
    prevEl: `.normSmll${oid}-${projectId}`,
  }}
>
  <SwiperSlide class="swiper-slideg"
    ><div
	 id="normSml"
><div class="{`normSml${oid}-${projectId}`}"></div>

<svg in:scale="{{ duration: 3200, opacity: 0.5, start: 1.56 }}" version="1.1" viewBox="6.323 104.09 165.22 165.22" xmlns="http://www.w3.org/2000/svg" xmlns:bx="https://boxy-svg.com" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
  <linearGradient id="sugzzk">
  <stop stop-color="#bd8328" offset="0"/>
  <stop stop-color="#fbec9b" offset=".1328"/>
  <stop stop-color="#f6e9a0" offset=".2148"/>
  <stop stop-color="#f34e9e" offset=".403"/>
  <stop stop-color="#bd984a" offset=".5038"/>
  <stop stop-color="#c09d4e" offset=".5896"/>
  <stop stop-color="#ff62a1" offset=".699"/>
  <stop stop-color="#faf994" offset=".8202"/>
  <stop stop-color="#f9fe92" offset=".9022"/>
  <stop stop-color="#bd8524" offset="1"/>
  </linearGradient>
  <filter id="sugzzaa" x="-.10376" y="-.10376" width="1.2075" height="1.2075" color-interpolation-filters="sRGB">
  <feGaussianBlur stdDeviation="10.190655"/>
  </filter>
  <linearGradient id="sugzzr" x1="254.4" x2="254.4" y1="151.42" y2="353.66" gradientUnits="userSpaceOnUse">
  <stop stop-color="#fffaa3" offset="0"/>
  <stop stop-color="#ead869" offset=".5"/>
  <stop stop-color="#bb8930" offset="1"/>
  </linearGradient>
  <linearGradient id="sugzzq" x1="205.73" x2="205.73" y1="136.75" y2="359.29" gradientUnits="userSpaceOnUse">
  <stop stop-color="#fd5" offset="0"/>
  <stop stop-color="#f8fa9f" offset=".1612"/>
  <stop stop-color="#f8ffaa" offset=".1842"/>
  <stop stop-color="#ff0048" offset=".419"/>
  <stop stop-color="#46281e" offset=".523"/>
  <stop stop-color="#c70c3b" offset=".643"/>
  <stop stop-color="#e6c34c" offset=".77"/>
  <stop stop-color="#eff489" offset=".8026"/>
  <stop stop-color="#f1ff97" offset=".8421"/>
  <stop stop-color="#a67e22" offset="1"/>
  </linearGradient>
  <linearGradient id="sugzzp" x1="203.27" x2="203.27" y1="135.83" y2="361.15" gradientUnits="userSpaceOnUse">
  <stop stop-color="#c0842d" offset="0"/>
  <stop stop-color="#f0de72" offset=".5269"/>
  <stop stop-color="#eaef9e" offset="1"/>
  </linearGradient>
  <linearGradient id="sugzzj" x1="201.52" x2="201.52" y1="133.6" y2="358.89" gradientTransform="matrix(.70867 0 0 .70867 359.72 66.468)" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <linearGradient id="sugzzi" x1="201.52" x2="201.52" y1="133.6" y2="358.89" gradientTransform="matrix(.71583 0 0 .71583 358.26 64.677)" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <linearGradient id="sugzzh" x1="201.52" x2="201.52" y1="133.6" y2="358.89" gradientTransform="matrix(.72306 0 0 .72306 356.77 62.868)" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <linearGradient id="sugzzg" x1="201.52" x2="201.52" y1="133.6" y2="358.89" gradientTransform="matrix(.73036 0 0 .73036 355.28 61.04)" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <linearGradient id="sugzzf" x1="201.52" x2="201.52" y1="133.6" y2="358.89" gradientTransform="matrix(.73774 0 0 .73774 353.76 59.195)" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <linearGradient id="sugzze" x1="201.52" x2="201.52" y1="133.6" y2="358.89" gradientTransform="matrix(.74519 0 0 .74519 352.24 57.33)" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <linearGradient id="sugzzd" x1="201.52" x2="201.52" y1="133.6" y2="358.89" gradientTransform="matrix(.75272 0 0 .75272 350.69 55.446)" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <linearGradient id="sugzzc" x1="201.52" x2="201.52" y1="133.6" y2="358.89" gradientTransform="matrix(.76032 0 0 .76032 349.13 53.544)" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <linearGradient id="sugzzb" x1="201.52" x2="201.52" y1="133.6" y2="358.89" gradientTransform="matrix(.768 0 0 .768 347.56 51.622)" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <linearGradient id="sugzza" x1="201.52" x2="201.52" y1="133.6" y2="358.89" gradientTransform="matrix(.77576 0 0 .77576 345.97 49.681)" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <linearGradient id="sugzzo" x1="186.37" x2="186.37" y1="133.66" y2="365.94" gradientUnits="userSpaceOnUse">
  <stop stop-color="#bd8328" offset="0"/>
  <stop stop-color="#fbec9b" offset=".1328"/>
  <stop stop-color="#f6e9a0" offset=".2148"/>
  <stop stop-color="#bd984a" offset=".5038"/>
  <stop stop-color="#faf994" offset=".8202"/>
  <stop stop-color="#f9fe92" offset=".9022"/>
  <stop stop-color="#bd8524" offset="1"/>
  </linearGradient>
  <linearGradient id="sugzzn" x1="205" x2="205" y1="132.19" y2="368.25" gradientUnits="userSpaceOnUse" xlink:href="#sugzzk"/>
  <style bx:fonts="Almendra SC" bx:pinned="true">@import url(https://fonts.googleapis.com/css2?family=Almendra+SC%3Aital%2Cwght%400%2C400&amp;display=swap);</style>
  <linearGradient id="sugzzt" x1="501.76" x2="501.76" y1="130.26" y2="148.42" gradientTransform="translate(3.1581 .39477)" gradientUnits="userSpaceOnUse">
  <stop stop-color="rgba(255, 0, 119, 1)" offset="0"/>
  <stop stop-color="rgba(153, 0, 71, 1)" offset="1"/>
  </linearGradient>
  <radialGradient id="sugzzz" cx="501.76" cy="139.34" r="17.422" gradientTransform="translate(3.1581 .39477)" gradientUnits="userSpaceOnUse">
  <stop stop-color="rgba(252, 165, 227, 1)" offset="0"/>
  <stop stop-color="rgba(249, 67, 197, 1)" offset="1"/>
  </radialGradient>
  <linearGradient id="sugzzs" x1="501.76" x2="501.76" y1="130.26" y2="148.42" gradientTransform="translate(3.5029 209.29)" gradientUnits="userSpaceOnUse">
  <stop stop-color="rgba(255, 0, 119, 1)" offset="0"/>
  <stop stop-color="rgba(153, 0, 71, 1)" offset="1"/>
  </linearGradient>
  <radialGradient id="sugzzy" cx="501.76" cy="139.34" r="17.422" gradientTransform="translate(3.5029 209.29)" gradientUnits="userSpaceOnUse">
  <stop stop-color="rgba(252, 165, 227, 1)" offset="0"/>
  <stop stop-color="rgba(249, 67, 197, 1)" offset="1"/>
  </radialGradient>
  <linearGradient id="sugzzx" x1="501.76" x2="501.76" y1="130.26" y2="148.42" gradientTransform="translate(18.967 78.624)" gradientUnits="userSpaceOnUse">
  <stop stop-color="rgba(255, 0, 119, 1)" offset="0"/>
  <stop stop-color="rgba(153, 0, 71, 1)" offset="1"/>
  </linearGradient>
  <radialGradient id="sugzzw" cx="501.76" cy="139.34" r="17.422" gradientTransform="translate(18.967 78.624)" gradientUnits="userSpaceOnUse">
  <stop stop-color="rgba(252, 165, 227, 1)" offset="0"/>
  <stop stop-color="rgba(249, 67, 197, 1)" offset="1"/>
  </radialGradient>
  <linearGradient id="sugzzv" x1="501.76" x2="501.76" y1="130.26" y2="148.42" gradientTransform="translate(-41.849 155.28)" gradientUnits="userSpaceOnUse">
  <stop stop-color="rgba(255, 0, 119, 1)" offset="0"/>
  <stop stop-color="rgba(153, 0, 71, 1)" offset="1"/>
  </linearGradient>
  <radialGradient id="sugzzu" cx="501.76" cy="139.34" r="17.422" gradientTransform="translate(-41.849 155.28)" gradientUnits="userSpaceOnUse">
  <stop stop-color="rgba(252, 165, 227, 1)" offset="0"/>
  <stop stop-color="rgba(249, 67, 197, 1)" offset="1"/>
  </radialGradient>
  <path id="sugzzm" d="m404.32 246.15c-0.72-39.92 14.183-47.064 25.232-62.343 16.139-22.317 46.924-37.219 81.045-34.807 47.034 3.325 85.126 44.164 93.3 94.682"/>
  <path id="sugzzl" d="m392.45 266.77c60.391 147.72 227.04 80.25 221.93-6.468"/>
   <clipPath id="sugclipCircle">
      <circle r="225" cx="225" cy="225"/>
    </clipPath>
  </defs>
  <path d="m28.476 172.78s16.516-49.799 63.258-49.052c43.29 0.692 59.774 49.179 59.774 49.179" fill="rgba(216, 216, 216, 0)" stroke="rgba(0, 0, 0, 0)">
  <title></title>
  </path>

  <g transform="matrix(.68728 0 0 .68728 -256.98 19.011)" style="">
  <path transform="matrix(1.0121 0 0 1.0121 296.09 -9.4615)" d="m322.86 250.22a117.86 117.86 0 1 1-235.71 0 117.86 117.86 0 1 1 235.71 0z" fill="#808080" filter="url(#sugzzaa)"/>
  <path transform="matrix(1.0121 0 0 1.0121 296.09 -9.4615)" d="m322.86 250.22a117.86 117.86 0 1 1-235.71 0 117.86 117.86 0 1 1 235.71 0z" fill="url(#sugzzr)"/>
  <path transform="matrix(.97576 0 0 .97576 304.26 -.36265)" d="m322.86 250.22c0 90.727-98.214 147.43-176.79 102.07-36.465-21.054-58.928-59.961-58.928-102.07 0-74.795 66.75-126.47 134.22-116.89 14.37 2.04 28.773 6.858 42.57 14.824 36.465 21.053 58.928 59.961 58.928 102.07z" fill="url(#sugzzq)" stroke="url(#sugzzn)" stroke-width="4.8048px"/>
  <path transform="matrix(.82424 0 0 .82424 336.03 37.549)" d="m322.86 250.22a117.86 117.86 0 1 1-235.71 0 117.86 117.86 0 1 1 235.71 0z" fill="url(#sugzzp)" stroke="url(#sugzzo)"/>
  <g>
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.73 0 0 .73 136.35 65.824)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  </g>
  <g transform="matrix(.53 0 0 .53 237.35 114.58)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.73 0 0 .73 136.35 65.824)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  </g>
  </g>
  <g transform="matrix(.2809 0 0 .2809 363.15 175.31)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.73 0 0 .73 136.35 65.824)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  </g>
  </g>
  <g transform="matrix(.14888 0 0 .14888 429.82 207.5)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.73 0 0 .73 136.35 65.824)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  </g>
  </g>
  <g transform="matrix(.078905 0 0 .078905 465.15 224.55)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.73 0 0 .73 136.35 65.824)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  </g>
  </g>
  <g transform="matrix(.04182 0 0 .04182 483.88 233.6)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.73 0 0 .73 136.35 65.824)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  </g>
  </g>
  <g transform="matrix(.022164 0 0 .022164 493.81 238.39)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.73 0 0 .73 136.35 65.824)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  <g transform="matrix(.9 0 0 .9 50.5 24.379)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  <g transform="matrix(.81 0 0 .81 95.95 46.32)">
  <path d="m596.43 243.79c0 50.495-40.934 91.429-91.429 91.429s-91.429-40.934-91.429-91.429c0-50.495 40.934-91.429 91.429-91.429s91.429 40.934 91.429 91.429z" fill="url(#sugzza)"/>
  <path d="m595.51 243.79c0 49.99-40.525 90.514-90.514 90.514s-90.514-40.525-90.514-90.514c0-49.99 40.525-90.514 90.514-90.514s90.514 40.525 90.514 90.514z" fill="url(#sugzzb)"/>
  <path d="m594.61 243.79c0 49.49-40.119 89.609-89.609 89.609s-89.609-40.119-89.609-89.609c0-49.49 40.119-89.609 89.609-89.609s89.609 40.119 89.609 89.609z" fill="url(#sugzzc)"/>
  <path d="m593.71 243.79c0 48.995-39.718 88.713-88.713 88.713s-88.713-39.718-88.713-88.713c0-48.995 39.718-88.713 88.713-88.713s88.713 39.718 88.713 88.713z" fill="url(#sugzzd)"/>
  <path d="m592.83 243.79c0 48.505-39.321 87.826-87.826 87.826s-87.826-39.321-87.826-87.826c0-48.505 39.321-87.826 87.826-87.826s87.826 39.321 87.826 87.826z" fill="url(#sugzze)"/>
  <path d="m591.95 243.79c0 48.02-38.928 86.948-86.948 86.948s-86.948-38.928-86.948-86.948c0-48.02 38.928-86.948 86.948-86.948s86.948 38.928 86.948 86.948z" fill="url(#sugzzf)"/>
  <path d="m591.08 243.79c0 47.54-38.539 86.078-86.078 86.078s-86.078-38.539-86.078-86.078c0-47.54 38.539-86.078 86.078-86.078s86.078 38.539 86.078 86.078z" fill="url(#sugzzg)"/>
  <path d="m590.22 243.79c0 47.064-38.153 85.217-85.217 85.217s-85.217-38.153-85.217-85.217c0-47.064 38.153-85.217 85.217-85.217s85.217 38.153 85.217 85.217z" fill="url(#sugzzh)"/>
  <path d="m589.37 243.79c0 46.594-37.772 84.365-84.365 84.365s-84.365-37.772-84.365-84.365c0-46.594 37.772-84.365 84.365-84.365s84.365 37.772 84.365 84.365z" fill="url(#sugzzi)"/>
  <path d="m588.52 243.79c0 46.128-37.394 83.522-83.522 83.522s-83.522-37.394-83.522-83.522c0-46.128 37.394-83.522 83.522-83.522s83.522 37.394 83.522 83.522z" fill="url(#sugzzj)"/>
  </g>
  </g>
  </g>
  </g>
<text transform="matrix(1.005 0 0 1.005 -.7373 -6.4393)" fill="url(#sugzzt)"  font-size="17px" stroke="url(#sugzzz)" stroke-miterlimit="0" stroke-width=".62511px" onclick={()=>linke()} onmouseenter={()=>hover({"he":` לחיצה כפולה לצפיה בעמוד הציבורי של ריקמת ${projectName} `, "en":`click two times to view the publick profile of ${projectName}`})} onmouseleave={()=>hover("0")}  style="white-space:pre; stroke-width: 0 !important; fill: url(#sugzzt) !important; font-weight:bold; font-family: gan, Powerr; " bx:origin="0.5 -0.369851"><textPath startOffset="{hst}" xlink:href="#sugzzm">{projectName}</textPath></text>

<text onclick={mesima} fill="url(#sugzzs)" font-size="17px" stroke="url(#sugzzy)" stroke-miterlimit="0" stroke-width=".62511px" style="white-space:pre; fill:white; font-family: Gan, Powerr; stroke-width: 0; cursor: pointer;"><textPath startOffset="{stb}" xlink:href="#sugzzl" onmouseenter={()=>hover({"he":"שם המשימה, 2 לחיצות להרחבה","en": "suggested mission, click 2 times to expand"})} onmouseleave={()=>hover("0")}>{missionName}</textPath></text>

<text x="503.31" y="223.099" fill="url(#sugzzx)" font-family='"Lobster Two"' font-size="27px" stroke="url(#sugzzw)" stroke-miterlimit="0" stroke-width=".2511px" text-anchor="middle" style="white-space:pre">{total.toLocaleString('en-US', {maximumFractionDigits:2})}</text>

<g>
<path d="m503.92 247.08 83.779 36.861s-27.955 50.743-83.36 51.943c-49.464 1.072-82.103-53.618-82.103-53.618l81.684-35.186z" fill="rgba(216, 216, 216, 0)" stroke="rgba(0, 0, 0, 0)">
</path>
<text transform="matrix(1 0 0 1 100.04 -13.744)" style="fill:url(#sugzzv); stroke-width: 0; font-family: gan, Powerr;" x="402.493" text-anchor="middle" y="299.752" fill="url(#sugzzv)"  font-size="18px" stroke="url(#sugzzu)" stroke-miterlimit="0" stroke-width=".62511px" >
   {#if timeToP == "alreadi"}
          {ttal[$lang]}
         {:else if timeToP == "week"}
          {ttwe[$lang]}
          {:else if timeToP == "month"}
          {ttmo[$lang]}
           {:else if timeToP == "threeM"}
          {tt3mo[$lang]}
           {:else if timeToP == "sixM"}
          {tt6mo[$lang]}
           {:else if timeToP == "oneY"}
          {tt1y[$lang]}
         {:else if timeToP == "twoY"}
          {tt2y[$lang]}
         {:else if timeToP == "more"}
          {ttmor[$lang]}
          {:else if timeToP == "never"}
          {ttne[$lang]}
        {/if}
   <tspan dx="0" dy="1.2em" font-size="17px"></tspan></text>
</g></g>
<image onclick={()=>linke()} onmouseenter={()=>hover({"he":` לחיצה כפולה לצפיה בעמוד הציבורי של ריקמת ${projectName} `, "en":`click two times to view the publick profile of ${projectName}`})} onmouseleave={()=>hover("0")} clip-path="url(#sugclipCircle)" transform="matrix(.068594 0 0 .068593 73.499 125.85)" width="450" height="450" style="" xlink:href={src}>
</image>
<g>
<path d="m39.377 159.37 102.12 1.34 4.557 10.454-55.753 13.939-55.754-16.887 4.825-8.846z" fill="rgba(216, 216, 216, 0)" stroke="rgba(0, 0, 0, 0)">
</path>

</g>

</svg>
      <!--  <img on:click={()=>linke()} on:mouseenter={()=>hover({"he":` לחיצה כפולה לצפיה בעמוד הציבורי של ריקמת ${projectName} `, "en":`click two times to view the publick profile of ${projectName}`})} on:mouseleave={()=>hover("0")} class="img" src={src}  alt="logo">
        <button on:click={()=>linke()} on:mouseenter={()=>hover({"he":` לחיצה כפולה לצפיה בעמוד הציבורי של ריקמת ${projectName} `, "en":`click two times to view the publick profile of ${projectName}`})} on:mouseleave={()=>hover("0")}  ><h7 class="text-lturk pn" >{projectName}</h7></button>
        <h1 on:mouseenter={()=>hover({"he":"המשימה המוצעת","en": "suggested mission"})} on:mouseleave={()=>hover("0")} style="color: rgb(233, 239, 239); " class="lt">{missionName}</h1>
        {#if total} <p class="lt">{total}</p>{/if}
        {#if timeToP == "alreadi"}
          <p>{ttal[$lang]}</p>
         {:else if timeToP == "week"}
          <p>{ttwe[$lang]}</p>
          {:else if timeToP == "month"}
          <p>{ttmo[$lang]}</p>
           {:else if timeToP == "threeM"}
          <p>{tt3mo[$lang]}</p>
           {:else if timeToP == "sixM"}
          <p>{tt6mo[$lang]}</p>
           {:else if timeToP == "oneY"}
          <p>{tt1y[$lang]}</p>
         {:else if timeToP == "twoY"}
          <p>{tt2y[$lang]}</p>
         {:else if timeToP == "more"}
          <p>{ttmor[$lang]}</p>
          {:else if timeToP == "never"}
          <p>{ttne[$lang]}</p>
        {/if}
        <span class="bg-gold font-semibold opacity-80 inline-flex items-center mr-2 px-2.5 py-0.5 rounded">
        </span>
      -->

</div>
</SwiperSlide
  ><SwiperSlide class="swiper-slideg"
    ><div   id="normSmll"
><div class="{`normSmll${oid}-${projectId}`} xyz"></div>
    <div class="ltn ab p-0 d flex flex-wrap items-center justify-center " style="text-shadow:none;" onmouseenter={()=>hover({"he":"הכישורים הנדרשים","en": "needed skills"})} onmouseleave={()=>hover("0")} >
      {#each skills.data as skill}
      <Tile  bg="green" word={skill.attributes.skillName}/>
        {/each}
</div>
   {#if deadLine != undefined && deadLine != "undefined"} <h5 onmouseenter={()=>hover({"he":"תאריך אחרון לביצוע","en": "last date to do the mission"})} onmouseleave={()=>hover("0")} class="lt bc">{dayjs(deadLine).format("dddd, MMMM Do YYYY, H:mm:ss ")}</h5>{/if}
      {#if deadLinefi != undefined && deadLine != "undefined"} <h5 onmouseenter={()=>hover({"he":"תאריך אחרון לביצוע","en": "last date to do the mission"})} onmouseleave={()=>hover("0")} class="lt bc">{dayjs(deadLine).format("dddd, MMMM Do YYYY, H:mm:ss ")}</h5>{/if}

    <h4 onmouseenter={()=>hover({"he":"פרטי המשימה","en":"mission details"})} onmouseleave={()=>hover("0")} class="ltn cd d" style=" line-height: 0.9;">{missionDetails}</h4>
    <div onmouseenter={()=>hover({"he":"תפקיד מבוקש", "en":"requested role"})}
       onmouseleave={()=>hover("0")}
       style="text-shadow:none;"
       class="ltn de d flex flex-wrap items-center justify-middle">

      {#each role.data as d}
       <Tile  bg="pink" word={d.attributes.roleDescription}/>
      {/each}

    </div>
{#if low == false}
    {#if already === false}
    <button onmouseenter={()=>hover({"he":"אני רוצה","en":"Yes I want"})} onmouseleave={()=>hover("0")} onclick={agree(oid)} class="btn a" name="requestToJoin" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
   <!--<button on:click={nego(oid)} name="negotiate" class="btn" title="משא ומתן"><i class="far fa-comments"></i></button>
   -->  <button onmouseenter={()=>hover({"he":"לא מתאים לי", "en": "not for me"})} onmouseleave={()=>hover("0")}  onclick={decline(oid)} class="btn b" name="decline" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
    {/if}
     {:else if low == true}
          <Lowbtn/>
        {/if}
</div>
</SwiperSlide
  >
</Swiper>
</div>

<div data-vaul-drawer-wrapper>
<Drawer.Root bind:open={dialogOpen} direction="right" shouldScaleBackground>
	<Drawer.Trigger/>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/40 " />
		<Drawer.Content class="fixed bottom-0 top-0 right-0 max-h-[96%] rounded-t-[10px] z-[1000] flex flex-row-reverse">
			<div class="swiper-slidec mx-auto ">
        <Cards
onProject={project}
 onAgree={claf}
  onDecline={claf}
  onHover={hoverc}
  onTochat={tochat}
  {acts}
  {low}
  {hearotMeyuchadot}
  {alreadyi}
  {missionName}
  {noOfHours}
  {perhour}
  {already}
  {missionDetails}
  {skills}
  {role}
  {projectName}
   {src}
 {workways}
 {timeToP}
   />
      </div>
        <!---<div>
      <button class="bg-gold p-4">
          |
            <Drawer.Close />
        </button>
            </div>-->
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
</div>
{:else}
<Cards
onProject={project}
 onAgree={claf}
  onDecline={claf}
  onHover={hoverc}
  onTochat={tochat}
  {isVisible}
  {acts}
  {low}
  {hearotMeyuchadot}
  {alreadyi}
  {missionName}
  {noOfHours}
  {perhour}
  {already}
  {missionDetails}
  {skills}
  {role}
  {projectName}
   {src}
 {workways}
 {timeToP}
   />
{/if}

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
  .xyz{
            grid-column: 1/4;

  }
  .pn{
     margin: 5px;
    font-size: 7px;
     line-height: 1;
     font-weight: bold;
  }
  .ab{
        grid-column: 1/4;
        grid-row: 1/ 2;
        margin-top: 10px;
        max-height: 70%;
        max-width: 100%;
        padding: 0 10%;
        overflow-y: auto;
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
        grid-column: 3/4;
    }
  .ltb{
    margin: 0px;
     font-size: 9px;
     font-weight: bold;
      line-height: 1;
  }
  .ltn{
    font-size: 8px;
     line-height: 1;
     font-weight: bold;
     height: 100%;
     overflow-y: auto;
  }
  .lt{
   margin: 1px;
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
     height: 22px;
  }
	#normSml{
        white-space: normal;
        text-align: center;
        line-height: 0.5;
        align-items: center;
        justify-content: safe center;
        color: var(--barbi-pink);
      min-height: 75px;
    min-width: 75px;
    max-width: 137.5px;
    max-height: 137.5px;
    aspect-ratio: 1 /1;
         background-color: rgb(100, 224, 137);
         border-radius: 50%;
         text-shadow: 1px 1px  rgb(63, 56, 18);

         background: url(https://res.cloudinary.com/love1/image/upload/v1643838569/cleenCoin1_xpsitt.png);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;

    }
	 #normSmll{
        white-space: normal;
        text-align: center;
        align-items: center;
        justify-content: safe center;
        color: var(--barbi-pink);
      min-height: 75px;
    min-width: 75px;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 /1;
         border-radius: 50%;
         text-shadow: 1px 1px  rgb(63, 56, 18);
                     background: url(https://res.cloudinary.com/love1/image/upload/v1643838569/cleenCoin1_xpsitt.png);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto auto auto;
    }
  /*  .normSmlHover{
        text-shadow: 1px 1px var(--gold);
        color: var(--barbi-pink);
        min-height: 115px;
    min-width: 115px;
    max-width: 325px;
    max-height: 325px;
    aspect-ratio: 1/ 1;
        border-radius: 50%;
        line-height: 0.5;
        text-align: center;
        background: url(https://res.cloudinary.com/love1/image/upload/v1643838569/cleenCoin1_xpsitt.png);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    }*/
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
    @media  (min-width: 550px) {

      .ltb{
    margin: 0px;
     font-size: 17px;
      }
      .ltn{
    font-size: 10px;
      }
      .lt{
   margin: 2px;
    font-size: 13px;
      }
         .pn{
   margin: 5px;
   padding-left: 8px;
   padding-right: 8px;
    font-size: 10px;
      }


    .img{
     width: 32px;
     height: 32px;
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
