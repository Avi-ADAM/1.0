<script>
    import { lang } from '$lib/stores/lang.js'
    import Tile from '$lib/celim/tile.svelte'
    import { onMount } from 'svelte';
    let xx = {}
    let sodata = [];
    let soter = []
onMount(async () => {
    let counter = 0;
    let colors = ["blue", "green", "yellow", "red", "purple", "indigo","pink" , "gray"];
    for (var i = 0; i <bmiData.length; i++){
        bmiData[i].tid = []
        for (var j = 0; j < bmiData[i].tafkidims.length; j++){
            bmiData[i].tid.push(bmiData[i].tafkidims[j].id)
            if (bmiData[i].tafkidims[j].id in xx) {
                  bmiData[i].tafkidims[j].color =  xx[bmiData[i].tafkidims[j].id] 
                   } else {
                    xx[bmiData[i].tafkidims[j].id] = colors[counter]
                    bmiData[i].tafkidims[j].color =  colors[counter]
           const word = $lang == "en" ? bmiData[i].tafkidims[j].roleDescription : bmiData[i].tafkidims[j].localizations.length > 0 ?  bmiData[i].tafkidims[j].localizations[0].roleDescription : bmiData[i].tafkidims[j].roleDescription                      
              soter.push({
                id: bmiData[i].tafkidims[j].id, 
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

    export let bmiData = [];
    let ohh = false;
    function sot(x , y){
        if (y == true && ohh == false|| ohh == true && y == false){
            ohh = true;
        let soret = soter.map(c => c.id)
        let index = soret.indexOf(x)
        soter[index].closei = false;
        soter[index].openi = true;
        for (var i = 0; i <soter.length; i++) {
            if (i != index){
            soter[i].openi = false;
            soter[i].closei = true;
            }
        }
       
        const asort = soret.slice(index, index+1)
        console.log(asort, sodata)
        const newar = bmiData.filter(val => val.tid.includes(asort[0]))
            if (sodata.length == bmiData.length){
            sodata = newar
            } else {
            const arr3 = sodata.concat(newar) 
            sodata = arr3
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

<section dir={$lang == "he" ? "rtl": "ltr"}>
  <h1>{hed[$lang]}</h1>
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
          <td>{data.name}</td>
          <td> 
        <div class="flex items-center space-x-4">
           <img data-tooltip-target="tooltip-jese" class="w-10 h-10 rounded-full" src="{data.users_permissions_user.profilePic.url}" alt="Medium avatar">
        <div class="font-large dark:text-white">
        <div>{data.users_permissions_user.username}</div>
    </div>    
        </div>
        </td>
          <td>
              <div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
    <div class="bg-barbi text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style="width: {data.status == null ? 0 : data.status}%">{data.status == null ? 0 : data.status}%</div>
  </div>
          </td>
          <td>{data.howmanyhoursalready == null ? 0 : data.howmanyhoursalready.toLocaleString('en-US', {maximumFractionDigits:2})}/{data.hoursassinged.toLocaleString('en-US', {maximumFractionDigits:2})}</td>
          <td>{(data.hoursassinged * data.perhour).toLocaleString('en-US', {maximumFractionDigits:2}) }</td>
          <td>
            {#each data.tafkidims as taf, i} 
            <Tile bg={taf.color} word="{$lang == "en" ? taf.roleDescription : taf.localizations.length > 0 ?  taf.localizations[0].roleDescription : taf.roleDescription }"/>
            {/each}
</td>
        </tr>
       {/each}
      </tbody>
    </table>
  </div>
</section>

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