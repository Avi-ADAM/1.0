<script>
    import {lang} from '$lib/stores/lang.js'
    import AddnewVal from '../addnew/addnewval.svelte';
    import MultiSelect from 'svelte-multiselect';
    import { onMount } from 'svelte';
 import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    let basis;
 export let linkP,githublink, fblink, discordlink,drivelink,twiterlink,watsapplink;
 export let desP;
 export let desPl;
 export let projectName_value;
    let token; 
   let idL;
let run = [];

  let shgi = false;
 export let restime;
function sendP () {
    if (run.includes(projectName_value) && projectName_value !== basis){
  shgi = true; 
} else{	
  console.log(selected)
    dispatch('message', {
      githublink:githublink ,
       fblink: fblink,
        discordlink: discordlink,
        drivelink: drivelink,
        twiterlink: twiterlink,
        watsapplink: watsapplink,
    linkP: linkP,
	desP : desP,
	desPl: desPl,
	projectName_value: projectName_value,
  restime: restime,
  valit: find_value_id(selected),
    })
  };
};


let vallues = [];
    let error1 = null;
    let addval = false;
    
    onMount(async () => {
      basis = projectName_value
       const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
    token  = cookieValue; 
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
 'Authorization': bearer1,
                 'Content-Type': 'application/json'      };
    
        try {
           const res = await fetch("https://tov.onrender.com/graphql", {
              method: "POST",
              headers: {
                   'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },  body: JSON.stringify({
                        query: `query {
 vallues {data{ id attributes { valueName ${$lang == 'he' ? 'localizations{data{attributes{ valueName}} }' : ""}}}}
  projects { data{ attributes{ projectName}}}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            vallues = res.data.vallues.data;
             if ($lang == "he" ){
              for (var i = 0; i < vallues.length; i++){
                if (vallues[i].attributes.localizations.data.length > 0){
                vallues[i].attributes.valueName = vallues[i].attributes.localizations.data[0].attributes.valueName
                }
              }
            }
            vallues = vallues
           const runi = res.data.projects.data;
           run = runi.map(c => c.attributes.projectName)
        } catch (e) {
            error1 = e
        }
    });

let suc = false;
   function find_value_id(value_name_arr){
     var  arr = [];
      for (let j = 0; j< value_name_arr.length; j++ ){
      for (let i = 0; i< vallues.length; i++){
        if(vallues[i].attributes.valueName === value_name_arr[j]){
          arr.push(vallues[i].id);
        }
      }
      }
      return arr;
     };

export let selected = [];
    const placeholder = `ערכים ומטרות`;
 
  function addnew (event){
    
    const newOb = event.detail.skob;
    const newN = event.detail.skob.valueName;
    const newValues = vallues;
    newValues.push(newOb);
       
    vallues = newValues;
   const newSele = selected;

selected.push(newN);

selected = newSele;
addval == false;

  }
  	let chan = false;
	function ch (){
		chan = true
	}
  const svbt = {"he": "שמירת שינויים","en": "save changes"}

  const githublinkde = {"he":"לינק לגיטהב של הריקמה","en":"link to the FreeMates GitHub"}
   const fblinkde = {"he":"לינק לפייסבוק של הריקמה","en":"link to the FreeMates Facebook"}
   const discordlinkde = {"he":"לינק לדיסקורד של הריקמה","en":"link to the FreeMates Discord"}
   const drivelinkde = {"he":"לינק לגוגל דרייב של הריקמה","en":"link to the FreeMates Google Drive"}
   const twiterlinkde = {"he":"לינק לטוויטר של הריקמה","en":"link to the FreeMates twitter"}
   const watsapplinkde = {"he":"לינק לווטסאפ של הריקמה","en":"link to the FreeMates WhatsApp"}

   
 </script>  

<div dir="rtl" class="jho">
  <h1>עריכת ריקמה</h1>
<br>

        <div dir="rtl" class='textinput'>
  <input on:change={ch}  name="des" bind:value={projectName_value}  
 type='text' class='input'required >
  <label for="des" class='label'>שם הריקמה</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600">השם כבר קיים</small>{/if}

    <div dir="rtl" class='textinput'>
  <input on:change={ch}  name="es"  bind:value={desP}    
 type='text' class='input' required >
  <label for="es" class='label'>תיאור קצר הגלוי לכול</label>
  <span class='line'></span>
</div>
   <div dir="rtl" class='textinput'>
  <input on:change={ch}  name="s"  bind:value={desPl}     
 type='text' class='input' required>
  <label for="s" class='label'>תיאור מפורט עם נראות סלקטיבית</label>
  <span class='line'></span>
</div>
 <div dir="rtl" class='textinput'>
  <input on:change={ch}  name="de"    bind:value={linkP}     
 type='text' class='input' required>
  <label for="de" class='label'>
לינק לאתר</label>
  <span class='line'></span>
</div>
<div dir={$lang == "he" ? "rtl" :"ltr"} class='textinput'>
  <input on:change={ch}  name="de"    bind:value={githublink}     
 type='text' class='input' required>
  <label for="de" class='label'>{githublinkde[$lang]}</label>
  <span class='line'></span>
</div>
<div dir={$lang == "he" ? "rtl" :"ltr"} class='textinput'>
  <input on:change={ch}  name="de"    bind:value={watsapplink}     
 type='text' class='input' required>
  <label for="de" class='label'>{watsapplinkde[$lang]}</label>
  <span class='line'></span>
</div>
<div dir={$lang == "he" ? "rtl" :"ltr"} class='textinput'>
  <input on:change={ch}  name="de"    bind:value={drivelink}     
 type='text' class='input' required>
  <label for="de" class='label'>{drivelinkde[$lang]}</label>
  <span class='line'></span>
</div>
<div dir={$lang == "he" ? "rtl" :"ltr"} class='textinput'>
  <input on:change={ch}  name="de"    bind:value={twiterlink}     
 type='text' class='input' required>
  <label for="de" class='label'>{twiterlinkde[$lang]}</label>
  <span class='line'></span>
</div>
<div dir={$lang == "he" ? "rtl" :"ltr"} class='textinput'>
  <input on:change={ch}  name="de"    bind:value={discordlink}     
 type='text' class='input' required>
  <label for="de" class='label'>{discordlinkde[$lang]}</label>
  <span class='line'></span>
</div>
<div dir={$lang == "he" ? "rtl" :"ltr"} class='textinput'>
  <input on:change={ch}  name="de"    bind:value={fblink}     
 type='text' class='input' required>
  <label for="de" class='label'>{fblinkde[$lang]}</label>
  <span class='line'></span>
</div>
<h4 class="text-barbi text:md mt-4">
 ערכים ומטרות שהריקמה תקדם
</h4> 

 <div  >
   <MultiSelect
   bind:selected
   on:change={ch} 
   {placeholder}
   options={vallues.map(c => c.attributes.valueName)}
   --sms-li-selected-bg="var(--gold)"
   /></div>
   <div  >
   {#if addval == false}
    <button
    on:click={() => addval = true} 
    class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full"
    >הוספת ערך חדש</button>
  {:else if addval == true} <AddnewVal color={"--barbi-pink"} addS={true} on:addnew={addnew} fn={vallues.map(c => c.attributes.valueName)}/>{/if}</div>
  <br>
 <div dir="rtl" class="mb-3 xl:w-96 ">
   <h2 class=" text-barbi">זמן תגובה לקבלת החלטות בריקמה</h2>
    <select on:change={ch}  bind:value={restime} class="round form-select appearance-none
      block
      w-80
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-gold focus:border-barbi focus:outline-none">
<option value="feh">שעות 48</option>
<option value="sth">שעות 72</option>
<option value="nsh">שעות 96</option>
<option value="sevend">שבוע</option>

</select>
<small style="color: red;">לאחר זמן זה חוסר מענה יחשב כהסכמה</small>
</div>
<div class="w-full grid items-center justify-center">
{#if chan == true}
  <button 
    class="cen bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold p-4 rounded-full"
     on:click="{sendP}"
     name="addm">{svbt[$lang]}</button>
     {/if}
</div></div>

<style>
  :global(div.multiselect > ul.selected > li) {
    background: var(--gold);
  }
  :global(div.multiselect > ul.selected > li button, button.remove-all) {
color: var(--barbi-pink)
}
select.round {
  background-image:
    linear-gradient(315deg, transparent 50%, rgb(0, 174, 255) 50%),
    linear-gradient(225deg, rgb(0, 174, 255) 50%, transparent 50%),
    radial-gradient(#ddd 70%, transparent 72%);
  background-position:
    calc(0% + 20px) calc(1em + 2px),
    calc(0% + 15px) calc(1em + 2px),
    calc(0% + .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
}

select.round:focus {
  background-image:
    linear-gradient(315deg, white 50%, transparent 50%),
    linear-gradient(225deg, transparent 50%, white 50%),
    radial-gradient(gray 70%, transparent 72%);
  background-position:
    calc(0% + 15px) 1em,
    calc(0% + 20px) 1em,
    calc(0% + .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
  border-color: green;
  outline: 0;
}
     .sp{
   display: grid;
    justify-content: center;
  align-items: center; 
  }
  .aft{
    display: grid;
    align-items: center;
    justify-content: center;
  }
  .cen{
    margin: 0 auto;

  }
  .jho{
 width: 50%;
 margin: 0 auto;
  }
   .textinput {
  position: relative;
  width: 100%;
  display: block;
}

.input {

  border: none;
  margin: 0;
  padding: 10px 0;
  outline: none;
  border-bottom: solid 1px var(--gold);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
 color:  var(--barbi-pink);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}


.label {

  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--barbi-pink);
  user-select: none;
}

.line {
  height: 2px;
  background-color: #2196F3;
  position: absolute;
  transform: translateX(-50%);
  left: 50%;
  bottom: 0;
  width: 0;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
}

.input:focus ~ .line, .input:valid ~ .line {
  width: 100%;
}

.input:focus ~ .label, .input:valid ~ .label {
  font-size: 11px;
  color: var(--gold);
  top: 0;
}

@media (max-width:600px){
 
.textinput {
  position: relative;
  width: 100%;
  display: block;
}
 .jho{
 width: 100%;
 margin: 0 auto;
  }
 
}
    h1{
      font-size: 29px;  
      color:  var(--barbi-pink);  
    }
  


</style>
