<script>
    //  import Chaticon from '../../../celim/chaticon.svelte'
  import { createEventDispatcher } from 'svelte';
  import {lang} from '$lib/stores/lang.js'
 const dispatch = createEventDispatcher();
import Lowbtn from '$lib/celim/lowbtn.svelte'
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte'
  import RichText from '$lib/celim/ui/richText.svelte';
  /** @type {{low?: boolean, isVisible?: boolean, mashName: any, easy: any, myp: any, price: any, total: any, descrip: any, projectName: any, src: any, spnot: any, deadLine: any, sqadualedf: any, already?: boolean}} */
  let {
    low = false,
    isVisible = false,
    mashName,
    easy,
    myp,
    price,
    total,
    descrip,
    projectName,
    src,
    spnot,
    deadLine,
    sqadualedf,
    already = $bindable(false)
  } = $props();
  import { isMobileOrTablet } from '$lib/utilities/device';
   
function hover(x){
dispatch("hover",{x:x});
}
function agree(alr){
  already = true;
dispatch("agree",{alr:alr,y:"a"})
}
function decline(alr) {
  already = true; 
dispatch("decline",{alr:alr,y:"d"});
}
function nego(alr){
dispatch("nego",{alr:alr,y:"n"});

}
function tochat (){
dispatch("tochat");
}
const askedVal = {
  "en": "asked vallue",
  "he":"הצעת הריקמה"}
  const myval = {
    "en": "my vallue",
    "he":'ההצעה שלי'
  }
  const head = {
    "he":"הצעה לשיתוף משאב בריקמה",
    "en":"Suggestion for sharing a reasurce with a FreeMates"
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
on:keypress={preventSwiperScroll} dir="{$lang == 'he' ? 'rtl' : 'ltr'}"  style="overflow-y:auto" class=" d  {isVisible ? $lang == 'he' ? 'boxleft' : 'boxright' : ''}  leading-normal {isMobileOrTablet() ? "w-full h-full" : " w-[90%] h-[90%]"} bg-white lg:w-[90%]">
 <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
  </div>-->
   <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
      <div class="relative flex items-center space-x-1">
         <div class="relative">
         <img src={src}  alt="" class="w-10 sm:w-16 h-10 sm:h-16  rounded-full">
         </div>
         <div class="flex flex-col leading-tight">
            <div class="sm:text-sm text-md mt-1 flex items-center">
               <span class="text-barbi text-center mr-3 sm:text-2xl text-sm">{head[$lang]}</span>
            </div>
            <span style=" text-shadow: 1px 1px white;" class="pn ml-1 text-sm sm:text-lg text-barbi ">{projectName}</span>
         </div>
         </div>
         </div>
  <div  class="{isScrolable ? "bg-white" : "bg-gray-200"} transition-all-300 rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
    <div  class="mb-8">
         <p style="line-height: 1;" class="text-sm sm:text-xl text-gray-600 flex items-center">
            <img style="width:2.5rem;" class=""  src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
        <span
        role="contentinfo"
         onmouseenter={()=>hover(askedVal[$lang])} 
         onmouseleave={()=>hover("0")} 
         style="color: var(--barbi-pink)">{easy} {askedVal[$lang]}</span
         > /<span 
         role="contentinfo"
         onmouseenter={()=>hover(myval[$lang])} onmouseleave={()=>hover("0")} > {myp} {myval[$lang]}</span> 
      </p>
              <h3 onmouseenter={()=>hover("שווי")} onmouseleave={()=>hover("0")} class="ltn" >{price} <span>שווי מקובל</span></h3>
             {#if total} <p onmouseenter={()=>hover("סך הכל")} onmouseleave={()=>hover("0")}>{total}</p>{/if}
             {#if deadLine || sqadualedf}
                                <p
                  style="line-height: 1;"
                  class="text-sm text-gray-100 flex items-center lg:text-2xl m-5"
                >
                  <img
                    class="w-6 lg:w-12"
                    src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
                    alt="howmuch"
                  />
                {#if deadLine}
                <span> {new Date(deadLine).toLocaleDateString()}</span>
                {/if}
                 {#if sqadualedf}
                <span> - {new Date(sqadualedf).toLocaleDateString()}</span>
                {/if}
                  </p>
                {/if}  
              <div style="font-size: 17px;" class="text-mturk font-bold  mb-2">{mashName}</div>
     {#if descrip !== null && descrip !== "null"} <p class="cd d max-h-32 text-gray-700 text-base">{descrip}</p>{/if}
    {#if spnot && spnot !== undefined && spnot !== null && spnot !== "undefined"}
     <p onmouseenter={()=>hover("הערות")} onmouseleave={()=>hover("0")} class="text-grey-700 max-h-1/2 cd d">
       <RichText  outpot={spnot} editable={false}/> </p>
     {/if} 

    </div>
  
        

       </div>
       {#if low == false}
 {#if already === false}
                <button onmouseenter={()=>hover("אני רוצה")}
               onmouseleave={()=>hover("0")} 
               onclick={()=>agree("f")} 
                class = "btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
                 name="requestToJoin">
                <Lev/>
                </button>   
         <!-- <button
             on:mouseenter={()=>hover("משא ומתן")} 
             on:mouseleave={()=>hover("0")} 
             on:click= {()=>nego("f")}
              class = "btnc bg-gradient-to-br hover:from-gold hover:via-mpink  hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-mpink hover:text-gold hover:scale-110" 
              name="negotiate" >
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"  viewBox="0 0 24 24"><path fill="currentColor" d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
            --> <button
             onmouseenter={()=>hover("לא מתאים לי")} 
             onmouseleave={()=>hover("0")} 
             onclick={()=>decline("f")} 
              class = "btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110" 
              name="decline">
              <No/>
            </button>
   

        {/if}
 {:else if low == true}
          <Lowbtn isCart="true"/>
        {/if}
</div>

<style>
    .cd{
    overflow-y: auto;
    }
 
  
</style>