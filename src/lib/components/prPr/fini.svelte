<script>
     
export let fmiData = [];
  export let hagdel = false;
   import { onMount } from 'svelte'; 
export let rikmashes = [];
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

    </script>
    {#if hagdel === false}
    <div style =" margin: 20px auto;" class="flex flex-col items-center justify-center ">
      <h1 class="text-barbi">חלוקת שווי הפרויקט</h1>
    <svg width="250px" height="250px" style="display: inline;" viewBox="0 0 64 64" class="pie">
        {#each ulist as use, i}
        <defs>
  <pattern id={use.imid} patternUnits="userSpaceOnUse" width="100" height="100">
    <image href={use.src} x="0" y="0" width="100" height="100" />
  </pattern>
</defs>
  <circle  r="25%" cx="50%" cy="50%" stroke-dasharray={use.s, 100} stroke-dashoffset={use.d}  stroke={use.c} animation-delay={"0.25s"}>
  <title>{use.un}, {use.p.toFixed(2)}%</title></circle>
  {/each}
</svg>
</div>
<button class="hover:bg-barbi bg-gold text-barbi hover:text-gold font-bold p-2 rounded-full" on:click={() => hagdel = true} >פירוט</button><br>
    {:else}
     <button
      title="סגירת הפירוט"
      on:click={() => hagdel = false}
       class=" hover:bg-barbi text-barbi hover:text-gold font-bold py-0.5 rounded-full"
       ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
    </svg></button> 
<div class="dd md:items-center">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >פעולות שבוצעו ואושרו</h1>
    </caption>
        <tr class="gg">
          <th class="gg">אפשרויות</th>
          {#each fmiData as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
        </td>
          {/each}
    </tr> <tr class="ggr">
      <th class="ggr">שם</th>
      {#each fmiData as data, i}
            <td class="ggr">{data.missionName}</td>
            {/each}
          </tr> <tr>
            <th>תיאור</th>
            {#each fmiData as data, i}
            <td>{data.descrip}</td>
              {/each}
            </tr>
         <tr>
              <th>תאריך ביצוע</th>
              {#each fmiData as data, i}
            <td>              {#if data.Sqadualed}
              {data.Sqadualed}
            {/if}
            </td>
            {/each}
          </tr> <tr>
            <th>קישורים ציבוריים</th>
            {#each fmiData as data, i}
            <td>
              {#if data.publicklinks}
              {data.publicklinks}
              {/if}
             </td>
             {/each}
        </tr><tr>
          <th>הערות יחודיות לריקמה שלי</th>
          {#each fmiData as data, i}
          <td>
            {#if data.hearotMeyuchadot}
            {data.hearotMeyuchadot}
            {/if}
           </td>
           {/each}
      </tr><tr>
        <th>קישורים יחודיים לריקמה שלי</th>
        {#each fmiData as data, i}
        <td>          {#if data.privatlinks} 

          {data.privatlinks} 
          {/if}
         </td>
         {/each}
    </tr><tr style="display:''" id="hoursD">
          <th >כמה שעות זה  לקח </th>
          {#each fmiData as data, i}
          <td>
            {#if data.hoursassinged > 0}

           {data.hoursassinged}
           {/if}
          </td>
          {/each}
        </tr><tr style="display:''" id="vallueperhourN" >
          <th>כמה שווה שעה</th>
          {#each fmiData as data, i}
          <td>
            {#if data.perhour > 0}

            {data.perhour}
            {/if}
          </td>
          {/each}
        </tr><tr >
      <th>שווי סך הכל למשימה </th>
      {#each fmiData as data, i}
      <td>
      {data.total}
      </td>
      {/each}
    </tr>
     <tr>
            <th> הערות סיום</th>
            {#each fmiData as data, i}
            <td>
              {#if data.why}
              {data.why}
              {/if}
             </td>
             {/each}
        </tr>
         <tr>
            <th>בוצע על ידי</th>
            {#each fmiData as data, i}
            <td>
              {data.users_permissions_user.username}
             </td>
             {/each}
        </tr>
    </table>

     <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >משאבים שהתקבלו</h1>
    </caption>
        <tr class="gg">
          <th class="gg">אפשרויות</th>
          {#each rikmashes as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
        </td>
          {/each}
    </tr> <tr class="ggr">
      <th class="ggr">שם</th>
      {#each rikmashes as data, i}
            <td class="ggr">{data.name}</td>
            {/each}
          </tr> <tr>
            <th>תיאור</th>
            {#each rikmashes as data, i}
            <td>{data.descrip}</td>
              {/each}
            </tr>
         <tr>
              <th>תאריך התחלה</th>
              {#each rikmashes as data, i}
            <td>              {#if data.Sqadualed}
              {data.Sqadualed}
            {/if}
            </td>
            {/each}
          </tr> <tr>
            <th> תאריך סיום</th>
            {#each rikmashes as data, i}
            <td>
                    {#if data.Sqadualef}
              {data.Sqadualef}
            {/if}
             </td>
             {/each}
        </tr><tr>
          <th>הערות יחודיות לריקמה שלי</th>
          {#each rikmashes as data, i}
          <td>
            {#if data.spnot}
            {data.spnot}
            {/if}
           </td>
           {/each}
      </tr><tr>
        <th>קישורים יחודיים לריקמה שלי</th>
        {#each rikmashes as data, i}
        <td>          {#if data.privatlinks} 

          {data.privatlinks} 
          {/if}
         </td>
         {/each}
    </tr><tr style="display:''" id="hoursD">
          <th >כמות </th>
          {#each rikmashes as data, i}
          <td>
            {#if data.hm }

           {data.hm}
           {/if}
          </td>
          {/each}
        </tr><tr style="display:''" id="vallueperhourN" >
          <th>כמה שווה 1</th>
          {#each rikmashes as data, i}
          <td>
            {#if data.agprice}

            {data.agprice}
            {/if}
          </td>
          {/each}
        </tr><tr >
      <th>שווי סך הכל  </th>
      {#each rikmashes as data, i}
      <td>
      {data.total}
      </td>
      {/each}
    </tr>
     <tr>
            <th> הערות סיום</th>
            {#each rikmashes as data, i}
            <td>
              {#if data.why}
              {data.why}
              {/if}
             </td>
             {/each}
        </tr>
         <tr>
            <th>שותף על ידי</th>
            {#each rikmashes as data, i}
            <td>
              {data.users_permissions_user.username}
             </td>
             {/each}
        </tr>
    </table>
  </div>
  </div>
{/if}
  
   
  <style>
.pie {
  width: 250px;
  background: #f06;
  border-radius: 50%;
}

.pie circle {
  fill: none;
  stroke-width: 32;
  animation: rotate 4.5s ease-in;
}

@keyframes rotate {
  to {
    x : 0;
  } 
}

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
      
        
   