<script>
	import { fly, scale } from 'svelte/transition';
    import { clickOutside } from './outsidclick.js';
        import { formatTime } from './utils.js';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
    import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
import { idPr } from '../../stores/idPr.js';
import { onMount } from 'svelte';
export let stname;
let show = true;
	export let shows = true
    export let dueDateOrCountToDedline = "11:11"
    export let projectName = "ONE"
    export let missionName = "do x" 
    export let missionDetails = "do x in y"
    export let src = "coin.png"
    export let link = "https://www.free-mates.com"
    export let linkDescription = "to website"
    export let projectId;
    export let linkP = "/project/"
    export let hourstotal;
    export let hoursdon = 0;
    export let mId;
    export let missId; //add in gr
    export let noofpu; //addtopr
    export let perhour;
    let x = 0;
    let already = false;
    function project (id) {
    idPr.set(id);
    goto("/projectPrivat", );
  };

let miatan;
  onMount(async () => {
    if (stname === "0") {
          console.log("to to"); 
  } else if (stname === "stopi") {
    console.log("to to tooooo");
    x = oldzman
  } else {
    console.log(stname)
      const startTime = stname - lapse
      timer = setInterval(() => {
        lapse = Date.now() - startTime 
      }, 1)
        x = oldzman
    running = true
  }
})

let zmani;
	function toggleShow() {
		shows = !shows
	}
  let msdonf;
  $: msdonf = hoursdon * 3600000;
  export let oldzman;
  import { onDestroy } from 'svelte'
  let timer;
  let running = false;
  let error1;
  
  async function azor () {
      clearInterval(timer)
      running = false;
      zmani += lapse;
      x += lapse;
      lapse = 0;
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
 let idL;
 let token;
 let bearer1;
 let linkg = "https://strapi-k4vr.onrender.com/graphql"
async function save() {
    const saved = lapse * 2.7777777777778E-7 + x * 2.7777777777778E-7;
    console.log("Saved",formatTime(saved), saved, lapse , x)
    const noofnew = hoursdon + saved;
    hoursdon = noofnew;
    clearInterval(timer)
    const msdon = hoursdon * 3600000
    console.log(msdon)
    zman = msdon
    lapse = 0
    running = false
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
          

        } catch (e) {
            error1 = e
            console.log(error1);
        }
}
export let zman;
$:  zman = msdonf + lapse + x;
 import { tweened } from "svelte/motion";
    // lapse refers to the number of milliseconds in the stopwatch
    export let lapse = 0;

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

 //   // minutes and seconds are undefined by default
 //   $: if (!lapse && minutes && seconds) {
 //       minutes.style.transition = "transform 0.2s ease-in-out";
 //       seconds.style.transition = "transform 0.2s ease-in-out";
 //       transitioned = false;
 //   }
 //   $: if (lapse && !transitioned) {
 //       minutes.style.transition = "none";
 //       seconds.style.transition = "none";
 //       transitioned = true;
 //   }
//

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
async function afterwhy () {
    console.log("done+ file")
  if (!why && !what) {
    activE = errorM.ein
  } else if (running) {
    activE = errorM.timer
  } else {
if (noofpu === 1) {
  tofinished1 = `: true`;
  tofinished2 = `finnished: true`;
  tofinished = `createFinnishedMission(
   input: { 
     data: {
      missionName: ${missionName},
      why: ${why},
      noofhours: ${hoursdon},
      mesimabetahalich: ${mId},
      perhour: ${perhour},
      total: ${perhour*hoursdon},
      project: ${projectId},
      mission: ${missId}
   }
}){finnishedMission {id }}`
} else if (noofpu > 1) {
    toapprove1 = `forappruval: true`;
}
//files shit from updatepic
    //כמה בפרןויקט אם 1 אז אישור מיידי , ליצור בועת אישור אם חוק דורש 
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
    ${toapprove1}
${tofinished1}
  }
}
) {mesimabetahalich{id forappruval finnished howmanyhoursalready}}
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
}){finiapruval {id }}
${tofinished}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
              isOpen = false;
        } catch (e) {
            error1 = e
            console.log(error1);
            isOpen = true;
            activE = error1;
        }
  }
}
</script>
<!--<svelte:window on:beforeunload={beforeUnload}/>-->

<div in:scale={{duration: 3200, opacity: 1, start: 0.1}}
out:scale={{duration: 2200, opacity: 0.5}}
>

    <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form">
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

{#if shows}
<div
	on:mouseenter={toggleShow}
	
	class="normSml"
    in:scale="{{ duration: 3200, opacity: 0.5, start: 1.56 }}"

	>
   
<svg viewBox="0 0 100 100" class="svgg">
    <g transform="translate(50 50)">
        <circle id="dial" cx="0" cy="0" r="42" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="0.3 1.898"></circle>
        <use href="#dial" transform="scale(-1 1)"></use>

        <!-- include the number of milliseconds in the rotation of the minutes dial
        1 full rotation for every 60 seconds
        -->
        <g bind:this="{minutes}" transform="rotate({rotation})">
            <g transform="translate(0 -50)">
                <path d="M -2.25 0 h 4.5 l -2.25 2.5 l -2.25 -2.5" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"></path>
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
        {#if lapse !== 0}
        <text text-anchor="middle" fill="red" dominant-baseline="middle" font-size="10" style="font-weight: 300; letter-spacing: 1px;">
            {formatTime(zman)}
        </text>
        {/if}
                <a sveltekit:prefetch href={`${linkP}${projectId}`}><text y='-12' text-anchor="middle" font-size="8" >{projectName}</text></a>
         <text y='-6' text-anchor="middle"  style=" color: var(--barbi-pink); " font-size="8">{missionName}</text>

                                                     <foreignObject  x='-12' y='-42' width='125px' height='56px'>   
    
        <img style=" border-radius: 50%;" src={src} width="24" height="24"   alt="logo">
         

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

{:else}
<div class="normSmlHover"
on:mouseleave={toggleShow}
in:scale="{{ duration: 1000, opacity: 0.5, start: 0.64 }}"
use:clickOutside on:click_outside={toggleShow}>	
    <img on:click={project(projectId)} class="img" src={src} alt="logo" title={projectName,"לחיצה למעבר ללוח הבקרה של פרויקט" }>
    <a sveltekit:prefetch href={`${linkP}${projectId}`}><h3 class="pn">{projectName}</h3></a>
    <h1 class="mn">{missionName}</h1>
   {#if dueDateOrCountToDedline !== null} <h5  class="mn">{dueDateOrCountToDedline}</h5>{/if}
    <p class="mn">{missionDetails}</p>
    <a class="mn" href={link}>{linkDescription}</a>
      <span class="mn">{formatTime(zman)}</span>

            <h5 class="mn">{`${hoursdon ? Math.round((hoursdon + Number.EPSILON) * 100) / 100 : 0} / ${hourstotal}`}</h5>

{#if lapse !== 0 || x !== 0}
<button class="sm:text-sm text-xs bg-gold p-0.5  sm:p-1 rounded hover:bg-lturk" on:click={handleClearClick}>ניקוי</button>
<button class="sm:text-sm text-xs  bg-lturk p-0.5 sm:p-1 rounded hover:bg-gold" on:click={save}> הוספה</button>
{/if}
<br/>
    <br />
    {#if already === false}
    <button title=" סיימתי" on:click={done}   class="btn a" name="done"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" /></svg></button>
     {/if} 
     {#if show === true}  <button on:click={running ? azor : start} class="btn b" name="start timer" title= {running ? 'עצירה' : 'התחלה'}><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path  fill="currentColor" d="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z" /></svg></button>
   {/if}
        <!--if stop then opposide sand timer
     <button2 class="btn" title="request more time" name="request more time"><i class="far fa-calendar-plus"></i></button2>-->
    
</div>

{/if}

</div>

<style>
     .a{
        margin-right: 20px;
    }
    .b{
        margin-left: 20px;
    }
  .mn{
    margin: 1px;
     line-height: 1; 
     font-size: 8px ;
     font-weight: bold; 
    color: var(--barbi-pink);
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
    max-width: 137.5px;
    max-height: 137.5px;
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
	.normSml{
       
        
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

         border-radius: 50%;
         background: url(https://res.cloudinary.com/love1/image/upload/v1643838415/diamondlight1_db635m.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    }
	
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
    }
    .btn{ 
        
        background-color: rgb(87, 208, 248);
        border-radius: 50%;
        color: purple;
        text-align: center;
        opacity: 0.6;
  transition: 0.3s;
  padding: 2px;
 
    }
    

.btn:hover {
    opacity: 1;
    padding: 6px;
    }

 @media  (min-width: 550px) {
      .a{
        margin-right: 55px;
    }
    .b{
        margin-left: 55px;
    }
     .mn{
    margin: 7px;
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
</style>

