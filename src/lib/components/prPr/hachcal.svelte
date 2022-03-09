<script>
     
export let fmiData = [];
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
       
    }
    for (let j = 0; j <fmiData.length; j++){
           if ("net" in dictid) {
            dictid["net"] += fmiData[j].total   
                          } else {
                    dictid["net"] = fmiData[j].total
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
      ulist.push({
               total: dictid[filteredw[t]],
                uid: users[i].id,
                   username : users[i].username,
                   src: users[i].profilePic.url,
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

//each for any user to create his circle
// so get the total of p get total fmision and mashaabims for each user then do presenteg save as obj arr and show with circle to each
}
    console.log(ulist)
    ulist = ulist

}
let revach = 0;
let x = [];
$: for (let i = 0; i <ulist.length; i++) {
x[i] = (ulist[i].p / 100) * revach
}
</script>

<h1>יש להזין את סכום הרווח שנצבר והמחשבון יציג כמה מגיע לכל 1</h1>

<input type="number" bind:value={revach} />
<div class="dd md:items-center">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >טבלת חישוב ראשונית</h1>
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
          {#each fmiData as data, i}
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
            <td >{data.p}</td>
            {/each}
          </tr> 
    </table>
  </div>
  </div>
<style>
     .gg{ 
     position: sticky;
     top: 1px; 
     background-color: var(--naim) !important;
     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
  }
   .ggd{ 
     position: sticky;
     bottom: 1px; 
     background-color: var(--naim) !important;
     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
  }
  .ggr{ 
     position: sticky;
     top: 77px; 
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
      overflow-x: auto;
      overflow-y: auto;
     height: 100vh;
     width: 100vw;
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

  }

  th:hover, td:hover {
    background:rgb(132, 241, 223);
  } 
  </style>
      
        
   
