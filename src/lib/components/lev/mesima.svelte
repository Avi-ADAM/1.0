
<script>
  import {
    createEventDispatcher
} from 'svelte';
import Tile from '$lib/celim/tile.svelte'
 const dispatch = createEventDispatcher();
import { lang } from '$lib/stores/lang.js'
  import { RingLoader
} from 'svelte-loading-spinners';
export let missionId;
let projectUsers =[];
let token;
let idL;
let srcP;
let error1 = null;
let projecto = [];
async function xyd () {
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
    let datar;
    let bearer1 = 'bearer' + ' ' + token;
        const parseJSON = (resp) => (resp.json ? resp.json() : resp);
        const checkStatus = (resp) => {
        if (resp.status >= 200 && resp.status < 300) {
          return resp;
        }
        return parseJSON(resp).then((resp) => {
          throw resp;
        });
      };
      const headers = {
        'Content-Type': 'application/json'   
      };
        let link ="https://tov.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
          `{  openMission (id:${missionId}) {data{attributes{ sqadualed
             project {data{ id attributes{ projectName timeToP profilePic {data{ attributes{url  }}}}}}
            tafkidims {data{attributes{roleDescription ${$lang == 'he' ? 'localizations{data{attributes{ roleDescription }}}' : ""}}}}
            skills {data{attributes{skillName ${$lang == 'he' ? 'localizations{data{attributes{skillName }}}' : ""}}}}
            descrip
            hearotMeyuchadot
            name dates
            work_ways {data{attributes{workWayName ${$lang == 'he' ? 'localizations{data{attributes{workWayName }}}' : ""}}}}
            noofhours perhour   }}}
        }`
        })
})
  .then(r => r.json())
  .then(data => datar = data.data.openMission.data.attributes);
  if ($lang != "en" ){
              for (var i = 0; i < datar.skills.data.length; i++){
                if (datar.skills.data[i].attributes.localizations.data.length > 0){
                datar.skills.data[i].attributes.skillName = datar.skills.data[i].attributes.localizations.data[0].attributes.skillName
                }
              }
              for (var i = 0; i < datar.tafkidims.data.length; i++){
                if (datar.tafkidims.data[i].attributes.localizations.data.length > 0){
                datar.tafkidims.data[i].attributes.roleDescription = datar.tafkidims.data[i].attributes.localizations.data[0].attributes.roleDescription
                }
              }
              for (var i = 0; i < datar.work_ways.data.length; i++){
                if (datar.work_ways.data[i].attributes.localizations.data.length > 0){
                datar.work_ways.data[i].attributes.workWayName = datar.work_ways.data[i].attributes.localizations.data[0].attributes.workWayName
                }
              }
            }
            datar = datar

            console.log(data)
        } catch (e) {
            error1 = e
            console.log(error1)
        }
        return datar
    };

    function project (x){
      dispatch('project',{id:x})
    }
    function hover(x){
      //
    }
    let data = xyd();
    const headi = {"he":"הצעה למשימה", "en":"suggested mission"}
    const om = {"he":"משימה פתוחה", "en": "open mission"}
</script>
 {#await data}
 <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
 {:then data}

<div dir="rtl"  style="overflow-y:auto" class=" d mb-4 mt-8 bg-white leading-normal w-full  bg-white lg:w-full">
 <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
  </div>-->
   <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
      <div class="relative flex items-center space-x-1">
         <div class="relative">
         <img src={data.project.data.attributes.profilePic.data?.attributes.url}  alt="" class="w-10 sm:w-16 h-10 sm:h-16  rounded-full">
         </div>
         <div class="flex flex-col leading-tight">
            <div class="sm:text-sm text-md mt-1 flex items-center">
               <span class="text-barbi text-center mr-3 sm:text-2xl text-sm">{headi[$lang]}</span>
            </div>
            <span style=" text-shadow: 1px 1px white;" class="pn ml-1 text-sm sm:text-lg text-barbi ">{data.project.data.attributes.projectName}</span>
         </div>
         </div>
         </div>
  <div  class=" bg-white rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
    <div  class="mb-8">
         <p style="line-height: 1;" class="text-sm text-gray-600 flex items-center">
            <img style="width:2.5rem;" class=""  src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
            <span on:mouseenter={()=>hover({"he":"שווי לשעה","en":"vallue per hour"})} on:mouseleave={()=>hover("0")} > {data.perhour.toLocaleString('en-US', {maximumFractionDigits:2})} לשעה </span> * <span on:mouseenter={()=>hover({"he":"כמות השעות", "en":"amount of hours"})} on:mouseleave={()=>hover("0")}  > {data.noofhours.toLocaleString('en-US', {maximumFractionDigits:2})} שעות </span> = <span on:mouseenter={()=>hover({"he":"סך הכל","en": "total"})} on:mouseleave={()=>hover("0")}>{(data.noofhours * data.perhour).toLocaleString('en-US', {maximumFractionDigits:2})} </span>
      </p>
      <div style="font-size: 17px;" class="  mb-2"><h2 class="text-barbi font-bold">{data.name}</h2></div>
  {#if data.descrip !== null && data.descrip !== "null"  && data.descrip !== "undefined"  && data.descrip !== undefined} <p class="cd d max-h-16 text-gray-700 text-base">{data.descrip}</p>{/if}
{#if data.hearotMeyuchadot}
     <p on:mouseenter={()=>hover("הערות")} on:mouseleave={()=>hover("0")} class="text-grey-700 max-h-16 cd text-sm d">{data.hearotMeyuchadot !== undefined && data.hearotMeyuchadot !== null && data.hearotMeyuchadot !== "undefined" ? data.hearotMeyuchadot : ""}</p>
     {/if}
    {#if data.skills.length > 0}
            <small class="text-barbi text-sm ">כישורים נדרשים:</small>
            <div class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 "> 
               {#each data.skills as skill}<p on:mouseenter={()=>hover({"he":"הכישורים הנדרשים","en": "needed skills"})} on:mouseleave={()=>hover("0")}  >
                <Tile pink={true} word={skill.attributes.skillName}/></p>
                {/each}
    </div>
    {/if}
     {#if data.tafkidims.length > 0}  <small class="text-sm text-barbi">תפקידים נדרשים:</small>
            <div class="border border-gold flex flex-row  flex-wrap justify-center align-middle d  cd p-2">  
              {#each data.tafkidims as rol}
              <p on:mouseenter={()=>hover({"he":"תפקיד מבוקש", "en":"requested role"})} on:mouseleave={()=>hover("0")} class="m-0" style="text-shadow:none;" >
        <Tile word={rol.attributes.roleDescription} wow={true}/></p>{/each}
    </div>{/if}
    {#if data.work_ways.length > 0}  <small class="text-sm text-barbi">דרכי העבודה:</small>
            <div class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 "> 
                {#each data.work_ways as rol}<p on:mouseenter={()=>hover({"he":"דרכי עבודה מבוקשות","en":"ways of work for the mission"})} on:mouseleave={()=>hover("0")} class="m-0" style="text-shadow:none;" >
              <Tile bg="gold"   word={rol.attributes.workWayName}/></p>{/each}
    </div>{/if}
           <button on:click={()=>project(data.project.data.id)} class="px-4 hover:text-barbi text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink rounded text-sm mt-2 border-2 border-gold" >לצפיה בריקמה </button >

    </div>
  
        

       </div><!---
<div class="dd md:items-center  d full pb-2">
  <div class="body items-center d" >
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >{om[$lang]}</h1>
    </caption>
        
    <tr class="ggr" style:top={ "1px"}>
      <th class="ggr">שם</th>
            <td class="ggr">{data.name}</td>
          </tr> <tr>
            <th>תיאור</th>
            <td>{data.descrip}</td>
            </tr> <tr>
              <th>כישורים נדרשים</th>
            <td>
              {#each data.skills as da, i}
                 {` ${da.skillName} `}
              {/each} 
              </td>
          </tr>  <tr>
              <th>הגדרת תפקיד</th>
            <td>
              {#each data.tafkidims as ta, i}
                {` ${ta.roleDescription} `}
            {/each}
            </td>
          </tr>
          <tr>
              <th>סוג משימה</th>
            <td>
              {#each data.work_ways as dm, i}
                  {` ${dm.workWayName} `}  
              {/each}
              </td>
          </tr>
         <tr>
              <th>תאריך ביצוע</th>
            <td>              {#if data.Sqadualed}
              {data.Sqadualed}
            {/if}
            </td>
          </tr> <tr>
            <th>קישורים ציבוריים</th>
            <td>
              {#if data.publicklinks}
              {data.publicklinks}
              {/if}
             </td>
        </tr><tr>
          <th>הערות יחודיות לריקמה שלי</th>
          <td>
            {#if data.hearotMeyuchadot != "undefined" }
            {data.hearotMeyuchadot}
            {/if}
           </td>
      </tr><tr>
        <th>קישורים יחודיים לריקמה שלי</th>
        <td>          {#if data.privatlinks != "undefined"} 

          {data.privatlinks} 
          {/if}
         </td>
    </tr><tr style="display:''" id="hoursD">
          <th >כמה שעות זה אמור לקחת? </th>
          <td>
            {#if data.noofhours > 0}

           {data.noofhours}
           {/if}
          </td>
        </tr><tr style="display:''" id="vallueperhourN" >
          <th>כמה שווה שעה ?</th>
          <td>
            {#if data.perhour > 0}

            {data.perhour}
            {/if}
          </td>
        </tr><tr >
      <th>שווי סך הכל למשימה </th>
      <td>
      {#if data.perhour > 0 & data.noofhours > 0}
      
      {(data.perhour * data.noofhours)}
      
      {:else} <p>0</p>
      {/if}
      </td>
    </tr>
    </table>
  </div>-->
  </div>
 

{/await}

  <style>
  .gg{ 
     position: sticky;
     top: 1px; 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
      color: rgb(132, 241, 223);
  }
   .ggd{ 
     position: sticky;
     bottom: 1px; 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
                  color: rgb(132, 241, 223);


  }
  .ggr{ 
     position: sticky;
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     opacity: 1;
            color: rgb(132, 241, 223);

  }
  .ggr:hover, .gg:hover, .ggd:hover {
    background:var(--barbi-pink);
  } 
    .dd{
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
    .body {
      overflow-x: auto;
      overflow-y: auto;
 
     padding-left: 0.5em;
     padding-right: 0.5em;
    }
        .full{
        height: 100%;
    }
  table, th, td {
  border-collapse: collapse;
  border-width: 4px;
  border-color: rgb(103, 232, 249);
border-radius: 4%;
  }
  table {
  text-align: center;
  color: var(--barbi-pink);
  margin: 0 auto;
 
  }
 
  th{
     background-color: #6b0f1a;
     background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
     color: rgb(132, 241, 223);
   }
  td{
     background-color: #5efaf2;
     background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
  }
 th:hover{
       background:var(--barbi-pink);

 }
  td:hover {
    background:rgb(132, 241, 223);
  } 
  </style>