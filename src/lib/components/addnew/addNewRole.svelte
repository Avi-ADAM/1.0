
<script>
import { onMount } from 'svelte';
import axios from 'axios';
import { idr } from '../../stores/idr.js';
import Addnewskil from './addNewSkillToRole.svelte';
import MultiSelect from 'svelte-multiselect';
import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
export let rn = [];
export let color = "--gold"
let idro;
idr.subscribe(newwork => {
idro = newwork;
});
export let mid = -1;
 let selected;
 let id;
 let meData = [];
const placeholder = `כישורים קשורים`; 
let tafkidimslist = [];
let skillslist = [];
let roleName_value;
let desR;
export let skills2 = [];
let error1 = null;
let shgi = false;
let link ="https://oneloveone.onrender.com/tafkidims";

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
            const res = await fetch("https://oneloveone.onrender.com/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  skills { id skillName}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            skills2 = res.data.skills
        } catch (e) {
            error1 = e
            console.log(error1)
        }
    });

    function dispatchrole (meData, id) {
  dispatch('addnewrole', {
    id: id,
    mid: mid,
    skob: meData
    } );
};

function addrole () {
  shgi = false;
if (rn.includes(roleName_value)){
  shgi = true;
} else {
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
    meData = response.data;
    id = meData.id;
        dispatchrole (meData, id);
        addR = false;
              })
  .catch(error => {
    console.log('צריך לתקן:', error);
            });}
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
  newsk = event.detail.new;
  addsk = false;
};
function dispatchb () {
   addR = false
  dispatch('b', {
    } );
};

</script>

<div style="--the:{`var(${color})`};">
{#if addR == false}
<button 
class="bg-gold hover:bg-barbi text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
on:click={() => addR = true}>הוספת תפקיד שאינו ברשימה</button>
{:else}


<button title={cencel}
on:click={dispatchb}
class=" hover:bg-barbi hover:text-mturk text-gold font-bold rounded-full"
 ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button> 
  

    <h1 class="font-bold" style="font-size: 1rem; line-height: normal; color: var(--barbi-pink); ">הוספת תפקיד חדש</h1>    
<div dir="rtl" class='textinput'>
  <input  bind:value={roleName_value}
 type='text' class='input' required>
  <label for="name" class='label'>שם</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600">התפקיד כבר קיים</small>{/if}

   <div dir="rtl" class='textinput'>
  <input bind:value={desR}  
 type='text' class='input' required>
  <label for="des" class='label'>תיאור קצר</label>
  <span class='line'></span>
</div>

   <div>
      <MultiSelect
      bind:selected
      {placeholder}
      options={skills2.map(c => c.skillName)}
      />
     </div>
     <div>
      {#if addsk == false}
 {#if newsk} <p>{newsk}</p> {/if}
      <button
       on:click={() => addsk = true} 
       class="bg-gold hover:bg-barbi text-barbi hover:text-gold font-bold py-1 px-1 rounded-full"
       >הוספת כישור שאינו ברשימה</button>
       <br/>
    <button on:click={addrole}
    title="הוספת תפקיד חדש"
    class=" hover:bg-barbi hover:text-mturk text-gold font-bold py-1 px-2 rounded-full" 
    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
    </svg></button>
    
      {:else} 
      <button title={cencel}
    on:click={() => addsk = false}
     class=" hover:bg-barbi hover:text-mturk text-gold font-bold p-1 rounded-full"
     ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
    </svg></button>
      <Addnewskil {color} rn={skills2.map(c => c.skillName)} on:finnish={finnish}/>{/if}</div>
  
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


