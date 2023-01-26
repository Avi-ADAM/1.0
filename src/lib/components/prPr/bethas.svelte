<script>
    import { lang } from '$lib/stores/lang.js';
    import Crtask from '$lib/components/prPr/tasks/crtask.svelte';
     import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
     import Plus from '$lib/celim/plus.svelte'
     import Close from '$lib/celim/close.svelte'
      import {  fly } from 'svelte/transition';
    import Tile from '$lib/celim/tile.svelte'
    import { onMount } from 'svelte';
    let isOpen = false;
    let xx = {}
    let sodata = [];
    let soter = []
onMount(async () => {
    let counter = 0;
    let colors = ["blue", "green", "yellow", "red", "purple", "indigo","pink" , "gray"];
    for (var i = 0; i <bmiData.length; i++){
        bmiData[i].tid = []
        for (var j = 0; j < bmiData[i].attributes.tafkidims.data.length; j++){
            bmiData[i].tid.push(bmiData[i].attributes.tafkidims.data[j].id)
            if (bmiData[i].attributes.tafkidims.data[j].id in xx) {
                  bmiData[i].attributes.tafkidims.data[j].color =  xx[bmiData[i].attributes.tafkidims.data[j].id] 
                   } else {
                    xx[bmiData[i].attributes.tafkidims.data[j].id] = colors[counter]
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
    }
        sodata = bmiData;
        soter = soter

})
  const closer = () => {
    isOpen = false;
  }
  function done() {
    isOpen = false;
    //toast email add to table
  }
    export let bmiData = [];
    let ohh = false;
    function sot(x , y){
        if (y == true && ohh == false|| ohh == true && y == false){
        let soret = soter.map(c => c.id)
        let index = soret.indexOf(x)
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
        ohh = true;
        const asort = soret.slice(index, index+1)
        console.log(asort, sodata)
        const newar = bmiData.filter(val => val.tid.includes(asort[0]))
            if (sodata.length == bmiData.length){
            sodata = newar
            } else {
            const arr3 = sodata.concat(newar) 
            sodata = arr3
            }
        } else if (ohh == true && y == true){
            if(bmiData.length == sodata.length){
                ohh = false;
                sot(x,y)
            }
        }
       
    }
    const hed = {"he":"משימות בתהליך ביצוע","en":"mission in progress"}
    const nam = {"he":"שם המשימה ", "en":"mission name"}
    const who = {"he":" על ידי", "en":"by"}
    const pro = {"he":"אחוז ביצוע", "en":"progress"}
    const hd = {"he":"שעות שהושמו/ בוצעו", "en":"hours asigned/ done"}
    const sho = {"he": "שווי המשימה", "en": "mission vallue"}
    const ro = {"he": "תפקיד", "en": "role"}
</script>
   
<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent class="formi" aria-label="form">
      <div style="z-index: 400;" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          on:click={closer}><Close/></button>
          <Crtask {bmiData} on:done={done}/>
      </div>
  </DialogContent>
  </div>
</DialogOverlay>
<section dir={$lang == "he" ? "rtl": "ltr"}>
  <h1>{hed[$lang]}</h1> 
  <button on:click={() =>isOpen = true} ><Plus/></button>
  <div>
    {#each soter as x, i}
    <button on:click={() =>sot(x.id, x.openi)}>
    <Tile bg="{x.color}" word={x.word} closei={x.closei} openi={x.openi}/>
    </button>
    {/each}
  </div>
  <div class="tbl-header">
    <table cellpadding="0" cellspacing="0" border="0">
      <thead>
        <tr>
          <th>{nam[$lang]}</th>
          <th>{who[$lang]}</th>
          <th>{pro[$lang]}</th>
          <th>{hd[$lang]}</th>
          <th>{sho[$lang]}</th>
            <th>{ro[$lang]}</th>
        </tr>
      </thead>
    </table>
  </div>
  <div class="tbl-content d">
    <table cellpadding="0" cellspacing="0" border="0">
      <tbody>
        {#each sodata as data, i}
        <tr>
          <td>{data.attributes.name}</td>
          <td> 
        <div class="flex items-center space-x-4">
           <img data-tooltip-target="tooltip-jese" class="sm:w-10 sm:h-10 w-7 h-7 rounded-full" src="{data.attributes.users_permissions_user.data.attributes.profilePic.data != null ? data.attributes.users_permissions_user.data.attributes.profilePic.data.attributes.url : "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"}" alt="Medium avatar">
        <div class="font-large dark:text-white">
        <div>{data.attributes.users_permissions_user.data.attributes.username}</div>
    </div>    
        </div>
        </td>
          <td>
              <div class="w-full  rounded-full bg-gray-700">
    <div class="bg-barbi text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style="width: {data.attributes.status == null ? 0 : data.attributes.status}%">{data.attributes.status == null ? 0 : data.attributes.status}%</div>
  </div>
          </td>
          <td>{data.attributes.howmanyhoursalready == null ? 0 : data.attributes.howmanyhoursalready.toLocaleString('en-US', {maximumFractionDigits:2})}/{data.attributes.hoursassinged.toLocaleString('en-US', {maximumFractionDigits:2})}</td>
          <td>{(data.attributes.hoursassinged * data.attributes.perhour).toLocaleString('en-US', {maximumFractionDigits:2}) }</td>
          <td>
            {#each data.attributes.tafkidims.data as taf, i} 
            <Tile bg={taf.color} word="{$lang == "en" ? taf.attributes.roleDescription : taf.attributes.localizations.data.length > 0 ?  taf.attributes.localizations.data[0].attributes.roleDescription : taf.attributes.roleDescription }"/>
            {/each}
</td>
        </tr>
       {/each}
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
  background-color: rgba(255,255,255,0.3);
 }
.tbl-content{
  height:300px;
  overflow-x:auto;
  margin-top: 0px;
  border: 1px solid rgba(255,255,255,0.3);
}
th{
  padding: 20px 15px;
  text-align: center;
  font-weight: 500;
  font-family: gan,powerr;
  font-size: 12px;
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