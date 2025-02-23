<!-- @migration-task Error while migrating Svelte code: Mixing old (on:wheel) and new syntaxes for event handling is not allowed. Use only the onwheel syntax -->
<script>
  import { run } from 'svelte/legacy';

  import Tile from '$lib/celim/tile.svelte'
      import Chaticon from '$lib/celim/chaticon.svelte'
      import {lang} from '$lib/stores/lang.js'
  import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();

import Lowbtn from '$lib/celim/lowbtn.svelte'
  import Lev from '$lib/celim/lev.svelte';
  import No from '$lib/celim/no.svelte'
  import RichText from '$lib/celim/ui/richText.svelte';
  /** @type {{low?: boolean, projectName: any, timeToP: any, acts: any, src: any, perhour: any, noOfHours: any, missionDetails: any, missionName: any, skills?: any, role?: any, workways?: any, totalminyearone?: number, totalmaxyearone?: number, totalminyearsec?: number, totalmaxyearsec?: number, totalinyearone?: number, totalinyearsec?: number, isMonthly?: boolean, alreadyi?: boolean, hearotMeyuchadot: any, already: any, allr?: boolean, isVisible?: boolean}} */
  let {
    low = false,
    projectName,
    timeToP,
    acts,
    src,
    perhour,
    noOfHours,
    missionDetails,
    missionName,
    skills = [],
    role = [],
    workways = [],
    totalminyearone = 1000,
    totalmaxyearone = 30000,
    totalminyearsec = 2000,
    totalmaxyearsec = 60000,
    totalinyearone = 600,
    totalinyearsec = 1000,
    isMonthly = true,
    alreadyi = false,
    hearotMeyuchadot,
    already = $bindable(),
    allr = false,
    isVisible = false
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
function project () {
dispatch("project")
}
function tochat (){
dispatch("tochat");
}
const ttal = {"he":"נכנס כבר כסף","en":"already has income"}
const ttwe = {"he":"צפי רווח: שבוע","en":"exp income: one week "}
const ttmo = {"he":"צפי רווח: חודש","en":"exp income: one month "}
const tt3mo = {"he":"צפי רווח: 3 חודשים","en":"exp income: three months"}
const tt6mo = {"he":"צפי רווח: חצי שנה","en":"exp income: 6 months "}
const tt1y = {"he":"צפי רווח: שנה","en":"exp income: 1 year"}
const tt2y = {"he":"צפי רווח: שנתיים","en":"exp income: 2 years "}
const ttmor = {"he":"צפי רווח: ארוך טווח","en":"exp income: long term"}
const ttne = {"he":"ללא רווח","en":"not profitable"}
    const headi = {"he":"הצעה למשימה", "en":"suggested mission"}
    const t = {
      "acts": {"he":"רשימת מטלות:","en":"todo list:"},	
      "wwneed" : {"he":"דרכי עבודה מבוקשות:","en":"ways of work for the mission:"},
      "skneed" : {"he":"הכישורים הנדרשים:","en": "needed skills:"},
      "rneed" : {"he":"תפקיד מבוקש:", "en":"requested role:"},
      "watchpr" : {"he": "לצפיה בריקמה","en": "see the FreeMate"},
      "min":{"he":"מינימום","en":"min."},
      "max":{"he":"","en":"max."},
      "firyer":{"he":"","en":"first year"}
    }
    const perho = {"he":"לשעה","en":"per hour"}
        const hourss = {"he":"שעות","en":"hours"}
        const monhly = {"he":"בחודש", "en": "per month"}

console.log(workways)
run(() => {
    console.log("ACTS: ",acts)
  });
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
on:wheel={preventSwiperScroll} 
on:touchmove={preventTouchScroll}
on:click={() => (isMobileOrTablet() ?  isScrolable = !isScrolable : isScrolable = true)}
role="button"
tabindex="0" 
on:keypress={preventSwiperScroll} dir="rtl"  style="overflow-y:auto" class=" d  leading-normal  dark:bg-slate-800  {isVisible ? $lang == 'he' ? 'boxleft' : 'boxright' : ''}  leading-normal {isMobileOrTablet() ? "w-full h-full" : " w-[90%] h-[90%]"} bg-white lg:w-[90%]">
 <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
  </div>-->
   <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
      <div class="relative flex items-center space-x-1">
         <div class="relative">
         <img src={src}  alt="" class="w-10 sm:w-16 h-10 sm:h-16  rounded-full">
         </div>
         <div class="flex flex-col leading-tight">
            <div class="sm:text-sm text-lg mt-1 flex items-center">
               <span class="text-barbi text-center mr-3 sm:text-2xl text-xl">{headi[$lang]}</span>
            </div>
            <span style=" text-shadow: 1px 1px white;" class="pn ml-1 text-lg sm:text-xl text-barbi ">{projectName}</span>

         </div>

         </div>
         <button onclick={project} class="px-2 mx-2 text-barbi hover:text-gold hover:bg-barbi bg-gold rounded text-sm" >{t.watchpr[$lang]}</button >
         </div>

  <div  class="{isScrolable ? "bg-white dark:bg-slate-800" : "bg-gray-200 dark:bg-slate-700"} transition-all-300   rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col xl:flex-row  leading-normal">
    
    <div  class="mb-8">
            <div class="sm:text-3xl text-xl text-mturk font-bold  mb-2">{missionName}</div>
      <!----  {#if data.alld.sqadualed || data.alld.sqadualedf}
                                <p
                  style="line-height: 1;"
                  class="text-sm text-gray-100 flex items-center lg:text-2xl m-5"
                >
                  <img
                    class="w-6 lg:w-12"
                    src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
                    alt="howmuch"
                  />
                {#if data.alld.sqadualed}
                <span> {new Date(data.alld?.sqadualed).toLocaleDateString()}</span>
                {/if}
                 {#if data.alld.sqadualedf}
                <span> - {new Date(data.alld?.sqadualedf).toLocaleDateString()}</span>
                {/if}
                  </p>
                {/if}  -->
         <p style="line-height: 1;" class="sm:text-xl text-lg text-gray-600 dark:text-slate-100 flex items-center">
            <img style="width:2.5rem;"   src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
            <span 
            role="contentinfo"
            onmouseenter={()=>hover({"he":"שווי לשעה","en":"vallue per hour"})} 
            onmouseleave={()=>hover("0")} 
            > {perhour.toLocaleString('en-US', {maximumFractionDigits:2})} {perho[$lang]} </span> * <span 
            role="contentinfo"
            onmouseenter={()=>hover({"he":"כמות השעות", "en":"amount of hours"})} 
            onmouseleave={()=>hover("0")}  > {noOfHours.toLocaleString('en-US', {maximumFractionDigits:2})} {hourss[$lang]} </span> = <span 
            role="contentinfo"
            onmouseenter={()=>hover({"he":"סך הכל","en": "total"})} 
            onmouseleave={()=>hover("0")}
            >{(noOfHours * perhour).toLocaleString('en-US', {maximumFractionDigits:2})} {isMonthly ? monhly[$lang] : ""} </span>
      </p>

      <span  class="text-barbi text-xl lg:text-2xl bg-gold px-4 underline py-2  decoration-mturk m-4">

        {#if timeToP == "alreadi"}
              {ttal[$lang]}
             {:else if timeToP == "week"}
              {ttwe[$lang]}
              {:else if timeToP == "month"}
              {ttmo[$lang]}
               {:else if timeToP == "threeM"}
              {tt3mo[$lang]}
               {:else if timeToP == "sixM"}
              {tt6mo[$lang]}
               {:else if timeToP == "oneY"}
              {tt1y[$lang]}
             {:else if timeToP == "twoY"}
              {tt2y[$lang]}
             {:else if timeToP == "more"}
              {ttmor[$lang]}
              {:else if timeToP == "never"}
              {ttne[$lang]}
            {/if}
        </span>
  {#if missionDetails !== null && missionDetails !== "null"} <div class=" d max-h-1/2"><RichText outpot={missionDetails} editable={false} /></div>{/if}
    {#if hearotMeyuchadot && hearotMeyuchadot !== undefined && hearotMeyuchadot !== null && hearotMeyuchadot !== "undefined" && hearotMeyuchadot !== "null"}
     <p onmouseenter={()=>hover("הערות")} onmouseleave={()=>hover("0")} class=" max-h-1/2  d">
      <RichText  outpot={hearotMeyuchadot} editable={false}/> 
      </p>
     {/if}
     {#if acts.data.length > 0}
     <div class="border-2 border-gold mt-5 p-2">
      <small class="text-barbi text-md ">{t.acts[$lang]}</small>

     <ul>
       {#each acts?.data as datai, t}
         <li>
           <div
             class="flex flex-row space-x-2 items-start border-y-2 border-y-mturk"
           >
             <span class="p-1">✅</span>
             <h2 class="md:text-xl p-1 text-barbi">{datai.attributes.shem}</h2>
           </div>
         </li>
       {/each}
     </ul>
   </div>
   {/if}
       {#if skills.data.length > 0}
            <small class="text-barbi text-md ">{t.skneed[$lang]}</small>
            <div class=" flex   d  flex-wrap ">
                {#each skills.data as skill}
                <p
                class="m-1 p-0"
                style="line-height:1;"
                onmouseenter={()=>hover({"he":"הכישורים הנדרשים","en": "needed skills"})}
                onmouseleave={()=>hover("0")}  >
                <Tile sm={true} big={true} bg="green" word={skill.attributes.skillName} />
                </p>{/each}
    </div>{/if}
   
     {#if role.data.length > 0}
      <small class="text-md text-barbi">{t.rneed[$lang]}</small>
            <div
            class=" flex   d  flex-wrap ">
             {#each role.data as rol}
             <p onmouseenter={()=>hover({"he":"תפקיד מבוקש", "en":"requested role"})}
               onmouseleave={()=>hover("0")} class="m-1"
               style="line-height:1;text-shadow:none;" >
               <Tile sm={true} big={true} bg="pink" word={rol.attributes.roleDescription} />
               </p>{/each}
    </div>{/if}
    {#if workways.data.length > 0}
    <small class="text-md text-barbi">{t.wwneed[$lang]}</small>
            <div class=" flex   d  flex-wrap ">
               {#each workways.data as wo}<p
               onmouseenter={()=>hover({"he":"דרכי עבודה מבוקשות","en":"ways of work for the mission"})} onmouseleave={()=>hover("0")}
                class="m-1" style="line-height:1;text-shadow:none;" >
                <Tile sm={true} big={true} bg="yellow" word={wo.attributes.workWayName} />
                </p>{/each}
    </div>{/if}

    </div>
    <!---
<div class="grow sm:pt-1 sm:p-14">
  <h3 class="text-center underline decoration-barbi">הערכת רווח חודשי:</h3>
  <svg width="100%" height="100%" viewBox="0 0 600.00001 600.00001" id="svg2" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <defs id="defs4"></defs>
  <g id="layer1" transform="translate(0,-452.36216)">
    <path style="stroke-width: 8; stroke-miterlimit: 4; stroke-dasharray: none; stroke-opacity: 1; stroke: #EEE8AA; fill: rgb(2, 255, 187);" id="path4365" d="m 207.19797,508.70985 c -0.38253,9.73948 -0.0761,19.48663 0.0124,29.22711 0.043,4.73228 0.0186,9.46493 0.0278,14.1974 -0.26066,57.68856 -0.88526,115.37432 -1.74321,173.05691 -0.435,14.19182 -0.70789,28.38953 -1.305,42.57545 -1.36508,32.43096 -2.79483,53.91477 -5.83404,86.13381 -3.03991,32.2265 -7.25772,64.32232 -11.51934,96.40352 -0.94792,6.85734 -1.89583,13.71468 -2.84374,20.57202 -0.98831,6.45554 -2.81421,6.176 -1.82591,-0.27954 l 0,0 c 1.14652,-6.82329 2.29304,-13.64659 3.43956,-20.46988 3.03488,-19.5006 6.20076,-38.9502 8.60371,-58.5463 6.77003,-55.20965 10.12342,-110.79161 11.2054,-166.39002 0.11638,-13.21684 0.29028,-26.43331 0.34916,-39.65053 0.19804,-44.45883 -0.41605,-88.91846 -1.04647,-133.3715 -0.36252,-14.49096 -0.93813,-28.97218 -1.44009,-43.45845 0,-13.85843 3.91975,-13.85843 3.91975,0 z"></path>
    <path style="stroke-width: 8; stroke-miterlimit: 4; stroke-dasharray: none; stroke-opacity: 1; stroke: #EEE8AA; fill: rgb(2, 255, 187);" id="path4367" d="m 369.14328,508.13854 c 1.49857,13.11239 0.69557,26.3101 0.15416,39.4517 -1.13642,22.44626 -3.239,44.82601 -5.03737,67.22374 -2.65146,33.02251 -2.59291,36.4542 -5.91745,70.55424 -1.28431,13.17321 -2.76445,26.3266 -4.14668,39.48991 -1.62318,13.16627 -3.20614,26.33757 -4.86955,39.49882 -3.77015,29.83019 -5.69143,42.65961 -9.16727,72.15433 -3.42922,29.09923 -6.23534,58.24208 -8.77198,87.42962 -1.14086,16.84151 -2.6656,33.68218 -3.22445,50.56022 -0.10599,3.20115 -0.0667,6.40546 -0.10002,9.60819 -0.27465,10.53584 -3.25463,10.45816 -2.97998,-0.0777 l 0,0 c 0.13453,-3.23691 0.19146,-6.47798 0.40359,-9.71074 1.10667,-16.86595 3.20367,-33.66274 4.57097,-50.50553 2.97065,-29.14881 6.08368,-58.27764 9.73044,-87.35152 4.6683,-37.21811 10.09791,-74.34017 14.32932,-111.61392 1.35896,-13.16473 2.87372,-26.31431 4.07689,-39.4942 2.51766,-27.57928 3.31247,-43.41496 4.9877,-70.6199 1.379,-22.39433 2.81,-44.78858 3.51825,-67.21737 0.17981,-12.81265 0.72331,-25.72504 -1.36755,-38.42715 -3.36845,-13.47383 0.44252,-14.42658 3.81098,-0.95275 z"></path>
    <path style="stroke-width: 8; stroke-miterlimit: 4; stroke-dasharray: none; stroke-opacity: 1; stroke: #EEE8AA; fill: rgb(2, 255, 187);" id="path4371" d="m 77.099822,639.18983 c 2.445978,0.35048 4.882264,0.777 7.337936,1.05146 14.089834,1.57477 27.329852,2.49678 41.645522,3.19557 11.94425,0.58304 23.89463,1.07556 35.84987,1.35377 31.74377,0.73871 62.88626,0.48577 94.66145,0.44653 54.6798,-0.39174 109.36414,-0.95778 164.02451,-2.5548 33.34666,-0.9743 55.60145,-2.0434 88.278,-3.46204 0.28033,-0.0122 0.28377,0.0671 0.003,0.0793 l 0,0 c -32.67737,1.41868 -54.93202,2.48777 -88.27958,3.46209 -54.66096,1.59704 -109.34588,2.16308 -164.02627,2.55483 -55.57163,0.0686 -42.08342,0.1818 -94.66864,-0.22422 -28.48464,-0.21993 -57.01353,-0.25837 -85.449517,-2.16281 -13.221729,-2.20363 -12.598451,-5.9433 0.623279,-3.73967 z"></path>
    <path style="stroke-width: 8; stroke-miterlimit: 4; stroke-dasharray: none; stroke-opacity: 1; stroke: #EEE8AA; fill: rgb(2, 255, 187);" id="path4373" d="m 87.105643,797.60819 c 9.562746,0.37699 11.865295,0.49856 23.418947,0.72668 7.41238,0.14636 14.82648,0.19166 22.23916,0.32212 37.87921,0.66665 75.75468,1.36225 113.63626,1.9069 71.58979,1.78475 143.06439,6.41391 214.61012,9.28097 47.36049,1.89788 48.99458,1.68052 94.17594,2.44397 11.79504,-0.0543 23.59008,-0.10866 35.38512,-0.16299 1.24745,-9.3e-4 1.24772,0.3519 2.6e-4,0.35283 l 0,0 c -11.79557,-0.0368 -23.59115,-0.0737 -35.38672,-0.11048 -45.18261,-0.76349 -46.81662,-0.54612 -94.17824,-2.44405 -71.54491,-2.86702 -143.01867,-7.49612 -214.60762,-9.2809 -14.99054,-0.21552 -29.97982,-0.55417 -44.97162,-0.64658 -12.77975,-0.0788 -25.55993,0.0667 -38.33975,0.13307 -25.32836,0.13146 -50.67068,0.23292 -75.981857,1.27212 -13.412621,0 -13.412621,-3.79366 0,-3.79366 z"></path>
  </g>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="345" y="129">מינימום</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="197" y="129">מקסימום</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="300" y="273">10</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="177" y="273">100</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="300" y="440">20</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="177" y="440">200</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="534.717" y="273"> שנה ראשונה</text>
  <text style="fill:  rgb(255, 0, 146); font-family: Gan,Powerr; font-size: 25.1px; white-space: pre;" text-anchor="center" x="497.547" y="440">שנה שניה</text>
</svg>
</div>-->
  </div>


       </div>
       <div dir="rtl"  style="overflow-y:visible" class=" bg-transparent ">

       {#if low == false}
 {#if already === false && allr === false && alreadyi == false}
                <button onmouseenter={()=>hover({"he":"אני רוצה","en":"yes I want"})}
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
             onmouseenter={()=>hover({"he":"לא מתאים לי", "en": "not for me"})}
             onmouseleave={()=>hover("0")}
             onclick={()=>decline("f")}
              class = "btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110"
              name="decline">
              <No/>
            </button>
            {:else if alreadyi == true}
            <button onmouseenter={()=>hover({"he":"צ'אט","en":"chat"})} onmouseleave={()=>hover("0")}  class="text-barbi btnc flex items-center" onclick={() => tochat()}><Chaticon/></button>

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
