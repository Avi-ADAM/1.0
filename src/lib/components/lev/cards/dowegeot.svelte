<script>
      import Chaticon from '../../../celim/chaticon.svelte'
          import {lang} from '$lib/stores/lang.js'
import Lowbtn from '$lib/celim/lowbtn.svelte'
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte'
  import { isMobileOrTablet } from '$lib/utilities/device';
  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {any} agprice
   * @property {any} useraplyname
   * @property {any} src2
   * @property {any} missionBName
   * @property {boolean} [already]
   * @property {any} yers
   * @property {any} projectName
   * @property {any} src
   * @property {any} kindOf
   * @property {any} noofusersWaiting
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} monts
   * @property {number} [hm]
   * @property {any} spnot
   * @property {boolean} [allr]
   * @property {(payload: { x: any }) => void} [onHover] - Callback for hover event
   * @property {(payload: { alr: any, y: string }) => void} [onAgree] - Callback for agree event
   * @property {(payload: { alr: any, y: string }) => void} [onDecline] - Callback for decline event
   * @property {(payload: { alr: any, y: string }) => void} [onNego] - Callback for nego event
   * @property {() => void} [onTochat] - Callback for tochat event
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    agprice,
    useraplyname,
    src2,
    missionBName,
    already = $bindable(false),
    yers,
    projectName,
    src,
    kindOf,
    noofusersWaiting,
    noofusersOk,
    noofusersNo,
    monts,
    hm = 1,
    spnot,
    allr = false,
    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat
  } = $props();
function hover(x){
onHover?.({x:x});
}
function agree(alr){
  already = true;
onAgree?.({alr:alr,y:"a"})
}
function decline(alr) {
  already = true; 
onDecline?.({alr:alr,y:"d"});
}
function nego(alr){
onNego?.({alr:alr,y:"n"});

}
function tochat (){
onTochat?.();
}
const neged ={"he":"נדרש בירור","en":"negotiation needed"}
const negedT = {"he":"סך ההצבעות להליך בירור","en":"total votes for negotiation"}
const bead = {"he":"בעד","en":"in favor"}
const notyet = {"he":"טרם","en":"not yet"}
const notyetT ={"he":"לא הצביעו","en":"not voted yet"}
const leshana = {"he":"לשנה","en":"per year"}
const oneyear = {"he":"שנה אחת","en":"one year"}
const years = {"he":"שנים","en":"years"} 
const intotal = {"he":"סך הכל","en":"in total"}
const onemonth = {"he":"חודש אחד","en":"one month"}
const lehodesh = {"he":"לחודש","en":"per month"}
const months = {"he":"חודשים","en":"months"}
const perunit = {"he":"ליחידה","en":"per unit"}
const units = {"he":"יחידות","en":"units"}
const oneunit = {"he":"יחידה אחת","en":"one unit"}
const head = {"he":"אישור קבלת משאב בהצלחה","en":"approval of getting a resorce sucsessfully"}
const totalinfavor = {"he":"סך ההצבעות בעד","en":"total votes in favor"}
let isScrolable = $state(true); 
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


<div onwheel={preventSwiperScroll} 
ontouchmove={preventTouchScroll}
onclick={() => (isMobileOrTablet() ?  isScrolable = !isScrolable : isScrolable = true)}
role="button"
tabindex="0" 
onkeypress={preventSwiperScroll} dir={$lang == "he" ? "rtl" : "ltr"} style="overflow-y:auto" class=" d {isVisible ? $lang == 'he' ? 'boxleft' : 'boxright' : ''}  leading-normal {isMobileOrTablet() ? "w-full h-full" : " w-[90%] h-[90%]"} bg-white lg:w-[90%]">
 <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
  </div>-->
   <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-liteGoldTobr">
      <div class="relative flex items-center space-x-1">
         <div class="relative">
         <img src={src2}  alt="" class="w-10 sm:w-16 h-10 sm:h-16  rounded-full">
         </div>
         <div class="flex flex-col leading-tight">
            <div class="sm:text-sm text-md mt-1 flex items-center">
               <span class="text-barbi text-center mr-3 sm:text-2xl text-xl">{head[$lang]}</span>
            </div>
            <span style="text-shadow: 1px 1px white;" class="pn ml-1 text-lg sm:text-xl  text-barbi ">{projectName}</span>
         </div>
         </div>
         </div>
  <div  class=" {isScrolable ? "bg-white" : "bg-gray-200"} transition-all-300  rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
    <div  class="mb-8">
         <div style="line-height: 1;" class="text-sm text-gray-600 flex items-center">
            <img style="width:2.5rem;" class=""  src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
      {#if kindOf === "perUnit"}
       <p ><span onmouseenter={()=>hover({"he":"שווי ליחידה","en":"per unit vallue"})} onmouseleave={()=>hover("0")} style="color:var(--barbi-pink)" >{agprice.toLocaleString('en-US', {maximumFractionDigits:2})} {perunit[$lang]}</span> * <span onmouseenter={()=>hover({"he":"כמות","en":"amount"})} onmouseleave={()=>hover("0")} style="color:var(--barbi-pink);" >{hm == 1 ? `${oneunit[$lang]}` : `${hm} ${units[$lang]}`}</span> = <span onmouseenter={()=>hover({"he":"סך הכל","en":"in total"})} onmouseleave={()=>hover("0")} >{(agprice * hm).toLocaleString('en-US', {maximumFractionDigits:2}) } {intotal[$lang]}</span> </p>
   {:else if kindOf === "total" || kindOf === "rent"}
       <p ><span onmouseenter={()=>hover({"he":"שווי מוצע","en":"offered vallue"})} onmouseleave={()=>hover("0")} style="color:var(--barbi-pink)" >{agprice.toLocaleString('en-US', {maximumFractionDigits:2})}</span></p>
          {:else if kindOf === "monthly"}
       <p ><span onmouseenter={()=>hover({"he":"שווי לחודש","en":"monthly vallue"})} onmouseleave={()=>hover("0")}  style="color:var(--barbi-pink)" >{agprice.toLocaleString('en-US', {maximumFractionDigits:2})} {lehodesh[$lang]}</span> * <span onmouseenter={()=>hover({"he":"כמות חודשים","en":"number of months"})} onmouseleave={()=>hover("0")}  style="color:var(--barbi-pink)" >{monts == 1 ?  `${onemonth[$lang]}` : `${monts} ${months[$lang]}`}</span> = <span onmouseenter={()=>hover({"he":"סך הכל","en":"in total"})} onmouseleave={()=>hover("0")} > {intotal[$lang]} {(agprice * monts).toLocaleString('en-US', {maximumFractionDigits:2}) }</span> </p>
          {:else if kindOf === "yearly"}
       <p ><span onmouseenter={()=>hover({"he":"שווי לשנה","en":"yearly vallue"})} onmouseleave={()=>hover("0")}  style="color:var(--barbi-pink)" >{agprice.toLocaleString('en-US', {maximumFractionDigits:2})} {leshana[$lang]}</span> * <span onmouseenter={()=>hover({"he":"מספר השנים","en":"number of years"})} onmouseleave={()=>hover("0")}  style="color:var(--barbi-pink)" >{yers == 1 ?  `${oneyear[$lang]}`: `${yers} ${years[$lang]}`}</span> = <span onmouseenter={()=>hover({"he":"סך הכל","en":"in total"})} onmouseleave={()=>hover("0")} > {intotal[$lang]} { (agprice * yers).toLocaleString('en-US', {maximumFractionDigits:2}) }</span> </p>
{/if}
         </div>
      <div style="font-size: 17px;" class="text-mturk font-bold  mb-2">{missionBName}</div>
     {#if spnot !== null && spnot !== "null" && spnot !== "undefined" && spnot !== undefined} <p class="cd d max-h-16 text-gray-700 text-base">{spnot}</p>{/if}
   <!-- {#if hearotMeyuchadot}
     <p on:mouseenter={()=>hover("הערות")} on:mouseleave={()=>hover("0")} class="text-grey-700 max-h-16 cd text-sm d">{hearotMeyuchadot !== undefined && hearotMeyuchadot !== null && hearotMeyuchadot !== "undefined" ? hearotMeyuchadot : ""}</p>
     {/if} 
     <div class="flex items-center border border-gold" >
          <p on:mouseenter={()=>hover("מילות סיכום")} on:mouseleave={()=>hover("0")} class="text-grey-700 max-h-16 cd text-sm d">{why !== undefined && why !== null && why !== "undefined" ? why : ""}</p>
   </div>-->
        </div>
     <div class="flex items-center">
      <img style="width: 2.5rem;" class="w-10 h-10 rounded-full mr-4" src="{src.length > 0 ? src : "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"}" alt="">
      <div class="text-sm">
        <p class="text-gray-900 leading-none">{useraplyname}</p>
        <p class="vo ef"><span
          role="contentinfo"
           onmouseenter={()=>hover(totalinfavor[$lang])} 
           onmouseleave={()=>hover("0")}  style="color:#7EE081;" >{noofusersOk}-{bead[$lang]}</span> <span
           role="contentinfo"
            onmouseenter={()=>hover(notyetT[$lang])} 
            onmouseleave={()=>hover("0")}  style="color:#0000cc;" >{noofusersWaiting}-{notyet[$lang]} </span><span 
            role="contentinfo"	
            onmouseenter={()=>hover()} 
            onmouseleave={()=>hover("0")}  style="color:#80037e;" >{noofusersNo}-{neged[$lang]}</span></p>
      </div>
    </div>
       </div>
       {#if low == false}
 {#if already === false && allr === false}
                <button onmouseenter={()=>hover({"he":"אישור","en":"appruve"})}
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
             onmouseenter={()=>hover({"he":"התנגדות","en":"objection"})} 
             onmouseleave={()=>hover("0")} 
             onclick={()=>decline("f")} 
              class = "btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110" 
              name="decline">
              <No/>
            </button><!--
    {:else if already === true && mypos === true && noofusersNo > 0 && allr === false}
            <button on:mouseenter={()=>hover("משא ומתן")} on:mouseleave={()=>hover("0")}  
                on:click={() => nego("alr")} 
                class = "btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110" 
                name="negotiate" 
                ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
            <button
             on:mouseenter={()=>hover("התנגדות")} 
             on:mouseleave={()=>hover("0")} 
             on:click={()=>decline("alr")} 
              class = "btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110" 
              name="decline">
              <No/>
            </button>     
            <button 
            on:mouseenter={()=>hover("תגובה")} 
            on:mouseleave={()=>hover("0")}  
            on:click={() => tochat()}
            class = "btnc bg-gradient-to-br hover:from-gold hover:via-mpink  hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-mpink hover:text-gold hover:scale-110" 
            ><Chaticon class="btin"/></button>
       {:else if already === true && mypos === false && noofusersOk > 0  && allr === false}
                <button on:mouseenter={()=>hover("אישור")}
               on:mouseleave={()=>hover("0")} 
               on:click={()=>agree("alr")} 
                class = "btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
                 name="requestToJoin">
                <Lev/>
                </button>   
              <button 
                on:mouseenter={()=>hover("משא ומתן")} 
                on:mouseleave={()=>hover("0")}  
                on:click={() => nego("alr")} 
              class = "btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110" 
                   name="negotiate" title="משא ומתן"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z" /></svg></button>
                 <button
                  on:mouseenter={()=>hover("תגובה")} 
                  on:mouseleave={()=>hover("0")}  
                   class = "btnc bg-gradient-to-br hover:from-gold hover:via-mpink  hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110" 
                       on:click={() => tochat()}
                       ><Chaticon/>
                          </button>
        {:else}
     <button
      on:mouseenter={()=>hover("לצפיה בדיון")} 
      on:mouseleave={()=>hover("0")}  
     class = "btnc bg-gradient-to-br hover:from-gold hover:via-mpink  hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110" 
      on:click={() => tochat()}
      ><Chaticon/>
        </button>
    -->
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
