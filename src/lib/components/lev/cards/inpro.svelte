<script>
export let x = 0,src,projectName,already,zman,hearotMeyuchadot,status = 0,dueDateOrCountToDedline, missionName,link,missionDetails, hoursdon, hourstotal,show,running,linkDescription,lapse = 0
    import { formatTime } from './../utils.js';
    import {lang} from '$lib/stores/lang.js' 
    export let low = false;
    export let iskvua = false
import Lowbtn from '$lib/celim/lowbtn.svelte'
     // import Chaticon from '../../../celim/chaticon.svelte'
  import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
function start(){
dispatch("start");
}
function done(){
    already = true
dispatch("done")
}
function save() {
dispatch("save");
}
function azor(){
dispatch("azor");

}
function clear (){
dispatch("clear");
}
function hover(x){
dispatch("hover",{x:x});
}
function statusi(){
   dispatch("statusi")
}
 // import { textfit } from 'svelte-textfit';
 // let parent;
 $: event = dueDateOrCountToDedline != "undefined" &&  dueDateOrCountToDedline != undefined &&  dueDateOrCountToDedline != null ? new Date(dueDateOrCountToDedline) : null;
  const sta = {"he": "סטטוס התקדמות ביצוע המשימה","en": "status of mission progress"}

const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

const hed = {"he": "משימה בתהליך ביצוע ","en": "mission in progress"}
$: totali = {"he":`${iskvua == true ? "שעות חודשיות":"שעות סך הכל"}`,"en":`${iskvua == true ? "monthly hours":"total hours"}`}
</script>


<div dir="rtl"  style="overflow-y:auto" class=" d  bg-white leading-normal w-full h-full bg-white lg:w-full">
 <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
  </div>-->
   <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
      <div class="relative flex items-center space-x-1">
         <div class="relative">
         <img src={src}  alt="" class="w-10 sm:w-16 h-10 sm:h-16  rounded-full">
         </div>
         <div class="flex flex-col leading-tight">
            <div class=" text-md mt-1 flex items-center">
               <span class="text-barbi text-center mr-3 sm:text-3xl text-sm">{hed[$lang]}</span>
            </div>
            <span style=" text-shadow: 1px 1px white;" class=" ml-1 sm:text-2xl text-sm text-barbi ">{projectName}</span>
         </div>
         </div>
         </div>
  <div  class=" bg-white rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
    <div   class="mb-8">
       <!--use:textfit={{parent,mode:"multi"}}  bind:this={parent}-->
              <div class="text-mturk font-bold text-lg md:text-4xl  mb-2">{missionName}</div>
                <h5  class="mn cd "><span on:mouseenter={()=>hover("מספר השעות שבוצעו ונשמרו")} on:mouseleave={()=>hover("0")} >{`${hoursdon ? Math.round((hoursdon + Number.EPSILON) * 100) / 100 : 0} שעות בוצעו`}</span> מתוך <span on:mouseenter={()=>hover("מספר השעות שהוקצו למשימה")} on:mouseleave={()=>hover("0")}>{hourstotal} {totali[$lang]}</span></h5>
                   {#if dueDateOrCountToDedline !== null} <h5 style="margin: 7px; font-size: 13px; line-height: 1;">{event.toLocaleDateString(undefined, options)}</h5>{/if}
       <div class="flex items-center justify-center m-1"><span class="bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre text-center text-wow p-2 sm:text-2xl text-xl" style:font-family="Digital" on:mouseenter={()=>hover("טיימר")} on:mouseleave={()=>hover("0")}  style="font-weight: 300; letter-spacing: 1px; text-shadow: 1px 1px black;">
            {formatTime(zman)}
        </span></div> 
         <!--<p style="line-height: 1;" class="text-sm text-gray-600 flex items-center">
            <img style="width:2.5rem;" class=""  src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
            <span on:mouseenter={()=>hover("שווי לשעה")} on:mouseleave={()=>hover("0")} > {perhour} לשעה </span> * <span on:mouseenter={()=>hover("כמות השעות")} on:mouseleave={()=>hover("0")}  > {noofhours.toLocaleString('en-US', {maximumFractionDigits:2})} שעות </span> = <span on:mouseenter={()=>hover("סך הכל")} on:mouseleave={()=>hover("0")}>{(noofhours * perhour).toLocaleString('en-US', {maximumFractionDigits:2})} </span>
      </p>-->
     {#if missionDetails !== null && missionDetails !== "null" && missionDetails !== "undefined"} <p on:mouseenter={()=>hover("פרטי המשימה")} on:mouseleave={()=>hover("0")} class="cd d max-h-16 text-sm text-gray-700 text-base">{missionDetails}</p>{/if}
    {#if hearotMeyuchadot}
     <p on:mouseenter={()=>hover("הערות")} on:mouseleave={()=>hover("0")} class="text-grey-700 max-h-16 cd text-sm md:text-lg d">{hearotMeyuchadot !== undefined && hearotMeyuchadot !== null && hearotMeyuchadot !== "undefined" && hearotMeyuchadot !== "null" ? hearotMeyuchadot : ""}</p>
     {/if} 
        <div
  on:mouseenter={()=>hover(sta[$lang])} on:mouseleave={()=>hover("0")}
  class="de border rounded-2xl border-barbi hover:border-gold mt-3" on:click={()=>statusi()}
    on:keypress={()=>statusi()}
    ><div class=" rounded-2xl bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre" style="width: {status == null ? 0 : status[0]}%">{status != null ? status[0] : "0"}%</div></div>
    </div>
    <div class="flex items-center">
      </div>
       </div>
       {#if low == false}
       {#if lapse !== 0 || x !== 0}
       <div class="flex items-center justify-center">
<button on:mouseenter={()=>hover("לחיצה לאיפוס הטיימר מבלי לשמור")} on:mouseleave={()=>hover("0")}  class="border border-barbi hover:border-gold bg-gradient-to-br from-graa to-grab text-barbi  p-4 rounded-full hover:from-lturk hover:to-barbi " on:click={clear}>ניקוי</button>
<button on:mouseenter={()=>hover("לחיצה לעצירת הטיימר ושמירת הזמן שבוצע")} on:mouseleave={()=>hover("0")} class="  bg-gradient-to-br text-gold hover:from-graa hover:to-grab hover:text-gold   p-4 rounded-full from-lturk to-barbi " on:click={save}> הוספה</button>
    </div>{/if}
    {#if already === false}
    <button on:mouseenter={()=>hover("לחיצה לסיום המשימה")} on:mouseleave={()=>hover("0")} on:click={done}  
                class = "btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
          name="done"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" /></svg></button>
     {/if} 
     {#if show === true} 
      <button
       on:mouseenter={()=>hover(`${running ? "עצירת הטיימר" : "הפעלת טיימר"}`)} 
       on:mouseleave={()=>hover("0")} 
       on:click={running ? azor : start} 
              class = "btnc bg-gradient-to-br hover:from-gold hover:via-mpink  hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-mpink hover:text-gold hover:scale-110" 
       name="start timer" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="btin" viewBox="0 0 24 24"><path  fill="currentColor" d="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z" /></svg></button>
   {/if}
 {:else if low == true}
          <Lowbtn isCart="true"/>
        {/if}
 <a on:mouseenter={()=>hover({linkDescription})} on:mouseleave={()=>hover("0")} 
              class = "btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110" 
         href={link}><svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M14.851 11.923c-.179-.641-.521-1.246-1.025-1.749-1.562-1.562-4.095-1.563-5.657 0l-4.998 4.998c-1.562 1.563-1.563 4.095 0 5.657 1.562 1.563 4.096 1.561 5.656 0l3.842-3.841.333.009c.404 0 .802-.04 1.189-.117l-4.657 4.656c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-1.952-1.951-1.952-5.12 0-7.071l4.998-4.998c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464.493.493.861 1.063 1.105 1.672l-.787.784zm-5.703.147c.178.643.521 1.25 1.026 1.756 1.562 1.563 4.096 1.561 5.656 0l4.999-4.998c1.563-1.562 1.563-4.095 0-5.657-1.562-1.562-4.095-1.563-5.657 0l-3.841 3.841-.333-.009c-.404 0-.802.04-1.189.117l4.656-4.656c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464 1.951 1.951 1.951 5.119 0 7.071l-4.999 4.998c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-.494-.495-.863-1.067-1.107-1.678l.788-.785z"/></svg></a>
</div>

<style>
    .cd{
    overflow-y: auto;
    }
  
</style>