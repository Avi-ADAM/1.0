<!-- @migration-task Error while migrating Svelte code: `<tr>` cannot be a child of `<table>`. `<table>` only allows these children: `<caption>`, `<colgroup>`, `<tbody>`, `<thead>`, `<tfoot>`, `<style>`, `<script>`, `<template>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components.
https://svelte.dev/e/node_invalid_placement -->
<script>
    import { onMount } from 'svelte';
 import { createEventDispatcher } from 'svelte';
  import { RingLoader
} from 'svelte-loading-spinners'

 const dispatch = createEventDispatcher();
  let token; 
export let meData = [];
  let miDatan = [];
    let error1 = null;

  onMount(async () => {
    const id = meData.id
    meData = meData.attributes
    meData.id = id
    meData = meData
   myMissionH()
   myMi ()
              });
   function myMi ()  {
    meData.hm !== undefined || null || 0 ? meData.hm : 1;
    meData.easy !== undefined || null || 0 ? meData.easy : meData.price;
    meData.dates !== undefined || null || 0 ? meData.dates : new Date().toISOString().slice(0, -1);
    meData.datef !== undefined || null || 0 ? meData.datef :  new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().slice(0, -1);
}
 let already = false;
 let idL;
const baseUrl = import.meta.env.VITE_URL

async function han (){
    console.log(meData)
    already = true;
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
   const hm = (meData.hm > 0) ? meData.hm : 1;
  const price = (meData.price > 0) ? meData.price : 0;
  const easy = (meData.myp > 0) ? meData.myp : 0;
  const sdate = (meData.dates !== undefined) ? `sdate: "${new Date(meData.dates).toISOString()}",` : ``;
   const fdate = (meData.datef !== undefined) ? `fdate: "${new Date(meData.datef).toISOString()}" ,` : ``;
 let linkgra = baseUrl+'/graphql';
    try {
             await fetch(linkgra, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { updateSp(
    id: ${meData.id}
      data: { 
          name: "${meData.name}",
             descrip: "${meData.descrip}",
             kindOf: ${meData.kindOf},
             unit: ${hm},
             spnot: "${meData.spnot}",  
             price: ${price},
             myp: ${easy},   
             linkto: "${meData.linkto}",
             users_permissions_user: "${idL}",
             ${sdate} 
             ${fdate}
    }
  )  {data{id attributes{ name}}}
} `   
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
             dispatch('close', {
                 id: miDatan.data.updateSp.data.id,
                 name: miDatan.data.updateSp.data.attributes.name,
                 skob: miDatan.data.updateSp.data
             });
        } catch (e) {
            error1 = e
        }
        
}


  let ky = false;
  let kc = false;

function myMissionH ()  {
  ky = false;
  kc = false;
  let is = [];

  if (meData.kindOf === "monthly"){
    ky = true;
    meData.ky = true;
         meData.kc = false;
   meData.m = true;
                   meData.r = false;
    meData.y = false;
  } else if (meData.kindOf === "yearly"){
    ky = true;
     meData.ky = true;
              meData.kc = false;
meData.m = false;
                   meData.r = false;
    meData.y = true;
    } else if (meData.kindOf === "rent"){
    ky = true;
     meData.ky = true;
         meData.kc = false;
meData.m = false;
                   meData.r = true;
    meData.y = false;
    } else if (meData.kindOf === "perUnit"){
    meData.kc = true;
         meData.ky = false;
    kc = true;
    meData.m = false;
                   meData.r = false;
    meData.y = false;
  } else {
    meData.kc = false;
         meData.ky = false;
          meData.m = false;
                   meData.r = false;
    meData.y = false;
  }
 

 
};
import {lang} from '$lib/stores/lang'
const ot = {"he":"עלות חד פעמית","en":"one time"}
const py = {"he":"ליחידה", "en": "per unit"}
const pm = {"he": "חודשי","en": "monthly"}
const pye = {"he": "שנתי", "en": "yearly"}
const re = {"he": "השכרה לזמן קצוב", "en": "rent"}
</script>
{#if error1 !== null}
{error1}
{:else}

  <div class="dd md:items-center border-2 border-gold rounded">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >משאבים שנבחרו</h1>
    </caption>
        <tr class="gg">
         <tr class="ggr">
      <th class="ggr">שם</th>
     
            <td class="ggr">
                <div dir="rtl" class='textinput'>
  <input type="text"  id="nam" name="nam" bind:value={meData.name} class='input' required>
  <label for="nam" class='label' >שם</label>
  <span class='line'></span>
</div>
            </td>
          </tr>
  <tr>
      <th>תיאור</th>
      <td>
       <div dir="rtl" class='textinput'>
  <input         bind:value={meData.descrip}
 type="text" class='input' required>
  <label for="name" class='label'>תיאור</label>
  <span class='line'></span>
</div>
        </td>
    </tr> <tr>
      <th>עלות</th>
      <td>
        <div dir="rtl" class='textinput'>
  <input         bind:value={meData.price}
 type="number" class='input' required>
  <label for="name" class='label'>שווי כספי <span style="display:{ meData.m  ? "" : "none"};">לכל חודש</span><span style="display:{ meData.y  ? "" : "none"};">לכל שנה</span><span style="display:{ meData.r  ? "" : "none"};">לכל התקופה</span><span style="display:{kc ? "" : "none"};">ליחידה</span> </label>
  <span class='line'></span>
</div>
    </tr><tr>
      <th>שווי להשקעה בריקמה</th>
      <td>
        <div dir="rtl" class='textinput'>
  <input         bind:value={meData.myp}
 type="number" class='input' required>
   <label for="name" class='label'>שווי מבוקש <span style="display:{ meData.m  ? "" : "none"};">לכל חודש</span><span style="display:{ meData.y  ? "" : "none"};">לכל שנה</span><span style="display:{ meData.r  ? "" : "none"};">לכל התקופה</span><span style="display:{kc ? "" : "none"};">ליחידה</span> </label>
  <span class='line'></span>
</div>
    </tr> <tr>
      <th>סוג</th>
      <td>
      
        <select  bind:value={meData.kindOf} on:change={() => myMissionH()} class="round form-select appearance-none
      block
      w-full
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-gold bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-gold focus:border-barbi focus:outline-none">
<option value="total">{ot[$lang]}</option>
<option value="monthly">{pm[$lang]}</option>
<option value="yearly">{pye[$lang]}</option>
<option value="perUnit">{py[$lang]}</option>
<option value="rent">{re[$lang]}</option>
</select>
        </td>
    </tr> <tr style="display:{kc ? "" : "none"};">
      <th>כמות</th>
      <td >
        <div style="display:{meData.kc ? "" : "none"};" dir="rtl" class='textinput'>
  <input  bind:value={meData.hm}
 type="number"  class='input' required>
  <label for="name" class='label'>כמות</label>
  <span class='line'></span>
</div>
    </tr><tr style="display:{ ky  ? "" : "none"};" >
      <th>תאריך התחלה </th>
      <td ><input class="bg-gold hover:bg-mtork border-2 border-barbi rounded" type="datetime-local" style="display:{ meData.ky  ? "" : "none"};"  placeholder="הוספת תאריך התחלה" bind:value={meData.dates}></td>
    </tr> <tr style="display:{ ky  ? "" : "none"};" >
      <th >תאריך סיום </th>
      <td ><input class="bg-gold hover:bg-mtork border-2 border-barbi rounded" style="display:{ meData.ky  ? "" : "none"};" type="datetime-local" placeholder="הוספת תאריך סיום" bind:value={meData.datef}></td>
    </tr> <tr>
      <th>הערות מיוחדות</th>
      <td>
  <div dir="rtl" class='textinput'>
  <input         bind:value={meData.spnot}
 type="text" class='input' required>
  <label for="name" class='label'>הערות מיוחדות</label>
  <span class='line'></span>
</div>
       </td>
  </tr> <tr>
      <th>לינק לפרטי מוצר\ מחיר \ רכישה</th>
      <td>
  <div dir="rtl" class='textinput'>
  <input         bind:value={meData.linkto}
 type='text' class='input' required>
  <label for="name" class='label'>לינק</label>
  <span class='line'></span>
</div></td>
  </tr>
</table>
</div>
<div>
    {#if already === false}
  <button 
  class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full"
  on:click={han}
  >פרסום משאבים</button>
  {:else}
           <RingLoader size="80" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  {/if}
</div> 


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
   .gg{ 
    
     background-color: var(--naim) !important;
     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
  }
  .ggr{ 
     
     background-color: var(--naim) !important;
     opacity: 1;

  }
  .ggr:hover, .gg:hover {
    background:rgb(132, 241, 223);
  } 
    .dd{
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
    .body {
      z-index:999;
      overflow-x: auto;
      overflow-y: auto;
     min-width: 96vw;
     padding-left: 0.5em;
     padding-right: 0.5em;
    }
  
  table, th, td {
  border-collapse: collapse;
  border-width: 4px;
  border-color: rgb(103, 232, 249);
border-radius: 4%;
  }
  table {
  text-align: center;
  color: var(--barbi-pink);
  margin: 0 auto;
  }
  th, td{
    background: var(--gold);
    min-width: 150px;
  }

  th:hover, td:hover {
    background:rgb(132, 241, 223);
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
  border-bottom: solid 1px var(--mturk);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
  color:var(--barbi-pink);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}

.label {

  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var( --barbi-pink);
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
