   <script>
  import Plus from "$lib/celim/plus.svelte";
  import { quintOut } from "svelte/easing";
  import { slide } from "svelte/transition";
    import {lang} from '$lib/stores/lang.js'
  import { createEventDispatcher } from "svelte";
  let { tasks = [] } = $props();
      const head = {"he":"רשימת מטלות","en":"checklist"}
        const nama = {"he":"שם המטלה ", "en":"action name"}
    const des = {"he":"תיאור","en":"decription"}
      const dates = {"he": "תאריכים" , "en":"dates"}
    const button = {"he":"יצירת מטלה חדשה", "en":"create new task"}
    const linkdes = {"he": "לינק", "en": "link"}
     const dispatch = createEventDispatcher();
    </script>
   {#key tasks}
   <div  class="w-full border-b-2 border-x-2 border-gold">
    <h1>{head[$lang]}</h1>
          <div  class="mx-auto">
            <div class="tbl-header">

          <table cellpadding="0" cellspacing="0" border="0">
      <thead>
        <tr class="sm:text-xl text-lg">
          <th class="sm:text-xl text-sm">{nama[$lang]}</th>
          <th class="sm:text-xl text-sm">{des[$lang]}</th>
          <th class="sm:text-xl text-sm">{dates[$lang]}</th>
        <th class="sm:text-xl text-sm">{linkdes[$lang]}</th>
        </tr>
      </thead>
    </table>
    </div>
    <div class="tbl-content mb-2">
    <table cellpadding="0" cellspacing="0" border="0">
      <tbody>
        {#each tasks as task, i}
                <tr transition:slide="{{ duration: 1000, easing: quintOut }}">

            <td><h2 class="md:text-xl">{task.shem}</h2></td>
            <td><p class="md:text-xl">{task.des}</p></td>
          <td>
              <span>{task.dateS}</span>-<span>{task.dateF}</span>
          </td>
            <td><p class="md:text-xl">{task.link}</p></td>
          </tr>
        {/each}
        </tbody>
    </table>
    </div>
       <!--- <button class="m-2 text-white" on:click={() =>{dispatch("new")}} ><Plus/></button>
   >--> </div>
    </div>
       
       {/key}
    

<style>
    
h1{
  font-size: 30px;
  color: #fff;
  text-transform: uppercase;
  font-weight: 300;
  text-align: center;
  margin-bottom: 15px;
}
table{
  width:100%;
  table-layout: fixed;
}
.tbl-header{
  position: sticky;
  background-color: rgba(255,255,255,0.3);
 }
.tbl-content{
  max-height:calc(94vh - 173px);
  margin-top: 0px;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid rgba(255,255,255,0.3);
}
th{
  padding: 20px 15px;
  text-align: center;
  font-weight: 500;
  font-family: gan,powerr;
  color: #fff;
  text-transform: uppercase;
}
td{
  padding: 15px;
  text-align: center;
  vertical-align:middle;
  font-weight: 300;
  font-size: 12px;
  color: #fff;
  border-bottom: solid 1px rgba(255,255,255,0.1);
}
</style>