<script>
	import  ChoosNed  from '$lib/components/prPr/chosNed.svelte';
  import Close from '$lib/celim/close.svelte';
  import SucssesConf from '$lib/celim/sucssesConf.svelte';
  import Chooser from '$lib/celim/ui/chooser.svelte';
  import { calcX } from '$lib/func/calcX.svelte';
  import { sanitizeUserInput } from '$lib/func/uti/sanitizeUserInput.svelte';
  import {SendTo} from '$lib/send/sendTo.svelte';
  import { idPr } from '$lib/stores/idPr';
  import { lang } from '$lib/stores/lang'
    const dispatch = createEventDispatcher();
    import { toast } from 'svelte-sonner';
  import { createEventDispatcher } from 'svelte';
  import { MultiSelect } from 'svelte-multiselect';
  import ChoosMission from '../choosMission.svelte';
  import { missionList, updateM } from '$lib/stores/missionList';
  let blabla = $state([]);
  let load = false
  async function callbackFunction(event) {
    console.log(event.detail)
    if (event.detail.type == 'add') {
      const lim = event.detail.li;
      if (lim.length > 0 || lim > 0) {
        //showvd = false;
        load = true
        //  await findiM().then();
          load = false;
        
        } else {
         
        }
      } else {

    }
  }

    let name = $state() , descrip = $state(),oneTime = $state(false),isPublik = false,already = $state(false), success = $state(false) , equaliSplited = true
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
    const pers = {"he": "משימות בתהליך", "en":"missions in progress"}
    const role = {"he": "הוספת משימה חדשה", "en":"add new mission"}
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
   toast.success(`${fnnn[$lang]}`);
   dispatch("close")
}
    }
  }else{
      success = true
      open = false
     setTimeout(function(){  
    success = false
  },15000)
  toast.success(`${fnnn[$lang]}`);
      dispatch("close")
  }
  }
}
    let isFromExsisted = $state(true)
    let selected = $state([])
  /** @type {{roles?: any, restime?: string, usersNum?: number, bmiData?: any}} */
  let {
    roles = [],
    restime = "feh",
    usersNum = 1,
    bmiData = []
  } = $props();
    const placeholder = {"he":`בחירה מרשימה`,"en":"choose from list"};
    let addMiss = $state(true)
    const addM = {"he":" הגדרת משימה חדשה שתיווצר כאשר השירות יתחיל","en":"create new mission when the service starts"}
    const addMissTr = {"he":"הוספת משימות","en":"add missions"}
    const addmissfl = {"he":"הוספת משאבים","en":"add resources"}	
    const addMissLeb = {"he":"הוספת משימות או משאבים","en":"add missions or resources"}
    const fromExFl = {"he":"משאב חדש","en":"new resources"}
    const fromExTr = {"he":"ממשאבים קיימים","en":"existing resources"}
    const fromExLeb = {"he":"שימוש במשאבים שכבר קיימים בריקמה או יצירת משאבים חדשים כאשר שירות נמכר","en":"existing resources or new resources"}
</script>
<SucssesConf {success} />

 {#if open === false}
   <button   
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
        onclick={()=>open = true}>{createLebel[$lang]}
    </button>
  {:else} 
      <div class="flex flex-col items-center justify-center sm:w-1/2 p-8 mx-auto bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400"> 
        <button   
                class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
            onclick={()=>open = false}><Close/>
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
        <br>
                <!----
                choose between mesimot and mash, after define for each mission how much of it is directly connected to mission/mash
                choose if add it as task to already defined mission in progress or to create and asign a new mission in progres opon appruval
                add the posibility for rikma fee(until we dd the option to better calculate it)
                <Chooser bind:checked={equaliSplited} tr={equaliSplitedTr} level={equaliSplitedLevel} fl={equaliSplitedFl}/>-->
                <Chooser bind:checked={addMiss} tr={addMissTr} level={addMissLeb} fl={addmissfl}/>
{#if addMiss == true}
<div class="flex flex-col p-4 items-center justify-center border border=gold" dir="ltr">
  <Chooser bind:checked={isFromExsisted} on:change={async()=>{
    if(isFromExsisted == false){
     await updateM()
    }
  }} tr={pers} level={oneTimeLevel} fl={role}/>
        {#if isFromExsisted == true}
      <MultiSelect
      bind:selected={selected}
      placeholder={placeholder[$lang]}
      options={bmiData.map(it=>it.attributes.users_permissions_user.data.attributes.username + " - " + it.attributes.name)}
      />
      {:else}
        <ChoosMission    
         {roles}
        mission1={$missionList}
        bind:selected={blabla}
        on:message={callbackFunction}>
        <small>{addM[$lang]}</small>
        </ChoosMission>
      {/if}
</div>
{:else}
<div class="flex flex-col p-4 items-center justify-center border border-gold" >
  <Chooser bind:checked={isFromExsisted} tr={fromExTr} level={fromExLeb} fl={fromExFl}/>
{#if isFromExsisted == true}
      <MultiSelect
      bind:selected={selected}
      placeholder={placeholder[$lang]}
      options={bmiData.map(it=>it.attributes.users_permissions_user.data.attributes.username + " - " + it.attributes.name)}
      />
      {:else}
        <ChoosNed/>
      {/if}
</div>
{/if}
        <!----<Chooser bind:checked={equaliSplited} tr={equaliSplitedTr} level={equaliSplitedLevel} fl={equaliSplitedFl}/>-->
        <Chooser bind:checked={oneTime} tr={oneTimeTr} level={oneTimeLevel} fl={oneTimeFl}/>
     <!---   <Chooser bind:checked={equaliSplited} tr={equaliSplitedTr} level={equaliSplitedLevel} fl={equaliSplitedFl}/>
-->
        {#if already === false}
   <button   
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
        onclick={create}>{action[$lang]}
    </button>
    {/if}   
    </div>

 {/if}    
