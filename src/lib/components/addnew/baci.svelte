<script>
  
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
    let url1 = "https://oneloveone.onrender.com/upload";
    let linkP;
    let desP;
    let desPl;
    let resP;
    let projectName_value;
    let token; 
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
  .post('https://oneloveone.onrender.com/projects', {
    user_1s: idL,
    projectName: projectName_value, 
    publicDescription: desP,
    profilePic: imageId,
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
  //  goto("/moach", );
              })
  .catch(error => {
    console.log('צריך לתקן:', error.response);
        loading = false;
            });
  console.log("hh")
})} else {
  axios
  .post('https://oneloveone.onrender.com/projects', {
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
           const res = await fetch("https://oneloveone.onrender.com/graphql", {
              method: "POST",
              headers: {
                   'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },  body: JSON.stringify({
                        query: `query {
  vallues { id valueName}
  projects { projectName}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            vallues = res.data.vallues;
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
    const placeholder = `ערכים ומטרות`;
 
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
  </script>  
<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form">
      <div style="z-index: 400;" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          on:click={closer}>ביטול</button>
          {#if a == 0}
          <Uplad on:message={callbackFunction}/>

          {:else if a == 2}
          <div class="sp bg-gold">
            <h3 class="text-barbi">רק רגע בבקשה</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> {/if}
  </DialogContent>
  </div>
</DialogOverlay>


  {#if before == false}
<img class="bg" src="https://res.cloudinary.com/love1/image/upload/v1641997213/4nd_us6lck.svg" alt="bg">

<div dir="rtl" class="jho flex flex-col items-center text-center justify-center">
  <h1 class="text-gold">יצירת ריקמה חדשה</h1>
<br>

        <div dir="rtl" class='textinput'>
  <input name="des" bind:value={projectName_value}  
 type='text' class='input'required >
  <label for="des" class='label'>שם הריקמה</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600">השם כבר קיים</small>{/if}

    <div dir="rtl" class='textinput'>
  <input name="es"  bind:value={desP}    
 type='text' class='input' required >
  <label for="es" class='label'>תיאור קצר הגלוי לכול</label>
  <span class='line'></span>
</div>
   <div dir="rtl" class='textinput'>
  <input name="s"  bind:value={desPl}     
 type='text' class='input' required>
  <label for="s" class='label'>תיאור מפורט עם נראות סלקטיבית</label>
  <span class='line'></span>
</div>
 <div dir="rtl" class='textinput'>
  <input name="de"    bind:value={linkP}     
 type='text' class='input' required>
  <label for="de" class='label'>
לינק לאתר</label>
  <span class='line'></span>
</div>
<br>
<button on:click={openen} class="bg-gold hover:bg-barbi text-barbi hover:text-gold rounded-full p-2" >הוסף לוגו</button>
{#if suc == true}<small class="text-barbi">לוגו נבחר בהצלחה</small>{/if}
         
<h1 class="midscreenText-2 text-center text-gold">
  {userName_value} 
 אלו ערכים ומטרות הריקמה תקדם
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
    class="bg-barbi hover:bg-gold text-gold hover:text-barbi font-bold py-2 px-4 rounded-full"
    >הוספת ערך חדש</button>
  {:else if addval == true} <AddnewVal addS={true} on:addnew={addnew} fn={vallues.map(c => c.valueName)}/>{/if}</div>
  <br>
 <div dir="rtl" class="mb-3 xl:w-96 m-2">
      <h2 class="text-center text-gold">זמן תגובה לקבלת החלטות בריקמה</h2>
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
<option value="feh" selected>שעות 48</option>
<option value="sth">שעות 72</option>
<option value="nsh">שעות 96</option>
<option value="sevend">שבוע</option>

</select>
<small style="color: red;">לאחר זמן זה חוסר מענה יחשב כהסכמה</small>
</div>
  {#if loading == false}

<button 
    class="cen bg-barbi  hover:bg-gold text-gold hover:text-barbi font-bold p-4 rounded-full"
     on:click="{sendP}"
     name="addm">ליצור ולפרסם ריקמה </button>
       {:else}  <RingLoader size="100" color="#ff00ae" unit="px" duration="2s"></RingLoader>
{/if}</div>
{:else}
<div class="aft">
  <h1>הריקמה נוצרה בהצלחה</h1>
</div>
{/if}


<style>
  
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
  font-family: 'Roboto', sans-serif;
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
  font-family: 'Roboto', sans-serif;
  font-size: 15px;
  position: absolute;
  right: 0;
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
  font-size: 11px;
  color: var(--barbi-pink);
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
