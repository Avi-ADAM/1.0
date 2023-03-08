<script>
    import {nutifi } from '$lib/func/nutifi.svelte'
    import { addToast } from 'as-toast';
  import RangeSlider from "svelte-range-slider-pips";
    import { lang } from '$lib/stores/lang.js'
	  import { fly, scale } from 'svelte/transition';
    import { clickOutside } from './outsidclick.js';
    import { formatTime } from './utils.js';
    import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
    import { goto } from '$app/navigation';
    import { idPr } from '../../stores/idPr.js';
    import { onMount } from 'svelte';
     import { createEventDispatcher } from 'svelte';
     import {betha} from './storess/betha.js'
     import Lowbtn from '$lib/celim/lowbtn.svelte'
     import {SendTo} from '$lib/send/sendTo.svelte';

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
        export let low = false;
        export let status = 0;//tween store
        export let tasks = []
    export let tx = 680;
    export let dueDateOrCountToDedline = "11:11"
    export let projectName = "ONE"
    export let missionName = "do x" 
    export let missionDetails = "do x in y"
    export let src = "coin.png"
    export let link = "https://www.1lev1.world"
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
  if (status == null){
    status = 0;
  }
  if (status >= 0){
    const numi = status
    status = []
    status.push(numi)
    status = status
  }
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
          nutifi("1❤️1 טיימר קרוב לסיום",text,"lev" )

        } else if (percentage(zman,mstotal) == 95){
 let text = `שלום ${usernames} נשארו רק חמישה אחוזים לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה` ;
          nutifi("1❤️1 טיימר קרוב לסיום",text,"lev" )

        } 
$: if (mstotal-zman == 300000){
 let text = `שלום ${usernames} נשארו רק חמש דקות לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה` ;
         nutifi("1❤️1 טיימר קרוב לסיום",text,"lev" )
  }else if (mstotal-zman == 60000){
          console.log("timer stop min")
 let text = `שלום ${usernames} נשארה רק דקה לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה` ;
        nutifi("1❤️1 טיימר קרוב לסיום",text,"lev" )

        }
$: if (percentage(zman,mstotal) >= 100 && running == true){
           azor ()
    let text = `שלום ${usernames} הטיימר של  ${missionName} נעצר מפני שמכסת השעות שסוכמה הסתיימה, יש ליצור משימה חדשה` ;
    nutifi("1❤️1 טיימר נעצר",text,"lev" )
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
    id:${mId}
  data: {
 stname: "stopi",
 timer: ${x}
  }
 ) { data{id attributes{ stname timer}}}
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
  id: "${mId}"
  data: {
 stname: "${stname}",
 timer: ${x}
  }
 ) {data{id attributes{ stname timer}}}
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
   id: "${mId}"
  data: {
stname: "0",
timer: 0
  }
) {data{id attributes{ stname timer}}}
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
 let linkg = "https://strapi-87gh.onrender.com/graphql"
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
   id: "${mId}"
  data: {
   howmanyhoursalready: ${hoursdon},
   stname: "0",
    timer: 0
 }
 ) {data{id attributes{ howmanyhoursalready}}}
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
  a = 1
  //file upload in a chlon kofetz and then archived,, future build smart contracts on blockchain
  isOpen = true;
}
function opentask(){
  a = 4
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
let butt = false
async function afterwhy () {
   butt = true
  already = true;
  let d = new Date
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
                     publishedAt: "${d.toISOString()}", 
              mission: ${missId}
   }
){data {id }}`
} else if (noofpu > 1) {
    toapprove1 = `forappruval: true`;
    appi =`
createFiniapruval(
     data: {
      missname: "${missionName}",
      why: "${why}",
      noofhours: ${hoursdon},
      mesimabetahalich: ${mId},
      project: "${projectId}",
              publishedAt: "${d.toISOString()}",
            users_permissions_user: "${idL}",
       vots:[ 
    {
      what: true
      users_permissions_user: "${idL}"
    }
  ]
}){data {id }}`
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
 id: "${mId}"
  data: {
    ${toapprove1}
${tofinished1}
  }
) {data{id attributes{ forappruval finnished howmanyhoursalready}}}
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
 async function stat (){
  a=3
  console.log(status[0])
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
    id: "${mId}"
  data: {
   status: ${status[0]},
  }
 ) {data{id }}
 }
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            isOpen = false;
               addToast(`${success[$lang]}`, 'info',5000);
        } catch (e) {
            error1 = e
                        isOpen = false;
            console.log(error1);
}

 }
 $: op = {}
    function clicked (t){
      op[t] = true
      console.log(t,"rfweiofjw",op)
    }
    async function taskishor(id){
      console.log(id)
      let que = `mutation { 
  updateAct(
      id: ${id}
      data: { 
        myIshur: true
 }
  ){data {id}}
 } ` 
    console.log(que)
 try{
 let res = await SendTo(que)
 .then (res => res = res);
  console.log(res)
  if(res.data !=null){
    addToast(suc[$lang])
  }else{
    addToast(er[$lang],"warn")
  }
}  catch (e) {
  console.error(e)
  addToast(`${er[$lang]}.${e.status},${e.message}`,"warn")
  }
    }
  let a = 1;
  const suc = {"he": "בוצע בהצלחה","en":"appruved sucssefully!"}
  const er = {"he": "אם הבעיה נמשכת ehad1one@gmail.com שגיאה יש לנסות שנית, ניתן ליצור קשר במייל  ","en":"error: please try again, if the problem continue contact at ehad1one@gmail.com"}
  const sta = {"he": "סטטוס התקדמות ביצוע המשימה","en": "status of mission progress"}
 const ishur = {"he": "אישור", "en": "save"}
 const success = {"he": "נשמר בהצלחה", "en": "saved successfully"}
 const rega = {"he": "שניה בבקשה", "en": "one moment please"}
 </script>


<!--<svelte:window on:beforeunload={beforeUnload}/>-->


    <DialogOverlay {isOpen} onDismiss={close} class="overlay">
        <div transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form" class="content">
      <div dir="rtl" >
              <button on:click={close}>ביטול</button>
             {#if a == 1}
              <h5>יש להעלות קובץ סיום משימה או לתאר במילים</h5>
      <input  type="file" bind:files={what}>
      <input class="border border-gold" type="text" bind:value={why} placeholder="יש לתאר במילים את סיום המשימה">
          {#if butt == false}  <button class="bg-gold p-2 m-1 rounded-xl" on:click={afterwhy}>אישור</button>
           {:else} <small>כמה שניות בבקשה</small>{/if}
      <br/> {#if activE}<small>{activE}</small>{/if}
        {:else if a == 2}
        <div dir="ltr" class="flex flex-col justify-center items-center w-full">
<h2 class="text-center">{sta[$lang]}</h2>
<div class="w-full">
<RangeSlider bind:values={status} suffix="%" pipstep="20" float pips all="label" hoverable />
</div>
<button on:click={stat} class="text-center text-barbi border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb to-gr-c">{ishur[$lang]}</button>       
</div> 
{:else if a == 3}
<h2>{rega[$lang]}</h2> 
{:else if a == 4}
<div>
  {#each tasks as task, i}
  <div class="bg-wow flex flex-col justify-center align-middle border border-yellow-300">
<h2 class="text-center underline  decoration-wavy">{task.attributes.shem}</h2>
<p class="text-center">{task.attributes.des}</p>
{#key op} 
{#if op?.i != true}

 <div
  on:mouseenter={()=>hover(sta[$lang])} 
  on:mouseleave={()=>hover("0")}
  on:click={()=>clicked(i)}
  on:keypress={()=>clicked(i)}
  class=" border rounded-2xl border-barbi hover:border-gold " 
    >
<div class=" rounded-2xl bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre" style="width: {task.attributes.status == null ? 0 : task.attributes.status}%">{task.attributes.status != null ? task.attributes.status : "0"}%</div>
    </div>
{:else if op?.i == true}
<RangeSlider 
  bind:values={task.attributes.status} suffix="%" pipstep="20" float pips all="label" hoverable />
{/if}
{/key}
  {#if task.attributes.myIshur == false}
    <button on:click={taskishor(task.id)} class="button-silver" >{ishur[$lang]}</button>
  {/if}
</div>
  {/each}
</div>
{/if}
  </DialogContent>
  </div>
</DialogOverlay>
{#if cards == false}

<div 
style="position: relative;" 
style:z-index={hovered === false ? 11 : 16}  
on:mouseenter={()=> hoverede()} 
on:mouseleave={()=> hoverede()}
use:clickOutside on:click_outside={toggleShow} 
class="hover:scale-290 duration-1000 ease-in"     
in:scale={{duration: 3200, opacity: 1, start: 0.1}}
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
{#if tasks.length > 0}
  <div 
  on:click={opentask} 
  on:keypress={opentask}
  class="absolute inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-red-500 border-2 border-white rounded-full top-0 right-0 dark:border-gray-900">{tasks.length}</div>
  {/if}
<svg class="svgg" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:bx="https://boxy-svg.com">
   <style bx:fonts="Lobster Two">@import url("https://fonts.googleapis.com/css?family=Lobster+Two:700");</style>
  <style type="text/css">#hours { stroke: #00ffff; }#hhand { fill: #00ffff; stroke: purple; }#minutes { stroke: lime; }#mhand { fill: lime; stroke: purple; }#seconds { stroke: magenta; }#shand { fill: magenta; stroke: purple; }.tics { stroke: purple; stroke-width: 2px; }.dots { fill: purple; stroke: none; } text { fill: #00ffff; stroke: purple; stroke-width: 0.75px; }</style>
  <defs>
   <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="2 2" result="glow"/>
    <feMerge>
      <feMergeNode in="glow"/>
    <feMergeNode in="glow"/>
    <feMergeNode in="glow"/>
    <feMergeNode in="glow"/>
    <feMergeNode in="glow"/>
    </feMerge>
    </filter>
   <radialGradient id="rg1" bx:pinned="true">
      <stop offset="0" style="stop-color: rgb(66, 221, 210);"/>
      <stop offset="0.249" style="stop-color: rgb(34, 0, 255);"/>
      <stop offset="0.621" stop-color="magenta"/>
      <stop offset="0.974" style="stop-color: rgb(189, 255, 244);"/>
    </radialGradient>
    <linearGradient id="rg1-0" gradientUnits="userSpaceOnUse" x1="300" y1="130" x2="300" y2="360" gradientTransform="matrix(1.122731, 0, 0, 1.267796, -36.960182, -99.406624)" xlink:href="#rg1"/>
    <linearGradient gradientUnits="userSpaceOnUse" x1="300" y1="130" x2="300" y2="360" id="gradient-1" gradientTransform="matrix(1.122731, 0, 0, 1.267796, -36.960182, -99.406624)">
      <stop offset="0" style="stop-color: rgba(0, 128, 60, 1)"/>
      <stop offset="1" style="stop-color: rgba(0, 26, 12, 1)"/>
    </linearGradient>
    <linearGradient id="rg1-1" gradientUnits="userSpaceOnUse" x1="300" y1="130" x2="300" y2="360" gradientTransform="matrix(0.877271, 0, 0, 0.719844, 62.592922, 117.334374)" xlink:href="#rg1"/>
    <linearGradient gradientUnits="userSpaceOnUse" x1="300" y1="130" x2="300" y2="360" id="gradient-2" gradientTransform="matrix(0.877271, 0, 0, 0.719844, 62.592922, 117.334374)">
      <stop offset="0" style="stop-color: rgba(0, 128, 60, 1)"/>
      <stop offset="1" style="stop-color: rgba(0, 26, 12, 1)"/>
    </linearGradient>
    <linearGradient id="rg1-2" gradientUnits="userSpaceOnUse" x1="300" y1="130" x2="300" y2="360" gradientTransform="matrix(1, 0, 0, 1, 0, -5)" xlink:href="#rg1"/>
    <linearGradient gradientUnits="userSpaceOnUse" x1="300" y1="130" x2="300" y2="360" id="gradient-3" gradientTransform="matrix(1, 0, 0, 1, 0, -5)">
      <stop offset="0" style="stop-color: rgba(0, 128, 60, 1)"/>
      <stop offset="1" style="stop-color: rgba(0, 26, 12, 1)"/>
    </linearGradient>
    <linearGradient id="rg1-3" gradientUnits="userSpaceOnUse" x1="300" y1="130" x2="300" y2="360" gradientTransform="matrix(0.693194, 0, 0, 0.740444, 123.399486, 111.6365)" xlink:href="#rg1"/>
    <linearGradient gradientUnits="userSpaceOnUse" x1="300" y1="130" x2="300" y2="360" id="gradient-4" gradientTransform="matrix(0.693194, 0, 0, 0.740444, 123.399486, 111.6365)">
      <stop offset="0" style="stop-color: rgba(0, 128, 60, 1)"/>
      <stop offset="1" style="stop-color: rgba(0, 26, 12, 1)"/>
    </linearGradient>
    <style bx:fonts="Abel" bx:pinned="true">@import url(https://fonts.googleapis.com/css2?family=Abel%3Aital%2Cwght%400%2C400&amp;display=swap);</style>
    <path id="arrow1" stroke="none" fill="#000000" transform="scale(0.01)" d="M 0.3,0 L -2.2,2.25 L 3.8,0 L -2.2,-2.25 L 0.3,0 Z"/>
    <path id="path-75" stroke="none" fill="#000000" transform="scale(0.01)" d="M 0.3,0 L -2.2,2.25 L 3.8,0 L -2.2,-2.25 L 0.3,0 Z"/>
    <linearGradient id="linearGradient3938" bx:pinned="true">
      <stop id="stop3940" style="stop-color:#ffdd55;stop-opacity:1" offset="0.257"/>
      <stop offset="0.455" style="stop-color: rgb(247, 0, 128);"/>
      <stop offset="0.587" style="stop-color: rgb(255, 3, 121);"/>
      <stop id="stop3958" style="stop-opacity: 1; stop-color: rgb(255, 196, 0);" offset="0.741"/>
    </linearGradient>
    <linearGradient id="gradient-2879" bx:pinned="true">
      <stop offset="0" style="stop-color: rgba(86, 251, 185, 0.25);"/>
      <stop offset="0.205" style="stop-color: rgb(144, 183, 236);"/>
      <stop offset="0.367" style="stop-color: rgb(66, 87, 125);"/>
      <stop offset="0.567" style="stop-color: rgb(228, 12, 229);"/>
      <stop offset="0.929" style="stop-color: rgba(255, 0, 247, 0.4);"/>
    </linearGradient>
    <linearGradient id="gradient-15" bx:pinned="true">
      <stop offset="0.214" style="stop-color: rgb(255, 216, 40);"/>
      <stop offset="0.888" style="stop-color: rgb(255, 0, 102);"/>
    </linearGradient>
    <linearGradient id="linearGradient7080" bx:pinned="true">
      <stop id="stop7082" style="stop-color:#bd8328;stop-opacity:1" offset="0"/>
      <stop id="stop7084" style="stop-color:#fbec9b;stop-opacity:1" offset="0.1328"/>
      <stop id="stop7086" style="stop-color:#f6e9a0;stop-opacity:1" offset="0.2148"/>
      <stop id="stop7088" style="stop-color:#bd984a;stop-opacity:1" offset="0.5038"/>
      <stop id="stop7096" style="stop-color:#c09d4e;stop-opacity:1" offset="0.5896"/>
      <stop id="stop7090" style="stop-color:#faf994;stop-opacity:1" offset="0.8202"/>
      <stop id="stop7094" style="stop-color:#bd8524;stop-opacity:1" offset="1"/>
    </linearGradient>
    <linearGradient id="linearGradient6333" bx:pinned="true">
      <stop id="stop6335" style="stop-opacity: 1; stop-color: rgb(0, 255, 98);" offset="0"/>
      <stop id="stop6349" style="stop-color:#f9fe92;stop-opacity:1" offset="0.789"/>
      <stop id="stop6341" style="stop-opacity: 1; stop-color: rgb(255, 239, 252);" offset="1"/>
      <stop id="stop6337" style="stop-color:#bd8524;stop-opacity:1" offset="1"/>
    </linearGradient>
    <linearGradient id="gradient-234" bx:pinned="true">
      <stop offset="0" style="stop-color: rgb(255, 245, 254);"/>
      <stop offset="0" style="stop-color: rgb(0, 136, 255);"/>
      <stop offset="0.242" style="stop-color: rgb(28, 241, 124);"/>
      <stop offset="0.289" style="stop-color: rgb(255, 255, 255);"/>
      <stop offset="1" style="stop-color: rgb(0, 136, 255);"/>
    </linearGradient>
    <linearGradient id="linearGradient3964" bx:pinned="true">
      <stop id="stop3966" style="stop-color:#c0842d;stop-opacity:1" offset="0"/>
      <stop id="stop3972" style="stop-color:#f0de72;stop-opacity:1" offset="0.5269"/>
      <stop id="stop3968" style="stop-color:#eaef9e;stop-opacity:1" offset="1"/>
    </linearGradient>
    <linearGradient id="linearGradient3928" bx:pinned="true">
      <stop id="stop3930" style="stop-color:#fffaa3;stop-opacity:1" offset="0"/>
      <stop id="stop3936" style="stop-opacity: 1; stop-color: rgb(120, 105, 234);" offset="0.5"/>
      <stop id="stop3932" style="stop-color:#bb8930;stop-opacity:1" offset="1"/>
    </linearGradient>
    <bx:grid x="92.274" y="87.642" width="166.141" height="126.038"/>
    <path id="text-path-0" d="M 100.38671826695645 154.8521511401658 Q 153.42986825880143 111.41786914965459 206.47301825064642 153.87258003183285"/>
    <linearGradient id="color-0" bx:pinned="true">
      <stop style="stop-color: #40e0d0;" offset="0"/>
      <stop style="stop-color: #ff8c00;" offset="0.775"/>
      <stop style="stop-color: #ff0080;" offset="1"/>
    </linearGradient>
    <linearGradient id="color-1" bx:pinned="true">
      <stop style="stop-color: rgb(255, 255, 255);" offset="0"/>
      <stop style="stop-color: #79cbca;" offset="0.5"/>
      <stop style="stop-color: #e684ae;" offset="1"/>
    </linearGradient>
    <linearGradient id="color-2" bx:pinned="true">
      <stop offset="0" style="stop-color: rgb(255, 255, 255);"/>
      <stop style="stop-color: rgb(0, 118, 236);" offset="0.569"/>
      <stop style="stop-color: rgb(118, 255, 69);" offset="0.84"/>
    </linearGradient>
    <linearGradient id="color-0-0" gradientUnits="userSpaceOnUse" x1="295.697" y1="-5.847" x2="295.697" y2="584.153" gradientTransform="matrix(1, 0, 0, 1, 2.999577, 9.641026)" xlink:href="#color-0"/>
    <linearGradient id="gradient-15-1" gradientUnits="userSpaceOnUse" x1="310.847" y1="0" x2="310.847" y2="590" gradientTransform="matrix(1, 0, 0, 1, -12.150015, 3.794)" xlink:href="#gradient-15"/>
    <radialGradient gradientUnits="userSpaceOnUse" cx="127.028" cy="92.411" r="107.258" id="linearGradient3938-4" xlink:href="#linearGradient3938"/>
    <radialGradient gradientUnits="userSpaceOnUse" cx="127.028" cy="92.411" r="107.258" id="color-0-2" xlink:href="#color-0"/>
    <radialGradient gradientUnits="userSpaceOnUse" cx="349.119" cy="362.34" r="96.651" id="linearGradient3938-0" xlink:href="#linearGradient3938"/>
    <linearGradient id="gradient-15-3" gradientUnits="userSpaceOnUse" x1="63.6" y1="7" x2="63.6" y2="118.8" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-4" gradientUnits="userSpaceOnUse" x1="67.51" y1="29.67" x2="67.51" y2="118.8" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-5" gradientUnits="userSpaceOnUse" x1="27.25" y1="45.33" x2="27.25" y2="80.33" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-6" gradientUnits="userSpaceOnUse" x1="100.75" y1="45.33" x2="100.75" y2="80.33" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-7" gradientUnits="userSpaceOnUse" x1="64.002" y1="64.758" x2="64.002" y2="85.76" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-8" gradientUnits="userSpaceOnUse" x1="45.008" y1="31.22" x2="45.008" y2="45.733" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-9" gradientUnits="userSpaceOnUse" x1="82.498" y1="31.22" x2="82.498" y2="45.733" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-10" gradientUnits="userSpaceOnUse" x1="100.415" y1="83.122" x2="100.415" y2="123.949" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-11" gradientUnits="userSpaceOnUse" x1="104.179" y1="95.08" x2="104.179" y2="123.957" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-12" gradientUnits="userSpaceOnUse" x1="99.739" y1="84.02" x2="99.739" y2="100.101" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-13" gradientUnits="userSpaceOnUse" x1="89.214" y1="86.522" x2="89.214" y2="99.178" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-14" gradientUnits="userSpaceOnUse" x1="22.496" y1="59.134" x2="22.496" y2="99.98" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-15" gradientUnits="userSpaceOnUse" x1="34.897" y1="59.134" x2="34.897" y2="99.91" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-16" gradientUnits="userSpaceOnUse" x1="14.099" y1="66.888" x2="14.099" y2="75.436" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-17" gradientUnits="userSpaceOnUse" x1="8.22" y1="72.209" x2="8.22" y2="87.271" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-15-18" gradientUnits="userSpaceOnUse" x1="12.639" y1="8.381" x2="12.639" y2="21.5" xlink:href="#gradient-15"/>
    <linearGradient id="gradient-234-0" gradientUnits="userSpaceOnUse" x1="12.3" y1="3.752" x2="12.3" y2="16.871" xlink:href="#gradient-234"/>
  
  </defs>

  <path id="path-1" d="M 319.633 333.287 L 328.789 226.373 L 331.915 333.287 L 325.774 376.477 L 319.633 333.287" style="fill: url(#rg1-1); stroke: url(#gradient-2);" transform="matrix(0, 1, -1, 0, 627.198997, -24.349007)"/>
  <path id="mhand" d="M 292 300 L 299.141 21.134 L 308 300 L 300 350 L 292 300"/>
  <circle cx="298.697" cy="298.794" r="295" style="stroke-width: 15px; fill: url(#color-0-0); stroke: url(#gradient-15-1);"/>
  <g id="ts" class="tics">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(0.8660254037844387, 0.49999999999999994, -0.49999999999999994, 0.8660254037844387, 190.19237886466837, -109.8076211353316)">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(0.5000000000000001, 0.8660254037844386, -0.8660254037844386, 0.5000000000000001, 409.8076211353316, -109.8076211353316)">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(6.123233995736766e-17, 1, -1, 6.123233995736766e-17, 600, 0)">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(-0.4999999999999998, 0.8660254037844387, -0.8660254037844387, -0.4999999999999998, 709.8076211353316, 190.19237886466834)">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(-0.8660254037844387, 0.49999999999999994, -0.49999999999999994, -0.8660254037844387, 709.8076211353316, 409.8076211353316)">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(-1, 1.2246467991473532e-16, -1.2246467991473532e-16, -1, 600, 600)">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(-0.8660254037844386, -0.5000000000000001, 0.5000000000000001, -0.8660254037844386, 409.8076211353316, 709.8076211353316)">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(-0.5000000000000004, -0.8660254037844385, 0.8660254037844385, -0.5000000000000004, 190.1923788646686, 709.8076211353317)">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(-1.8369701987210297e-16, -1, 1, -1.8369701987210297e-16, 5.684341886080802e-14, 600)">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(0.5000000000000001, -0.8660254037844386, 0.8660254037844386, 0.5000000000000001, -109.8076211353316, 409.8076211353316)">
    <circle class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g class="tics" transform="matrix(0.8660254037844384, -0.5000000000000004, 0.5000000000000004, 0.8660254037844384, -109.8076211353316, 190.19237886466865)">
    <circle   class="dots" cx="300" cy="20" r="6"/>
    <path d="M300,14l0,12" transform="rotate(6,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(12,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(18,300,300)"/>
    <path d="M300,14l0,12" transform="rotate(24,300,300)"/>
  </g>
  <g transform="matrix(1, 0, 0, 1, 7.731958, 16.323034)">
    <g transform="matrix(1, 0, 0, 1, 0, 136.020615)">
      <path  id="path-3" d="M 326.505 333.769 L 333.739 223.796 L 336.21 333.769 L 331.357 378.195 L 326.505 333.769" style="fill: url(#rg1-3); stroke: url(#gradient-4);" transform="matrix(0, 1, -1, 0, 632.353004, -30.361992)"/>
    </g>
  </g>
  <g style="" transform="matrix(0.570447, 0, 0, 0.324065, 129.261917, 312.639984)">
    <g transform="matrix(1, 0, 0, 1, -1.718234, 136.597931)">
      <path id="hhand" d="M 291 291.188 L 303.437 111.58 L 309 291.188 L 300 340 L 291 291.188" style=""/>
      <path id="shand" d="M 292 280.932 L 303.718 92.634 L 307.718 280.932 L 299.859 357 L 292 280.932" style="fill: url(#rg1-0); stroke: url(#gradient-1);"/>
    </g>
    <circle cx="298.282" cy="436.598" r="4" style="fill:url(#rg1);"/>
  </g>
  <g transform="matrix(0.542341, 0, 0, 0.542341, 267.0672, 302.203613)" style="">
    <radialGradient id="face_1_" cx="63.6" cy="-2088.8999" r="56.9597" gradientTransform="matrix(1 0 0 -1 0 -2026)" gradientUnits="userSpaceOnUse">
      <stop offset="0.5" style="stop-color:#FDE030"/>
      <stop offset="0.9188" style="stop-color:#F7C02B"/>
      <stop offset="1" style="stop-color:#F4A223"/>
    </radialGradient>
    <path id="face_15_" style="fill: url(#face_1_); stroke: url(#gradient-15-3);" d="M63.6,118.8c-27.9,0-58-17.5-58-55.9S35.7,7,63.6,7c15.5,0,29.8,5.1,40.4,14.4 c11.5,10.2,17.6,24.6,17.6,41.5s-6.1,31.2-17.6,41.4C93.4,113.6,79,118.8,63.6,118.8z"/>
    <path style="fill: rgb(235, 143, 0); stroke: url(#gradient-15-4);" d="M111.49,29.67c5.33,8.6,8.11,18.84,8.11,30.23c0,16.9-6.1,31.2-17.6,41.4 c-10.6,9.3-25,14.5-40.4,14.5c-18.06,0-37.04-7.35-48.18-22.94c10.76,17.66,30.99,25.94,50.18,25.94c15.4,0,29.8-5.2,40.4-14.5 c11.5-10.2,17.6-24.5,17.6-41.4C121.6,50.16,118.13,38.84,111.49,29.67z"/>
    <g id="three-heart-face_2_">
      <g id="blush_3_">
        <radialGradient id="gradient-5" cx="25.7006" cy="61.378" r="19.4444" gradientTransform="matrix(0.9791 0 0 0.9301 2.0871 5.7411)" gradientUnits="userSpaceOnUse">
          <stop offset="0" style="stop-color:#ED7770"/>
          <stop offset="0.9" style="stop-color:#ED7770;stop-opacity:0"/>
        </radialGradient>
        <circle style="opacity: 0.8; fill: url(#gradient-5); stroke: url(#gradient-15-5);" cx="27.25" cy="62.83" r="17.5"/>
        <radialGradient id="gradient-6" cx="100.7714" cy="61.378" r="19.4444" gradientTransform="matrix(0.9791 0 0 0.9301 2.0871 5.7411)" gradientUnits="userSpaceOnUse">
          <stop offset="0" style="stop-color:#ED7770"/>
          <stop offset="0.9" style="stop-color:#ED7770;stop-opacity:0"/>
        </radialGradient>
        <circle style="opacity: 0.8; fill: url(#gradient-6); stroke: url(#gradient-15-6);" cx="100.75" cy="62.83" r="17.5"/>
      </g>
      <path id="mouth_91_" style="fill: rgb(66, 43, 13); stroke: url(#gradient-15-7);" d="M100.69,65.04C90.42,71,77.74,74.53,64,74.53c-13.74,0-26.42-3.53-36.69-9.49 c-1.89-1.09-3.87,1.27-2.46,2.92c9.3,10.87,23.38,17.8,39.15,17.8c15.77,0,29.85-6.93,39.15-17.8 C104.57,66.3,102.58,63.94,100.69,65.04z"/>
      <g id="eyes_71_">
        <path style="fill: rgb(66, 43, 13); stroke: url(#gradient-15-8);" d="M49.56,44.12c0,0-0.05-0.07-0.16-0.2c-0.1-0.13-0.24-0.31-0.42-0.54 c-0.15-0.16-0.33-0.35-0.54-0.57c-0.21-0.24-0.47-0.49-0.73-0.75c-0.27-0.25-0.55-0.51-0.84-0.72c-0.28-0.23-0.59-0.4-0.84-0.54 c-0.26-0.16-0.5-0.2-0.65-0.25c-0.08-0.03-0.15-0.03-0.21-0.04c-0.03,0.01-0.06-0.01-0.09,0l-0.04,0.01l-0.02,0l-0.01,0l0,0l0,0 l0,0c0.12,0-0.27,0.01,0.27-0.01l-0.55,0.02c-0.14,0-0.05,0.01-0.04,0.01c0.03,0,0.05,0,0.07-0.01c0.08-0.03,0,0-0.02,0 c-0.03,0-0.07,0.01-0.11,0.03c-0.16,0.05-0.4,0.09-0.65,0.25c-0.25,0.14-0.56,0.31-0.84,0.54c-0.28,0.22-0.57,0.47-0.84,0.72 c-0.52,0.51-0.98,1.02-1.3,1.39c-0.33,0.38-0.51,0.6-0.51,0.6l-0.23,0.27c-1.37,1.6-3.89,1.87-5.62,0.61 c-1.18-0.86-1.69-2.2-1.47-3.48c0,0,0.07-0.41,0.27-1.12c0.21-0.71,0.56-1.72,1.25-2.91c0.69-1.18,1.69-2.57,3.38-3.84 c0.83-0.62,1.84-1.24,3.04-1.66c0.29-0.11,0.6-0.21,0.92-0.29c0.33-0.08,0.59-0.17,1.04-0.23l0.62-0.09 c0.19-0.02,0.47-0.05,0.51-0.05l0.55-0.04l0.31-0.01l0.03,0l0.06,0l0.13,0.01l0.26,0.01l0.51,0.03c0.34,0.03,0.67,0.09,1,0.14 c0.65,0.12,1.3,0.29,1.89,0.51c1.2,0.42,2.21,1.03,3.04,1.66c1.69,1.27,2.69,2.66,3.38,3.84c0.35,0.59,0.61,1.15,0.8,1.64 c0.21,0.47,0.36,0.97,0.48,1.34c0.11,0.36,0.11,0.55,0.16,0.72c0.03,0.16,0.04,0.25,0.04,0.25c0.37,2.02-1.12,3.93-3.31,4.26 C51.94,45.88,50.43,45.24,49.56,44.12z"/>
        <path style="fill: rgb(66, 43, 13); stroke: url(#gradient-15-9);" d="M87.06,44.12c0,0-0.05-0.07-0.16-0.2c-0.1-0.13-0.24-0.31-0.42-0.54 c-0.15-0.16-0.33-0.35-0.54-0.57c-0.21-0.24-0.47-0.49-0.73-0.75c-0.27-0.25-0.55-0.51-0.84-0.72c-0.28-0.23-0.59-0.4-0.84-0.54 c-0.26-0.16-0.5-0.2-0.65-0.25c-0.08-0.03-0.15-0.03-0.21-0.04c-0.03,0.01-0.06-0.01-0.09,0l-0.04,0.01l-0.02,0l-0.01,0l-0.01,0 l0,0l0,0c0.12,0-0.27,0.01,0.27-0.01l-0.55,0.02c-0.14,0-0.05,0.01-0.04,0.01c0.03,0,0.05,0,0.07-0.01c0.08-0.03,0,0-0.02,0 c-0.03,0-0.07,0.01-0.11,0.03c-0.16,0.05-0.4,0.09-0.65,0.25c-0.25,0.14-0.56,0.31-0.84,0.54c-0.28,0.22-0.57,0.47-0.84,0.72 c-0.52,0.51-0.98,1.02-1.3,1.39c-0.33,0.38-0.51,0.6-0.51,0.6l-0.23,0.27c-1.37,1.6-3.89,1.87-5.62,0.61 c-1.18-0.86-1.69-2.2-1.47-3.48c0,0,0.07-0.41,0.27-1.12c0.21-0.71,0.56-1.72,1.25-2.91c0.69-1.18,1.69-2.57,3.38-3.84 c0.83-0.62,1.84-1.24,3.04-1.66c0.29-0.11,0.6-0.21,0.92-0.29c0.33-0.08,0.59-0.17,1.04-0.23l0.62-0.09 c0.19-0.02,0.47-0.05,0.51-0.05l0.55-0.04l0.31-0.01l0.03,0l0.06,0l0.13,0.01l0.26,0.01l0.51,0.03c0.34,0.03,0.67,0.09,1,0.14 c0.65,0.12,1.3,0.29,1.89,0.51c1.2,0.42,2.21,1.03,3.04,1.66c1.69,1.27,2.69,2.66,3.38,3.84c0.35,0.59,0.61,1.15,0.8,1.64 c0.21,0.47,0.36,0.97,0.48,1.34c0.11,0.36,0.11,0.55,0.16,0.72c0.03,0.16,0.04,0.25,0.04,0.25c0.37,2.02-1.12,3.93-3.31,4.26 C89.43,45.88,87.92,45.24,87.06,44.12z"/>
      </g>
    </g>
    <g>
      <g bind:this="{seconds}" transform="rotate(-{(rotation * 30) % 360})">
        <path style="fill: rgb(244, 67, 54); stroke: url(#gradient-15-10);" d="M116.31,96.26c-6.38-4.14-13.3-0.02-13.3-0.02s1.43-6.67-3.91-10.58 c-6.41-4.7-15.2-3.13-18.81,6.88c-4.13,11.45,6.46,31.39,6.46,31.39s20.6,0.81,30.2-8.09C124.76,108.61,121.13,99.39,116.31,96.26 z"/>
        <g>
          <path style="fill: rgb(198, 40, 40); stroke: url(#gradient-15-11);" d="M116.31,96.26c0,0-1.58-1-2.52-1.18c0,0,3.14,3.61,3.62,8.55c0.31,3.26-0.54,7.09-4.21,10.85 c-7.96,8.15-25.07,9.4-26.34,9.46c1.51,0.05,20.87,0.46,30.1-8.09C124.76,108.61,121.13,99.39,116.31,96.26z"/>
        </g>
        <path style="fill: rgb(198, 40, 40); stroke: url(#gradient-15-12);" d="M102.67,97.3c0.28-1.04,0.4-2.12,0.44-2.76c0.19-3.22-0.6-5.24-2.36-7.32 c-1.77-2.08-4.41-3.2-4.41-3.2s2.33,1.58,3.03,5.68c0.37,2.15,0.22,4.37-0.29,6.5c-0.18,0.77-0.41,1.55-0.28,2.33 s0.72,1.55,1.51,1.57C101.58,100.14,102.28,98.76,102.67,97.3z"/>
        <g>
          <path style="fill: rgb(255, 132, 122); stroke: url(#gradient-15-13);" d="M87.39,88.07c2.2-1.48,5.4-2.56,7.37-0.04c1.04,1.34,0.24,3.97-1.75,4.66 c-3.37,1.15-3.91,2.44-4.56,3.44c-0.78,1.21-1.52,2.71-2.93,3c-1.41,0.29-2.24-0.74-2.3-2.8C83.21,95.91,82.89,91.1,87.39,88.07z "/>
        </g>
      </g>
    </g>
    <g>
      <g bind:this="{seconds}" transform="rotate({(rotation * 30) % 360})">
        <path style="fill: rgb(244, 67, 54); stroke: url(#gradient-15-14);" d="M27.99,59.77c-7.12,2.67-7.92,10.68-7.92,10.68s-4.52-5.11-10.83-3.14 C1.65,69.68-2.31,77.68,3.6,86.53c6.76,10.12,29.09,13.45,29.09,13.45s12.89-16.09,11.44-29.1C42.95,60.3,33.38,57.75,27.99,59.77 z"/>
        <g>
          <path style="fill: rgb(198, 40, 40); stroke: url(#gradient-15-15);" d="M27.99,59.77c0,0-1.74,0.68-2.44,1.33c0,0,4.77-0.38,9.03,2.17c2.8,1.68,5.38,4.64,6.22,9.83 c1.82,11.25-7.34,25.75-8.04,26.81c0.93-1.19,12.77-16.52,11.37-29.02C42.95,60.3,33.38,57.75,27.99,59.77z"/>
        </g>
        <path style="fill: rgb(198, 40, 40); stroke: url(#gradient-15-16);" d="M20.73,71.36c-0.67-0.84-1.47-1.58-1.97-1.99c-2.48-2.07-4.57-2.63-7.29-2.45 c-2.73,0.18-5.19,1.65-5.19,1.65s2.66-0.94,6.37,0.93c1.95,0.98,3.65,2.42,5.06,4.09c0.51,0.6,1.01,1.25,1.71,1.61 s1.68,0.34,2.16-0.28C22.36,73.92,21.67,72.53,20.73,71.36z"/>
        <g >
          <path style="fill: rgb(255, 132, 122); stroke: url(#gradient-15-17);" d="M4.22,78.16c0.12-2.65,1.15-5.87,4.35-5.95c1.7-0.04,3.34,2.17,2.7,4.18 c-1.07,3.4-0.36,4.59,0.06,5.71c0.51,1.35,1.28,2.83,0.68,4.14c-0.6,1.31-1.93,1.37-3.62,0.19C8.04,86.18,3.99,83.58,4.22,78.16z "/>
        </g>
      </g>
    </g>
  </g>
  <text fill="#00ffff"  stroke="purple" on:mouseenter={()=>hover("טיימר")} on:mouseleave={()=>hover("0")} text-anchor="middle" style="font-family: Abel; font-size: 151.8557px; stroke: url(#linearGradient3938-0); white-space: pre;" transform="matrix(0.402832, 0, 0, 0.402832, 160.187408, 123.860977)"><tspan x="348.475" y="383.502">{formatTime(zman)}</tspan><tspan x="348.475" dy="1em">​</tspan><tspan x="348.475" dy="1em">​</tspan></text>
  <g transform="matrix(0.868491, 0, 0, 0.709487, 222.545898, 86.737846)" style="">
    <g transform="matrix(0.7, 0, 0, 0.7, 0, -44)">
      <path style="stroke-width: 3.50234px; fill: url(#linearGradient3938-4); stroke: url(#color-0-2);" d="M 229.346 122.539 C 232.896 117.184 234.287 110.89 234.287 104.595 C 234.287 93.632 228.098 87.224 221.694 83.859 C 223.325 82.12 224.62 80.266 225.58 78.572 C 232.056 67.265 231.912 52.754 225.22 41.562 C 223.133 38.083 220.087 35.795 217.424 32.796 C 219.943 31.629 222.054 29.981 223.061 27.395 C 223.997 24.9 223.709 22.016 222.293 19.75 C 222.126 19.476 221.862 19.155 221.526 19.155 C 221.238 19.155 220.998 19.338 220.782 19.521 C 219.391 20.78 218.072 22.131 216.537 23.206 C 213.442 25.358 209.484 26.273 205.67 26.044 C 200.441 25.724 195.74 21.261 195.74 21.261 C 195.74 21.261 203.08 10.069 203.703 1.852 C 204.399 -7.326 200.849 -12.43 197.731 -15.085 C 193.557 -18.678 187.992 -19.8 184.418 -19.022 C 179.26 -17.923 177.581 -15.268 177.581 -15.268 C 173.6 -22.409 168.154 -27.765 161.726 -30.695 C 157.384 -32.663 151.867 -32.983 147.238 -32.228 C 142.416 -37.836 135.148 -41.429 127.016 -41.429 C 118.885 -41.429 111.617 -37.836 106.819 -32.251 C 102.19 -33.006 96.673 -32.709 92.331 -30.717 C 85.902 -27.788 80.433 -22.409 76.475 -15.291 C 76.475 -15.291 74.82 -17.946 69.639 -19.045 C 66.065 -19.8 60.5 -18.678 56.326 -15.108 C 53.232 -12.453 49.682 -7.349 50.353 1.829 C 50.977 10.069 58.317 21.238 58.317 21.238 C 58.317 21.238 53.616 25.724 48.387 26.021 C 44.549 26.25 40.615 25.335 37.52 23.183 C 35.961 22.108 34.666 20.734 33.275 19.498 C 33.059 19.315 32.819 19.109 32.531 19.132 C 32.195 19.155 31.931 19.453 31.763 19.727 C 30.324 21.993 30.036 24.877 30.996 27.372 C 31.979 29.981 34.114 31.629 36.633 32.773 C 33.946 35.772 30.924 38.06 28.837 41.539 C 22.145 52.732 22.001 67.242 28.477 78.549 C 29.437 80.243 30.732 82.097 32.363 83.836 C 25.959 87.201 19.77 93.609 19.77 104.572 C 19.77 110.867 21.161 117.184 24.711 122.517 C 29.101 129.108 36.849 133.892 38.552 137.943 C 39.583 140.369 39.487 143.482 37.4 145.198 C 35.242 146.938 32.051 146.617 29.269 146.045 C 28.405 145.862 27.374 145.725 26.726 146.32 C 26.246 146.778 26.222 147.51 26.294 148.151 C 26.582 150.875 28.165 153.461 30.54 155.017 C 32.915 156.574 36.009 157.077 38.768 156.345 C 37.976 158.794 35.026 164.539 37.017 172.87 C 39.343 182.666 45.124 192.576 55.127 195.689 C 60.38 197.314 66.089 196.833 67.648 196.33 C 69.159 204.821 75.204 212.466 83.24 216.54 C 91.755 220.866 100.751 219.95 107.995 217.455 C 115.263 214.526 122.651 226.565 127.064 226.244 C 130.734 225.97 139.418 215.029 146.134 217.455 C 153.378 219.95 162.374 220.866 170.889 216.54 C 178.901 212.466 184.969 204.821 186.481 196.33 C 188.04 196.833 193.749 197.314 199.002 195.689 C 209.005 192.576 214.785 182.666 217.112 172.87 C 219.103 164.539 216.153 158.794 215.361 156.345 C 218.144 157.077 221.238 156.574 223.589 155.017 C 225.963 153.461 227.547 150.875 227.834 148.151 C 227.906 147.51 227.858 146.778 227.403 146.32 C 226.779 145.725 225.748 145.862 224.86 146.045 C 222.102 146.595 218.887 146.938 216.728 145.198 C 214.642 143.505 214.546 140.392 215.577 137.943 C 217.232 133.915 224.98 129.131 229.346 122.539 Z M 109.794 -26.048 C 109.866 -25.98 109.938 -25.934 110.01 -25.865 C 112.264 -24.217 115.239 -17.191 116.27 -11.537 L 127.016 -11.675 L 137.739 -11.537 C 138.77 -17.191 141.745 -24.24 143.999 -25.865 C 144.071 -25.911 144.143 -25.98 144.215 -26.048 C 145.391 -23.691 146.062 -21.059 146.062 -18.267 C 146.062 -8.242 137.499 -0.071 126.992 -0.071 C 116.486 -0.071 107.923 -8.242 107.923 -18.267 C 107.947 -21.036 108.618 -23.668 109.794 -26.048 Z M 127.016 -36.462 C 133.781 -36.462 139.706 -33.075 143.088 -28.017 C 142.584 -28.108 142.08 -28.177 141.577 -28.154 C 139.25 -28.131 136.947 -27.399 135.028 -26.117 C 134.692 -25.888 134.357 -25.636 133.949 -25.614 C 132.773 -25.522 130.974 -30.603 130.495 -31.564 C 129.847 -32.892 129.175 -34.219 128.528 -35.547 C 128.24 -36.165 127.616 -36.462 127.016 -36.462 C 126.417 -36.462 125.793 -36.165 125.505 -35.547 C 124.858 -34.219 124.186 -32.892 123.538 -31.564 C 123.059 -30.626 121.26 -25.545 120.084 -25.614 C 119.676 -25.636 119.341 -25.888 119.005 -26.117 C 117.11 -27.399 114.783 -28.108 112.456 -28.154 C 111.953 -28.154 111.425 -28.108 110.945 -28.017 C 114.327 -33.075 120.252 -36.462 127.016 -36.462 Z M 213.106 128.65 C 211.355 130.253 208.693 133.297 207.277 134.922 C 204.591 138.057 202.288 141.994 203.991 148.38 L 196.723 154.834 C 200.609 156.528 207.469 160.487 206.75 173.968 C 206.438 180.102 202.504 186.625 196.363 189.006 C 196.363 189.006 197.827 184.611 196.363 181.476 C 194.78 178.111 191.566 176.097 188.112 176.234 C 185.833 176.28 183.65 177.012 181.971 178.248 C 179.524 180.057 178.181 182.895 178.301 186.03 C 178.325 186.74 178.445 187.449 178.613 188.136 C 179.764 196.398 176.862 202.899 169.738 207.362 C 160.67 213.015 150.14 208.3 143.376 202.67 L 110.681 202.67 C 103.917 208.3 93.386 213.015 84.319 207.362 C 77.195 202.899 74.293 196.398 75.444 188.136 C 75.612 187.449 75.732 186.74 75.756 186.03 C 75.876 182.872 74.533 180.034 72.086 178.248 C 70.383 177.012 68.2 176.303 65.945 176.234 C 62.491 176.097 59.277 178.111 57.694 181.476 C 56.23 184.611 57.694 189.006 57.694 189.006 C 51.553 186.602 47.619 180.102 47.307 173.968 C 46.611 160.487 53.448 156.528 57.334 154.834 L 50.042 148.38 C 51.745 141.994 49.442 138.057 46.755 134.922 C 45.364 133.297 42.678 130.253 40.927 128.65 C 35.194 123.409 29.053 119.793 29.053 108.212 C 29.053 95.372 41.214 94.548 42.654 94.365 L 43.469 84.042 C 25.311 71.271 33.874 53.601 33.874 53.601 C 35.721 58.637 39.799 64.496 44.836 67.471 L 48.315 62.093 C 44.357 59.758 41.19 54.151 40.807 48.772 C 40.471 44.286 41.766 40.967 45.94 37.58 C 50.497 34.856 53.568 34.192 59.613 34.513 L 70.791 20.551 C 70.191 19.91 69.423 19.247 68.56 18.468 C 65.106 15.47 60.908 12.403 58.629 2.973 C 57.694 -0.918 57.742 -5.793 60.068 -9.272 C 61.148 -10.897 63.259 -12.567 65.297 -12.911 C 68.344 -13.437 71.174 -11.331 69.855 -8.287 C 69.015 -6.342 66.209 -5.564 64.17 -4.259 C 63.474 -3.801 62.779 -3.115 62.875 -2.314 C 62.923 -1.879 63.211 -1.513 63.546 -1.215 C 65.513 0.616 68.416 0.776 70.91 0.112 C 69.807 5.377 69.399 10.801 69.735 16.111 L 78.994 15.585 C 78.562 8.581 77.099 -12.911 93.434 -23.37 C 96.961 -25.636 100.487 -26.506 103.221 -26.506 C 101.83 -23.462 101.038 -20.12 101.038 -16.596 C 101.038 -2.909 112.72 8.238 127.064 8.238 C 141.409 8.238 153.09 -2.909 153.09 -16.596 C 153.09 -20.12 152.299 -23.462 150.908 -26.506 C 153.642 -26.529 157.144 -25.636 160.694 -23.37 C 177.03 -12.911 175.566 8.581 175.135 15.585 L 184.394 16.111 C 184.73 10.801 184.298 5.377 183.218 0.112 C 185.713 0.776 188.615 0.616 190.582 -1.215 C 190.918 -1.513 191.206 -1.879 191.254 -2.314 C 191.35 -3.115 190.654 -3.801 189.959 -4.259 C 187.92 -5.564 185.137 -6.502 184.298 -8.448 C 182.978 -11.492 185.761 -13.437 188.831 -12.934 C 190.87 -12.59 192.981 -10.92 194.061 -9.294 C 196.363 -5.816 196.435 -0.94 195.5 2.951 C 193.245 12.357 189.023 15.447 185.569 18.446 C 184.706 19.201 183.938 19.888 183.338 20.528 L 194.516 34.49 C 200.561 34.192 203.631 34.833 208.189 37.557 C 212.387 40.944 213.658 44.263 213.322 48.749 C 212.938 54.128 209.772 59.735 205.814 62.07 L 209.292 67.448 C 214.33 64.473 218.408 58.614 220.255 53.578 C 220.255 53.578 228.818 71.271 210.66 84.019 L 211.475 94.342 C 212.914 94.525 225.076 95.349 225.076 108.189 C 224.98 119.793 218.839 123.409 213.106 128.65 Z"/>
    </g>
  </g>

      <g>
              <g bind:this="{minutes}" transform="rotate({rotation})" transform-origin="center">
    <g transform="matrix(0.876067, -1.904102, 2.169019, 0.860512, 460, 470)"  >
      <path d="M 17.426 8.381 C 20.657 8.381 23.277 10.153 23.277 12.636 C 23.277 17.6 15.298 20.436 12.638 21.5 C 10.534 20.658 5.102 18.708 2.923 15.472 L 2.223 14.054 C 2.079 13.602 2 13.129 2 12.636 C 2 10.153 4.66 8.381 7.851 8.381 C 9.83 8.381 11.574 9.09 12.638 9.799 C 13.702 9.09 15.447 8.381 17.426 8.381 Z" style="fill: url(#gradient-15-18); stroke: url(#gradient-234-0);"/>
    </g>

   </g>
  </g>
   <foreignObject  x='300' y='105' width='100' height='100' transform='translate(-50 -50)'>   
    <span class="{`normSml${perhour}-${projectId}-${mId}`}"></span>
        <img on:click={()=>project()} on:mouseenter={()=>hover("לוגו הריקמה")} on:mouseleave={()=>hover("0")} style=" border-radius: 50%;" src={src} width="24" height="24"   alt="logo">
    </foreignObject> 
  
        <g style="overflow:hidden; text-anchor: middle;" on:click={()=>linke("p")} on:mouseenter={()=>hover("לחיצה כפולה לצפיה בעמוד הציבורי של הריקמה")} on:mouseleave={()=>hover("0")}  >
                  <text x="300" y='210' fill="#00ffff" style="filter: url(#glow);"  text-anchor="middle" font-size="42" >{projectName}</text>
                  <text x="300" y='210' fill="black"  text-anchor="middle" font-size="42" >{projectName}</text></g>

     <path transform="matrix(1.4, 0, 0, 1.4 , 20, 280)" fill="transparent" stroke="transparent" id="curveooo8" d=" M 0 0 A 200 200 0 0 0 400 0" />
            <text x="{tx}" fill="#00ffff" font-weight="bold" stroke="purple">
            <textPath font-size="60" fill="#00ffff" font-weight="bold" stroke="purple" xlink:href="#curveooo8">
                  <tspan fill="#00ffff" font-weight="bold" stroke="purple" dy="-5">{missionName}</tspan>
                </textPath>
        </text> 
<!--
       {#if dueDateOrCountToDedline !== null} <h5 style="margin: 7px; font-size: 13px; line-height: 1;">{dueDateOrCountToDedline}</h5>{/if}-->
    <!--<g transform="translate(50 50)">
        <circle id="dial" cx="0" cy="0" r="42" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="0.3 1.898"></circle>
        <use href="#dial" transform="scale(-1 1)"></use>

         include the number of milliseconds in the rotation of the minutes dial
        1 full rotation for every 60 seconds
        --><!--
        <g bind:this="{minutes}" transform="rotate({rotation})">
            <g transform="translate(0 -50)">
                    <path d="M 17.426 8.381 C 20.657 8.381 23.277 10.153 23.277 12.636 C 23.277 17.6 15.298 20.436 12.638 21.5 C 10.534 20.658 5.102 18.708 2.923 15.472 L 2.223 14.054 C 2.079 13.602 2 13.129 2 12.636 C 2 10.153 4.66 8.381 7.851 8.381 C 9.83 8.381 11.574 9.09 12.638 9.799 C 13.702 9.09 15.447 8.381 17.426 8.381 Z" style="fill: url(#gradient-15-18); stroke: url(#gradient-234-0);"/>

                <path d="M -2.25 0 h 4.5 l -2.25 2.5 l -2.25 -2.5" fill="currentColor"  stroke="currentColor" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"></path>
            </g>
        </g>

        <g transform="translate(0 20)">
             include the number of milliseconds in the rotation of the minutes dial
            1 full rotation for every single second
            --><!--
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

      
<foreignObject x='-12' y='42' width='125px' height='56px'>
    
       <h5 style="margin: 7px; font-size: 13px; line-height: 1;">{`${hoursdon ? hoursdon : 0} / ${hourstotal}`}</h5>

        <button1 title="סיימתי"  class="btn" name="done" on:click={done}><i class="far fa-check-circle"></i></button1>
        <button3 on:click={handleRunClick} class="btn" name="start timer" title= {running ? 'Stop' : 'Start'}><i class="fas fa-hourglass-start"></i></button3>
        <button2 class="btn" title="request more time" name="request more time"><i class="far fa-calendar-plus"></i></button2>
        
</foreignObject></g>
-->
    
</svg>
   
</div>
</SwiperSlide >

<SwiperSlide class="swiper-slideg"
    >
    <div id="normSmll" >
<div on:mouseenter={()=>hover("זמן שכבר בוצע")} on:mouseleave={()=>hover("0")} class="mn ab  ">{formatTime(zman)}</div>
  {#if missionDetails!== undefined &&  missionDetails!== null  &&  missionDetails!==  "undefined"}  <p on:mouseenter={()=>hover("פרטי המשימה")} on:mouseleave={()=>hover("0")} class="mn bc">{missionDetails}</p>{/if}

  <h5 dir="ltr" class="mn cd "><span on:mouseenter={()=>hover("מספר השעות שבוצעו ונשמרו")} on:mouseleave={()=>hover("0")} >{`${hoursdon ? Math.round((hoursdon + Number.EPSILON) * 100) / 100 : 0}`}</span> / <span on:mouseenter={()=>hover("מספר השעות שהוקצו למשימה")} on:mouseleave={()=>hover("0")}>{hourstotal}</span></h5>
  
  <div
  on:mouseenter={()=>hover(sta[$lang])} on:mouseleave={()=>hover("0")}
  class="de border rounded-2xl border-barbi hover:border-gold " on:click={function(){
    a = 2;
    isOpen = true}}
    on:keypress={function(){
    a = 2;
    isOpen = true}}
    ><div class=" rounded-2xl bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre" style="width: {status == null ? 0 : status[0]}%">{status != null ? status[0] : "0"}%</div></div>
    {#if link != null && link != undefined && link != "undefined"}
  <a on:mouseenter={()=>hover("לינק לביצוע המשימה")} on:mouseleave={()=>hover("0")} class="mn ef text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  hover:text-barbi p-0 rounded-full "  style="padding: 0px;" href={link}>{linkDescription}</a>
    {/if}
  <div class="{`normSmll${perhour}-${projectId}-${mId}`}"></div>
{#if low == false}
{#if lapse !== 0 || x !== 0}
<button on:mouseenter={()=>hover("לחיצה לאיפוס הטיימר מבלי לשמור")} on:mouseleave={()=>hover("0")}  class="  border border-barbi hover:border-gold bg-gradient-to-br from-graa to-grab text-barbi  p-0 rounded-full hover:from-lturk hover:to-barbi ga" on:click={handleClearClick}>ניקוי</button>
<button on:mouseenter={()=>hover("לחיצה לעצירת הטיימר ושמירת הזמן שבוצע")} on:mouseleave={()=>hover("0")} class="  bg-gradient-to-br text-gold hover:from-graa hover:to-grab hover:text-gold   p-0 rounded-full from-lturk to-barbi gb" on:click={save}> הוספה</button>
{/if}
    {#if already === false}
    <button on:mouseenter={()=>hover("לחיצה לסיום המשימה")} on:mouseleave={()=>hover("0")} on:click={done}   class="btn a" name="done"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" /></svg></button>
     {/if} 
     {#if show === true}  <button on:mouseenter={()=>hover(`${running ? "עצירת הטיימר" : "הפעלת טיימר"}`)} on:mouseleave={()=>hover("0")} on:click={running ? azor : start} class="btn b" name="start timer" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path  fill="currentColor" d="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z" /></svg></button>
   {/if}
    {:else if low == true}
          <Lowbtn/>
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
  {low}
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

