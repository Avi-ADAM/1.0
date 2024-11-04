<script>
  import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
import Lowbtn from '$lib/celim/lowbtn.svelte'
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte'
  import {lang} from '$lib/stores/lang.js'
  import Chaticon from '$lib/celim/chaticon.svelte';
  /** @type {{low?: boolean, isVisible?: boolean, iskvua: any, projectName: any, src: any, openmissionName: any, missionDetails: any, useraplyname: any, noofusersNo: any, noofusersOk: any, noofusersWaiting: any, already?: boolean, src2: any, perhour?: number, noofhours?: number}} */
  let {
    low = false,
    isVisible = false,
    iskvua,
    projectName,
    src,
    openmissionName,
    missionDetails,
    useraplyname,
    noofusersNo,
    noofusersOk,
    noofusersWaiting,
    already = $bindable(false),
    src2,
    perhour = 0,
    noofhours = 0
  } = $props();
function hover(x){
dispatch("hover",{x:x});
}
function agree(alr){
  already = true;
dispatch("agree",{alr:alr})
}
function decline(alr) {
  already = true; 
dispatch("decline",{alr:alr});
}
function tochat() {
dispatch("chat");
}

const leho = {"he":" בכל חודש " , "en": " per month"}

const hed = {"he":"אישור צירוף לריקמה והשמת משימה","en":"appruval of joining and mission assigned"}
</script>


<div dir="{$lang == 'he' ? 'rtl' : 'ltr'}"  class="{isVisible ? $lang == 'he' ? 'boxleft' : 'boxright' : ''} leading-normal w-[90%] h-[90%] bg-white lg:w-[90%] d">
 <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
  </div>-->
   <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
      <div class="relative flex items-center space-x-1">
         <div class="relative">
         <img src={src2}  alt="" class="w-10 sm:w-16 h-10 sm:h-16  rounded-full">
         </div>
         <div class="flex flex-col leading-tight">
            <div class="sm:text-sm text-md mt-1 flex items-center">
               <span class="text-barbi text-center mr-3 sm:text-2xl text-sm">{hed[$lang]}</span>
            </div>
            <span style="text-shadow: 1px 1px white;" class="pn ml-1 text-sm sm:text-lg text-barbi ">{projectName}</span>
         </div>
         </div>
         </div>
  <div  class=" bg-white rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
    <div  class="mb-8">
       <p style="line-height: 1;" class="text-sm sm:text-xl text-gray-600 flex items-center">
            <img style="width:2.5rem;" class=""  src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
            <span 
              onmouseenter={()=>hover("שווי לשעה")} 
              onmouseleave={()=>hover("0")} 
              > {perhour} לשעה </span> * <span 
              onmouseenter={()=>hover("כמות השעות")} 
              onmouseleave={()=>hover("0")}  > {noofhours.toLocaleString('en-US', {maximumFractionDigits:2})} שעות {#if iskvua == true}{leho[$lang]}{/if}</span> = <span 
              onmouseenter={()=>hover("סך הכל")} 
              onmouseleave={()=>hover("0")}> {(noofhours * perhour).toLocaleString('en-US', {maximumFractionDigits:2})} </span>
              {#if iskvua == true} {leho[$lang]}{/if}
      </p>
      <div class="text-gray-900 font-bold md:text-3xl mb-2">{openmissionName}</div>
     {#if missionDetails} <p class="text-gray-700 text-base">{missionDetails}</p>{/if}
    </div>
    <div class="flex items-center">
      <img style="width: 2.5rem;" class="w-10 h-10 rounded-full mr-4" src="{src.length > 0 ? src : "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"}" alt="">
      <div class="text-sm">
        <p class="text-gray-900 leading-none">{useraplyname}</p>
        <p class="vo ef"><span onmouseenter={()=>hover("סך ההצבעות בעד")} onmouseleave={()=>hover("0")}  style="color:#7EE081;" >{noofusersOk}-בעד</span> <span onmouseenter={()=>hover("לא הצביעו")} onmouseleave={()=>hover("0")}  style="color:#0000cc;" >{noofusersWaiting}-טרם </span><span onmouseenter={()=>hover("כמות ההצבעות נגד")} onmouseleave={()=>hover("0")}  style="color:#80037e;" >{noofusersNo}-נגד</span></p>
      </div>
    </div>
  </div>
  {#if low == false}
   {#if already === false}
            <button onmouseenter={()=>hover("אישור")}
               onmouseleave={()=>hover("0")} 
               onclick={agree} 
                class = "btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
                 name="requestToJoin">
                <Lev/>
                </button>
          <!-- <button3 on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button3>--> 
            <button
             onmouseenter={()=>hover("התנגדות")} 
             onmouseleave={()=>hover("0")} 
             onclick={decline} 
              class = "btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110" 
              name="decline">
              <No/>
            </button>
        {/if}
            <button
      onmouseenter={()=>hover("לצפיה בדיון")} 
      onmouseleave={()=>hover("0")}  
     class = "btnc bg-gradient-to-br hover:from-gold hover:via-mpink  hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110" 
      onclick={() => tochat()}
      ><Chaticon/>
        </button>
         {:else if low == true}
          <Lowbtn isCart="true"/>
        {/if}
</div>

<style>
 
</style>