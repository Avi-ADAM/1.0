<script>
  import {Textarea, TextField, MaterialAppMin } from 'svelte-materialify';
    import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
import axios from 'axios';
import { idr } from './store/idr.js';
let skillName_value;
    let desS;
    let link ="http://localhost:5000/skills";
    let meData;
function addNewSkill () {
    axios
  .post(link, {
    skillName: skillName_value,
    descrip: desS
              },
  {
  headers: {
            }})
  .then(response => {
    console.log('הצליח', response.data);
    meData = response.data;
    finnish (meData.id);
         idr.set(meData.id);
              })
  .catch(error => {
    console.log('צריך לתקן:', error);
            });
  console.log("hh")
};    


function finnish (id) {
        console.log("hh", id)
  dispatch('finnish', {
    id: id,
    addsk: false,
    rob: meData,
    new: skillName_value
    } );
       };
</script>

<div dir="rtl" style="background-color: var(--gold)">
  <h1 style="font-size: 2rem; line-height: normal; color: var(--barbi-pink) background-color: var(--gold)">הוספת כישור חדש</h1>    

<div>
    <MaterialAppMin >
      
<div dir="rtl" style="background-color: var(--gold)">

        <TextField
         class="m-4 "
          style=" background-color: var(--gold); padding-top: 10px; margin: 0 auto;" 
          color="pink accent-2" 
          dense 
          rounded 
          outlined 
          bind:value={skillName_value}
          >שם </TextField>
     
      <Textarea 
      class="m-4" 
      style="background-color: var(--gold);  padding-top: 10px; margin: 0 auto;" 
      color="pink accent-2" bind:value={desS}  
      autogrow outlined 
      rounded rows={2}>תיאור קצר</Textarea>
    

      <button on:click={addNewSkill}
      title="הוספת כישור חדש"
      class="bg-pink-300 hover:bg-barbi text-mturk hover:text-gold font-bold py-1 px-2 rounded" 
      ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
      </svg></button>
</div>
    </MaterialAppMin>
</div>
</div>