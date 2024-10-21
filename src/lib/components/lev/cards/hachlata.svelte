<script>

        import tr from '$lib/translations/tr.json'
  import { createEventDispatcher, onMount } from 'svelte';
 const dispatch = createEventDispatcher();
  import Lev from '../../../celim/lev.svelte';
  import {lang} from '$lib/stores/lang.js'
      export let low = false;
      export let isVisible = false;
        import { formatTime } from '../utils';
import Lowbtn from '$lib/celim/lowbtn.svelte'
  import No from '../../../celim/no.svelte'
  import { restim } from '$lib/func/restime.svelte';
    export let projectName,restime, src,src2 ,openmissionName, missionDetails, useraplyname, noofusersNo, noofusersOk,noofusersWaiting,deadline,spdata,kind,price
    export let already = false;
     export let timegramaDate
    let zman
  onMount(()=>{
        let x = restim(restime)
    let cr = new Date(timegramaDate)
    let crr = cr.getTime() //if nego then use last nego creationtime
  console.log(zman , Date.now() , crr , x)
       setInterval(() => {
   zman = -((Date.now() - cr) - x)
      }, 1)
  })
    const isPublikLevel ={"he":"לפרסם ולפתוח את השירות לכל?","en":"is the service should be public and open for everyone ?"}
    const isPublikFl = {"he":"ציבורי","en":"public"}
    const isPublikTr = {"he":"פרטי","en":"private"}
    const oneTimeLevel = {"he":"השירות הינו חד פעמי או על בסיס חודשי","en":"one time service or monthly based"}
    const oneTimeTr = {"he":"חודשי","en":"monthly"}
    const oneTimeFl = {"he":"חד פעמי","en":"one time"}
    const createLebel = {"he":"יצירת שירות חדש","en":"create new service"}
    const equaliSplitedLevel = {"he":"עלויות השירות מחולקות באופן שווה או שאין סכום מסוים שחובה לתת","en":"is the service cost are splited equally or the subscribers pay what they want"}
    const equaliSplitedFl = {"he":"חלוקה שווה","en":"splited equally"}
    const equaliSplitedTr = {"he":"דמי מנוי","en":"subscription"}
    const timero = {"he":"מונה זמן לסיום הדיון", "en":"time counter for end of discution"}
    const oldob = {"he":"הלוגו העכשווי", "en":"old Logo"}
    const newlogo = {"he":"הלוגו החדש", "en":"new logo"}
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
function linke(t){
  console.log(t)
}
const tri = import('$lib/translations/tr.json')

</script>


<div dir="{$lang == 'he' ? 'rtl' : 'ltr'}"  class=" d {isVisible ? $lang == 'he' ? 'boxleft' : 'boxright' : ''} leading-normal w-[90%] h-[90%] bg-white lg:w-[90%] overflow-y-auto">
 <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
  </div>-->
   <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
      <div class="relative flex items-center space-x-1">
         <div class="relative">
         <img src={src}  alt="" class="w-10 sm:w-16 h-10 sm:h-16  rounded-full">
         </div>
         <div class="flex flex-col leading-tight">
            <div class=" text-md mt-1 flex items-center">
               <span class="text-barbi text-center mr-3 sm:text-xl text-sm">{tr?.headers[kind][$lang]}</span>
            </div>
            <span style="text-shadow: 1px 1px white;" class="pn ml-1 text-lg sm:text-2xl text-barbi ">{projectName}</span>
         </div>
         </div>
         </div>
  <div  class="d bg-white rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
    <div  class="mb-8">
        {#if kind == "sheirutpends"}
              <h1 class="text-gray-900 font-bold text:2xl sm:text-3xl mb-2">{spdata.sheirut.data.attributes.name}</h1>
          <p class="text-gray-900 font-bold text-xl mb-2">{spdata.sheirut.data.attributes.descrip}</p>
          <h5 class="text-barbi font-bold text-xl mb-2">⚙️{spdata.sheirut.data.attributes.oneTime ? oneTimeTr[$lang]:oneTimeFl[$lang]}</h5>
          <h5 class="text-barbi font-bold text-xl mb-2">🧮{spdata.sheirut.data.attributes.equaliSplited ? equaliSplitedTr[$lang]:equaliSplitedFl[$lang]}</h5>
          {:else if kind == "pic"}
          <div class="w-full sm:w-3/4 lg:w-1/3">
          <svg class="scale-110" height="100%" width="100%" version="1.1" id="desLayer_1" x="0px" y="0px" viewBox="1194.702695 779.45875 162.446096 162.190653" enable-background="new 0 0 2103.3203 1667.9167" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:bx="https://boxy-svg.com">
        <defs>
                <bx:grid x="-23.43558" y="159.787667" width="100" height="100"/>
                <linearGradient id="deslinearGradient4172">
                        <stop style="stop-opacity: 1; stop-color: rgb(105, 197, 209);" offset="0" id="desstop4174"/>
                        <stop offset="0.083" style="stop-color: rgb(255, 172, 64);"/>
                        <stop offset="0.181" style="stop-color: rgb(107, 99, 228);"/>
                        <stop offset="0.307" style="stop-color: rgb(228, 105, 250);"/>
                        <stop offset="0.517" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.669" style="stop-color: rgb(242, 133, 220);"/>
                        <stop offset="0.915" style="stop-color: rgb(47, 225, 184);"/>
                        <stop style="stop-opacity: 0; stop-color: rgb(16, 255, 191);" offset="1" id="desstop4176"/>
                </linearGradient>
                <path id="destext-path-0" d="M 262.9292457252741 724.03125 Q 374.44947788864374 615.765625 485.9697100520134 724.03125"/>
                <path id="destext-path-1" d="M 229.6546981483698 748.2107315063477 Q 374.4493424668908 640.0388565063477 519.2439867854118 748.2107315063477"/>
                <linearGradient id="desgradient-8">
                        <stop offset="0" style="stop-color: rgb(65, 21, 136);"/>
                        <stop offset="0.2072" style="stop-color: rgb(255, 163, 4);"/>
                        <stop offset="0.4213" style="stop-color: rgb(161, 254, 208);"/>
                        <stop offset="0.641" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.7258" style="stop-color: rgb(255, 199, 253);"/>
                        <stop offset="1" style="stop-color: #4bc0c8;"/>
                </linearGradient>
                <linearGradient id="desgradient-8-0" gradientUnits="userSpaceOnUse" x1="-11.410587" y1="-74.731157" x2="-11.410587" y2="125.268835" gradientTransform="matrix(-0.754888680208, -0.655853626728, 0.701070978292, -0.790485016248, -26.552696643615, 20.378790698498)" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-1" gradientUnits="userSpaceOnUse" x1="0" y1="-80" x2="0" y2="80" gradientTransform="matrix(0.726894335271, 0.686750080346, -0.804564100907, 0.856592964427, -11.269566742122, 8.384562548277)" xlink:href="#desgradient-8"/>
                <linearGradient id="deslinearGradient4172-2" gradientUnits="userSpaceOnUse" x1="0" y1="-80" x2="0" y2="80" xlink:href="#deslinearGradient4172"/>
                <linearGradient id="deslinearGradient4172-4" gradientUnits="userSpaceOnUse" x1="0" y1="-100" x2="0" y2="100" xlink:href="#deslinearGradient4172"/>
                <linearGradient x1="-0.028894" x2="-0.028894" y1="-0.221767" y2="0.778233" id="desgradient-0" gradientTransform="matrix(-0.223797066, 2.807657279324, -0.735254724459, -0.142553470129, 0.630090949504, 0.682546054271)">
                        <stop offset="0" style="stop-color: rgb(254, 172, 94);"/>
                        <stop offset="0.2037" style="stop-color: rgb(231, 7, 252);"/>
                        <stop offset="0.5881" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="1" style="stop-color: rgb(75, 192, 200);"/>
                </linearGradient>
                <linearGradient x1="0" x2="0" y1="0" y2="1" id="desgradient-19" gradientTransform="matrix(0.999989392915, -0.00690363767, -7.381e-9, 1.392766101665, 0.508886933327, 0.051793377846)">
                        <stop offset="0" style="stop-color: rgb(105, 197, 209);"/>
                        <stop offset="0.083" style="stop-color: rgb(255, 172, 64);"/>
                        <stop offset="0.181" style="stop-color: rgb(107, 99, 228);"/>
                        <stop offset="0.307" style="stop-color: rgb(228, 105, 250);"/>
                        <stop offset="0.517" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.669" style="stop-color: rgb(242, 133, 220);"/>
                        <stop offset="0.915" style="stop-color: rgb(47, 225, 184);"/>
                        <stop offset="1" style="stop-color: rgb(16, 255, 191); stop-opacity: 0"/>
                </linearGradient>
                <linearGradient id="desgradient-8-2" gradientUnits="userSpaceOnUse" x1="62.5" y1="100" x2="62.5" y2="124" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-3" gradientUnits="userSpaceOnUse" x1="60.899998" y1="101.699997" x2="60.899998" y2="122.299995" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-4" gradientUnits="userSpaceOnUse" x1="58.896753" y1="104.634323" x2="58.896753" y2="113.276024" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-5" gradientUnits="userSpaceOnUse" x1="49.499998" y1="20.399998" x2="49.499998" y2="34.899998" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-6" gradientUnits="userSpaceOnUse" x1="79.39999" y1="4" x2="79.39999" y2="88.5" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-7" gradientUnits="userSpaceOnUse" x1="60.584377" y1="4.2" x2="60.584377" y2="88.504451" xlink:href="#desgradient-8"/>
                <linearGradient id="desgradient-8-8" gradientUnits="userSpaceOnUse" x1="48.602041" y1="8.267158" x2="48.602041" y2="27.711257" xlink:href="#desgradient-8"/>
                <linearGradient x1="0" x2="0" y1="0" y2="1" id="desgradient-2">
                        <stop offset="0" style="stop-color: rgb(105, 197, 209);"/>
                        <stop offset="0.083" style="stop-color: rgb(255, 172, 64);"/>
                        <stop offset="0.181" style="stop-color: rgb(107, 99, 228);"/>
                        <stop offset="0.307" style="stop-color: rgb(228, 105, 250);"/>
                        <stop offset="0.4967" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.669" style="stop-color: rgb(242, 133, 220);"/>
                        <stop offset="0.915" style="stop-color: rgb(47, 225, 184);"/>
                        <stop offset="1" style="stop-color: rgb(16, 255, 191); stop-opacity: 0"/>
                </linearGradient>
                <linearGradient x1="0" x2="0" y1="0" y2="1" id="desgradient-3">
                        <stop offset="0" style="stop-color: rgb(254, 172, 94);"/>
                        <stop offset="0.2037" style="stop-color: rgb(231, 7, 252);"/>
                        <stop offset="0.5881" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="1" style="stop-color: rgb(75, 192, 200);"/>
                </linearGradient>
                <linearGradient x1="0" x2="0" y1="0" y2="1" id="desgradient-4">
                        <stop offset="0" style="stop-color: rgb(105, 197, 209);"/>
                        <stop offset="0.083" style="stop-color: rgb(255, 172, 64);"/>
                        <stop offset="0.181" style="stop-color: rgb(107, 99, 228);"/>
                        <stop offset="0.307" style="stop-color: rgb(228, 105, 250);"/>
                        <stop offset="0.517" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.669" style="stop-color: rgb(242, 133, 220);"/>
                        <stop offset="0.915" style="stop-color: rgb(47, 225, 184);"/>
                        <stop offset="1" style="stop-color: rgb(16, 255, 191); stop-opacity: 0"/>
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1277.371582" y1="878.059692" x2="1277.371582" y2="915.86908" id="desgradient-1" gradientTransform="matrix(0.999842524528, 0.017750786617, -4.8996e-7, 0.817124962807, -0.436929970915, 144.130935668888)">
                        <stop offset="0" style="stop-color: rgb(254, 172, 94);"/>
                        <stop offset="0.2037" style="stop-color: rgb(231, 7, 252);"/>
                        <stop offset="0.7503" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="1" style="stop-color: rgb(75, 192, 200);"/>
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1275.92572" y1="887.198853" x2="1275.92572" y2="918.401733" id="desgradient-10" gradientTransform="matrix(1.966910847481, -0.012811510475, 0.103871255342, 1.227695672948, -1325.221774444, -198.180313027092)">
                        <stop offset="0" style="stop-color: rgb(254, 172, 94);"/>
                        <stop offset="0.2037" style="stop-color: rgb(231, 7, 252);"/>
                        <stop offset="0.5881" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="1" style="stop-color: rgb(75, 192, 200);"/>
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1213.250004" y1="793.897034" x2="1213.250004" y2="811.712948" id="desgradient-8-12" gradientTransform="matrix(0.99953350807, 0.023905547683, 0.051217046866, 3.148688275153, -40.09509024791, -1734.840653697257)" xlink:href="#desgradient-8"/>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1212.220001" y1="792.222473" x2="1212.220001" y2="811.472059" id="desgradient-5" gradientTransform="matrix(0.998129736518, -0.048505495716, -0.047405668989, 1.195203713433, 40.735545945283, -99.603026110877)">
                        <stop offset="0" style="stop-color: rgb(254, 172, 94);"/>
                        <stop offset="0.2037" style="stop-color: rgb(231, 7, 252);"/>
                        <stop offset="0.6763" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="1" style="stop-color: rgb(75, 192, 200);"/>
                </linearGradient>
                <radialGradient gradientUnits="userSpaceOnUse" cx="272.799042" cy="690.554321" r="14.029419" id="desgradient-6">
                        <stop offset="0" style="stop-color: rgb(105, 197, 209);"/>
                        <stop offset="0.083" style="stop-color: rgb(255, 172, 64);"/>
                        <stop offset="0.181" style="stop-color: rgb(107, 99, 228);"/>
                        <stop offset="0.307" style="stop-color: rgb(228, 105, 250);"/>
                        <stop offset="0.517" style="stop-color: rgb(255, 255, 255);"/>
                        <stop offset="0.669" style="stop-color: rgb(242, 133, 220);"/>
                        <stop offset="0.915" style="stop-color: rgb(47, 225, 184);"/>
                        <stop offset="1" style="stop-color: rgb(16, 255, 191); stop-opacity: 0"/>
                </radialGradient>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1212.219936" y1="792.332458" x2="1212.219936" y2="811.325251" id="desgradient-8-9" xlink:href="#desgradient-8"/>
                <linearGradient gradientUnits="userSpaceOnUse" x1="1213.249935" y1="793.903076" x2="1213.249935" y2="811.70492" id="desgradient-8-10" xlink:href="#desgradient-8"/>
        </defs>
  
        <g transform="matrix(-26.963636398315, -0.16880223155, 0.16880223155, -26.963636398315, 2040.875854492188, 769.663757324219)"/>
        <path d="M 258.769635 678.009259 H 273.142181 L 263.421941 634.502746 L 286.828448 690.554332 L 263.421941 746.605918 L 273.142181 703.099404 H 258.769635 V 678.009259 Z" style="fill: url(#desgradient-0); stroke-linejoin: bevel; stroke-linecap: round; stroke: url(#desgradient-6); stroke-opacity: 0.15; stroke-width: 50px;" transform="matrix(0.015224737447, 0.999884096968, -0.999884097408, 0.015224708582, 1962.671874999992, 567.42761230469)" bx:shape="arrow 258.769635 634.502746 28.058813 112.103172 25.090145 23.406507 9.72024 1@cd22d2f5"/>
        <path d="M 1272.445046 869.363904 Q 1275.925773 868.86837 1279.4065 869.363904 L 1287.25665 870.481493 Q 1290.737377 870.977027 1293.616254 872.377948 L 1300.109042 875.537473 Q 1302.987919 876.938394 1304.767164 879.002469 L 1308.779927 883.657619 Q 1310.559171 885.721694 1310.931135 888.092027 L 1311.770031 893.437884 Q 1312.141994 895.808217 1311.042361 898.074955 L 1308.562336 903.187172 Q 1307.462703 905.45391 1305.081609 907.225113 L 1299.711484 911.219742 Q 1297.33039 912.990946 1294.079549 913.960357 L 1286.747866 916.14669 Q 1283.497025 917.116102 1279.938536 917.116102 L 1271.91301 917.116102 Q 1268.354521 917.116102 1265.10368 916.14669 L 1257.771997 913.960357 Q 1254.521156 912.990946 1252.140062 911.219742 L 1246.769937 907.225113 Q 1244.388843 905.45391 1243.28921 903.187172 L 1240.809185 898.074955 Q 1239.709552 895.808217 1240.081515 893.437884 L 1240.920411 888.092027 Q 1241.292375 885.721694 1243.071619 883.657619 L 1247.084382 879.002469 Q 1248.863627 876.938394 1251.742504 875.537473 L 1258.235292 872.377948 Q 1261.114169 870.977027 1264.594896 870.481493 Z" style="stroke: url(#desgradient-19); fill: url(#desgradient-10); stroke-miterlimit: 7; stroke-width: 5px; stroke-opacity: 0.51;" bx:shape="n-gon 1275.925773 893.25873 36.41571 24.39036 15 0.235 1@3e6751a7"/>
        <g transform="matrix(0.288743883371, 0, 0, 0.21300779283, 1258.6982421875, 838.323364257813)" style="">
                <g>
                        <circle style="fill: rgb(189, 189, 189); stroke: url(#desgradient-8-2);" cx="62.5" cy="112" r="12"/>
                        <circle style="fill: rgb(224, 224, 224); stroke: url(#desgradient-8-3);" cx="60.9" cy="112" r="10.3"/>
                        <path style="fill: rgb(255, 255, 255); stroke: url(#desgradient-8-4);" d="M55.1,108.4c1.2-1.8,3.8-3.3,6.5-3.7c0.7-0.1,1.3-0.1,1.9,0.1c0.4,0.2,0.8,0.6,0.5,1 c-0.2,0.4-0.7,0.5-1.1,0.6c-2.5,0.7-4.8,2.4-6.2,4.4c-0.5,0.8-1.4,2.9-2.4,2.4C53.3,112.5,53.5,110.6,55.1,108.4z"/>
                        <path style="fill: rgb(189, 189, 189); stroke: url(#desgradient-8-5);" d="M46.1,24.3c-2.1,2-3.4,4.4-4,7.4c-0.3,1.9-2,3.2-3.9,3.2h6.9c1.9,0,3.6-1.3,3.9-3.2 c0.5-3,1.9-5.4,4-7.4c2.1-1.9,4.7-3.1,7.8-3.6c-1.1-0.2-2.3-0.3-3.5-0.3C52.7,20.5,49,21.8,46.1,24.3z"/>
                        <path style="fill: rgb(189, 189, 189); stroke: url(#desgradient-8-6);" d="M89.5,12.2C83.4,6.7,75,4,64.2,4c-1.2,0-2.3,0-3.4,0.1c9.1,0.5,16.4,3.2,21.8,8.1 c6.1,5.5,9.1,13.2,9.1,23c0,8.8-4.1,17.4-12.2,25.9l-9.8,9.6c-0.1,0.1-0.2,0.2-0.3,0.3c-2.9,3.4-4.6,8-5.2,13.9 c-0.2,2-1.9,3.6-4,3.6h6.9c2,0,3.8-1.6,4-3.6c0.5-5.9,2.3-10.5,5.2-13.9c0.1-0.1,0.2-0.2,0.3-0.3l9.8-9.6 c8.2-8.5,12.2-17.1,12.2-25.9C98.5,25.4,95.5,17.7,89.5,12.2z"/>
                        <path style="fill: rgb(224, 224, 224); stroke: url(#desgradient-8-7); stroke-width: 4.2069px;" d="M64.2,85c0.5-5.9,2.3-10.5,5.2-13.9c0.1-0.1,0.2-0.2,0.3-0.3l9.8-9.6c8.2-8.5,12.2-17.1,12.2-25.9 c0-9.8-3-17.5-9.1-23C77.2,7.4,70,4.7,60.8,4.2c-8.9,0.5-16.2,3.3-21.9,8.2C33.6,17,30.4,23,29.5,30.5c-0.3,2.4,1.6,4.4,4,4.4h4.8 c1.9,0,3.6-1.3,3.9-3.2c0.5-3,1.9-5.4,4-7.4c2.8-2.6,6.6-3.9,11.2-3.9c1.2,0,2.4,0.1,3.5,0.3c1.1-0.2,2.2-0.3,3.4-0.3 c4.8,0,8.5,1.3,11,4s3.8,6.5,3.8,11.5c0,3.8-1.1,7.4-3.2,10.6c-1.4,2.2-4.7,5.8-10,10.9c-5.2,5.1-8.8,9.8-10.5,14 c-1.4,3.4-2.3,7.7-2.5,12.9c-0.1,2.3,1.7,4.2,4,4.2l0,0h3.5C62.2,88.6,64,87,64.2,85z"/>
                        <path style="fill: rgb(255, 255, 255); stroke: url(#desgradient-8-8);" d="M39.6,15.9C43,11.7,49.5,8.7,56,8.3c1.6-0.1,3.2,0,4.5,0.7c1,0.5,1.7,1.6,1,2.6 c-0.6,0.8-1.8,1.1-2.8,1.3c-6.1,1.2-12,4.7-15.9,9.3c-1.5,1.8-4,6.8-6.2,5.2C34.3,25.5,35.4,21,39.6,15.9z"/>
                </g>
        </g>
        <path d="M 1275.254748 881.616379 Q 1277.371544 881.308248 1279.48834 881.616379 L 1280.975819 881.832903 Q 1283.092615 882.141034 1285.002205 883.035265 L 1286.344079 883.663644 Q 1288.253668 884.557875 1289.769127 885.950672 L 1290.834044 886.929395 Q 1292.349503 888.322192 1293.322488 890.077219 L 1294.006207 891.310481 Q 1294.979191 893.065508 1295.314459 895.010971 L 1295.550052 896.378053 Q 1295.88532 898.323515 1295.550052 900.268977 L 1295.314459 901.636059 Q 1294.979191 903.581522 1294.006207 905.336549 L 1293.322488 906.569811 Q 1292.349503 908.324838 1290.834044 909.717635 L 1289.769127 910.696358 Q 1288.253668 912.089155 1286.344079 912.983386 L 1285.002205 913.611765 Q 1283.092615 914.505996 1280.975819 914.814127 L 1279.48834 915.030651 Q 1277.371544 915.338782 1275.254748 915.030651 L 1273.767269 914.814127 Q 1271.650473 914.505996 1269.740883 913.611765 L 1268.399009 912.983386 Q 1266.48942 912.089155 1264.973961 910.696358 L 1263.909044 909.717635 Q 1262.393585 908.324838 1261.4206 906.569811 L 1260.736881 905.336549 Q 1259.763897 903.581522 1259.428629 901.636059 L 1259.193036 900.268977 Q 1258.857768 898.323515 1259.193036 896.378053 L 1259.428629 895.010971 Q 1259.763897 893.065508 1260.736881 891.310481 L 1261.4206 890.077219 Q 1262.393585 888.322192 1263.909044 886.929395 L 1264.973961 885.950672 Q 1266.48942 884.557875 1268.399009 883.663644 L 1269.740883 883.035265 Q 1271.650473 882.141034 1273.767269 881.832903 Z" style="stroke: url(#desgradient-2); stroke-miterlimit: 17; fill: url(#desgradient-1); stroke-width: 2px;" transform="matrix(-1, 1e-12, 2e-12, -1, 2553.297363280778, 1717.467407226184)" bx:shape="n-gon 1277.371544 898.323515 18.513776 17.015267 20 0.37 1@f7764595"/>
           <foreignObject 
           role="button" tabindex="0"
            on:click={()=>linke("u")}
             on:keypress={()=>linke("u")}
              on:mouseenter={()=>hover({"he":"הלוגו העכשווי", "en":"old Logo"})} 
              on:mouseleave={()=>hover("0")} x='1276' y='820' width='38px' height='38px' transform="translate(-19,-19)" >
                                                  <span class="{`normSml${projectName}-noo`}"></span>
                                                    <img
                                                        width='38px'
                                                        height='38px'
                                                        alt="{oldob[$lang]}"
                                                        src={src}
                                                        style="border-radius: 50%;"
                                                        /> 
                          </foreignObject> 
             <foreignObject x='1276' y='892' width='50px' height='50px' transform="translate(-25,-25)" >
              <img on:mouseenter={()=>hover(newlogo)} on:mouseleave={()=>hover("0")} style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src2} width="50" height="50" alt="new project logo" >
            </foreignObject>

      </svg>

          </div>
          {/if}
     {#if missionDetails} <p class="text-gray-700 text-base">{missionDetails}</p>{/if}
    </div>
    <div class="flex items-center">
      <div class="text-lg sm:text-xl">
        <p class="vo ef"><span role="contentinfo" on:mouseenter={()=>hover("סך ההצבעות בעד")} on:mouseleave={()=>hover("0")}  style="color:#7EE081;" >{noofusersOk}-בעד</span> <span on:mouseenter={()=>hover("לא הצביעו")} on:mouseleave={()=>hover("0")}  style="color:#0000cc;" >{noofusersWaiting}-טרם </span><span on:mouseenter={()=>hover("כמות ההצבעות נגד")} on:mouseleave={()=>hover("0")}  style="color:#80037e;" >{noofusersNo}-על גרסאות קודמות</span></p>
          <div class="flex items-center justify-center m-1 "><span role="contentinfo" aria-label="{timero[$lang]}" class="bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre text-center text-barbi p-2 sm:text-2xl text-xl" style:font-family="Digital" on:mouseenter={()=>hover(timero[$lang])} on:mouseleave={()=>hover("0")}  style="font-weight: 300; letter-spacing: 1px; text-shadow: 1px 1px black;">
            {formatTime(zman)}
        </span></div> 

      </div>
    </div>
  </div>
  {#if low == false}
   {#if already === false}
            <button on:mouseenter={()=>hover("אישור")}
               on:mouseleave={()=>hover("0")} 
               on:click={agree} 
                class = "btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
                 name="requestToJoin">
                <Lev/>
                </button>
          <!-- <button3 on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button3>--> 
            <button
             on:mouseenter={()=>hover("התנגדות")} 
             on:mouseleave={()=>hover("0")} 
             on:click={decline} 
              class = "btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110" 
              name="decline">
              <No/>
            </button>
        {/if}
         {:else if low == true}
          <Lowbtn isCart="true"/>
        {/if}
</div>