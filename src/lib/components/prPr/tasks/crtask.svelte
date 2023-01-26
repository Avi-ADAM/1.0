<script>
    export let bmiData = []
    import { idPr } from '$lib/stores/idPr.js';
    import moment from 'moment';
  import { createEventDispatcher } from 'svelte';

 const dispatch = createEventDispatcher();
    export let userMevatzeaId, userMevakeshId, mimatai  ,adMatai , name = "", teur = "",selected = [],link = "";
    let seEr = false, neEr = false
        import MultiSelect from 'svelte-multiselect';
     import SveltyPicker from 'svelty-picker'

    import {lang} from '$lib/stores/lang.js'
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
let linkg = 'https://strapi-87gh.onrender.com/graphql';
async function sub(){
    if (selected.length < 1){
        seEr = true
    } else {
        if(name.length < 1){
              neEr = true
                 } else {
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
             des:  "${teur}",
             my: "${userMevatzeaId}",
             shem: "${name}",
             vali: "${userMevakeshId}",
             mesimabetahalich: "${mtaha}",
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

            dispatch('done', {
                id: miDatan.data.createAct.data.id,
                name:  miDatan.data.createAct.data.attributes.shem,
                user: miDatan.data.createAct.data.attributes.my.data.id
            })
          
        } catch (e) {
            error1 = e
            /*dispatch('eror')*/
        }  
      }
}
}
    const sedes = {"he": " שליחה","en": "send"}
    const placeholderdf = {"he": "תאריך סיום", "en": "end date"}
    const placeholderds = {"he": "תאריך התחלה (אם רלוונטי)" , "en":"starting date (if relevant)"}
    const heading = {"he":"יצירת מטלה חדשה", "en":"create new task"}
    const namede = {"he":"שם למטלה", "en": "task name"}
    const desde = {"he": "תיאור קצר", "en":"task description"}
    const placeholder = {"he": "בחירת משימה בתהליך", "en": "choose mission in progress"}
    const linkdes = {"he": "לינק רלוונטי", "en": "relevante link"}
    const seerdes = {"he": "נא לבחור משימה בתהליך לשיוך המטלה","en":"please choose one mission in progress"}
    const neerdes = {"he": "חובה להזין שם", "en":"must enter name"}
   </script>
    <div class="flex flex-col items-center justify-center">
        <h1 class="text-barbi">{heading[$lang]}</h1>
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
      <MultiSelect
      bind:selected={selected}
      maxSelect={1}
      placeholder={placeholder[$lang]}
      options={bmiData.map(it=>it.attributes.users_permissions_user.data.attributes.username + " - " + it.attributes.name)}
      />
    {#if seEr == true}
        <small class="text-red-900 bg-slate-200 px-2">{seerdes[$lang]}</small>
    {/if}
<button class="text-barbi bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:text-gold hover:bg-gradient-to-br hover:from-barbi hober:via-mpink hober:to-lpink px-4 py-1 rounded-xl mt-2" type="submit" on:click|preventDefault={sub}>{sedes[$lang]}</button>
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