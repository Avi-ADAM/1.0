<script>
    import { clickOutside } from './outsidclick.js';
    import { scale, fly } from 'svelte/transition';
   import { createEventDispatcher } from 'svelte';
  import Nego from '../prPr/negoPend.svelte';
   import { onMount } from 'svelte'; 
 import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
import { idPr } from '../../stores/idPr.js';
 const dispatch = createEventDispatcher();
	export let shows = true;
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
    export let already;
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
	function toggleShow() {
		shows = !shows
	};
    function toggleShowf() {
        dispatch('show')
		shows = !shows
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
        console.log("nego")   
        no = false;
         masa = true;
            isOpen = true;
            console.log(no)
	}
    function decline() {
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
        } catch (e) {
            error1 = e
            console.log(error1)
        }
       

        } else{
          console.log("decline",why)
            alert("min 20 ")
        }
           

    }
     const close = () => {
    isOpen = false;
    no = false; 
    masa = false;
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


</script>



<div transition:fly={{y: 550, opacity: 0.2, duration: 2000}}
>
    <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form">
      <div dir="rtl" >
              <button on:click={close} class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded"
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

{#if shows}
<div
	on:mouseenter={toggleShowf}
	class="normSml"
    in:scale="{{ duration: 3200, opacity: 0.5, start: 1.56 }}"
>
 <a sveltekit:prefetch href={`${link}${projectId}`}>
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

{:else}
<div class="normSmlHover" 
on:mouseleave={toggleShow}
in:scale="{{ duration: 1000, opacity: 0.5, start: 0.64 }}"
use:clickOutside on:click_outside={toggleShow}
>
	
        <img on:click={project(projectId)} src={src} class="img" alt="projectlogo" title={projectName,"לחיצה למעבר ללוח הבקרה של פרויקט" }>
        <a sveltekit:prefetch href={`${link}${projectId}`}
        ><h3 class="pn">{projectName}</h3></a>
        <h1 class="pn">{name}</h1>
       <p class="p" ><span style="color:var(--gold)" title="שווי שעה">{perhour}</span> * <span style="color: aqua" title="כמות שעות">{noofhours}</span> = {noofhours * perhour} </p>
<p class="p"><span style="color:var(--gold)" title="בעד">{noofusersOk} </span><span style="color:aqua" title="לא הצביעו">{noofusersWaiting} </span><span style="color:var(--barbi-pink)" title="נגד">{noofusersNo} </span></p>
    <h5 class="pnn">{descrip}</h5>
    <h6 class="pnn">{hearotMeyuchadot}</h6>
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

       <button on:click={agree} style="margin: 0;" class = "btn" name="requestToJoin"><i class="far fa-check-circle"></i></button>
        <button on:click= {nego} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button>
        <button on:click={decline} style="margin: 0;" class = "btn"name="decline"><i class="far fa-times-circle"></i></button>
  
        {/if}
    
</div>

{/if}
</div>


<style>
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
	.normSml{
        
        text-align: center; 
        line-height: 0.8;
        align-items: center;
        justify-content: safe center;
        color: var(--barbi-pink);
        min-height: 75px;
        min-width: 75px;
        max-width: 75px;
        max-height: 75px;

         background-color: rgb(100, 224, 137);
         border-radius: 50%;
         text-shadow: 1px 1px  rgb(63, 56, 18);

         background: url(https://res.cloudinary.com/love1/image/upload/v1643838503/pink_qfdffz.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;

    }
	
    .normSmlHover{
         text-shadow: 1px 1px  rgb(63, 56, 18);
        color: var(--barbi-pink);
        height: 115px;
        width: 115px;
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
     :global([data-svelte-dialog-content].content) {
      width: 80vw;
  }
  @media (min-width: 568px){
        :global([data-svelte-dialog-content].content) {
width:50vw;
        }
  }
</style>