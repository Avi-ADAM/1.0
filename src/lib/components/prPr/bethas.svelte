<script>
    import { lang } from '$lib/stores/lang.js';
    import Crtask from '$lib/components/prPr/tasks/crtask.svelte';
     import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
     import Plus from '$lib/celim/plus.svelte'
     import Close from '$lib/celim/close.svelte'
      import {  fly } from 'svelte/transition';
    import Tile from '$lib/celim/tile.svelte'
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
  	import { quintOut } from 'svelte/easing';
  import Chaticon from '$lib/celim/chaticon.svelte';
  import { toast } from 'svelte-sonner';

    let isOpen = $state(false);
    let xx = {}
    let proles = $state([])
    let sodata = $state([]);
  
    let soter = $state([])
onMount(async () => {
  console.log(bmiData)
    let counter = 0;
    let colors = ["blue", "green", "yellow", "red", "purple", "indigo","pink" , "gray"];
    for (var i = 0; i <bmiData.length; i++){
        bmiData[i].tid = []
        bmiData[i].isAct = false
        bmiData[i].open = false
        for (var j = 0; j < bmiData[i].attributes.tafkidims.data.length; j++){
            bmiData[i].tid.push(bmiData[i].attributes.tafkidims.data[j].id)
            if (bmiData[i].attributes.tafkidims.data[j].id in xx) {
                  bmiData[i].attributes.tafkidims.data[j].color =  xx[bmiData[i].attributes.tafkidims.data[j].id] 
                   } else {
                    xx[bmiData[i].attributes.tafkidims.data[j].id] = colors[counter]
                    proles.push({
                      id: bmiData[i].attributes.tafkidims.data[j].id,
                      name: bmiData[i].attributes.tafkidims.data[j].attributes.roleDescription
                    })
                    bmiData[i].attributes.tafkidims.data[j].color =  colors[counter]
           const word = $lang == "en" ? bmiData[i].attributes.tafkidims.data[j].attributes.roleDescription : bmiData[i].attributes.tafkidims.data[j].attributes.localizations.data.length > 0 ?  bmiData[i].attributes.tafkidims.data[j].attributes.localizations.data[0].attributes.roleDescription : bmiData[i].attributes.tafkidims.data[j].attributes.roleDescription
              soter.push({
                id: bmiData[i].attributes.tafkidims.data[j].id, 
                color: colors[counter],
                word: word,
                closei: false,
                openi: true
            })
                    counter < 8 ? counter += 1 : counter = 0;
                
                   }
        }
        proles = proles
        bmiData = bmiData
        if (bmiData[i].attributes.acts){
        if (bmiData[i].attributes.acts.data.length > 0){ 
                  bmiData[i].hasAct = true
                  /*
        for (let t = 0; t < bmiData[i].attributes.acts.data.length; t++) {
          sodata.push({
            isAct:true,
            hasAct:false,
            tid: bmiData[i].tid,
            id:bmiData[i].attributes.acts.data[t].id,
            attributes:{
              name:bmiData[i].attributes.acts.data[t].attributes.shem,
              users_permissions_user: bmiData[i].attributes.acts.data[t].attributes.my,
              status: bmiData[i].attributes.acts.data[t].attributes.status,
              tafkidims: bmiData[i].attributes.tafkidims,
              howmanyhoursalready:bmiData[i].attributes.howmanyhoursalready,
              perhour: bmiData[i].attributes.perhour,
              hoursassinged: bmiData[i].attributes.hoursassinged,

            },
          })
        }*/
        }
      }
    }
    bmiData = bmiData
    let m = [...sodata,...bmiData]

        sodata = m
        sodata = sodata
        bmiData = m;
        bmiData = bmiData
        soter = soter
        console.log(proles)

})
  const closer = () => {
    isOpen = false;
  }
  const doneMes = {"he":"המטלה נוצרה בהצלחה","en":"task has created sucsefully"}
  function done() {
    isOpen = false;
    toast.success(doneMes[$lang])
    //TODO: email add to table
  }
  let { actdata = [], onChat, bmiData = $bindable([]) } = $props();
    let ohh = $derived(soter.map(c=>c.openi).includes(false));
    function sot(idd , y){
      console.log(ohh, soter.map(c=>c.openi).includes(false),y)
        if (y == true && ohh == false|| ohh == true && y == false){
        let soret = soter.map(c => c.id)
        let index = soret.indexOf(idd)
        soter[index].closei = false;
        soter[index].openi = true;
        if (y == true && ohh == false){
        for (var i = 0; i <soter.length; i++) {
            if (i != index){
            soter[i].openi = false;
            soter[i].closei = true;
            }
        }
        }
        const asort = soret.slice(index, index+1)
        const newar = bmiData.filter(val => val.tid.includes(asort[0]))
                      console.log(sodata.length,bmiData.length)

            if (sodata.length == bmiData.length){
            sodata = newar
            } else {
              let array3 = sodata.concat(newar);
              array3 = [...new Set([...sodata,...newar])];
            sodata = array3
            }
        } 
        sodata = sodata
        console.log(sodata)
        /*else if (ohh == true && y == true){
          console.log("else if")
            if(bmiData.length == sodata.length){
                ohh = false;
                sot(idd,y)
            }
        }*/
       
    }
    const hed = {"he":"משימות בתהליך ביצוע","en":"mission in progress"}
    const nam = {"he":"שם המשימה ", "en":"mission name"}
        const nama = {"he":"שם המטלה ", "en":"action name"}

    const who = {"he":" על ידי", "en":"by"}
    const pro = {"he":"אחוז ביצוע", "en":"progress"}
    const hd = {"he":"שעות שהושמו / בוצעו", "en":"hours asigned/ done"}
    const sho = {"he": "שווי המשימה", "en": "mission vallue"}
    const ro = {"he": "תפקיד", "en": "role"}
    const acts = {"he":"דיון ומטלות","en":"chat & actions"}
    const des = {"he":"תיאור","en":"decription"}
    let w = $state(0);
   
    let id = $state(0)
    function chat (id,isNew,smalldes){
      onChat?.({id,isNew,smalldes,"nameChatPartner":{"he":"דיון על משימה בתהליך ","en":"chat on mission in progress"}})
    }
</script>
   
<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent class="formi" aria-label="form">
      <div style="z-index: 400;" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          onclick={closer}><Close/></button>
          <Crtask {id} {proles} {bmiData} on:done={done}/>
      </div>
  </DialogContent>
  </div>
</DialogOverlay>
<section dir={$lang == "he" ? "rtl": "ltr"} bind:clientWidth={w}>
  <h1>{hed[$lang]}</h1> 
  <button onclick={() =>isOpen = true} ><Plus/></button>
  <div>
    {#each soter as x, i}
    <button onclick={() =>sot(x.id, x.openi)}>
    <Tile big={w > 500 ? true:false} sm={w > 500 ? true:false} bg="{x.color}" word={x.word} closei={x.closei} openi={x.openi}/>
    </button>
    {/each}
  </div>
  <div class="tbl-header">
    <table cellpadding="0" cellspacing="0" border="0">
      <thead>
        <tr >
          <th class="sm:text-xl text-sm">{acts[$lang]}</th>
          <th class="sm:text-xl text-sm">{nam[$lang]}</th>
          <th class="sm:text-xl text-sm">{who[$lang]}</th>
          <th class="sm:text-xl text-sm">{pro[$lang]}</th>
          <th class="sm:text-xl text-sm">{hd[$lang]}</th>
         <!--- <th class="sm:text-xl text-sm">{sho[$lang]}</th>-->
          <th class="sm:text-xl text-sm">{ro[$lang]}</th>
        </tr>
      </thead>
    </table>
  </div>
  <div class="tbl-content d xs:pl-0  pl-1">
    <table cellpadding="0" cellspacing="0" border="0">
      <tbody>
        {#key sodata}
      {#key bmiData}
        {#each sodata as data, i}
        {#if data.isAct == false}
        <tr transition:slide="{{ duration: 1000, easing: quintOut }}" class:border-r-2={data.open == true && $lang == "he"} class:border-t-2={data.open} class="border-gold">
          <td>
            {#if data.attributes.forums?.data?.length === 0}
              <button class="mx-1" onclick={()=>chat(data.id,true,data.attributes.name)}>
                <Chaticon/></button>
                {:else}
              <button class="mx-1" onclick={()=>chat(data.attributes.forums.data[0].id,false,data.attributes.name)}>
                <Chaticon/></button>                
            {/if}
            {#if data.hasAct == true}<button onclick={()=> {data.open = !data.open
          console.log(data.open)}}><svg
                class:rotate-90={data.open == false}
                class="sm:w-5 sm:h-5 sm:ms-5 h-3 w-3 ms-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 4 4 4-4"
                />
              </svg></button>
              {:else}
              <button onclick={() =>{isOpen = true
              id = data.id}} ><Plus/></button>
              {/if}
            </td>
          <td><h2 class="md:text-xl">{data.attributes.name}</h2></td>
          <td> 
        <div class="flex flex-col items-center justify-center ">
        <div><Tile
          animate={true}
          src="{data.attributes.users_permissions_user.data.attributes.profilePic.data != null ? data.attributes.users_permissions_user.data.attributes.profilePic.data.attributes.url : "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"}" alt="Medium avatar"
          pic={true}
          big={w > 500 ? true:false} sm={w > 500 ? true:false} single={true}  bg="gold"  word="{data.attributes.users_permissions_user.data.attributes.username}"/></div>
        </div>
        </td>
          <td>
              <div class="w-full  rounded-full bg-gray-700">
    <div class="bg-barbi text-xs md:text-xl font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style="width: {data.attributes.status == null ? 0 : data.attributes.status}%">{data.attributes.status == null ? 0 : data.attributes.status}%</div>
  </div>
          </td>
          <td><p class="md:text-xl text-sm">{data.attributes.howmanyhoursalready == null ? 0 : data.attributes.howmanyhoursalready.toLocaleString('en-US', {maximumFractionDigits:2})} / {data.attributes.hoursassinged.toLocaleString('en-US', {maximumFractionDigits:2})}</p></td>
          <!----<td><p class="md:text-xl text-sm">{(data.attributes.hoursassinged * data.attributes.perhour).toLocaleString('en-US', {maximumFractionDigits:2}) }</p></td>-->
          <td >
            {#each data.attributes.tafkidims.data as taf, i} 
            <Tile big={w > 500 ? true:false} sm={w > 500 ? true:false} bg={taf.color} word="{$lang == "en" ? taf.attributes.roleDescription : taf.attributes.localizations.data.length > 0 ?  taf.attributes.localizations.data[0].attributes.roleDescription : taf.attributes.roleDescription }"/>
            {/each}
</td>
        </tr>
        {#if data.open == true}
        <div  class="w-screen border-b-2 border-x-2 border-gold">
          <div style="max-width:94vw;" class="mx-auto">
            <div class="tbl-header">

          <table cellpadding="0" cellspacing="0" border="0">
      <thead>
        <tr class="sm:text-xl text-lg">
          <th class="sm:text-xl text-sm">{nama[$lang]}</th>
          <th class="sm:text-xl text-sm">{des[$lang]}</th>
          <th class="sm:text-xl text-sm">{pro[$lang]}</th>
        </tr>
      </thead>
    </table>
    </div>
    <div class="tbl-content mb-2">
    <table cellpadding="0" cellspacing="0" border="0">
      <tbody>
        {#each data.attributes.acts.data as datai, i}
                <tr transition:slide="{{ duration: 1000, easing: quintOut }}">

            <td><h2 class="md:text-xl">{datai.attributes.shem}</h2></td>
            <td><p class="md:text-xl">{datai.attributes.des}</p></td>
          <td>
              <div class="w-full  rounded-full bg-gray-700">
    <div class="bg-barbi text-xs md:text-xl font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style="width: {datai.attributes.status == null ? 0 : datai.attributes.status}%">{datai.attributes.status == null ? 0 : datai.attributes.status}%</div>
  </div>
          </td>
          </tr>
        {/each}
        </tbody>
    </table>
    </div>
        <button class="m-2 text-white" onclick={() =>{isOpen = true
              id = data.id}} ><Plus/></button>
    </div>
    </div>
        {/if}
        {/if}
       {/each}
       {/key}
       {/key}
      </tbody>
    </table>
  </div>
</section>

<style>
    
   :global([data-svelte-dialog-content].formi) {
  background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
 background-size: 400% 400%;
      -webkit-animation: AnimationName 13s ease infinite;
    -moz-animation: AnimationName 13s ease infinite;
    animation: AnimationName 3s ease infinite;
      width: 80vw;
  }
  @media (min-width: 568px){
  
        :global([data-svelte-dialog-content].formi) {
 background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
 background-size: 400% 400%;
      -webkit-animation: AnimationName 13s ease infinite;
    -moz-animation: AnimationName 13s ease infinite;
    animation: AnimationName 13s ease infinite;
width:50vw;
        }
  }
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


/* demo styles */

@import url(https://fonts.googleapis.com/css?family=Roboto:400,500,300,700);
/*
section{
  margin: 50px;
}*/






/* for custom scrollbar for webkit browser*/

</style>
