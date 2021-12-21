<script>
  //  import { Textarea, TextField, MaterialAppMin } from 'svelte-materialify';
    import axios from 'axios';
     import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 let vallues = [];
// דף של השראה כפתור להוסיף את ההשראה שלך, כפתור לתיקונים  
    let name_value;
    let desV;
   
    let error1 = null;
    let link ="https://strapi-k4vr.onrender.com/vallues";
let meData;
export let vallId;   


function addNewVall() {

	axios
      .post(link, {
        valueName: name_value,
        descrip: desV
                  },
      {
      headers: {
       
                }})
      .then(response => {
        console.log('הצליח', response.data);
        meData = response.data;
        vallId = meData.id;
                dispatchvall (vallId, meData)
                  })
      .catch(error => {
        console.log('צריך לתקן:', error.response);
        error = error1 
        console.log(error1)
                });
    };    

 
function dispatchvall (vallId, meData) {
  dispatch('addnew', {
    id: vallId,
    skob: meData
    } );
};

function dispatchb () {
   addS = false
  dispatch('b', {
    } );
};
export let addS = false; 
let cencel = 'ביטול';

 </script>
 
{#if addS == false}
<button
class="bg-sturk hover:bg-barbi text-barbi hover:text-gold font-bold py-2 px-4 rounded"
on:click={() => addS = true}>הוספת ערך שאינו ברשימה</button>
{:else}
<button title={cencel}
on:click={dispatchb}
class="bg-lturk hover:bg-barbi text-barbi hover:text-lturk font-bold py-1 px-1 rounded text-center" ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>

<div>
 <h1 style="font-size: 2rem; line-height: normal; "> הוספת ערך חדש</h1>    
</div>
<div dir="rtl" class='textinput'>
  <input  bind:value={name_value} type='text' class='input' required>
  <label for="name" class='label'>שם הערך</label>
  <span class='line'></span>
</div>
<br />
<div dir="rtl" class='textinput'>
  <input type='text' class='input' bind:value={desV} required>
  <label for="descrip" class='label'>תיאור קצר</label>
  <span class='line'></span>
</div>

<button style="margin-top: 20px; " on:click={addNewVall}
class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-1 rounded">הוספה
</button>

{/if}
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
  border-bottom: solid 1px #212121;
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
  color: #212121;
  -webkit-tap-highlight-color: transparent;
}

.label {
  font-family: 'Roboto', sans-serif;
  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color: #212121;
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
