<script>
    import { Textarea, TextField, MaterialAppMin } from 'svelte-materialify';
    import axios from 'axios';
     import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 let vallues = [];

    let name_value;
    let desV;
   
    let error1 = null;
    let link ="http://localhost:5000/vallues";
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
<div style=" margin: 0 auto;">
  <MaterialAppMin >
      
      <TextField
       class="m-4 " 
       style=" background-color: var(--gold); padding-top: 10px; margin: 0 auto;" 
       color="pink accent-2" 
       dense 
       rounded 
       outlined 
       bind:value={name_value}
       >שם הערך</TextField>
   
    <Textarea 
    class="m-4" 
    style="background-color: var(--gold);  padding-top: 10px; margin: 0 auto;" 
    color="pink accent-2" 
    bind:value={desV}  
    autogrow 
    outlined 
    rounded 
    rows={2}>תיאור קצר</Textarea>
  
  </MaterialAppMin>


<button on:click={addNewVall}
class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-1 rounded">הוספה
</button></div>

{/if}