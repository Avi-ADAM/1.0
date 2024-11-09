
<script>
  let isonly = $state(false);
   import { onMount } from 'svelte';
  /**
   * @typedef {Object} Props
   * @property {any} [omiData]
   * @property {number} [who]
   */

  /** @type {Props} */
  let { omiData = $bindable([]), who = 0 } = $props();
   onMount(async () => {
 if (who !== 0){
      isonly = true
      var filtered = omiData.filter(function(event){
    return event.id == who;
});
    omiData = filtered;
    }
})

function remove (id) {
  console.log(id)
};
function edit (id) {
  console.log(id)
}
    </script>

<div class="dd md:items-center border-2 border-gold rounded d">
  <div class="body items-center d" class:full={who == 0}>
  
  <table dir="rtl">
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >{isonly == true ? " פעולה פתוחה" : "פעולות פתוחות"}</h1>
    </caption>
    {#if isonly == false}
        <thead>
            <tr class="gg">
                <th class="gg">משימה</th>
            </tr>
        </thead>
        <tbody>
            {#each omiData as data, i}
                <tr>
                    <td class="gg" style="font-size: 3rem">
                        {i + 1}
                    </td>
                </tr>
            {/each}
        </tbody>
    {/if}
    <tbody>
        <tr class="ggr" style:top={isonly == true ? "1px": "77px"}>
            <th class="ggr">שם</th>
            {#each omiData as data, i}
                <td class="ggr">{data.attributes.name}</td>
            {/each}
        </tr>
        <tr>
            <th>תיאור</th>
            {#each omiData as data, i}
                <td>{data.attributes.descrip}</td>
            {/each}
        </tr>
        <tr>
            <th>כישורים נדרשים</th>
            {#each omiData as data, i}
                <td>
                    {#each data.attributes.skills.data as da, i}
                        {` ${da.attributes.skillName} `}
                    {/each}
                </td>
            {/each}
        </tr>
        <tr>
            <th>הגדרת תפקיד</th>
            {#each omiData as data, i}
                <td>
                    {#each data.attributes.tafkidims.data as ta, i}
                        {` ${ta.attributes.roleDescription} `}
                    {/each}
                </td>
            {/each}
        </tr>
        <tr>
            <th>סוג משימה</th>
            {#each omiData as data, i}
                <td>
                    {#each data.attributes.work_ways.data as dm, i}
                        {` ${dm.attributes.workWayName} `}  
                    {/each}
                </td>
            {/each}
        </tr>
        <tr>
            <th>תאריך ביצוע</th>
            {#each omiData as data, i}
                <td>              {#if data.attributes.Sqadualed}
                    {data.attributes.Sqadualed}
                {/if}
                </td>
            {/each}
        </tr>
        <tr>
            <th>קישורים ציבוריים</th>
            {#each omiData as data, i}
                <td>
                    {#if data.attributes.publicklinks}
                        {data.attributes.publicklinks}
                    {/if}
                </td>
            {/each}
        </tr>
        <tr>
            <th>הערות יחודיות לריקמה שלי</th>
            {#each omiData as data, i}
                <td>
                    {#if data.attributes.hearotMeyuchadot != "undefined"}
                        {data.attributes.hearotMeyuchadot}
                    {/if}
                </td>
            {/each}
        </tr>
        <tr>
            <th>קישורים יחודיים לריקמה שלי</th>
            {#each omiData as data, i}
                <td>          {#if data.attributes.privatlinks != "undefined"} 

                    {data.attributes.privatlinks} 
                {/if}
                </td>
            {/each}
        </tr>
        <tr style="display:''" id="hoursD">
            <th >כמה שעות זה אמור לקחת? </th>
            {#each omiData as data, i}
                <td>
                    {#if data.attributes.noofhours > 0}

                        {data.attributes.noofhours}
                    {/if}
                </td>
            {/each}
        </tr>
        <tr style="display:''" id="vallueperhourN" >
            <th>כמה שווה שעה ?</th>
            {#each omiData as data, i}
                <td>
                    {#if data.attributes.perhour > 0}

                        {data.attributes.perhour}
                    {/if}
                </td>
            {/each}
        </tr>
        <tr >
            <th>שווי סך הכל למשימה </th>
            {#each omiData as data, i}
                <td>
                    {#if data.attributes.perhour > 0 & data.attributes.noofhours > 0}

                        {(data.attributes.perhour * data.attributes.noofhours).toLocaleString('en-US', {maximumFractionDigits:2})}

                    {:else} <p>0</p>
                    {/if}
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