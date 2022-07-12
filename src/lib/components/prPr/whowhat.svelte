<script>
          import pic from './../../celim/pic.js'
   import { idPr } from '../../stores/idPr.js';
export let fmiData = [];
export let rikmashes = [];
  export let hagdel = false;
   import { onMount } from 'svelte'; 
   export let salee = [];
   export let allin = 0
let revach = allin;
let x = [];
let meca = [];
let miDatan = [];
let noten = [];
// what about hours alrerady done to  mission in progres 
function remove (id) {
  console.log(id)
};
function edit (id) {
  console.log(id)
}
function confirm (id) {
      console.log(id)
   
}
function percentage(partialValue, totalValue) {
   return (100 * partialValue) / totalValue;
} 
let ulist = [
]; 
export let trili;
export let users;
let linkg = "https://i18.onrender.com/graphql";
let dictid = {};
let dictidi = {};
let hal = false;
let error1 = null;
export let already = false;
async function ask (){
  already = true;
   const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
 let idL = cookieValueId;
  let  token  = cookieValue; 
   let  bearer1 = 'bearer' + ' ' + token;
        try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { createTosplit(
      input: {
      data: { project: "${$idPr}"
      vots: [
     {
      what: true
      users_permissions_user: "${idL}"
    }
  ]}
      }
  ){tosplit { vots { users_permissions_user { id}}}}
} `   
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
        } catch (e) {
            error1 = e
            console.log(error1)
}
            console.log(error1)

}
let hatzaa = false;
let noofok, noofw, noofno = 0;
onMount(async () => {
cal()

pre ()
if (trili.length > 0){
  already = true;
  hatzaa = true;
  const vots = trili[0].vots
  for (let i = 0; i < vots.length; i++){
    if (vots[i].what == true) {
      noofok += 1
    } else {
      noofno += 1
    }
  }
  noofw = ulist.length - vots.length
}
})
function cal (){
      for (let i = 0; i < users.length; i++){
        for (let j = 0; j <salee.length; j++){
                        if (salee[j].users_permissions_user.id === users[i].id){
                 if (salee[j].users_permissions_user.id in dictidi) {
                    dictidi[salee[j].users_permissions_user.id] += salee[j].in
                   } else {
                      dictidi[salee[j].users_permissions_user.id] = salee[j].in
                   }
                        }
        }         if (users[i].id in dictidi)  {          
                    console.log(users[i].id)
      }
      else {
          dictidi[users[i].id] = 0;
                    console.log(users[i].id)
      }
    }
    console.log(dictidi)
}
function pre (){
    console.log(users, fmiData)
  for (let i = 0; i < users.length; i++){
        for (let j = 0; j <fmiData.length; j++){
          
            if (fmiData[j].users_permissions_user.id === users[i].id){
                   if (fmiData[j].users_permissions_user.id in dictid) {
                    dictid[fmiData[j].users_permissions_user.id] += fmiData[j].total
                   } else {
                    dictid[fmiData[j].users_permissions_user.id] = fmiData[j].total

                   }
            }
        }
        for (let j = 0; j <rikmashes.length; j++){
          
            if (rikmashes[j].users_permissions_user.id === users[i].id){
                   if (rikmashes[j].users_permissions_user.id in dictid) {
                    dictid[rikmashes[j].users_permissions_user.id] += rikmashes[j].total
                   } else {
                    dictid[rikmashes[j].users_permissions_user.id] = rikmashes[j].total

                   }
            }
        }
    }
    for (let j = 0; j <fmiData.length; j++){
           if ("net" in dictid) {
            dictid["net"] += fmiData[j].total   
                          } else {
                    dictid["net"] = fmiData[j].total
                   }
                  }
                  for (let j = 0; j <rikmashes.length; j++){
           if ("net" in dictid) {
            dictid["net"] += rikmashes[j].total   
                          } else {
                    dictid["net"] = rikmashes[j].total
                   }
                  }
    console.log(dictid)
      const filteredw = Object.keys(dictid)
      const filtered = Object.keys(dictidi)
     console.log(filteredw)

  
        for (let i = 0; i < users.length; i++){
        //arr from obj key and val then add needed data
                for (let t = 0; t < filteredw.length; t++){

  if (filteredw[t] === users[i].id){
                      for (let m = 0; m < filtered.length; m++){
  if (filtered[m] === users[i].id){

     if ("counter" in dictid) {
            dictid["counter"] += 1   
                          } else {
                    dictid["counter"] = 1
                   }
                    if ("pmcounter" in dictid) {
            dictid["pmcounter"] -= ulist[ulist.length - 1].p   
                          } else {
                    dictid["pmcounter"] = 0
                   }
                    let src22 = ``;
                   if (users[i].profilePic !== null){
                     src22 = users[i].profilePic.url
                   } else {
                     src22 = pic
                   }
      ulist.push({
          ihave: dictidi[filtered[m]],
               total: dictid[filteredw[t]],
                uid: users[i].id,
                   username : users[i].username,
                   src: src22,
                   p: percentage(dictid[filteredw[t]], dictid["net"]),
                   un: users[i].username,
                   s: percentage(dictid[filteredw[t]], dictid["net"]),
                    s2: 100,
                      d: dictid["pmcounter"],
                        o: "visible",
                         c: `url(#img${dictid["counter"]})`,
                          imid: `img${dictid["counter"]}`
                })
            }
        }
  }
    }
for (let i = 0; i <ulist.length; i++) {
   ulist[i].x = (ulist[i].p / 100) * revach;
  if (ulist[i].ihave-ulist[i].x < 0 ){
 ulist[i].meca = ulist[i].x-ulist[i].ihave;
   ulist[i].noten = 0;
   ulist[i].cama = 0;
 } else if (ulist[i].ihave-ulist[i].x > 0 ){
  ulist[i].noten = ulist[i].ihave-ulist[i].x;
   ulist[i].meca = 0;
 }


}
 
}
for (let t=0; t<ulist.length; t++){
    for (let z=0; z<ulist.length; z++){
   if (ulist[t].noten.toFixed(2) == ulist[z].meca.toFixed(2) && ulist[t].noten > 0 && ulist[z].meca > 0){
      ulist[t].le = []
    ulist[t].le.push({
       le: ulist[z].username,
    leid: ulist[z].id,
    cama: ulist[z].meca
    }) 
     ulist[z].kibal = true;
   }
  }
 }
 ulist.sort(({meca:a}, {meca:b}) => b-a)

 for (let n=0; n<ulist.length; n++){
    if (ulist[n].noten > 0 && !ulist[n].le){
      ulist[n].latet = ulist[n].noten;
               ulist[n].le = []

   for (let z=0; z<ulist.length; z++){
 if (ulist[n].latet >= ulist[z].meca && ulist[z].kibal != true && ulist[z].meca > 0){
   ulist[n].le.push({
       le: ulist[z].username,
    cama: ulist[z].meca
    }) 
     ulist[z].kibal = true;
    ulist[n].latet -= ulist[z].meca;
    console.log("here with",ulist[z].username )
    }
 }
    }
 }

    console.log(ulist)
    ulist = ulist

}


</script>

<div class="dd md:items-center">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >טבלת חישוב </h1>
    </caption>
        <tr class="gg">
          <th class="gg"></th>
          {#each ulist as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
        </td>
          {/each}
    </tr> <tr class="ggr">
      <th class="ggr">שם</th>
      {#each ulist as data, i}
            <td class="ggr">{data.username}</td>
            {/each}
          </tr> <tr>
          <th> החלק מהרווח</th>
          {#each ulist as data, i}
          <td>
            {#if  revach > 0}
 {data.x.toFixed(2)}
 {:else}  
 0      
     {/if}
           </td>
           {/each}
      </tr><tr>
          <th>הסכום שממתין אצלי</th>
          {#each ulist as data, i}
          <td>
            {#if  data.ihave > 0}
 {data.ihave.toFixed(2)}
 {:else}  
 0      
     {/if}
           </td>
           {/each}
      </tr><tr>
          <th>סכום להעביר</th>
          {#each ulist as data, i}
          <td>
            {#if  revach > 0 &&  (data.ihave-data.x) > 0 }
 {data.noten.toFixed(2)}
 {:else}  
 0      
     {/if}
           </td>
           {/each}
      </tr> <tr >
      <th > להעביר אל:</th>
      {#each ulist as data, i}
      <td>
        {#if data.le}
        {#each data.le as ee, i}
            {` ${ee.le} :  ${ee.cama.toFixed(2)} `}
            <br>
            {/each}
            {/if}
            </td>
            {/each}
          </tr> 
      <tr>
          <th>סכום לקבל</th>
          {#each ulist as data, i}
          <td>
            {#if  revach > 0 && (data.ihave-data.x) < 0 }
 {data.meca.toFixed(2)}
 {:else}  
 0      
     {/if}
           </td>
           {/each}
      </tr><tr >
      <th >אחוז ברקמה</th>
      {#each ulist as data, i}
            <td >{data.p.toFixed(2)}</td>
            {/each}
          </tr> 
         
    </table>

     {#if hal === false && already === false}
   <button  class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
 on:click={ask}>אישור חלוקה</button>
{/if}
{#if hatzaa == true}
<div class="border border-barbi m-2 p-2">
<h1 class="font-bold">הוגשה הצעה לחלוקה והיא בתהליך אישור:<br>
  {` עד כה ${noofok > 1 ? `ישנן ${noofok} הצבעות`: "ישנה הצבעה אחת" } בעד ${noofno > 0 ? `, ${noofno} נגד `: ""} ${noofw > 0 ? `ו-${noofw} שעוד לא הצביעו`: ""}`}</h1>
</div>{/if}
  </div>
  </div>
<style>
     .gg{ 
     position: sticky;
     top: 1px; 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
      color: rgb(132, 241, 223);
  }
   .ggd{ 
     position: sticky;
     bottom: 1px; 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
                  color: rgb(132, 241, 223);


  }
  .ggr{ 
     position: sticky;
     top: 77px; 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     opacity: 1;
            color: rgb(132, 241, 223);

  }
  .ggr:hover, .gg:hover, .ggd:hover {
    background:var(--barbi-pink);
  } 
    .dd{
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
    .body {
      overflow-x: auto;
      overflow-y: auto;
     max-height: 100vh;
     max-width: 100vw;
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
   th{
     background-color: #6b0f1a;
     background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
     color: rgb(132, 241, 223);
   }
  td{
     background-color: #5efaf2;
     background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
  }
 th:hover{
       background:var(--barbi-pink);

 }
  td:hover {
    background:rgb(132, 241, 223);
  } 
  </style>
      
        
   
