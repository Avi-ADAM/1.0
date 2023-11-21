<script>
  import Close from '$lib/celim/close.svelte';
  import SucssesConf from '$lib/celim/sucssesConf.svelte';
  import Chooser from '$lib/celim/ui/chooser.svelte';
  import { calcX } from '$lib/func/calcX.svelte';
  import { sanitizeUserInput } from '$lib/func/uti/sanitizeUserInput.svelte';
  import {SendTo} from '$lib/send/sendTo.svelte';
  import { idPr } from '$lib/stores/idPr';
  import { lang } from '$lib/stores/lang'
    const dispatch = createEventDispatcher();

  import { addToast } from 'as-toast';
  import { createEventDispatcher } from 'svelte';
    export let restime = "feh", usersNum = 1
    let name , descrip,oneTime = false,isPublik = false,already = false, success = false , equaliSplited = true
    const heading = {"he":"יצירת שירות חדש","en":"create new service"}
    const expl = {"he":"","en":""}
    const action = {"he":"יצירת שירות חדש","en":"create new service"}
    const namede = {"he":"שם","en":"name"}
    const desde = {"he":"תיאור","en":"description"}
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
    const fnnn = { he: ' השירות נוצר בהצלחה', en: 'service has created sucsessfully' };

    let open = false
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
   addToast(`${fnnn[$lang]}`, 'info');
   dispatch("close")
}
    }
  }else{
      success = true
      open = false
     setTimeout(function(){  
    success = false
  },15000)
   addToast(`${fnnn[$lang]}`, 'info');
      dispatch("close")
  }
  }
}
    
</script>
<SucssesConf {success} />

 {#if open === false}
   <button   
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
        on:click={()=>open = true}>{createLebel[$lang]}
    </button>
  {:else} 
      <div class="flex flex-col items-center justify-center sm:w-1/2 p-8 mx-auto bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400"> 
        <button   
                class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
            on:click={()=>open = false}><Close/>
        </button>
        <h1 class="text-barbi">{heading[$lang]}</h1>
        <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
              <input name="des" bind:value={name}  
             type='text' class='input'required >
              <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="des" class='label'>{namede[$lang]}</label>
              <span class='line'></span>
        </div>

        <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
              <textarea name="es"  bind:value={descrip}    
             type='text' class='input d' required ></textarea>
              <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="es" class='label'>{desde[$lang]}</label>
              <span class='line'></span>
        </div>

        <!----<Chooser bind:checked={equaliSplited} tr={equaliSplitedTr} level={equaliSplitedLevel} fl={equaliSplitedFl}/>-->
        <Chooser bind:checked={oneTime} tr={oneTimeTr} level={oneTimeLevel} fl={oneTimeFl}/>
        <Chooser bind:checked={equaliSplited} tr={equaliSplitedTr} level={equaliSplitedLevel} fl={equaliSplitedFl}/>
             {#if already === false}
   <button   
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
        on:click={create}>{action[$lang]}
    </button>
    {/if}   
    </div>

 {/if}    
