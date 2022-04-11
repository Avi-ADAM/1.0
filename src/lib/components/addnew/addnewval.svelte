<script>
  //  import { Textarea, TextField, MaterialAppMin } from 'svelte-materialify';
    import axios from 'axios';
     import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 let vallues = [];
// דף של השראה כפתור להוסיף את ההשראה שלך, כפתור לתיקונים  
    let name_value;
    let desV;
   export let color = "--gold";

    let error1 = null;
    let link ="https://onelovevone.onrender.com/vallues";
let meData;
export let vallId;   
export let rn = [];
    let shgi = false;

async function addNewVall() {
   shgi = false;
if (rn.includes(name_value)){
  shgi = true;
} else {
  let link ="https://onelovevone.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
           `mutation { createVallue(
    input: {
       data: {
         valueName: "${name_value}",
          descrip: "${desV}"
       }
    }
  ){
          vallue{
              id valueName
          }
  }
}`   
        })
})
  .then(r => r.json())
  .then(data => meData = data);
   dispatchvall ( meData);
                  }
      catch(error) {
        console.log('צריך לתקן:', error.response);
        error = error1 
        console.log(error1)
                };}
    };    

 
function dispatchvall (meData) {
  dispatch('addnew', {
    id: meData.data.createVallue.vallue.id,
    skob: meData.data.createVallue.vallue
    } );
    addS = false
};

function dispatchb () {
   addS = false
  dispatch('b', {
    } );
};
export let addS = false; 
let cencel = 'ביטול';
 </script>
 <div style="--the:{`var(${color})`};">
{#if addS == false}
<button 
class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-2 rounded-full"
on:click={() => addS = true}>הוספת ערך שאינו ברשימה</button>
{:else}
<button title={cencel}
on:click={dispatchb}
class=" hover:bg-barbi text-gold hover:text-lturk font-bold  rounded-full text-center" ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>

<div >
 <h1 class="font-bold" style="font-size: 1rem; line-height: normal; color: var(--barbi-pink); "> הוספת ערך חדש</h1>    
</div>
<div dir="rtl" class='textinput'>
  <input  bind:value={name_value} type='text' class='input' required>
  <label for="name" class='label'>שם הערך</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600">השם כבר קיים</small>{/if}
<br />
<div dir="rtl" class='textinput'>
  <input type='text' class='input' bind:value={desV} required>
  <label for="descrip" class='label'>תיאור קצר</label>
  <span class='line'></span>
</div>

<button style="margin-top: 20px; " on:click={addNewVall} 
title="הוספה"
class=" hover:bg-barbi text-gold hover:text-mturk font-bold py-1 px-1 rounded-full"><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
</svg>
</button>

{/if}
</div>
<style>
 .textinput {
  position: relative;
  width: 80%;
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
  color:var( --the, var(--gold));
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
  color:var( --the, var(--gold));
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
  color: #2196F3;
  top: 0;
}

@media (max-width:600px){
.textinput {
  position: relative;
  width: 100%;
  display: block;
}
 
}
</style>
