<script>
 
export let fmiData = [];
   export let who = 0;
  let isonly = false;
   import { onMount } from 'svelte';
   onMount(async () => {
 if (who !== 0){
      isonly = true
      var filtered = fmiData.filter(function(event){
    return event.id == who;
});
    fmiData = filtered;
    }
})

  
    </script>

 
<div class="dd md:items-center">
  <div class="body items-center" class:full={who == 0}>
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right " >  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >{isonly == true ? " פעולה שבוצעה ואושרה " : "פעולות שבוצעו ואושרו"} </h1>
    </caption>
               {#if isonly == false}

        <tr class="gg">
          <th class="gg">אפשרויות</th>
          {#each fmiData as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
        </td>
          {/each}
    </tr>
    {/if}
    <tr class="ggr" style:top={isonly == true ? "1px": "77px"}>
      <th class="ggr">שם</th>
      {#each fmiData as data, i}
            <td class="ggr">{data.attributes.missionName}</td>
            {/each}
          </tr> <tr>
            <th>תיאור</th>
            {#each fmiData as data, i}
            <td>{data.attributes.descrip}</td>
              {/each}
            </tr>
         <tr>
              <th>תאריך ביצוע</th>
              {#each fmiData as data, i}
            <td>              {#if data.attributes.Sqadualed}
              {data.attributes.Sqadualed}
            {/if}
            </td>
            {/each}
          </tr> <tr>
            <th>קישורים ציבוריים</th>
            {#each fmiData as data, i}
            <td>
              {#if data.attributes.publicklinks}
              {data.attributes.publicklinks}
              {/if}
             </td>
             {/each}
        </tr><tr>
          <th>הערות יחודיות לריקמה שלי</th>
          {#each fmiData as data, i}
          <td>
            {#if data.attributes.hearotMeyuchadot}
            {data.attributes.hearotMeyuchadot}
            {/if}
           </td>
           {/each}
      </tr><tr>
        <th>קישורים יחודיים לריקמה שלי</th>
        {#each fmiData as data, i}
        <td>          {#if data.attributes.privatlinks} 

          {data.attributes.privatlinks} 
          {/if}
         </td>
         {/each}
    </tr><tr style="display:''" id="hoursD">
          <th >כמה שעות זה  לקח </th>
          {#each fmiData as data, i}
          <td>
            {#if data.attributes.noofhours > 0}

           {data.attributes.noofhours.toLocaleString('en-US', {maximumFractionDigits:2})}
           {/if}
          </td>
          {/each}
        </tr><tr style="display:''" id="vallueperhourN" >
          <th>כמה שווה שעה</th>
          {#each fmiData as data, i}
          <td>
            {#if data.attributes.perhour > 0}

            {data.attributes.perhour.toLocaleString('en-US', {maximumFractionDigits:2})}
            {/if}
          </td>
          {/each}
        </tr><tr >
      <th>שווי סך הכל למשימה </th>
      {#each fmiData as data, i}
      <td>
      {data.attributes.total}
      </td>
      {/each}
    </tr>
     <tr>
            <th> הערות סיום</th>
            {#each fmiData as data, i}
            <td>
              {#if data.attributes.why}
              {data.attributes.why}
              {/if}
             </td>
             {/each}
        </tr>
         <tr>
            <th>בוצע על ידי</th>
            {#each fmiData as data, i}
            <td>
              {data.attributes.users_permissions_user.data.attributes.username}
             </td>
             {/each}
        </tr>
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
 
  .ggr{ 
     position: sticky;
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     opacity: 1;
            color: rgb(132, 241, 223);

  }
  .ggr:hover, .gg:hover {
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
     padding-left: 0.5em;
     padding-right: 0.5em;
    }
    .full{
    height: 100vh;
    width: 97vw;
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
      
        
   