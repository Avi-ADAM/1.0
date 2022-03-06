<script>
    import { clickOutside } from './outsidclick.js';
    import { scale, fly } from 'svelte/transition';
   import { createEventDispatcher } from 'svelte';
  import Nego from '../prPr/negoPend.svelte';
   import { onMount } from 'svelte'; 
 import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
import { idPr } from '../../stores/idPr.js';
 const dispatch = createEventDispatcher();
    export let descrip = "";
    export let projectName = "";
    export let name = "";
    export let hearotMeyuchadot = "";
    export let noofhours = 0;
    export let src = "coin.png";
    export let perhour = 0;
    export let projectId;
    export let link = "https://strapi-k4vr.onrender.com/project/";
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
    export let pendId;
    export let users;
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
let nut;
    onMount(async () => {
 ok = percentage(noofusersOk, noofusers)
nook = percentage(noofusersNo, noofusers) + ok
nut = percentage(noofusersWaiting, noofusers) + ok
console.log(ok, nook , nut, name, projectName)
})

       function coinLapach() {
        dispatch('coinLapach', {
    data: pendId
    } );
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
            let linkg = 'https://strapi-k4vr.onrender.com/graphql';
    const userss = objToString(users)

async function agree() {
  already = true;
    const date = (mdate !== undefined) ? ` sqadualed: ${mdate}` : ``;
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
          if (noofusersOk + 1 === noofusers){
              const skillsa = skills.map(c => c.id);
             const tafkidimsa = tafkidims.map(c => c.id);
              const workwaysa = workways.map(c => c.id);
              const valluesa = vallues.map(c => c.id);

    try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { createOpenMission(
    input: {
      data: {project: "${projectId}",
             mission:  "${missionId}",
             work_ways: [${workwaysa}],
             hearotMeyuchadot: "${hearotMeyuchadot}",
             name: "${name}",
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
    }
  ) {openMission {project{id }}}
  updatePendm(
      input: {
      where: {id: ${pendId}}
      data: { users:[  ${userss}, 
         
     {
      what: true
      users_permissions_user: "${idL}"
    }
  ],
archived: true
}
      }
  ){pendm { users { users_permissions_user { id}}}}
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
      input: {
      where: {id: ${pendId}}
      data: { users:[  ${userss}, 
         
     {
      what: true
      users_permissions_user: "${idL}"
    }
  ]}
      }
  ){pendm { users { users_permissions_user { id}}}}
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
	};
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
async function nego() {
  already = true;
        console.log("nego")   
        no = false;
         masa = true;
            isOpen = true;
            console.log(no)
	}
    function decline() {
      already = true;
      no = true;
            isOpen = true;
        //create why alert (from smui) add validation for minimum 
        // send why with userss, create way to show why for all agreed users and for them to response.
	}
  let why;
let isOpen = false;
  async function afterwhy (){
        if (why.length > 20) {
          
            isOpen = false;
        console.log("decline",why)
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
      input: {
      where: {id: ${pendId}}
      data: { users:[  ${userss}, 
     {
      what: false
      why: "${why}"
      users_permissions_user: "${idL}"
    }
  ]}
      }
  ){pendm { users { users_permissions_user { id}}}}
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
            alert("min 20 ")
            already = false;
        }
              }
     const close = () => {
    isOpen = false;
    no = false; 
    masa = false;
    already = false;
  };

  function afternego (event) {
  isOpen = false;
    no = false; 
    masa = false;
    //dispach or update  coin to negotiable state 
  }

   function project (id) {
    idPr.set(id);
    goto("/moach", );
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
    swiperRef.slideTo(index , 400);
  };
 function toggleShow (){
  slideTo(1)
 }
</script>

 <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form" class="content">
      <div dir="rtl" class="grid items-center justify-center text-center">
              <button style="margin: 0 auto;" on:click={close} class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
title="ביטול"
><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
{#if no === true}
      <input minlength="26"  type="text" bind:value={why} placeholder="יש לנמק מדוע ההצעה נדחית על ידך">
            <button on:click={afterwhy}>אישור</button>
{:else if masa === true}
<Nego
        on:close={afternego}
  descrip ={descrip}
  projectName ={projectName}
  name1 ={name}
  hearotMeyuchadot = {hearotMeyuchadot}
  noofhours ={noofhours}
  perhour = {perhour}
  projectId = {projectId}
  total ={total}
  noofusers={noofusers}
  missionId={missionId}
  skills = {skills}
  tafkidims = {tafkidims}
  workways ={workways}
  publicklinks={publicklinks}
  privatlinks={privatlinks}
  mdate={mdate}
  pendId={pendId}
  users={users}
/>
 
{/if}
      
  </DialogContent>
  </div>
</DialogOverlay>

<div 
use:clickOutside on:click_outside={toggleShow} 
class="hover:scale-150 duration-1000 ease-in" transition:fly={{y:450, duration: 2200, opacity: 0.5}}>
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
    nextEl: `.normSml${pendId}`,
    prevEl: `.normSmll${pendId}`,
  }}
>
  <SwiperSlide
    ><div
	class="{`normSml${pendId}`}" id="normSml" 
>
 <a sveltekit:prefetch href={`/project/${projectId}`}>
        <img class="img"
         src={src}  alt="projectlogo" title={projectName}>
       <h3 class="na" >{projectName}</h3>
    </a>
        <h1 class="mn">{name}</h1>
       <p class="p"><span style="color:var(--gold)" title="שווי שעה">{perhour}</span> * <span style="color: aqua" title="כמות שעות">{noofhours}</span> = {noofhours * perhour} </p>
   <p class="p"><span style="color:var(--gold)" title="בעד">{noofusersOk} </span><span style="color:aqua" title="לא הצביעו">{noofusersWaiting} </span><span style="color:var(--barbi-pink)" title="נגד">{noofusersNo} </span></p>
    <!--  <svg height="10" width="120">
  <defs>
    <linearGradient id="solids" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
      <stop offset={`${ok}%`} style="stop-color:rgb(255,0,0);stop-opacity:1" />
      <stop offset={`${ok}%`} style="stop-color:rgb(0,255,0);stop-opacity:1" />
      <stop offset={`${nut}%`} style="stop-color:rgb(0,255,0);stop-opacity:1" />
      <stop offset={`${nut}%`} style="stop-color:rgb(0,0,255);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="120" height="10" fill="url(#solids)" />
</svg> 
       {#if already === false}
       <button on:click={agree} style="margin: 0;" class="btn" name="requestToJoin"><i class="far fa-check-circle"></i></button>
        <button on:click= {nego} style="margin: 0;" class="btn" name="negotiate"><i class="far fa-comments"></i></button>
        <button on:click={decline} style="margin: 0;" class="btn" name="decline"><i class="far fa-times-circle"></i></button>
 
        {/if}-->
</div>
</SwiperSlide
  ><SwiperSlide
    ><div class="{`normSmll${pendId}`} " id="normSmll"
>
	  <img on:click={project(projectId)} src={src} class="img ab" alt="projectlogo" title={projectName,"לחיצה למעבר ללוח הבקרה של ריקמה" }>
      
   {#if descrip}
 <h5 class="pnn bc">{descrip}</h5>
      {/if}
   {#if hearotMeyuchadot}
     <h6 class="pnn cd">{hearotMeyuchadot}</h6>
     {/if}
     <!--  <svg height="10" width="180">
  <defs>
    <linearGradient id="solids" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
      <stop offset={`${ok}%`} style="stop-color:rgb(255,0,0);stop-opacity:1" />
      <stop offset={`${ok}%`} style="stop-color:rgb(0,255,0);stop-opacity:1" />
      <stop offset={`${nut}%`} style="stop-color:rgb(0,255,0);stop-opacity:1" />
      <stop offset={`${nut}%`} style="stop-color:rgb(0,0,255);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="180" height="10" fill="url(#solids)" />
</svg> -->
     {#if already === false}

       <button on:click={agree} style="margin: 0;" class = "btn" name="requestToJoin" title="אישור"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
        <button on:click= {nego} style="margin: 0;" class = "btn" name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
        <button on:click={decline} style="margin: 0;" class = "btn"name="decline" title="התנגדות"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
  
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

    }
  .a{
        grid-column: 1/2;
    }
    .b{
        grid-column: 2/3;
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
         background: url(https://res.cloudinary.com/love1/image/upload/v1643838503/pink_qfdffz.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto auto auto auto;
    }
  .pnn{
  color:aqua;
   margin: 2px;
    font-size: 8px; 
    font-weight: bold; 
   line-height: 0.7; 
  }
  .pn{
     margin: 2px; 
     font-size: 8px; 
     line-height: 1; 
     font-weight: bold;
     color: aqua;
  }
  .p{
    margin: 2px;
    font-size: 9px;
  }
  .mn{
  margin: 2px;
   font-size: 9px;
    font-weight: bold;
     color: rgb(87, 208, 248 ); 
    line-height: 0.7; 
  }
  .na{
    color:aqua;
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
    max-width: 137.5px;
    max-height: 137.5px;
    aspect-ratio: 1 /1;
         background-color: rgb(100, 224, 137);
         border-radius: 50%;
         text-shadow: 1px 1px  rgb(63, 56, 18);

         background: url(https://res.cloudinary.com/love1/image/upload/v1643838503/pink_qfdffz.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;

    }
	
    #normSmlHover{
         text-shadow: 1px 1px  rgb(63, 56, 18);
        color: var(--barbi-pink);
         min-height: 115px;
    min-width: 115px;
    max-width: 325px;
    max-height: 325px;
    aspect-ratio: 1/ 1;
        border-radius: 50%;
        line-height: 0.8;
        text-align: center;
        background: url(https://res.cloudinary.com/love1/image/upload/v1643838503/pink_qfdffz.jpg);
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
        min-height: 125px;
        min-width: 125px;
        max-width: 125px;
        max-height: 125px;
  }
   #normSmlHover{

        height: 195px;
        width: 195px;
   }
    }
     :global([data-svelte-dialog-content].content) {
      width: 80vw;
  }
  @media (min-width: 568px){
        :global([data-svelte-dialog-content].content) {
width:50vw;
        }
         .btin{
    width:24px;
     height:24px;
  }
  }
</style>