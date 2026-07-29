<script>
  import { isRtl, t } from '$lib/translations';
  import Close from '$lib/celim/close.svelte';
  import SucssesConf from '$lib/celim/sucssesConf.svelte';
  import Chooser from '$lib/celim/ui/chooser.svelte';
  import { calcX } from '$lib/func/calcX.svelte';
  import { sanitizeUserInput } from '$lib/func/uti/sanitizeUserInput.svelte';
  import {SendTo} from '$lib/send/sendTo.svelte';
  import { idPr } from '$lib/stores/idPr';
  import { toast } from 'svelte-sonner';
  /**
   * @typedef {Object} Props
   * @property {string} [restime]
   * @property {number} [usersNum]
   * @property {() => void} [onClose] - Callback when the component should close.
   */

  /** @type {Props} */
  let { restime = "feh", usersNum = 1, onClose } = $props();
    let name = $state() , descrip = $state(),oneTime = $state(false),isPublik = false,already = $state(false), success = $state(false) , equaliSplited = $state(true)
    let open = $state(false)
    async function create(){
        already = true
        let isApruved = false
        if (usersNum > 1){
          isApruved = true
        }
            const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    let idL = cookieValueId;
    let d = new Date()
        console.log(isPublik,oneTime)//add vots, ispublic, apruved
         let que = `mutation { 
  createSheirut(
      data:{ name: """${sanitizeUserInput(name)}""",
            project: ${$idPr},
            descrip: """${sanitizeUserInput(descrip)}""",
            oneTime:${oneTime},
            equaliSplited:${equaliSplited},
            isApruved: ${isApruved},
    }
  ){
    data {id}
  }
}`
 const d2 = await SendTo(que) 
    .then()
    const r2 = d2.data
    console.log(r2)
    if (r2 != null){
      if(usersNum > 1){
      let hilutz = r2.createSheirut.data.id
let pendque = `mutation {
    createSheirutpend(
    data:{
      sheirut: "${hilutz}",
      project:${$idPr},
      vots: [{
        what:true
        order: 0
        users_permissions_user: ${idL}
        ide:${idL}
        zman:"${d.toISOString()}"
      }]
    }
  ){data{id}}
  }`
     const dp = await SendTo(pendque) 
    .then()
    const rp = dp.data
    console.log(rp)
    if (rp != null){
       let x = calcX(restime)
     let fd = new Date(Date.now() + x)
         let hiluzId = rp.createSheirutpend.data.id
                        let quee = `mutation 
                        {createTimegrama(
         data:{
           date: "${fd.toISOString()}",
           whatami: "sheirutpend",
      sheirutpend: ${hiluzId},
          }
        ){
          data {id}
        }
      }`
    const d3 = await SendTo(quee)
    .then()
    const r3 = d3.data
    console.log(r3)
    if (r3 != null){
      success = true
      open = false
     setTimeout(function(){  
    success = false
  },15000)
   toast.success(`${$t('project.sheirut.fnnnCreated')}`);
   onClose?.()
}
    }
  }else{
      success = true
      open = false
     setTimeout(function(){  
    success = false
  },15000)
  toast.success(`${$t('project.sheirut.fnnnCreated')}`);
      onClose?.()
  }
  }
}
    
</script>
<SucssesConf {success} />

 {#if open === false}
   <button   
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
        onclick={()=>open = true}>{$t('project.sheirut.createNew')}
    </button>
  {:else} 
      <div class="flex flex-col items-center justify-center sm:w-1/2 p-8 mx-auto bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400"> 
        <button   
                class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
            onclick={()=>open = false}><Close/>
        </button>
        <h1 class="text-barbi">{$t('project.sheirut.createNew')}</h1>
        <div dir="{$isRtl ? 'rtl' : 'ltr'}" class='textinput'>
              <input name="des" bind:value={name}  
             type='text' class='input'required >
              <label style:right={$isRtl ? "0" : "none"} style:left={$isRtl ? "none" : "0"} for="des" class='label'>{$t('project.sheirut.name')}</label>
              <span class='line'></span>
        </div>

        <div dir="{$isRtl ? 'rtl' : 'ltr'}" class='textinput'>
              <textarea name="es"  bind:value={descrip}    
             type='text' class='input d' required ></textarea>
              <label style:right={$isRtl ? "0" : "none"} style:left={$isRtl ? "none" : "0"} for="es" class='label'>{$t('project.sheirut.description')}</label>
              <span class='line'></span>
        </div>

        <!----<Chooser bind:checked={equaliSplited} tr={$t('project.sheirut.splitEqually')} level={$t('project.sheirut.equaliSplitedLevel')} fl={$t('project.sheirut.subscription')}/>-->
        <Chooser bind:checked={oneTime} tr={$t('project.sheirut.oneTime')} level={$t('project.sheirut.oneTimeLevel')} fl={$t('project.sheirut.monthly')}/>
        <Chooser bind:checked={equaliSplited} tr={$t('project.sheirut.splitEqually')} level={$t('project.sheirut.equaliSplitedLevel')} fl={$t('project.sheirut.subscription')}/>
             {#if already === false}
   <button   
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
        onclick={create}>{$t('project.sheirut.createNew')}
    </button>
    {/if}   
    </div>

 {/if}
