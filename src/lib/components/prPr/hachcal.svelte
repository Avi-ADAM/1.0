
<script>
     import pic from './../../celim/pic.js'
export let fmiData = [];
export let rikmashes = [];
  export let hagdel = false;
   import { onMount } from 'svelte'; 

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
export let users;
let dictid = {};
onMount(async () => {

pre ()
})

function pre (){
  for (let i = 0; i < users.length; i++){
        for (let j = 0; j <fmiData.length; j++){
          
            if (fmiData[j].attributes.users_permissions_user.data.id === users[i].id){
                   if (fmiData[j].attributes.users_permissions_user.data.id in dictid) {
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
    console.log(dictid)
      const filteredw = Object.keys(dictid)
     console.log(filteredw)

  
        for (let i = 0; i < users.length; i++){
        //arr from obj key and val then add needed data
                for (let t = 0; t < filteredw.length; t++){

  if (filteredw[t] === users[i].id){
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
               total: dictid[filteredw[t]],
                uid: users[i].id,
                   username : users[i].attributes.username,
                   src: src22,
                   p: percentage(dictid[filteredw[t]], dictid["net"]),
                   un: users[i].attributes.username,
                   s: percentage(dictid[filteredw[t]], dictid["net"]),
                    s2: 100,
                      d: dictid["pmcounter"],
                        o: "visible",
                         c: `url(#img${dictid["counter"]})`,
                          imid: `img${dictid["counter"]}`
                })
  }
    }

//each for any user to create his circle
// so get the total of p get total fmision and mashaabims for each user then do presenteg save as obj arr and show with circle to each
}
    ulist = ulist

}
$: revach = 0;
let x = [];
$: for (let i = 0; i <ulist.length; i++) {
  console.log(ulist)
x[i] = ((ulist[i].p / 100) * revach).toFixed(2)
}
</script>

<h1>יש להזין את סכום הרווח שנצבר והמחשבון יציג כמה מגיע לכל 1</h1>

<input type="number" bind:value={revach} />
<div class="dd md:items-center">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >טבלת חישוב </h1>
    </caption>
    <thead>
        <tr class="gg">
          <th class="gg"></th>
          {#each ulist as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
        </td>
          {/each}
    </tr> 
    </thead>
    <tbody>
    <tr class="ggr">
      <th class="ggr">שם</th>
      {#each ulist as data, i}
            <td class="ggr">{data.username}</td>
            {/each}
          </tr> <tr>
          <th> החלק מהרווח</th>
          {#each ulist as data, i}
          <td>
            {#if  revach > 0}
 {x[i]}
 {:else}  
 0      
     {/if}
           </td>
           {/each}
      </tr><tr >
      <th >אחוז בפרויקט</th>
      {#each ulist as data, i}
            <td >{data.p.toFixed(2)}%</td>
            {/each}
          </tr> 
    </tbody>
    </table>
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
      
        
   
