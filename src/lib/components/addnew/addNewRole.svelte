
<script>
import { Textarea, TextField, MaterialAppMin } from 'svelte-materialify';
import { onMount } from 'svelte';
import axios from 'axios';
import { idr } from './store/idr';
import Addnewskil from './addNewSkillToRole.svelte';
import MultiSelect from 'svelte-multiselect';
import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();

let idro;
idr.subscribe(newwork => {
idro = newwork;
});
export let mid = -1;
 let selected;
 let id;
 let meData = [];
const placeholder = `בחירת כישורים משוייכים`; 
let tafkidimslist = [];
let skillslist = [];
let roleName_value;
let desR;
export let skills2 = [];
let error1 = null;

let link ="http://localhost:5000/tafkidims";

onMount(async () => {
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
        'Content-Type': 'application/json',
      };
    
        try {
            const res = await fetch("http://localhost:5000/skills?_limit=-1", {
              method: "GET",
              headers: {
                 'Content-Type': 'application/json'
              },
            }).then(checkStatus)
          .then(parseJSON);
            skills2 = res
        } catch (e) {
            error1 = e
            console.log(error1)
        }
    });

    function dispatchrole (meData, id) {
  console.log("hh", id)
  dispatch('addnewrole', {
    id: id,
    mid: mid,
    skob: meData
    } );
};

function addrole () {
  console.log("id", find_skill_id(selected));
  console.log('gggyu');
skillslist = find_skill_id(selected);
skillslist.push(idro);
axios
  .post(link, {
    roleDescription: roleName_value,
    descrip: desR,
    skills: skillslist
              },
  {
  headers: {
   
            }})
  .then(response => {
    console.log('הצליח', response.data);
    meData = response.data;
    id = meData.id;
        dispatchrole (meData, id);
        addR = false;
              })
  .catch(error => {
    console.log('צריך לתקן:', error);
            });
  console.log("hh")
};    




    function find_skill_id(skill_name_arr){
     var  arr = [];
      for (let j = 0; j< skill_name_arr.length; j++ ){
      for (let i = 0; i< skills2.length; i++){
        if(skills2[i].skillName === skill_name_arr[j]){
          arr.push(skills2[i].id);
        }
      }
      }
      return arr;
     };
export let addR = false;
let cencel = " ביטול"
let addsk = false;
let newsk;
function finnish (event) {
  addsk = event.detail.addsk;
  newsk = event.detail.new;
};
function dispatchb () {
   addR = false
  dispatch('b', {
    } );
};

</script>


<div style="margin: 0 auto; background-color: var(--gold)">

{#if addR == false}
<button
class="bg-sturk hover:bg-barbi text-barbi hover:text-gold font-bold py-2 px-4 rounded"
on:click={() => addR = true}>הוספת תפקיד חדש</button>
{:else}
<MaterialAppMin >
  <div style=" margin: 0 auto; background-color: var(--gold)">

<button title={cencel}
on:click={dispatchb}
class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold  p-0.5 rounded"
 ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button> 
  
<div>
    <h1 style="font-size: 2rem; line-height: normal; color: var(--barbi-pink) background-color: var(--gold)">הוספת תפקיד חדש</h1>    
</div>
  </div>

    
  <TextField
   style=" background-color: var(--gold); padding-top: 10px; margin: 0 auto;" 
   color="pink accent-2" 
   dense 
   rounded 
   outlined 
   bind:value={roleName_value}
   >שם </TextField>

<Textarea 
style="background-color: var(--gold);  padding-top: 10px; margin: 0 auto;" 
color="pink accent-2" 
bind:value={desR}  
autogrow 
outlined 
rounded 
rows={2}>תיאור קצר</Textarea>

<div style="margin: 0 auto; background-color: var(--gold)">

   <div>
      <MultiSelect
      bind:selected
      {placeholder}
      options={skills2.map(c => c.skillName)}
      />
     </div><div>
      {#if addsk == false}
 {#if newsk} <p>{newsk}</p> {/if}
      <button
       on:click={() => addsk = true} 
       class="bg-sturk hover:bg-barbi text-barbi hover:text-gold font-bold py-1 px-1 rounded"
       >הוספת כישור אחר</button>
       
    <button on:click={addrole}
    title="הוספת תפקיד חדש"
    class="bg-pink-300 hover:bg-barbi text-mturk hover:text-gold font-bold py-1 px-2 rounded" 
    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
    </svg></button>
    
      {:else} 
      <button title={cencel}
    on:click={() => addsk = false}
     class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold p-1 rounded"
     ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
    </svg></button>
      <Addnewskil on:finnish={finnish}/>{/if}</div>
     </MaterialAppMin> 
    {/if}
    </div>



