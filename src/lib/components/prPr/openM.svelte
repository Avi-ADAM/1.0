<script>
  export let omiData = [];
   
function remove (id) {
  console.log(id)
};
function edit (id) {
  console.log(id)
}
    </script>

<div class="dd md:items-center border-2 border-gold rounded">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >משימות פתוחות</h1>
    </caption>
        <tr class="gg">
          <th class="gg">משימה</th>
          {#each omiData as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
           <!-- <button
             title='הסרה'
             on:click={remove(data.id)}><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path fill="currentColor" d="M4,2H11A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M17.59,12L15,9.41L16.41,8L19,10.59L21.59,8L23,9.41L20.41,12L23,14.59L21.59,16L19,13.41L16.41,16L15,14.59L17.59,12Z" />
          </svg></button> 
          <button
          class="bg-pink-200 hover:bg-barbi text-mturk rounded"
          title="עריכה"
          on:click={edit(data.id)} 
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
           <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
          </svg>
          </button> -->
        </td>
          {/each}
    </tr> <tr class="ggr">
      <th class="ggr">שם</th>
      {#each omiData as data, i}
            <td class="ggr">{data.name}</td>
            {/each}
          </tr> <tr>
            <th>תיאור</th>
            {#each omiData as data, i}
            <td>{data.descrip}</td>
              {/each}
            </tr> <tr>
              <th>כישורים נדרשים</th>
              {#each omiData as data, i}
            <td>
              {#each data.skills as da, i}
                 {` ${da.skillName} `}
              {/each}
              </td>
            {/each}
          </tr>  <tr>
              <th>הגדרת תפקיד</th>
              {#each omiData as data, i}
            <td>
              {#each data.tafkidims as ta, i}
                {` ${ta.roleDescription} `}
            {/each}
            </td>
            {/each}
          </tr>
          <tr>
              <th>סוג משימה</th>
              {#each omiData as data, i}
            <td>
              {#each data.work_ways as dm, i}
                  {` ${dm.workWayName} `}  
              {/each}
              </td>
            {/each}
          </tr>
         <tr>
              <th>תאריך ביצוע</th>
              {#each omiData as data, i}
            <td>              {#if data.Sqadualed}
              {data.Sqadualed}
            {/if}
            </td>
            {/each}
          </tr> <tr>
            <th>קישורים ציבוריים</th>
            {#each omiData as data, i}
            <td>
              {#if data.publicklinks}
              {data.publicklinks}
              {/if}
             </td>
             {/each}
        </tr><tr>
          <th>הערות יחודיות לפרויקט שלי</th>
          {#each omiData as data, i}
          <td>
            {#if data.hearotMeyuchadot != "undefined"}
            {data.hearotMeyuchadot}
            {/if}
           </td>
           {/each}
      </tr><tr>
        <th>קישורים יחודיים לפרויקט שלי</th>
        {#each omiData as data, i}
        <td>          {#if data.privatlinks != "undefined"} 

          {data.privatlinks} 
          {/if}
         </td>
         {/each}
    </tr><tr style="display:''" id="hoursD">
          <th >כמה שעות זה אמור לקחת? </th>
          {#each omiData as data, i}
          <td>
            {#if data.noofhours > 0}

           {data.noofhours}
           {/if}
          </td>
          {/each}
        </tr><tr style="display:''" id="vallueperhourN" >
          <th>כמה שווה שעה ?</th>
          {#each omiData as data, i}
          <td>
            {#if data.perhour > 0}

            {data.perhour}
            {/if}
          </td>
          {/each}
        </tr><tr >
      <th>שווי סך הכל למשימה </th>
      {#each omiData as data, i}
      <td>
      {#if data.perhour > 0 & data.noofhours > 0}
      
      {data.perhour * data.noofhours}
      
      {:else} <p>0</p>
      {/if}
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