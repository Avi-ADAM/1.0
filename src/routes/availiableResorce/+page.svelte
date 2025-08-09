<script>
    import { Engine, functionCreateDatatable, Pagination, RowsPerPage, Search, Sort } from 'svelte-datatables-net';
  import { quintOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';
    import {lang}  from '$lib/stores/lang.js'
  import { RingLoader } from 'svelte-loading-spinners';
  import { onMount } from 'svelte';
    export let data
    console.log(data)
  let arrayUsers = [{
    name:"test",
    price: 100,
    easy:150,
    projectName:"1lev1"
  }]
  let objectDatatable = functionCreateDatatable({
        parData: arrayUsers,
        parSearchableColumns: ['name', 'price','projectName'],
        parRowsPerPage: '5',
        parSearchString: '',
        parSortBy: 'name',
        parSortOrder: 'ascending'
    });
onMount(()=>{ 
console.log("mount")
check()
})
    
  function add(){
    console.log("here")
    arrayUsers = data?.alld
    arrayUsers = arrayUsers
    objectDatatable = functionCreateDatatable({
        parData: arrayUsers,
        parSearchableColumns: ['name', 'price','projectName'],
        parRowsPerPage: '5',
        parSearchString: '',
        parSortBy: 'name',
        parSortOrder: 'ascending'
    });
  }
  function check(){
    if(data?.alld){
    add()
  }else{
    console.log(data)
    setTimeout(()=>check(),1000)
  }
}
    const prices = {
      "he":"שווי",
      "en":"vallue"
    }
    const easys = {
      "he":"מקסימום שווי מחושב",
      "en":"max calc vallue"
    }
    const rikma = {"he":"ריקמה","en":"organiczeishen"}
    const name = {"he":"שם","en":"name"}
    const rpp = {"he":"תוצאות בעמוד","en":"RESULTS PER PAGE"}
    const all = {"he":"הכל","en":"ALL"}
    const se = {"he":"חיפוש:","en":"Search:"}
    const plh = {"he":"שם משאב, מחירים...","en":"Type here..."}
</script>
{#if data?.alld?.fullfild == false}
  <div
    class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex align-middle content-center justify-center"
  >
    <RingLoader size="260" color="#ff00ae" unit="px" duration="2s" />
  </div>
{:else if data != null}
{#key arrayUsers}

<Engine bind:propDatatable={objectDatatable} />
<!--<form>   
    <label for="default-search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
    <div class="relative">
        <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
        </div>
        <input type="search" id="default-search" class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search Mockups, Logos..." required>
    </div>
</form>
-->
<div class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" dir="{$lang == "en" ? "ltr": "rtl"}">
    <span>{se[$lang]}</span>
    <Search bind:propDatatable={objectDatatable} propPlaceholder="{plh[$lang]}" />
</div>

  <div class="tbl-header">
    <table cellpadding="0" cellspacing="0" border="0">
    <thead>
        <tr class="text-3xl">
            <th><Sort bind:propDatatable={objectDatatable} propColumn={'projectName'}>{rikma[$lang]}</Sort></th>
            <th><Sort bind:propDatatable={objectDatatable} propColumn={'name'}>{name[$lang]}</Sort>
            </th>
            <th><Sort bind:propDatatable={objectDatatable} propColumn={'price'}>{prices[$lang]}</Sort></th>
            <th><Sort bind:propDatatable={objectDatatable} propColumn={'easy'}>{easys[$lang]}</Sort></th>
        </tr>
    </thead>
    </table>
    </div>
     <div class="tbl-content d xs:pl-0  pl-1">
        
    <table cellpadding="0" cellspacing="0" border="0">
            <tbody>

        {#each objectDatatable.arrayData as row}
        <tr transition:slide="{{ duration: 1000, easing: quintOut }}"  class="border-gold text-2xl">
                <td class="text-xl">{row.projectName}</td>
                <td class="text-xl">{row.name}</td>
                <td class="text-xl">{row.price}</td>
                <td class="text-xl">{row.easy}</td>
            </tr>
        {/each}
    </tbody>
</table>
  </div>
  <div class="flex flex-row justify-end">
<p  class=" form-select appearance-none
      block
      px-8
      py-1.5
      text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-lturk focus:border-barbi focus:outline-none">

    <RowsPerPage bind:propDatatable={objectDatatable}>
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="30">30</option>
        <option value="all">{all[$lang]}</option>
    </RowsPerPage>
    <span>{rpp[$lang]}</span>
</p>
<div class="py-1.5 mx-2  appearance-none
      px-8  text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      overflow-x-hidden
      transition
      ease-in-out">
    <Pagination class="overflow-hidden" bind:propDatatable={objectDatatable} propSize="small" />
</div>
</div>
{/key}
{/if}

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
  color: #fff;
  border-bottom: solid 1px rgba(255,255,255,0.1);
}
</style>