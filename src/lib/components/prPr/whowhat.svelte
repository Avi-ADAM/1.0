<script>
  import {lang } from '$lib/stores/lang.js'
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
// what about hours alrerady done to mission in progres 
 // matbea: Matbea,
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
let linkg = "https://tov.onrender.com/graphql";
let dictid = {};
let dictidi = {};
let hal = false;
let error1 = null;
export let already = false;
async function ask (){
  already = true;
  let d = new Date
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
   let qurer = ``
   let naminator = []
         for (let i = 0; i < ulist.length; i++){ 
          console.log(qurer, ulist[i])
          if (ulist[i].noten > 0){
         for (let x = 0; x < ulist[i].le.length; x++){ 
        qurer =  `  
createHaluka( 
      data: { 
                project: "${$idPr}",
        usersend: "${ulist[i].uid}",
        userrecive: "${ulist[i].le[x].leid}",
        amount: ${ulist[i].le[x].cama.toFixed(2)},
        matbea: "2",
        confirmed: false,
        publishedAt: "${d.toISOString()}",
      }
    
    ){data{ id  }} `
         
 try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation 
          { ${qurer}
}`   
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
            console.log(miDatan)
            naminator.push(`${miDatan.data.createHaluka.data.id}`)
        } catch (e) {
            error1 = e
            console.log(error1)
}
         }
        }
      }
        
        console.log(naminator)
      //create hervachti compo
      let hervachti = ``
      let counter = 0
      let mored = ``
      for (let c = 0; c < ulist.length; c++) {
        const amount = ulist[c].x;
        const user = ulist[c].uid
        if (amount > 0){

            counter += 1
          if (counter == 1){
             mored = `
             {
              users_permissions_user: ${user},
              amount: ${amount},
              ${ulist[c].meca > 0 ? "mekabel:true," : ``}
              ${ulist[c].noten > 0 ? "noten:true" : ``}
             },
             `
            hervachti = `hervachti:[${mored}]`
          } else{
             mored += `
             {
              users_permissions_user: ${user},
              amount: ${amount},
              ${ulist[c].meca > 0 ? "mekabel:true," : ``}
              ${ulist[c].noten > 0 ? "noten:true" : ``}
             },
            `
            hervachti = `hervachti:[${mored}]`
            console.log("here",hervachti)
          }
        }
        
      }
      hervachti = hervachti
        try{
         await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation
           { createTosplit(
      data: { 
        publishedAt: "${d.toISOString()}",
        project: "${$idPr}",
      vots: [
     {
      what: true
      users_permissions_user: "${idL}"
    }
  ],
    halukas: [${naminator}],
    ${hervachti}
}
    
  ){data { id }}
} `   
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
         //get ids put in tosplitname for now
        } catch (e) {
            error1 = e
            console.log(error1)
}
        }
       



let hatzaa = false;
let noofok, noofw, noofno = 0;
onMount(async () => {
cal()

pre ()
if (trili.length > 0){
  already = true;
  hatzaa = true;
  const vots = trili[0].attributes.vots
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
                        if (salee[j].attributes.users_permissions_user.data.id === users[i].id){
                 if (salee[j].attributes.users_permissions_user.data.id in dictidi) {
                    dictidi[salee[j].attributes.users_permissions_user.data.id] += salee[j].attributes.in
                   } else {
                      dictidi[salee[j].attributes.users_permissions_user.data.id] = salee[j].attributes.in
                   }
                        }
        }         if (users[i].id in dictidi)  {          
      }
      else {
          dictidi[users[i].id] = 0;
      }
    }
}
function pre (){
  for (let i = 0; i < users.length; i++){
        for (let j = 0; j <fmiData.length; j++){
          
            if (fmiData[j].attributes.users_permissions_user.data.id === users[i].id){
                   if (fmiData[j].attributes.users_permissions_user.data.id  in dictid) {
                    dictid[fmiData[j].attributes.users_permissions_user.data.id] += fmiData[j].attributes.total
                   } else {
                    dictid[fmiData[j].attributes.users_permissions_user.data.id] = fmiData[j].attributes.total

                   }
            }
        }
        for (let j = 0; j <rikmashes.length; j++){
          
            if (rikmashes[j].attributes.users_permissions_user.data.id === users[i].id){
                   if (rikmashes[j].attributes.users_permissions_user.data.id in dictid) {
                    dictid[rikmashes[j].attributes.users_permissions_user.data.id] += rikmashes[j].attributes.total
                   } else {
                    dictid[rikmashes[j].attributes.users_permissions_user.data.id] = rikmashes[j].attributes.total

                   }
            }
        }
    }
    for (let j = 0; j <fmiData.length; j++){
           if ("net" in dictid) {
            dictid["net"] += fmiData[j].attributes.total   
                          } else {
                    dictid["net"] = fmiData[j].attributes.total
                   }
                  }
                  for (let j = 0; j <rikmashes.length; j++){
           if ("net" in dictid) {
            dictid["net"] += rikmashes[j].attributes.total   
                          } else {
                    dictid["net"] = rikmashes[j].attributes.total
                   }
                  }
      const filteredw = Object.keys(dictid)
      const filtered = Object.keys(dictidi)

  
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
                   if (users[i].attributes.profilePic.data !== null){
                     src22 = users[i].attributes.profilePic.data.attributes.url
                   } else {
                     src22 = pic
                   }
      ulist.push({
          ihave: dictidi[filtered[m]],
               total: dictid[filteredw[t]],
                uid: users[i].id,
                   username : users[i].attributes.username,
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
    leid: ulist[z].uid,
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
         leid: ulist[z].uid,
    cama: ulist[z].meca
    }) 
     ulist[z].kibal = true;
    ulist[n].latet -= ulist[z].meca;
    }
 }
    }
 }
    ulist = ulist

}
const head = {"he": "טבלת חישוב", "en": "coculation table"}
const name = {"he": "שם", "en":"name"}
const pres = {"he":"החלק מהרווח", "en":"profit precentage"}
const amho = {"he": "הסכום שממתין אצלי", "en": "amount that I guard"}
const amtog = {"he": "סכום להעביר", "en": "amount to give"}
const amtor = {"he":"סכום לקבל","en":"amount to recive"}
const movto = {"he": " להעביר אל:","en": "give to:"}
const perof = {"he": "אחוז ברקמה", "en": "precentage in the FreeMate"}
const appbu = {"he": "אישור ובקשת חלוקה", "en": "confirm split"}
const ft = {"he": "הוגשה הצעה לחלוקה והיא בתהליך אישור:", "en": "suggestion to split has been requested and its in appruval process:"}
const sofar = {"he": "עד כה", "en": "so far"}
const there = {"he": "ישנן", "en": "there are"}
const vots = {"he": "הצבעות", "en": "vots"}
const onvo = {"he": "ישנה הצבעה אחת","en":"there is one vote"}
const toap = {"he": "בעד", "en": "in favor"}
const ag = {"he": "נגד", "en": "against"}
const and = {"he": "ו", "en": "and"}
const noy = {"he": "שעוד לא הצביעו", "en": "that didnt vote yet"}
</script>

<div class="dd md:items-center">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >{head[$lang]}</h1>
    </caption>
        <tr class="gg">
          <th class="gg"></th>
          {#each ulist as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
        </td>
          {/each}
    </tr> <tr class="ggr">
      <th class="ggr">{name[$lang]}</th>
      {#each ulist as data, i}
            <td class="ggr">{data.username}</td>
            {/each}
          </tr> <tr>
          <th>{pres[$lang]}</th>
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
          <th>{amho[$lang]}</th>
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
          <th>{amtog[$lang]}</th>
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
      <th >{movto[$lang]}</th>
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
          <th>{amtor[$lang]}</th>
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
      <th >{perof[$lang]}</th>
      {#each ulist as data, i}
            <td >{data.p.toFixed(2)}</td>
            {/each}
          </tr> 
         
    </table>

     {#if  already === false }<!--//hal === false &&-->
   <button  class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
 on:click={ask}>{appbu[$lang]}</button>
{/if}
{#if hatzaa == true}
<div class="border border-barbi m-2 p-2">
<h1 class="font-bold">{ft[$lang]}<br>
  {` ${sofar[$lang]} ${noofok > 1 ? `${there[$lang]} ${noofok} ${vots[$lang]}`: onvo[$lang] } ${toap[$lang]} ${noofno > 0 ? `, ${noofno} ${ag[$lang]} `: ""} ${noofw > 0 ? `${and[$lang]}-${noofw} ${noy[$lang]}`: ""}`}</h1>
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
      
        
   
