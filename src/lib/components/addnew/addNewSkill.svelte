<script>
    import Addnewro from './addNewRoleToSkill.svelte';
    import MultiSelect from 'svelte-multiselect';
    import { Textarea, TextField, MaterialAppMin } from 'svelte-materialify';
    import { onMount } from 'svelte';
    import axios from 'axios';
    import { idd } from './store/idd.js';
    import { skillIdStore } from './store/skillIdStore.js'
    import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
export let roles1 = [];
export let mid = -1;
 let selected;
 let id;
const placeholder = `בחירת תפקיד משוייך`;
    let addro = false;    
let idk;
    idd.subscribe(newwork => {
    idk = newwork;
  });
    let tafkidimslist = [];
    let skillName_value;
    let desS;
    let meData;
    let error1 = null;
    let link ="http://localhost:5000/skills";

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
          const res = await fetch("http://localhost:5000/tafkidims?_limit=-1", {
            method: "GET",
            headers: {
               'Content-Type': 'application/json'
            },
          }).then(checkStatus)
        .then(parseJSON);
          roles1 = res
      } catch (e) {
          error1 = e
      }
  });

    function find_role_id(role_name_arr){
     var  arr = [];
      for (let j = 0; j< role_name_arr.length; j++ ){
      for (let i = 0; i< roles1.length; i++){
        if(roles1[i].roleDescription === role_name_arr[j]){
          arr.push(roles1[i].id);
        }
      }
      }
      return arr;
     };
function dispatchskillid (meData, id) {
  console.log("hh", id)
  dispatch('addnewskill', {
    id: id,
    mid: mid,
    skob: meData
    } );
};

function addNewSkill() {
  tafkidimslist = find_role_id(selected);
  console.log(tafkidimslist);
  tafkidimslist.push(idk);
  console.log(tafkidimslist);
	axios
      .post(link, {
        skillName: skillName_value,
        descrip: desS,
        tafkidims: tafkidimslist,
                  },
      {
      headers: {
       
                }})
      .then(response => {
        console.log('הצליח', response.data);
        meData = response.data;
        console.log(meData.id);
        skillIdStore.set(meData.id);
        id = meData.id;
        dispatchskillid (meData, id);
        addS = false;
                  })
      .catch(error => {
        console.log('צריך לתקן:', error);
                });
    };    

export let addS = false;
let cencel = " ביטול"
let newrole;
function finnish (event) {
  addro = event.detail.addro;
  newrole = event.detail.name;
}
function dispatchb () {
   addS = false
  dispatch('b', {
    } );
};
  </script>
  <div style="margin: 0 auto; background-color: var(--gold)">
{#if addS == false}
<button
class="bg-sturk hover:bg-barbi text-barbi hover:text-gold font-bold py-2 px-4 rounded"
on:click={() => addS = true}>הוספת כישור שאינו ברשימה</button>
{:else}
<MaterialAppMin >
  <div style=" margin: 0 auto; background-color: var(--gold)">
<button title={cencel}
on:click={dispatchb}
              class="bg-lturk hover:bg-barbi text-barbi hover:text-lturk font-bold py-1 px-1 rounded text-center"
 ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>



 <h1 style="font-size: 2rem; line-height: normal; color: var(--barbi-pink) background-color: var(--gold)"> הוספת כישור חדש</h1>    
</div>
<div style=" margin: 0 auto; background-color: var(--gold)">
  
      
      <TextField
       class="m-4 " 
       style=" background-color: var(--gold); padding-top: 10px; margin: 0 auto;" 
       color="pink accent-2" 
       dense 
       rounded 
       outlined 
       bind:value={skillName_value}
       >שם הכישור</TextField>
   
    <Textarea 
    class="m-4" 
    style="background-color: var(--gold);  padding-top: 10px; margin: 0 auto;" 
    color="pink accent-2" 
    bind:value={desS}  
    autogrow 
    outlined 
    rounded 
    rows={2}>תיאור קצר</Textarea>
  
  
<div>
  <MultiSelect
  bind:selected
  {placeholder}
  options={roles1.map(c => c.roleDescription)}
  /></div>
<div>
  {#if addro == false}
{#if newrole} <p>{newrole}</p>{/if}
  <button
   on:click={() => addro = true} 
   class="bg-sturk hover:bg-barbi text-barbi hover:text-gold font-bold py-1 px-1 rounded"
   >הוספת תפקיד אחר</button>
   
<button on:click={addNewSkill}
title="הוספת כישור חדש"
class="bg-pink-300 hover:bg-barbi text-mturk hover:text-gold font-bold py-1 px-2 rounded" 
><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
</svg></button>

  {:else} 
  <button title={cencel}
on:click={() => addro = false}
 class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold p-1 rounded"
 ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
  <Addnewro on:finnish={finnish}/>
  {/if}</div>
 </MaterialAppMin> 
{/if}

</div>

<style>
 
  </style>