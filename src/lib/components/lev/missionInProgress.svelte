<script>
	  import { fly, scale } from 'svelte/transition';
    import { clickOutside } from './outsidclick.js';
    import { formatTime } from './utils.js';
    import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
    import { goto, prefetch } from '$app/navigation';
    import { idPr } from '../../stores/idPr.js';
    import { onMount } from 'svelte';
     import { createEventDispatcher } from 'svelte';
     import {betha} from './storess/betha.js'
function percentage(partialValue, totalValue) {
   return (100 * partialValue) / totalValue;
} 
let tdtd = []
betha.subscribe(value => {
		tdtd = value;
	});

 const dispatch = createEventDispatcher();
 export let coinlapach
    export let stname;
    let show = true;
    export let dueDateOrCountToDedline = "11:11"
    export let projectName = "ONE"
    export let missionName = "do x" 
    export let missionDetails = "do x in y"
    export let src = "coin.png"
    export let link = "https://www.free-mates.com"
    export let linkDescription = "לביצוע"
    export let projectId;
    export let linkP = "/project/"
    export let hourstotal;
    export let hoursdon = 0;
    export let mId;
    export let missId; //add in gr
    export let noofpu; //addtopr
    export let perhour;
    export let usernames;
    let mstotal = hourstotal*3600000
     let idL;

    let x = 0;
    let already = false;

$: pcli = 0
$: pmcli = 0
function linke (s){
    pcli += 1;
    if(pcli >= 2){
        dispatch("proj", {id: projectId});
    
  }
}
  let img = 'https://res.cloudinary.com/love1/image/upload/v1648817031/maskable_icon_x128_tt2kgj.png';

  function project (id) {
      pmcli += 1;
    if(pmcli >= 2){
    idPr.set(id);
    goto("/moach")
    }
  };
let zmani;

  let msdonf;
  $: msdonf = hoursdon * 3600000;
  export let zman;
    export let oldzman;

$: zman = msdonf + lapse + x;
let miatan;
onMount(async () => {
  console.log(tdtd[coinlapach-1])
  if (tdtd[coinlapach-1].ch == true){
    stname = tdtd[coinlapach-1].stname
    if(tdtd[coinlapach-1].hoursdon !== false){
    hoursdon = tdtd[coinlapach-1].hoursdon
    }
  }
    if (stname === "0") {
      console.log(stname, lapse, x,"מאפס")
  } else if (stname === "stopi") {
          console.log(stname, lapse ,x,"מסטופי")
    if (tdtd[coinlapach-1].ch == true && tdtd[coinlapach-1].hoursdon == false){
    oldzman = tdtd[coinlapach-1].timer
  }
    x = oldzman
  } else {
          console.log(stname, lapse,x,"מאחר")
    if (tdtd[coinlapach-1].ch == true){
    oldzman = tdtd[coinlapach-1].timer
    }
      const startTime = stname - lapse
      timer = setInterval(() => {
        lapse = Date.now() - startTime 
      }, 1)
        x = oldzman
    running = true
  }
})

$: if (percentage(zman,mstotal) == 90){
 let text = `שלום ${usernames} נשארו רק עשרה אחוזים לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה` ;
    navigator.serviceWorker.register('sw.js');
 Notification.requestPermission(function(result) {
  if (result === 'granted') {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.showNotification('1❤️1', { body: text, icon: img });
    });
  }
 });
        } else if (percentage(zman,mstotal) == 95){
 let text = `שלום ${usernames} נשארו רק חמישה אחוזים לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה` ;
    navigator.serviceWorker.register('sw.js');
 Notification.requestPermission(function(result) {
  if (result === 'granted') {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.showNotification('1❤️1', { body: text, icon: img });
    });
  }
 });
        } 
$: if (mstotal-zman == 300000){
 let text = `שלום ${usernames} נשארו רק חמש דקות לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה` ;
    navigator.serviceWorker.register('sw.js');
 Notification.requestPermission(function(result) {
  if (result === 'granted') {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.showNotification('1❤️1', { body: text, icon: img });
    });
  }
 })}else if (mstotal-zman == 60000){
          console.log("timer stop min")
 let text = `שלום ${usernames} נשארה רק דקה לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה` ;
    navigator.serviceWorker.register('sw.js');
 Notification.requestPermission(function(result) {
  if (result === 'granted') {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.showNotification('1❤️1', { body: text, icon: img });
    });
  }
 });
        }
$: if (percentage(zman,mstotal) >= 100){
           azor ()
    let text = `שלום ${usernames} הטיימר של  ${missionName} נעצר מפני שמכסת השעות שסוכמה הסתיימה, יש ליצור משימה חדשה` ;
    navigator.serviceWorker.register('sw.js');
 Notification.requestPermission(function(result) {
  if (result === 'granted') {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.showNotification('1❤️1', { body: text, icon: img });
    });
  }
 });
        }

  let timer;
  let running = false;
  let error1;
  
async function azor () {
      clearInterval(timer)
      running = false;
      zmani += lapse;
      x += lapse;
      lapse = 0;
        tdtd[coinlapach-1].stname = "stopi"
        tdtd[coinlapach-1].timer = x
        console.log("from azor",x)
        tdtd[coinlapach-1].hoursdon = false
        tdtd[coinlapach-1].ch = true
        tdtd[coinlapach-1].x = x
        tdtd[coinlapach-1].lapse = 0
      betha.set(tdtd)
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
                    body: JSON.stringify({
                        query: `mutation 
                        { 
 updateMesimabetahalich(
  input: {
    where: {id: "${mId}"}
  data: {
 stname: "stopi",
 timer: ${x}
  }
 }
 ) {mesimabetahalich{id stname timer}}
 }
 `})
                })
                .then(r => r.json())
                .then(data => miCatan = data);
            console.log(miCatan);
        } catch (e) {
            error1 = e
            console.log(error1);
        }
} 
async function start () {
      const startTime = Date.now() - lapse
      timer = setInterval(() => {
        lapse = Date.now() - startTime 
      }, 1)
    running = true
    stname = Date.now()
      tdtd[coinlapach-1].stname = stname
        tdtd[coinlapach-1].timer = x
        tdtd[coinlapach-1].hoursdon = false
        tdtd[coinlapach-1].ch = true
        tdtd[coinlapach-1].x = x
        tdtd[coinlapach-1].lapse = lapse
       tdtd[coinlapach-1].running = true
      betha.set(tdtd)
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
 updateMesimabetahalich(
  input: {
    where: {id: "${mId}"}
  data: {
 stname: "${stname}",
 timer: ${x}
  }
 }
 ) {mesimabetahalich{id stname timer}}
 }
`})
                })
                .then(r => r.json())
                .then(data => miCatan = data);
            console.log(miCatan);
        } catch (e) {
            error1 = e
            console.log(error1);
        }
}

async function handleClearClick () {
    clearInterval(timer)
    lapse = 0
    x = 0;
    running = false
      tdtd[coinlapach-1].stname = "0"
        tdtd[coinlapach-1].timer = 0
        tdtd[coinlapach-1].hoursdon = false
        tdtd[coinlapach-1].ch = true
         tdtd[coinlapach-1].x = 0
        tdtd[coinlapach-1].lapse = 0
       tdtd[coinlapach-1].running = false
      betha.set(tdtd)
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
updateMesimabetahalich(
  input: {
    where: {id: "${mId}"}
  data: {
stname: "0",
timer: 0
  }
}
) {mesimabetahalich{id stname timer}}
}
`})
                })
                .then(r => r.json())
                .then(data => miCatan = data);
            console.log(miCatan);
        } catch (e) {
            error1 = e
            console.log(error1);
        }
  }
  let miCatan =[];

  let miDatan;
 let token;
 let bearer1;
 let linkg = "https://i18.onrender.com/graphql"
async function save() {
    const saved = lapse * 2.7777777777778E-7 + x * 2.7777777777778E-7;
    const noofnew = hoursdon + saved;
    hoursdon = noofnew;
    clearInterval(timer)
    const msdon = hoursdon * 3600000
    zman = msdon
    lapse = 0
    x = 0
    running = false
      tdtd[coinlapach-1].stname = "0"
        tdtd[coinlapach-1].timer = 0
     tdtd[coinlapach-1].hoursdon = hoursdon
        tdtd[coinlapach-1].ch = true
        tdtd[coinlapach-1].x = 0
        tdtd[coinlapach-1].lapse = 0
        tdtd[coinlapach-1].zman = msdon
        tdtd[coinlapach-1].running = false
          console.log("trynoww")
                  console.log("trynow")

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
          console.log("try")
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
   updateMesimabetahalich(
  input: {
    where: {id: "${mId}"}
  data: {
   howmanyhoursalready: ${hoursdon},
   stname: "0",
    timer: 0
  }
 }
 ) {mesimabetahalich{id howmanyhoursalready}}
 }
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
                        betha.set(tdtd)

        } catch (e) {
            error1 = e
            console.log(error1);
}}
    export let lapse = 0;


    // lapse refers to the number of milliseconds in the stopwatch

    // rotation refers to the degrees applied to the minutes dial to have a full rotation for 60 seconds
    // multiply the value by 60 for the seconds dial to have a full rotation every second
    $: rotation = ((lapse / 1000 / 60) * 360) % 360;

    // this is a very imperfect way to have the dials rotate smoothly back to 0
    // set a transition on the minutes and seconds dial, but only when lapse is set to 0
    // remove it when lapse is then more than 0
    let seconds;
    let minutes;
    // to avoid constantly setting transition to none add a boolean to short-circuit the second conditional
    let transitioned;


function done() {
  already = true;
  //file upload in a chlon kofetz and then archived,, future build smart contracts on blockchain
  isOpen = true;
}
let isOpen = false;
function close() {
  isOpen = false;
  already = false;
}
let errorM = {ein:"יש להעלות קובץ המכיל את ביצוע המשימה או לתאר במילים",
               timer: " יש לכבות את הטיימר לפני הגשת המשימה לאישור"   };
let activE;
let why;
let what;
let tofinished = ``;
let tofinished1 = ``;
let tofinished2 = ``;
let toapprove1 = ``; 
let toapprove = ``; 
let appi = ``;
async function afterwhy () {
  already = true;
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
    console.log("done+ file")
  if (!why && !what) {
    activE = errorM.ein
  } else if (running) {
    activE = errorM.timer
  } else {
if (noofpu === 1) {
  console.log(hoursdon)
  tofinished1 = `finnished: true`;
  tofinished2 = `finnished: true`;
  appi = ``
  tofinished = `
   createFinnishedMission(
           input: { 
             data: {
              missionName: "${missionName}",
              why: "${why}",
              noofhours: ${hoursdon},
              mesimabetahalich: ${mId},
              perhour: ${perhour},
              total: ${perhour*hoursdon},
              project: ${projectId},
              descrip: "${missionDetails}",
              users_permissions_user: "${idL}",
              mission: ${missId}
   }
}){finnishedMission {id }}`
} else if (noofpu > 1) {
    toapprove1 = `forappruval: true`;
    appi =`
createFiniapruval(
   input: { 
     data: {
      missname: "${missionName}",
      why: "${why}",
      noofhours: ${hoursdon},
      mesimabetahalich: ${mId},
      project: "${projectId}",
            users_permissions_user: "${idL}",
       vots:[ 
    {
      what: true
      users_permissions_user: "${idL}"
    }
  ]
   }
}){finiapruval {id }}`
}
//files shit from updatepic
    //כמה בפרןויקט אם 1 אז אישור מיידי , ליצור בועת אישור אם חוק דורש 
 
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
updateMesimabetahalich(
  input: {
    where: {id: "${mId}"}
  data: {
    ${toapprove1}
${tofinished1}
  }
}
) {mesimabetahalich{id forappruval finnished howmanyhoursalready}}
${appi}
${tofinished}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
              isOpen = false;
              dispatch("done",
               {ani: "minp",
                coinlapach: coinlapach})
        } catch (e) {
            error1 = e
            console.log(error1);
            isOpen = true;
            activE = error1;
        }
  }
}
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
 let hovered = false;
 
 let  u = "משימה בתהליך ביצוע"
 function hoverede(){
   hovered = !hovered
    if (hovered == false){
    u = "לב המערכת"
  } else {
u = "פעולה בתהליך ביצוע"
  }
  dispatch("hover", {id: u});
 }
function hover (id){
  if (id == "0"){
 u = "משימה בתהליך ביצוע"
  } else {
    u = id
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
   import Cards from './cards/inpro.svelte'
export let cards = false;
function claf (event){
  let o = event.detail.alr
  let d = event.detail.y
  console.log(o,d)
}
</script>

<!--<svelte:window on:beforeunload={beforeUnload}/>-->


    <DialogOverlay {isOpen} onDismiss={close} class="overlay">
        <div transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form" class="content">
      <div dir="rtl" >
              <button on:click={close}>ביטול</button>
             
              <h5>יש להעלות קובץ סיום משימה או לתאר במילים</h5>
      <input  type="file" bind:files={what}>
      <input  type="text" bind:value={why} placeholder="יש לתאר במילים את סיום המשימה">
            <button on:click={afterwhy}>אישור</button>
      <br/> {#if activE}<small>{activE}</small>{/if}
      
  </DialogContent>
  </div>
</DialogOverlay>
{#if cards == false}

<div 
style="position: relative;" 
style:z-index={hovered === false ? 1 : 6} 
on:mouseenter={()=> hoverede()} 
on:mouseleave={()=> hoverede()}
use:clickOutside on:click_outside={toggleShow} 
class="hover:scale-290 duration-1000 ease-in"     in:scale={{duration: 3200, opacity: 1, start: 0.1}}
out:scale={{duration: 2200, opacity: 0.5}}
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
    nextEl: `.normSml${perhour}-${projectId}-${mId}`,
    prevEl: `.normSmll${perhour}-${projectId}-${mId}`,
  }}
>
  <SwiperSlide class="swiper-slideg"
    ><div
	 id="normSml" 
>  
<svg viewBox="0 0 100 100" class="svgg">
  <defs>
   <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
<feGaussianBlur stdDeviation="10 10" result="glow"/>
<feMerge>
  <feMergeNode in="glow"/>
<feMergeNode in="glow"/>
<feMergeNode in="glow"/>
<feMergeNode in="glow"/>
<feMergeNode in="glow"/>
</feMerge>
</filter>
  </defs>
    <g transform="translate(50 50)">
        <circle id="dial" cx="0" cy="0" r="42" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="0.3 1.898"></circle>
        <use href="#dial" transform="scale(-1 1)"></use>

        <!-- include the number of milliseconds in the rotation of the minutes dial
        1 full rotation for every 60 seconds
        -->
        <g bind:this="{minutes}" transform="rotate({rotation})">
            <g transform="translate(0 -50)">
                <path d="M -2.25 0 h 4.5 l -2.25 2.5 l -2.25 -2.5" fill="currentColor"  stroke="currentColor" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"></path>
            </g>
        </g>

        <g transform="translate(0 20)">
            <!-- include the number of milliseconds in the rotation of the minutes dial
            1 full rotation for every single second
            -->
            <g bind:this="{seconds}" transform="rotate({(rotation * 60) % 360})">
                <path d="M 0 -1 v -4.5" fill="none" stroke="currentColor" stroke-width="0.4" stroke-linejoin="round" stroke-linecap="round"></path>
            </g>
            <circle r="7" fill="none" stroke="currentColor" stroke-width="0.4"></circle>
            <circle r="1" fill="none" stroke="currentColor" stroke-width="0.4"></circle>
        </g>
        <text font-family="Digital" on:mouseenter={()=>hover("טיימר")} on:mouseleave={()=>hover("0")} text-anchor="middle" fill="red" y="10" font-size="7" style="font-weight: 300; letter-spacing: 1px;">
            {formatTime(zman)}
        </text>
                <g style="overflow:hidden; text-anchor: middle;" on:click={()=>linke("p")} on:mouseenter={()=>hover("לחיצה כפולה לצפיה בעמוד הציבורי של הריקמה")} on:mouseleave={()=>hover("0")}  >
                  <text y='-8' style="filter: url(#glow); fill: var(--gold);"  text-anchor="middle" font-size="8" >{projectName}</text>
                  <text y='-8'  style="fill: black;"  text-anchor="middle" font-size="8" >{projectName}</text></g>
         <g style="overflow:hidden; text-anchor: middle;">
                <text style="filter: url(#glow); fill: var(--gold);" on:mouseenter={()=>hover("שם המשימה")} on:mouseleave={()=>hover("0")} y="0"   font-size="8">{missionName}</text>
         <text font-family="Bellefair" style="fill: black;"  on:mouseenter={()=>hover("שם המשימה")} on:mouseleave={()=>hover("0")} y="0"  font-size="8">{missionName}</text>
    </g>
                                                     <foreignObject  x='-12' y='-42' width='25px' height='56px'>   
    <span class="{`normSml${perhour}-${projectId}-${mId}`}"></span>
        <img on:click={()=>project()} on:mouseenter={()=>hover("לוגו הריקמה")} on:mouseleave={()=>hover("0")} style=" border-radius: 50%;" src={src} width="24" height="24"   alt="logo">
         

       {#if dueDateOrCountToDedline !== null} <h5 style="margin: 7px; font-size: 13px; line-height: 1;">{dueDateOrCountToDedline}</h5>{/if}
                                                     </foreignObject>     

<!--        
<foreignObject x='-12' y='42' width='125px' height='56px'>
    
       <h5 style="margin: 7px; font-size: 13px; line-height: 1;">{`${hoursdon ? hoursdon : 0} / ${hourstotal}`}</h5>

        <button1 title="סיימתי"  class="btn" name="done" on:click={done}><i class="far fa-check-circle"></i></button1>
        <button3 on:click={handleRunClick} class="btn" name="start timer" title= {running ? 'Stop' : 'Start'}><i class="fas fa-hourglass-start"></i></button3>
        <button2 class="btn" title="request more time" name="request more time"><i class="far fa-calendar-plus"></i></button2>
        
</foreignObject>
-->
    </g>
</svg>
   
</div>
</SwiperSlide >

<SwiperSlide class="swiper-slideg"
    >
    <div id="normSmll" >
<div on:mouseenter={()=>hover("זמן שכבר בוצע")} on:mouseleave={()=>hover("0")} class="mn ab  ">{formatTime(zman)}</div>
  {#if missionDetails!== undefined &&  missionDetails!== null  &&  missionDetails!==  "undefined"}  <p on:mouseenter={()=>hover("פרטי המשימה")} on:mouseleave={()=>hover("0")} class="mn bc">{missionDetails}</p>{/if}

  <h5 dir="ltr" class="mn cd "><span on:mouseenter={()=>hover("מספר השעות שבוצעו ונשמרו")} on:mouseleave={()=>hover("0")} >{`${hoursdon ? Math.round((hoursdon + Number.EPSILON) * 100) / 100 : 0}`}</span> / <span on:mouseenter={()=>hover("מספר השעות שהוקצו למשימה")} on:mouseleave={()=>hover("0")}>{hourstotal}</span></h5>
  

  <a on:mouseenter={()=>hover("לינק לביצוע המשימה")} on:mouseleave={()=>hover("0")} class="mn de text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  hover:text-barbi p-0 rounded-full "  style="padding: 0px;" href={link}>{linkDescription}</a>
<div class="{`normSmll${perhour}-${projectId}-${mId}`}"></div>

{#if lapse !== 0 || x !== 0}
<button on:mouseenter={()=>hover("לחיצה לאיפוס הטיימר מבלי לשמור")} on:mouseleave={()=>hover("0")}  class="  border border-barbi hover:border-gold bg-gradient-to-br from-graa to-grab text-barbi  p-0 rounded-full hover:from-lturk hover:to-barbi ga" on:click={handleClearClick}>ניקוי</button>
<button on:mouseenter={()=>hover("לחיצה לעצירת הטיימר ושמירת הזמן שבוצע")} on:mouseleave={()=>hover("0")} class="  bg-gradient-to-br text-gold hover:from-graa hover:to-grab hover:text-gold   p-0 rounded-full from-lturk to-barbi gb" on:click={save}> הוספה</button>
{/if}
    {#if already === false}
    <button on:mouseenter={()=>hover("לחיצה לסיום המשימה")} on:mouseleave={()=>hover("0")} on:click={done}   class="btn a" name="done"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" /></svg></button>
     {/if} 
     {#if show === true}  <button on:mouseenter={()=>hover(`${running ? "עצירת הטיימר" : "הפעלת טיימר"}`)} on:mouseleave={()=>hover("0")} on:click={running ? azor : start} class="btn b" name="start timer" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path  fill="currentColor" d="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z" /></svg></button>
   {/if}
        <!--if stop then opposide sand timer
     <button2 class="btn" title="request more time" name="request more time"><i class="far fa-calendar-plus"></i></button2>-->
 </div>
</SwiperSlide
  >
</Swiper>

</div>

{:else}

<Cards 
on:start={start}
 on:done={done}
  on:save={save}
  on:hover={hoverc}
  on:azor={azor}
  on:clear={handleClearClick}
  {dueDateOrCountToDedline}
{x}
  {zman}
  {already} 
  {projectName}
   {src} 
   {missionDetails}
   {link}
   {missionName}
   {linkDescription} 
   {running} 
   {show}
   {hourstotal}
   {hoursdon}
   />
{/if}
<style>
  .di{
            grid-column: 1/4;

  }
  .btin{
    width:13px;
     height:13px;
  }
  .ab{
        grid-column: 1/4;
        grid-row: 1/ 2;
        margin-top: 5px;
        color: var(--gold);
    }
    .bc{
        grid-column: 1/4;
        grid-row: 2/ 3;
        color: var(--gold);
    }
      .cd{
        grid-column: 1/4;
        grid-row: 3/ 4;

    }
      .de{
        grid-column: 1/4;
        grid-row: 4/ 5;
}
 
.ga{
        grid-column: 1/2;
        grid-row: 5/ 6;
        font-size: 9px;
}
.gb{
        grid-column: 3/4;
        grid-row: 5/ 6;
                font-size: 9px;

}
  .a{
        grid-column: 1/2;
        margin: 0 auto;
    }
    .b{
        grid-column: 3/4;
        margin: 0 auto;
    }
  .mn{
     line-height: 1; 
     font-size: 8px ;
     font-weight: bold; 
  }
  .pn{
    margin: 1px;
     font-size: 8px; 
     font-weight: bold;
      line-height: 1;
  }
  .img{
    width: 22px;
     height: 22px;
   margin: 0px; 
    margin-right:auto;
     margin-left: auto;
      border-radius: 50%;
  }
  .svgg{
    min-height: 75px;
    min-width: 75px;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 /1;
  }
small {
  color: red ;
  padding: 2em;
}
       svg {
        font-family: "Roboto Mono", monospace;
        color: hsl(0, 0%, 5%);
    }
	#normSml{
       
        
        text-align: center; 
        line-height: 0.5;
        align-items: center;
        justify-content: safe center;
        color: var(--barbi-pink);
        min-height: 75px;
    min-width: 75px;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 /1;

         border-radius: 50%;
         background: url(https://res.cloudinary.com/love1/image/upload/v1643838415/diamondlight1_db635m.jpg);
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
    background: url(https://res.cloudinary.com/love1/image/upload/v1643838415/diamondlight1_db635m.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    display: grid;
    grid-template-columns: auto auto auto;
    grid-template-rows: auto auto auto auto auto;
    }
    /*
    .normSmlHover{
        min-height: 115px;
    min-width: 115px;
    max-width: 325px;
    max-height: 325px;
    aspect-ratio: 1/ 1;
        color: var(--barbi-pink);

        border-radius: 50%;
        line-height: 0.6; 
        text-align: center;
        background: url(https://res.cloudinary.com/love1/image/upload/v1643838415/diamondlight1_db635m.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    }*/
    .btn{ 
        
        background-color: rgb(87, 208, 248);
        border-radius: 50%;
        color: purple;
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
   .a{
        grid-column: 1/2;
        margin-left: 5px;
    }
    .b{
        grid-column: 2/3;
                margin-right: 5px;

    }
   .ab{
     
        margin-top: 13px;
        color: var(--gold);
    }
   .ga{
             font-size: 17px;

   }
   .gb{
             font-size: 17px;

   }
    .btin{
    width:24px;
     height:24px;
  }
     .mn{
     font-size: 13px ;
  }
    .pn{
    margin: 13px;
     font-size: 13px; 
  }
  .img{
     width: 42px;
     height: 42px;
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
   .svgg{
     width:125px; 
     height:125px;
  }
    }
            :global([data-svelte-dialog-content].content) {
      width: 80vw;
      z-index: 60;
  }
    :global([data-svelte-dialog-overlay].overlay) {
    z-index: 100;
  }
  @media (min-width: 568px){
        :global([data-svelte-dialog-content].content) {
width:50vw;
      z-index: 60;

        }
          :global([data-svelte-dialog-overlay].overlay) {
    z-index: 100;
  }
      }
</style>

