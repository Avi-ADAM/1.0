<script>
	import  RichText from '$lib/celim/ui/richText.svelte';
  import Share from '$lib/components/share/shareButtons/index.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import {lang} from '$lib/stores/lang'
  export let omiData = [];
  console.log(omiData)
     export let who = 0;
  let isonly = false;
  export let projectName
   import { onMount } from 'svelte';
  import { langAdjast } from '$lib/func/langAdjast.svelte';
   onMount(async () => {
 if (who !== 0){
      isonly = true
      var filtered = omiData.filter(function(event){
    return event.id == who;
});
    omiData = filtered;
    }
    for(let i = 0; i < omiData.length; i++){
      const langd = langAdjast(omiData[i].attributes, $lang);
      omiData[i].attributes = langd
    }
    omiData = omiData
})

function remove (id) {
  console.log(id)
};
function edit (id) {
  console.log(id)
}
function hover(){
    
}
const om = {
    "he": "משימה פתוחה",
    "en": "open mission"
}
const requireSkills = {
    "he": "כישורים נדרשים:",
    "en": "required skills:"
}
const seePr = {
    "he": "לצפיה בריקמה",
    "en": "see the freeMates page"
}
const requiredRoles = {
    "he": "תפקידים נדרשים:",
    "en": "required roles:"
}
const requiredWW = {
    "he":"דרכי עבודה מבוקשות:",
    "en":"ways of work for the mission:"
    }
    let wid
    </script>

<div bind:clientWidth={wid} class="h-screen overflow-auto md:items-center border-2 border-gold rounded d">
  <div class=" items-center d" class:full={who == 0}>
          <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >{isonly == true ? " פעולה פתוחה" : "פעולות פתוחות"}</h1>
    {#each omiData as datai, i}
    {@const data = datai.attributes}
    {@const title = {
                he: `הצעה למשימה בשם "${data.name}" בריקמה: ${projectName}, באתר 1💗1 `,
                en: 'come see this mission on 1💗1'
              }} 
    <div dir="rtl"  style="overflow-y:auto" class={isonly == false ? "lg:w-1/2 d mb-4 pt-4 w-full  mx-auto" : "d mb-4 pt-4 w-full"}>
    <div  class=" bg-gray-700  rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal ">
         <div  class="mb-8">
              <div class="  mb-2 text-start">
        <div class="flex flex-row justify-between">
            <div class="px-2 sm:basis-3/4 ">
            <h2 class="text-barbi font-bold text-xl lg:text-4xl underline ">{data.name}</h2>
            {#if data.descrip !== null && data.descrip !== "null"  && data.descrip !== "undefined"  && data.descrip !== undefined} 
           <RichText outpot={data.descrip} editable={false} sml={true}/>
            {/if}
    {#if data.hearotMeyuchadot}
    {#if data.hearotMeyuchadot !== undefined && data.hearotMeyuchadot !== null && data.hearotMeyuchadot !== "undefined" ? data.hearotMeyuchadot : ""}
    <RichText outpot={data.hearotMeyuchadot} editable={false} sml={true}/>
    {/if}
   
    {/if}
     <p style="line-height: 1;" class="text-sm text-gray-100 flex items-center lg:text-2xl m-5">
        <img  class="w-12 lg:w-24"  src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
        <span on:mouseenter={()=>hover({"he":"שווי לשעה","en":"vallue per hour"})} on:mouseleave={()=>hover("0")} > {data.perhour.toLocaleString('en-US', {maximumFractionDigits:2})} לשעה </span> * <span on:mouseenter={()=>hover({"he":"כמות השעות", "en":"amount of hours"})} on:mouseleave={()=>hover("0")}  > {data.noofhours.toLocaleString('en-US', {maximumFractionDigits:2})} שעות </span> = <span on:mouseenter={()=>hover({"he":"סך הכל","en": "total"})} on:mouseleave={()=>hover("0")}>{(data.noofhours * data.perhour).toLocaleString('en-US', {maximumFractionDigits:2})} </span>
    </p>
      
                   
    {#if data.skills.data.length > 0}
    <small class="text-barbi text-sm lg:text-2xl">{requireSkills[$lang]}</small>
    <div class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 lg:p-4 ">
        {#each data.skills.data as skill}
        <p 
        on:mouseenter={()=>hover({"he":"הכישורים הנדרשים","en": "needed skills"})} 
        on:mouseleave={()=>hover("0")}  >
            <Tile sm={wid > 555 ? true : false} pink={true} word={skill.attributes.skillName}/></p>
                {/each}
                </div>
                {/if}
                {#if data.tafkidims.data.length > 0}  
                <small class="text-sm text-barbi lg:text-2xl">{requiredRoles[$lang]}</small>
                <div class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle d  cd p-2">
                    {#each data.tafkidims.data as rol}
                    <p on:mouseenter={()=>hover({"he":"תפקיד מבוקש", "en":"requested role"})} on:mouseleave={()=>hover("0")} class="m-0" style="text-shadow:none;" >
    <Tile sm={wid > 555 ? true : false} word={rol.attributes.roleDescription} wow={true}/></p>{/each}
      </div>
      {/if}
      {#if data.work_ways.data.length > 0}  <small class="text-sm lg:text-2xl text-barbi">{requiredWW[$lang]}</small>
      <div class="border border-gold flex sm:flex-row flex-wrap lg:p-4 justify-center align-middle d cd p-2 ">
          {#each data.work_ways.data as rol}
          <p on:mouseenter={()=>hover({"he":"דרכי עבודה מבוקשות","en":"ways of work for the mission"})} on:mouseleave={()=>hover("0")} class="m-0" style="text-shadow:none;" >
              <Tile bg="gold" sm={wid > 555 ? true : false} word={rol.attributes.workWayName}/>
          </p>
          {/each}
          </div>
          {/if}
          <!--
          <div class="flex justify-center">
            {#if alr == false}
          <button on:click={ask} on:mouseenter={()=>hovered = true} on:mouseleave={()=>hovered = false} class:button-perl={hovered == false} class:button-gold={hovered == true}  
            class=" mx-auto mt-7 text-3xl px-4 py-3 hover:text-black hover:font-bold  text-barbi">אני אשמח לבצע</button>
        {/if}  
        </div>-->
           </div>
            <div class="basis-14" >
                
                <Share
                slug="{"/availableMission/"+datai.id}"
	 title="{title[$lang]}"
     desc="its new thing"
     hashtags={['1💗1','consensus']}
	 quote="{title[$lang]}"
	 related={[]}
	 via={''}
	 />
            </div>     
        </div>
          </div>
          
          </div>
          
          </div>
          
          </div>
          
                    {/each}
</div>
</div>
