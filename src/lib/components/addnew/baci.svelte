<script>
               import { lang } from '$lib/stores/lang.js'

    import { idPr } from '../../stores/idPr.js';
    import axios from 'axios';
    import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
    import AddnewVal from './addnewval.svelte';
    import MultiSelect from 'svelte-multiselect';
    import { onMount } from 'svelte';
    import Uplad from '../userPr/uploadPic.svelte';
     import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';
let loading = false;
let isOpen = false;
let a = 0;
    let before = false;
    let url1 = "https://i18.onrender.com/upload";
    let linkP;
    let desP;
    let desPl;
    let resP;
    let projectName_value;
    let token; 
    let timeToP = "already";
   let idL;
let run = [];
let imageId = 50;
let files;
  let shgi = false;
    let restime;
function sendP () {
    if (run.includes(projectName_value)){
  shgi = true; 
} else{
  loading = true;
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
    let bearer1 = 'bearer' + ' ' + token;
//let fd = new FormData();
if (files) {
  //  fd.append('files', files[0]);
  axios
 .post( url1, files  ,{
                headers: {
                    Authorization: bearer1,
                },
            })
            .then(({ data }) => {
                 imageId = data[0].id;
 
  axios
  .post('https://i18.onrender.com/projects', {
    user_1s: idL,
    projectName: projectName_value, 
    publicDescription: desP,
    profilePic: imageId,
    linkToWebsite: linkP,
    descripFor: desPl,
    vallues: find_value_id(selected),
     restime: restime,
     timeToP:timeToP
              },
  {
  headers: {
    'Authorization': bearer1
            }})
  .then(response => {
    console.log('הצליח', response.data);
    resP = response.data; 
    idPr.set(resP.id);
    before = true;
    loading = false;
   goto("/moach", );
              })
  .catch(error => {
    console.log('צריך לתקן:', error.response);
        loading = false;
            });
  console.log("hh")
})} else {
  axios
  .post('https://i18.onrender.com/projects', {
    user_1s: idL,
        profilePic: imageId,
    projectName: projectName_value, 
    publicDescription: desP,
    linkToWebsite: linkP,
    descripFor: desPl,
    vallues: find_value_id(selected),
    restime: restime
              },
  {
  headers: {
    'Authorization': bearer1
            }})
  .then(response => {
    console.log('הצליח', response.data);
    resP = response.data; 
    idPr.set(resP.id);
        before = true;
            loading = false;
   goto("/moach", );
              })
  .catch(error => {
    console.log('צריך לתקן:', error.response);
        loading = false;
            });
  console.log("hh")



}
  }
}
;


let vallues = [];
    let error1 = null;
    let addval = false;
    
    onMount(async () => {
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
        try {
           const res = await fetch("https://i18.onrender.com/graphql", {
              method: "POST",
              headers: {
                   'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },  body: JSON.stringify({
                        query: `query {
  vallues { id valueName ${$lang == 'he' ? 'localizations{valueName }' : ""}}
  projects { projectName}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            vallues = res.data.vallues;
            if ($lang == "he" ){
              for (var i = 0; i < vallues.length; i++){
                if (vallues[i].localizations.length > 0){
                vallues[i].valueName = vallues[i].localizations[0].valueName
                }
              }
            }          
            vallues = vallues
            const runi = res.data.projects;
           run = runi.map(c => c.projectName)
        } catch (e) {
            error1 = e
        }
    });

let suc = false;
    function find_value_id(value_name_arr){
     var  arr = [];
      for (let j = 0; j< value_name_arr.length; j++ ){
      for (let i = 0; i< vallues.length; i++){
        if(vallues[i].valueName === value_name_arr[j]){
          arr.push(vallues[i].id);
        }
      }
      }
      return arr;
     };


    let selected;
        const placeholder = `${$lang == "he" ? "ערכים ומטרות" : "vallues and goals"}`;

 function project (id) {
    idPr.set(resP.id);
    goto("/moach");
  };
export let userName_value;
  import { RingLoader
} from 'svelte-loading-spinners'
 const closer = () => {
    isOpen = false;
  a = 0;
  };
  	function callbackFunction(event) {
    a = 2;
    files = event.detail.files;
    isOpen = false;
    suc = true;
	}
  function openen () {
  isOpen = true;
 
}


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
const timeto = {"he":"כמה זמן עד שהריקמה תכניס כסף", "en":"how much time until the FreeMates will be profitable"}
const timetoex = {"he":"חישוב הזמן עד שניתן יהיה לחלק כסף מרגע שאוישו כל המשימות ונתקבלו כל המשאבים הנדרשים", "en" : "the time until money can be splited from when all of the missions has asigned and all the resources has accepted" }
const cvar = {"he":"הריקמה כבר רווחית", "en": "the FreeMates already profitable"}
const week = {"he":"שבוע" , "en": "week"}
const month = {"he": "חודש", "en": "month"}
const threemonth = {"he": "שלושה חודשים", "en": "three months"}
const halt = {"he": "חצי שנה" , "en": "half a year"}
const year = {"he": "שנה" , "en": "year"}
const toyers = {"he": "שנתיים", "en": "two years"}
const more = {"he": "יותר משנתיים", "en": "more then 2 years" }
const never = {"he": "לעולם לא", "en": "never"}
const om = {"he":"רק רגע בבקשה", "en": "one moment please"}
const cencel = {"he":"ביטול","en": "cencel"}
const crn = {"he":"יצירת ריקמה חדשה", "en": "Create new FreeMate"}
const frn = {"he":"שם הריקמה", "en":"FreeMates name"}
const hours = {"he": "שעות", "en": "hours"}
const hrex = {"he": "לאחר זמן זה חוסר מענה יחשב כהסכמה", "en": "after that: non-voting will consider as agreement"}
const hre = {"he":"זמן תגובה לקבלת החלטות בריקמה", "en":"time to respond to FreeMates voting"}
const teure = {"he": "תיאור קצר שיהיה גלוי לכל", "en": "short description with public visibility"} 
const prte = {"he": "תאור מפורט שגלוי רק בתוך הריקמה", "en":"long description visible only to the FreeMates members"}
const wel = {"he":"לינק לאתר (אם יש(" ,"en":"link to a website (if any)"}
const naex = {"he":"השם כבר קיים נא לבחור שם אחר" , "en":"name already exists please try another name"}
const whva = {"he":"אלו ערכים ומטרות הריקמה תקדם" , "en":"which vallues and goals the FreeMates will promote"}
const ladd = {"he":"הוסף לוגו", "en": "add Logo"} 
const su = {"he": "לוגו נוסף בהצלחה", "en": "logo has successfully added"}
const addn = {"he":"הוספת ערך חדש","en": "Add new Vallue"}
const cree = {"he": "ליצור ולפרסם ריקמה", "en": "Create new FreeMate"}
const sur = {"he":"הריקמה נוצרה בהצלחה", "en":"new FreeMates has created"}
const tob = {"he":"למוח הריקמה", "en":"to the FreeMates brain"}
 </script>  
<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form">
      <div style="z-index: 400;" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          on:click={closer}>{cencel[$lang]}</button>
          {#if a == 0}
          <Uplad on:message={callbackFunction}/>

          {:else if a == 2}
          <div class="sp bg-gold">
            <h3 class="text-barbi">{om[$lang]}</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> {/if}
  </DialogContent>
  </div>
</DialogOverlay>
<div class="a"></div>


  {#if before == false}

<div dir="{$lang == "en" ? "ltr" : "rtl"}" class="jho flex flex-col items-center text-center justify-center">
  <h1 class="text-gold">{crn[$lang]}</h1>
<br>

        <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <input name="des" bind:value={projectName_value}  
 type='text' class='input'required >
  <label for="des" class='label'>{frn[$lang]}</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600">{naex[$lang]}</small>{/if}

    <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <textarea name="es"  bind:value={desP}    
 type='text' class='input d' required ></textarea>
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="es" class='label'>{teure[$lang]}</label>
  <span class='line'></span>
</div>
   <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <textarea name="s"  bind:value={desPl}     
 type='text' class='input d' required></textarea>
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="s" class='label'>{prte[$lang]}</label>
  <span class='line'></span>
</div>
 <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <input name="de"    bind:value={linkP}     
 type='text' class='input' required>
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="de" class='label'>{wel[$lang]}</label>
  <span class='line'></span>
</div>
<br>
<button on:click={openen} class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold rounded-full p-2" >{ladd[$lang]}</button>
{#if suc == true}<small class="text-barbi">{su[$lang]}</small>{/if}
         
<h1 class="midscreenText-2 text-center text-gold">
  {userName_value} 
  {whva[$lang]}
?
</h1> 

 <div  class="input-2">
   <MultiSelect
   bind:selected
   {placeholder}
   options={vallues.map(c => c.valueName)}
   /></div>
   <div  class="input-2-2">
   {#if addval == false}
    <button
    on:click={() => addval = true} 
    class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full"
    >{addn[$lang]}</button>
  {:else if addval == true} <AddnewVal addS={true} on:addnew={addnew} fn={vallues.map(c => c.valueName)}/>{/if}</div>
  <br>
 <div dir="{$lang == "en" ? "ltr" : "rtl"}" class="mb-3 xl:w-96 m-2">
      <h2 class="text-center text-gold">{hre[$lang]}</h2>
    <select bind:value={restime} class="round form-select appearance-none
      block
      w-full
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
      focus:text-barbi focus:bg-lturk focus:border-barbi focus:outline-none">
<option value="feh" selected> 48 {hours[$lang]} </option>
<option value="sth">72 {hours[$lang]} </option>
<option value="nsh">96 {hours[$lang]} </option>
<option value="sevend">{week[$lang]}</option>

</select>
<small style="color: turquoise;">{hrx[$lang]}</small>
</div>
<div dir="{$lang == "en" ? "ltr" : "rtl"}" class="mb-3 xl:w-96 m-2">
      <h2 class="text-center text-gold">{timeto[$lang]}</h2>
    <select bind:value={timeToP} class="round form-select appearance-none
      block
      w-full
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
      focus:text-barbi focus:bg-lturk focus:border-barbi focus:outline-none">
<option value="already" selected>{cvar[$lang]}</option>
<option value="week">{week[$lang]}</option>
<option value="month">{month[$lang]}</option>
<option value="threeM">{threemonth[$lang]}</option>
<option value="sixM">{halt[$lang]}</option>
<option value="oneY">{year[$lang]}</option>
<option value="twoY">{toyers[$lang]}</option>
<option value="more">{more[$lang]}</option>
<option value="never">{never[$lang]}</option>
</select>
<small style="color: turquoise;">{timetoex[$lang]}</small>
</div>
  {#if loading == false}

<button 
    class="cen bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold p-4 rounded-full"
     on:click="{sendP}"
     name="addm">{cree[$lang]}</button>
       {:else}  <RingLoader size="100" color="#ff00ae" unit="px" duration="2s"></RingLoader>
{/if}</div>
{:else}
<div class="aft">
  <h1>{sur[$lang]}</h1>
  <button class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full"
 on:click={project} >{tob[$lang]}</button>
</div>
{/if}

<style>
 

  textarea::-webkit-resizer {
  border-width: 8px;
  border-style: solid;
  border-color: transparent  transparent var(--gold)  var(--gold);
}
 .d::-webkit-scrollbar {
    width: 10px;
}
   
.d::-webkit-scrollbar-track {
    background-color: #e4e4e4;
    border-radius: 100px;
}
 
.d::-webkit-scrollbar-thumb {
    background-color: #d4aa70;
    border-radius: 100px;
}
.d {
    scrollbar-color: #D4AA70 #e4e4e4;
}
.d::-webkit-scrollbar-thumb {
    background-image: linear-gradient(180deg, #D0368A 0%, #708AD4 99%);
    box-shadow: inset 2px 2px 5px 0 rgba(#fff, 0.5);
    border-radius: 100px;
}
  .a{
     background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
 z-index: -1;
 position: fixed;
  top: 0;
  left: 0;
  min-width: 100vw;
  min-height: 100vh;
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
 color:  var(--gold);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}


.label {

  font-size: 15px;
  position: absolute;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--gold);
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
  font-size: 14px;
  color: turquoise;
  top: 0;
}
.input:focus ,.input:valid  {
  border: 0;
}

@media (max-width:600px){
 
.textinput {
  position: relative;
  width: 100%;
  display: block;
}
 .jho{
 width: 90%;
 margin: 0 auto;
  }
 
}
@media (min-width:601px){
 .d::-webkit-scrollbar {
    width: 17px;
}
}


    h1{
      font-size: 29px;  
    }
    img.bg {
  min-height: 100%;
  min-width: 1024px;
  width: 100%;
  height: auto;
	  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
}


@media screen and (max-width: 1024px) { /* Specific to this particular image */
  img.bg {
    left: 50%;
    margin-left: -512px;   /* 50% */
  }
}  
</style>
