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
let ulist = [
{un: "", s: 40, s2: 100, p: 40, d: 0,  o: "visible", c: "url(#img1)", imid: "img1", src: "bu.png" },
{un: "", s: 10, s2: 100, p: 10, d: -40, o: "visible", c: "green"},
{un: "", s: 20, s2: 100, p: 20, d: -50, o: "visible", c: "yellow"},
{un: "", s: 26, s2: 100, p: 26, d: -70, o: "visible", c: "pink"},
{un: "", s: 4, s2: 100, p: 4, d: -96, o: "visible", c: "blue"},
]; 
export let users;
let dictid = {};
//onMount(async () => {

pre ()
//})

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
    console.log(dictid)
    //for (i = 0; i < dictid.length; i++){
        //arr from obj key and val then add needed data
  const filteredw = Object.keys(dictid)

   // }
    //  ulist.push({
    //               uid: users[i].id,
    //               username : users[i].username,
    //               total: fmiData[j].total
    //            })
//each for any user to create his circle
// so get the total of p get total fmision and mashaabims for each user then do presenteg save as obj arr and show with circle to each
}


    </script>
    {#if hagdel === false}
    <div style =" margin: 0 auto;" class="flex items-center justify-center">
    <svg width="250px" height="250px" style="display: inline;" viewBox="0 0 64 64" class="pie">
        {#each ulist as use, i}
        <defs>
  <pattern id={use.imid} patternUnits="userSpaceOnUse" width="100" height="100">
    <image href={use.src} x="0" y="0" width="100" height="100" />
  </pattern>
</defs>
  <circle  r="25%" cx="50%" cy="50%" stroke-dasharray={use.s, 100} stroke-dashoffset={use.d}  stroke={use.c} animation-delay={"0.25s"}>
  <title>{use.un ,use.p}%</title></circle>
  {/each}
</svg>
</div>
    {:else}
<div class="dd md:items-center">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >פעולות בתהליך ביצוע</h1>
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
            <td class="ggr">{data.name}</td>
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
          <th>הערות יחודיות לפרויקט שלי</th>
          {#each fmiData as data, i}
          <td>
            {#if data.hearotMeyuchadot}
            {data.hearotMeyuchadot}
            {/if}
           </td>
           {/each}
      </tr><tr>
        <th>קישורים יחודיים לפרויקט שלי</th>
        {#each fmiData as data, i}
        <td>          {#if data.privatlinks} 

          {data.privatlinks} 
          {/if}
         </td>
         {/each}
    </tr><tr style="display:''" id="hoursD">
          <th >כמה שעות זה אמור לקחת? </th>
          {#each fmiData as data, i}
          <td>
            {#if data.hoursassinged > 0}

           {data.hoursassinged}
           {/if}
          </td>
          {/each}
        </tr><tr style="display:''" id="vallueperhourN" >
          <th>כמה שווה שעה ?</th>
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
      {#if data.perhour > 0 & data.hoursassinged > 0}
      
      {data.perhour * data.hoursassinged}
      
      {:else} <p>0</p>
      {/if}
      </td>
      {/each}
    </tr>
    <tr class="ggd">
          <th class="ggd">אפשרויות</th>
          {#each fmiData as data, i}
          <td class="ggd" style="font-size: 3rem">
           
          <button
          class="bg-pink-200 hover:bg-barbi text-mturk rounded"
          title="עריכה"
          on:click={edit(data.id)} 
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
           <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
          </svg>
          </button> 
         
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
      
        
   