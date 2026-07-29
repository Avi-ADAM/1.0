<script>
  import { t } from '$lib/translations';
  import SucssesConf from '$lib/celim/sucssesConf.svelte';
  import Share from '$lib/components/share/shareButtons/index.svelte';
  import { calcX } from '$lib/func/calcX.svelte';
  import { SendTo } from '$lib/send/sendTo.svelte';
import { toast } from 'svelte-sonner';
import { onMount } from 'svelte';/**
   * @typedef {Object} Props
   * @property {any} [sheirutim]
   * @property {string} [projectName]
   * @property {any} pid
   * @property {boolean} [wb]
   * @property {any} restime
   */

  /** @type {Props} */
  let {
    sheirutim = [],
    projectName = "",
    pid,
    wb = false,
    restime
  } = $props();
let alr = $state({})
let success = $state(false)
let hovered = $state(false)
async function ask(id,i){
  alr[i] = true
    const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
   let idL = cookieValueId;
     let que4 = `mutation { 
             createAskwant(
                data:{
                    sheirut:"${id}",
                    users_permissions_user:"${idL}",
                    project:"${pid}"
                }
             ){data{id}}
            }
              `
               try {
      let res4 = await SendTo(que4).then((res4) => (res4 = res4));
      console.log(res4,"ask res4 ")      
      if (res4.data != null) {
              console.log(res4.data,"ask res4 ")
                   let x = calcX(restime)
              let fd = new Date(Date.now() + x)
              let hiluz = res4.data.createAskwant.data.id   
               let que5 = `mutation { 
             createTimegrama(
             data:{
               date: "${fd.toISOString()}",
              whatami: "askwant",
              askwant: "${hiluz}",
            }){
              data{id}}
            }`
              try {
      let res5 = await SendTo(que5).then((res5) => (res5 = res5));
      console.log(res5,"ask res5 ")      
      if (res5.data != null) {
        success = true
     setTimeout(function(){  
    success = false
  },15000)
   toast.success(`${$t('project.sheirut.requestSent')}`);
           }
 } catch (e) {
      console.error(e);
    } 
               }
 } catch (e) {
      console.error(e);
    } 
}
onMount(()=>{
  for (let i = 0; i < sheirutim.data.length; i++) {
    alr[i] = false
    console.log(i)
  }
  alr = alr
  console.log(alr)
})</script>
<SucssesConf {success} />

 <h3 style="color: var(--barbi-pink) ;text-shadow: 1px 1px var(--gold);"
      >{$t('project.sheirut.ourServices')}</h3>
    {#each sheirutim?.data as datai, i}
    {@const data = datai.attributes}
    {@const title = {
                he: ` שירות "${data.name}" בריקמה: ${projectName}, באתר 1💗1 `,
                en: 'come see this service on 1💗1'
              }} 
    <div dir="rtl"  style="overflow-y:auto" class="lg:w-1/2 d mb-4 pt-4 w-full d mx-auto" >
    <div  class=" bg-gray-700  rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal ">
         <div  class="mb-8">
              <div class="  mb-2 text-start">
        <div class="flex flex-row justify-between">
            <div class="px-2 sm:basis-3/4 ">
            <h2 class="text-barbi font-bold text-xl lg:text-4xl underline ">{data.name}</h2>
            {#if data.descrip !== null && data.descrip !== "null"  && data.descrip !== "undefined"  && data.descrip !== undefined} 
           <p class="cd d max-h-16 text-gray-100 text-lg lg-text-2xl">{data.descrip}</p>
           {/if}
                     <h5 class="text-barbi font-bold text-xl mb-2">⚙️{data.oneTime ? $t('project.sheirut.oneTime'):$t('project.sheirut.monthly')}</h5>
          <h5 class="text-barbi font-bold text-xl mb-2">🧮{data.equaliSplited ? $t('project.sheirut.splitEqually'):$t('project.sheirut.subscription')}</h5>
 <!---
     <p style="line-height: 1;" class="text-sm text-gray-100 flex items-center lg:text-2xl m-5">
        <img  class="w-12 lg:w-24"  src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
        <span onmouseenter={()=>hover($t('common.valph'))} onmouseleave={()=>hover("0")} > {data.perhour.toLocaleString('en-US', {maximumFractionDigits:2})} לשעה </span> * <span onmouseenter={()=>hover($t('common.noofhours'))} on:mouseleave={()=>hover("0")}  > {data.noofhours.toLocaleString('en-US', {maximumFractionDigits:2})} שעות </span> = <span on:mouseenter={()=>hover($t('lev.cards.voteCard.inTotal'))} on:mouseleave={()=>hover("0")}>{(data.noofhours * data.perhour).toLocaleString('en-US', {maximumFractionDigits:2})} </span>
    </p>-->
          <div class="flex justify-center">
            {#if alr[i] == false && wb == true}
          <button onclick={()=>ask(datai.id,i)} onmouseenter={()=>hovered = true} onmouseleave={()=>hovered = false} class:button-perl={hovered == false} class:button-gold={hovered == true}  
            class=" mx-auto mt-7 text-3xl px-4 py-3 hover:text-black hover:font-bold  text-barbi">{$t('project.sheirut.askToJoin')}</button>
        {/if}  
        </div>
           </div>
            <div class="basis-14" >
                {#if data.isApruved}
                <Share
                slug="{"project/"+pid}"
	 title={$t('project.sheirut.shareTitle', { name: data.name, projectName })}
     desc="new service at 1💗1"
     hashtags={['1💗1','consensus']}
	 quote={$t('project.sheirut.shareTitle', { name: data.name, projectName })}
	 related={[]}
	 via={''}
	 />
     {:else}
            <h2 class="bg-red-700 text-gold">{$t('project.sheirut.notApproved')}</h2>
     {/if}
            </div>     
        </div>
          </div>
          
          </div>
          
          </div>
          
          </div>
          
                    {/each}
