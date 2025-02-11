<script>
  import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 import {lang} from '$lib/stores/lang.js'
  import Lev from '../../../celim/lev.svelte';
import Lowbtn from '$lib/celim/lowbtn.svelte'
  import No from '../../../celim/no.svelte'
  /** @type {{low?: boolean, isVisible?: boolean, projectName: any, src: any, openmissionName: any, missionDetails: any, useraplyname: any, noofusersNo: any, noofusersOk: any, noofusersWaiting: any, deadline: any, easy: any, myp: any, price: any, already?: boolean, src2: any, perhour?: number, noofhours?: number}} */
  let {
    low = false,
    isVisible = false,
    projectName,
    src,
    openmissionName,
    missionDetails,
    useraplyname,
    noofusersNo,
    noofusersOk,
    noofusersWaiting,
    deadline,
    easy,
    myp,
    price,
    already = $bindable(false),
    src2,
    perhour = 0,
    noofhours = 0
  } = $props();
  import { isMobileOrTablet } from '$lib/utilities/device';

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
let isScrolable = true; 
function preventSwiperScroll(event) {
    if (!isScrolable && isMobileOrTablet()) {
      event.stopPropagation();
    }
  }

  // מניעת פרופוגציה של גלילה במגע
  function preventTouchScroll(event) {
    if (!isScrolable && isMobileOrTablet()) {
      event.stopPropagation();
    }
  }
</script>


<div on:wheel={preventSwiperScroll} 
on:touchmove={preventTouchScroll}
on:click={() => (isMobileOrTablet() ?  isScrolable = !isScrolable : isScrolable = true)}
role="button"
tabindex="0" 
on:keypress={preventSwiperScroll} dir="rtl"  class="{isVisible ? $lang == 'he' ? 'boxleft' : 'boxright' : ''} leading-normal {isMobileOrTablet() ? "w-full h-full" : " w-[90%] h-[90%]"} bg-white lg:w-[90%] d">
 <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
  </div>-->
   <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
      <div class="relative flex items-center space-x-1">
         <div class="relative">
         <img src={src2}  alt="" class="w-10 sm:w-16 h-10 sm:h-16  rounded-full">
         </div>
         <div class="flex flex-col leading-tight">
            <div class="sm:text-sm text-md mt-1 flex items-center">
               <span class="text-barbi text-center mr-3 sm:text-xl text-sm">הצבעה על שיתוף משאב והצטרפות לריקמה </span>
            </div>
            <span style="text-shadow: 1px 1px white;" class="pn ml-1 text-sm sm:text-lg text-barbi ">{projectName}</span>
         </div>
         </div>
         </div>
  <div  class="{isScrolable ? "bg-white" : "bg-gray-200"} transition-all-300 rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
    <div  class="mb-8">
       <p style="line-height: 1;" class="text-sm sm:text-xl text-gray-600 flex items-center">
            <img style="width:2.5rem;" class=""  src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
        <span onmouseenter={()=>hover("ההצעה שהתקבלה")} onmouseleave={()=>hover("0")} style="color: var(--barbi-pink)" >{myp} השווי המוצע</span> /<span onmouseenter={()=>hover("ההצעה של הריקמה")} onmouseleave={()=>hover("0")} > {easy} השווי שהצענו</span>
        </p>
              <h3 onmouseenter={()=>hover("שווי")} onmouseleave={()=>hover("0")} class="ltn" >{price} <span>שווי מקובל</span></h3>
      <div class="text-gray-900 font-bold text-xl mb-2">{openmissionName}</div>
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
         {:else if low == true}
          <Lowbtn isCart="true"/>
        {/if}
</div>

