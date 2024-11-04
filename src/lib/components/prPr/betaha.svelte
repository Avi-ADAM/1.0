<script>
  export let bmiData = [];
   export let who = 0;
  let isonly = false;
   import { onMount } from 'svelte';
   onMount(async () => {
 if (who !== 0){
      isonly = true
      var filtered = bmiData.filter(function(event){
    return event.id == who;
});
    bmiData = filtered;
    }
})

function remove (id) {
  console.log(id)
};
function edit (id) {
  console.log(id)
}
function confirm (id) {
      console.log(id)

}
    </script>
   
<div class="dd md:items-center border-2 border-gold rounded">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >{isonly == true ? "פעולה" : "פעולות"} בתהליך ביצוע</h1>
    </caption>
    <thead>
       {#if isonly == false}
        <tr class="gg">
          <th class="gg "></th>
          {#each bmiData as data, i}
          <td class="gg " style="font-size: 3rem">
            {i + 1}
        </td>
          {/each}
    </tr> 
    {/if}
    <tr class="ggr" style:top={isonly == true ? "1px": "77px"}>
      <th class="ggr  font-bold">שם</th>
      {#each bmiData as data, i}
            <td class="ggr  font-bold">{data.attributes.name}</td>
            {/each}
          </tr>
    </thead>
    <tbody>
          <tr>
            <th>תיאור</th>
            {#each bmiData as data, i}
            <td>{data.attributes.descrip !== null && data.attributes.descrip !== undefined && data.attributes.descrip !== "undefined" ? data.attributes.descrip : ""}</td>
              {/each}
            </tr>
         <tr>
              <th>תאריך ביצוע</th>
              {#each bmiData as data, i}
            <td>              {#if data.attributes.Sqadualed !== undefined}
              {data.attributes.Sqadualed}
            {/if}
            </td>
            {/each}
          </tr> <tr>
            <th>קישורים ציבוריים</th>
            {#each bmiData as data, i}
            <td>
              {#if data.attributes.publicklinks !== undefined && data.attributes.publicklinks !== "undefined"}
             <a target="_blank" rel="noreferrer" href="{data.attributes.publicklinks}">קישור</a>
              {/if}
             </td>
             {/each}
        </tr><tr>
          <th>הערות יחודיות לריקמה שלי</th>
          {#each bmiData as data, i}
          <td>
            {#if data.attributes.hearotMeyuchadot !== undefined && data.attributes.hearotMeyuchadot !== "undefined"}
            {data.attributes.hearotMeyuchadot}
            {/if}
           </td>
           {/each}
      </tr><tr>
        <th>קישורים יחודיים לריקמה שלי</th>
        {#each bmiData as data, i}
        <td>       
      {#if data.attributes.privatlinks !== undefined && data.attributes.privatlinks !== "undefined"} 
             <a rel="noreferrer" target="_blank" href="{data.attributes.privatlinks}">קישור</a>
          {/if}
         </td>
         {/each}
    </tr><tr style="display:''" id="hoursD">
          <th >כמה שעות זה אמור לקחת? </th>
          {#each bmiData as data, i}
          <td>
            {#if data.attributes.hoursassinged > 0}

           {data.attributes.hoursassinged}
           {/if}
          </td>
          {/each}
        </tr><tr style="display:''" id="vallueperhourN" >
          <th>כמה שווה שעה ?</th>
          {#each bmiData as data, i}
          <td>
            {#if data.attributes.perhour > 0}

            {data.attributes.perhour}
            {/if}
          </td>
          {/each}
        </tr><tr >
      <th>שווי סך הכל למשימה </th>
      {#each bmiData as data, i}
      <td>
      {#if data.attributes.perhour > 0 & data.attributes.hoursassinged > 0}
      
      {data.attributes.perhour * data.attributes.hoursassinged}
      
      {:else} <p>0</p>
      {/if}
      </td>
      {/each}
    </tr>
    <tr style="display:''" id="total" >
          <th>כבר בוצעו</th>
          {#each bmiData as data, i}
          <td dir="ltr">
  <h5 class="mn">{`${data.attributes.howmanyhoursalready  ? Math.round((data.attributes.howmanyhoursalready + Number.EPSILON) * 100) / 100 : 0} / ${data.attributes.hoursassinged} `}</h5>
          </td>
          {/each}
        </tr><tr>
        <th>1</th>
        {#each bmiData as data, i}
        <td>       
             <a rel="noreferrer" target="_blank" href="/user/{data.attributes.users_permissions_user.data.id}">{data.attributes.users_permissions_user.data.attributes.username}</a>
         </td>
         {/each}
    </tr>
              

    <tr class="ggd">
          <th class="ggd">אפשרויות</th>
          {#each bmiData as data, i}
          <td class="ggd" style="font-size: 3rem">
           
          <button
          class="bg-pink-200 hover:bg-barbi text-mturk rounded-full"
          title="עריכה"
          on:click={edit(data.id)} 
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
           <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
          </svg>
          </button> 
         
        </td>
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
      
        
   