<script>
     import MultiSelect from 'svelte-multiselect';
    import Addnewm from '../addnew/addNewMission.svelte';
    import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 
export let selected = [];

export let roles = [];
    let addmission = false;  
export let mission1 = [];


    function find_mission_id(mission_name_arr){
     var  arr = [];
      for (let j = 0; j< mission_name_arr.length; j++ ){
      for (let i = 0; i< mission1.length; i++){
        if(mission1[i].missionName === mission_name_arr[j]){
          arr.push(mission1[i].id);
        }
      }
      }
      return arr;
     };
let moving = [];
let ids;
const placeholder = `בחירה מרשימה`;
function handl() {

    if (selected.length > 0) {
    
    dispatch('message', {
    li: find_mission_id(selected),
    show: true,
    bla: selected
    } );
   moving = selected;
    selected = moving;
    };
  //  
   
    
	};

let cencel = " ביטול הוספת פעולה חדשה";

function newM (event) {
  const myids = find_mission_id(selected);
  const newId = event.detail.id;
 const allm = myids.concat(newId);
 const mys = selected;
  const newn = event.detail.name;
 const alln = mys.concat(newn);
  console.log(allm);
  console.log(alln);
  dispatch('message', {
    li: allm,
    show: true,
    bla: alln
    } );
  addmission = false;
}
  </script>

<div dir="rtl" >
<h1 class="text-barbi font-bold">הוספת פעולות הנדרשות להקמה או\ו לתפקוד הריקמה</h1>
  
           <div class="inline-block relative w-min	">
        
      
          <MultiSelect
          bind:selected
          {placeholder}
          options={mission1.map(c => c.missionName)}
         on:blur={handl}
          /></div>
        
        
{#if addmission == false}
<!--{#if selected[0]} 
          <button
          title="הוספה"
          class="bg-pink-200 hover:bg-pink-500 text-mturk hover:text-lturk font-bold py-1 px-2 rounded-full" 
          on:click={handl}><svg style="width:24px;height:24px" viewBox="0 0 24 24">
            <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
        </svg></button>
          {/if}-->
<button
 on:click={() => addmission = true}
  class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-1 px-2 rounded-full"
  >הוספת פעולה שאינה ברשימה</button>
  {:else if addmission == true}
  <div  class="border-2 border-gold rounded m-4">
  <button
  title={cencel}
       on:click={() => addmission = false}
        class=" hover:bg-barbi text-barbi hover:text-gold font-bold p-0.5 rounded-full"
        ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
         <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
     </svg></button>
 <Addnewm roles={roles} on:new={newM}/></div>
 {/if} 
 </div>

<style>
  h1{
      font-size: 29px;  
     
    }
  </style> 