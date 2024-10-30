<script>
    export let bmiData = [], proles = []
    import { idPr } from '$lib/stores/idPr.js';
    import moment from 'moment';
  import { createEventDispatcher, onMount } from 'svelte';
  let isPersonal = true
  export let id 
  export let misid
  export let fromMis = false
  export let editdata = -1
  let isEdit = false
  onMount(()=>{
    console.log(editdata)
    if(editdata != -1){
      isEdit = true
      teur = editdata.des
      name  = editdata.shem
        link = editdata.link
         mimatai = editdata.dateS
         adMatai = editdata.dateF
    }
 if (id > 0){
    const bmi = bmiData.filter(t=>t.id == id)
    console.log(bmi)
    selected = [bmi[0].attributes.users_permissions_user.data.attributes.username + " - " + bmi[0].attributes.name]
  }
})

 const dispatch = createEventDispatcher();
    export let userMevatzeaId, userMevakeshId, mimatai  ,adMatai , name = "", teur = "",selected = [],link = "";
    let seEr = false, neEr = false
        import MultiSelect from 'svelte-multiselect';
     import SveltyPicker from 'svelty-picker'

    import {lang} from '$lib/stores/lang.js'
  import Button from '$lib/celim/ui/button.svelte';
    function find_se_id(lebel){
     let id , uid;
       for (let i = 0; i< bmiData.length; i++){
        if((bmiData[i].attributes.users_permissions_user.data.attributes.username + " - " + bmiData[i].attributes.name) == lebel){
          id = bmiData[i].id;
          uid = bmiData[i].attributes.users_permissions_user.data.id
        }
      }
      return [id ,uid];
     };
     let miDatan = [];
     const baseUrl = import.meta.env.VITE_URL

let linkg = baseUrl+'/graphql';
let loading = false
let success = false
let error = false
async function sub(){
  loading = true
    if (fromMis == false){
    if (selected.length < 1){
        seEr = true
        error = true
        loading = false
    } else {
        if(name.length < 1){
              neEr = true
              error = true
              loading = false
                 } else {
                  error = false
                  let d = new Date
              neEr = false
             seEr = false
             const ob = find_se_id(selected)
         userMevatzeaId = ob[1]
        const mtaha = ob[0]
        console.log(moment(mimatai, "HH:mm DD/MM/YYYY"))
        let momentx = moment(mimatai, "HH:mm DD/MM/YYYY ")
        let momebtt =moment(adMatai, "HH:mm DD/MM/YYYY ")
        const st = mimatai !== undefined &&  mimatai !== null ? `dateS: "${momentx.toISOString()}",`: ``;
       ///is before?
        const fd = adMatai !== undefined && adMatai !== null ?  `dateF: "${momebtt.toISOString()}",`: ``;
        const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
         const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    userMevakeshId = cookieValueId;
            const tt = userMevatzeaId == userMevakeshId ? ` myIshur: true,`:``; 
    let token = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        { createAct(
      data: {project: "${$idPr}",
             des:  """${teur}""",
             my: "${userMevatzeaId}",
             shem: """${name}""",
             vali: "${userMevakeshId}",
             mesimabetahaliches: "${mtaha}",
             link: "${link}",
             publishedAt: "${d.toISOString()}",
            ${tt}
             ${st}
             ${fd}
                  }
    
  ) {data{id attributes{ shem my {data{id}}}}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
                loading = false
                success = true
            dispatch('done', {
                id: miDatan.data.createAct.data.id,
                name:  miDatan.data.createAct.data.attributes.shem,
                user: miDatan.data.createAct.data.attributes.my.data.id
            })
          
        } catch (e) {
           const error1 = e
           loading = false
           error = true
            /*dispatch('eror')*/
        }  
      }
}
    }else{
      loading = false
      success = true
      dispatch("add",{
        isEdit,
        id:misid,
        data:{
          des:teur,
          shem:name,
          link,
          dateS:mimatai,
          dateF:adMatai
        }
      })
    }
}
    const level = {"he": "השמה למשימה בתהליך ספציפית או להציע לפי תפקיד","en": "do you want to assing it to spesific mission and person or to to offer it to all projecr mambers of a choosen role"}
    const sedes = {"he": " שליחה","en": "send"}
    const placeholderdf = {"he": "תאריך סיום", "en": "end date"}
    const placeholderds = {"he": "תאריך התחלה (אם רלוונטי)" , "en":"starting date (if relevant)"}
    const heading = {"he":"יצירת מטלה חדשה", "en":"create new task"}
    const editheading = {"he":"עריכת מטלה", "en":"edit task"}

    const namede = {"he":"שם למטלה", "en": "task name"}
    const desde = {"he": "תיאור קצר", "en":"task description"}
    const placeholder = {"he": "בחירת משימה בתהליך", "en": "choose mission in progress"}
    const placeholderoles = {"he": "בחירת תפקיד", "en": "choose role"}
    const linkdes = {"he": "לינק רלוונטי", "en": "relevante link"}
    const seerdes = {"he": "נא לבחור משימה בתהליך לשיוך המטלה","en":"please choose one mission in progress"}
    const neerdes = {"he": "חובה להזין שם", "en":"must enter name"}
    const pers = {"he": "משימה בתהליך", "en":"mission in progress"}
    const role = {"he": "תפקידים", "en":"roles"}
  //TODO: validation of dateF after dateS
   </script>
    <div class="flex flex-col items-center justify-center">
        <h1 class="text-barbi">{isEdit == false ? heading[$lang] : editheading[$lang]}</h1>
        <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
              <input name="des" bind:value={name}  
             type='text' class='input'required >
              <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="des" class='label'>{namede[$lang]}</label>
              <span class='line'></span>
        </div>
        {#if neEr == true}
         <small class="text-red-900 bg-slate-200 px-2">{neerdes[$lang]}</small>
    {/if}
          <br><span >
      <SveltyPicker  placeholder={placeholderds[$lang]}  inputClasses="form-control" format=" hh:ii dd/mm/yyyy" bind:value={mimatai}></SveltyPicker>
     </span> <br>
      <SveltyPicker placeholder={placeholderdf[$lang]} inputClasses="form-control" format=" hh:ii dd/mm/yyyy" bind:value={adMatai}></SveltyPicker>
       <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
              <input name="des" bind:value={link}  
             type='text' class='input'required >
              <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="des" class='label'>{linkdes[$lang]}</label>
              <span class='line'></span>
        </div>
         <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
              <textarea name="es"  bind:value={teur}    
             type='text' class='input d' required ></textarea>
              <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="es" class='label'>{desde[$lang]}</label>
              <span class='line'></span>
        </div>
        {#if fromMis != true}

        <h2  class="text-barbi text-center text-sm sm:text-xl">:{level[$lang]}</h2>

<div class="flex items-center justify-center" dir="ltr">
  <label for="Toggle3" class="inline-flex items-center  p-2 rounded-md cursor-pointer text-gray-800">
    <input id="Toggle3" type="checkbox" class="hidden peer" bind:checked={isPersonal}>
    <span class="px-4 py-2 rounded-l-md text-barbi peer-checked:text-gray-900 bg-mturk peer-checked:bg-gold">{role[$lang]}</span>
    <span class="px-4 py-2 rounded-r-md  peer-checked:text-barbi  bg-gold peer-checked:bg-mturk">{pers[$lang]}</span>
  </label>
  </div>
        {#if isPersonal == true}
      <MultiSelect
      bind:selected={selected}
      placeholder={placeholder[$lang]}
      options={bmiData.map(it=>it.attributes.users_permissions_user.data.attributes.username + " - " + it.attributes.name)}
      />
      {:else}
      בבניה
       <!-- <MultiSelect
      bind:selected={selected}
      placeholder={placeholderoles[$lang]}
      options={proles.map(pr=>pr.name)}
      />-->
      {/if}
      {/if}
    {#if seEr == true}
        <small class="text-red-900 bg-slate-200 px-2">{seerdes[$lang]}</small>
    {/if}
    <hr class="h-2">
  <Button on:click={sub} {loading} {success} text={sedes} {error}/>
    </div>

    <style>
          :global(.multiselect) {
    background-color: var(--gold) !important ;
  /* top-level wrapper div */
}
  :global(.multiselect:focus){
    border: 1px solid var(--barbi-pink) !important;
  }
  :global(.multiselect span.token) {
  color: var(--gold);
  background: var(--barbi-pink) ;
    /* selected options */
  }
 /* :global(.multiselect span.token button),
  :global(.multiselect .remove-all) {

    /* buttons to remove a single or all selected options at once */
 /* } 
  :global(.multiselect ul) {
    /* dropdown options */
 /* }
  :global(.multiselect ul li) {
    /* dropdown options */
 /* } */
 :global(li.selected) {
    border: var(--sms-focus-border, 1pt solid var( cornflowerblue));
    color: var(--gold);
    /* selected options in the dropdown list */
  }
  :global(li:not(.selected):hover) {
 color: var(--barbi-pink);
    background-color:var(--lturk);    /* unselected but hovered options in the dropdown list */
  }
  :global(ul.tokens > li){
    background-color: var(--barbi-pink);
    color:var(--lturk);
  }
  :global(ul.tokens > li):hover{
    color: var(--barbi-pink);
background-color:var(--lturk);  
  }
  /*
  :global(li.selected:hover) {
    /* selected and hovered options in the dropdown list */
    /* probably not necessary to style this state in most cases */
 /* } */
  :global(li.active) {
    color:var(--barbi-pink) !important;
    /* active means element was navigated to with up/down arrow keys */
    /* ready to be selected by pressing enter */
  }
 /* :global(li.selected.active) {
  } */
  
    </style>