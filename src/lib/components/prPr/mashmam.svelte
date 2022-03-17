<script>
  export let meData = [];
      import { onMount } from 'svelte';
 
  import moment from 'moment'
function remove (id) {
  console.log(id)
};
function edit (id) {
  console.log(id)
}
  onMount(async () => {
   myMissionH()
              });

 let km = false;
  let ky = false;
  let kc = false;


function myMissionH ()  {
  km = false;
  ky = false;
  kc = false;
  let is = [];
      console.log(i,"toeg3e to")

for (var i = 0; i <meData.length; i++) {
  if (meData[i].kindOf === "monthly"){
    var a = moment(meData[i].datef);
var b = moment(meData[i].dates);
meData[i].monts = a.diff(b, 'months', true).toFixed(2); 
    console.log(i,"to to")
    ky = true;
    meData[i].m = true;
    meData[i].ky = true;
         meData[i].kc = false;
                   meData[i].r = false;
    meData[i].y = false;
   meData[i].total = meData[i].monts * meData[i].price;
meData[i].totaltotal = meData[i].monts * meData[i].easy;
  } else if (meData[i].kindOf === "yearly"){
     var a = moment(meData[i].datef);
var b = moment(meData[i].dates);
meData[i].years = a.diff(b, 'years', true).toFixed(2);
    ky = true;
    meData[i].y = true;
        meData[i].m = false;
          meData[i].r = false;
     meData[i].ky = true;
              meData[i].kc = false;
   meData[i].total = (meData[i].years * meData[i].price).toFixed(2);
meData[i].totaltotal = (meData[i].years * meData[i].easy).toFixed(2);
    } else if (meData[i].kindOf === "rent"){
            meData[i].y = false;
    ky = true;
    meData[i].r = true;
     meData[i].ky = true;
             meData[i].m = false;
         meData[i].kc = false;
   meData[i].total =  meData[i].price;
meData[i].totaltotal =  meData[i].easy;
    } else if (meData[i].kindOf === "perUnit"){
    meData[i].y = false;
    meData[i].kc = true;
         meData[i].ky = false;
                 meData[i].m = false;
          meData[i].r = false;
    kc = true;
    meData[i].total = meData[i].hm * meData[i].price;
meData[i].totaltotal = meData[i].hm * meData[i].easy;
  } else {
        meData[i].y = false;
    meData[i].kc = false;
         meData[i].ky = false;
                 meData[i].m = false;
                     meData[i].r = false;
   meData[i].total =  meData[i].price;
meData[i].totaltotal =  meData[i].easy;
  }
}
};
    </script>
  <div class="dd md:items-center border-2 border-gold rounded">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >משאבים שנבחרו</h1>
    </caption>
        <tr class="gg">
          <th class="gg"> </th>
          {#each meData as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
            </td>
          {/each}
    </tr> <tr class="ggr">
      <th class="ggr">שם</th>
      {#each meData as data, i}
            <td class="ggr">
                {data.name}
            </td>
            {/each}
          </tr>
  <tr>
      <th>תיאור</th>
      {#each meData as data, i}
      <td>  {data.deskrip}
</td>
        {/each}
    </tr> <tr>
      <th>סוג</th>
      {#each meData as data, i}
      <td>
      <h1>{data.kindOf}</h1>
        </td>
      {/each}
    </tr> <tr style="display:{kc ? "" : "none"};">
      <th>כמות</th>
      {#each meData as data, i}
      <td >
       {data.hm}
      {/each}
    </tr><tr style="display:{ ky  ? "" : "none"};" >
      <th>תאריך התחלה </th>
      {#each meData as data, i}
      <td ><h1 style="display:{ meData[i].ky  ? "" : "none"};"  >{data.dates}</h1></td>
      {/each}
    </tr> <tr style="display:{ ky  ? "" : "none"};" >
      <th >תאריך סיום </th>
      {#each meData as data, i}
      <td ><h1 style="display:{ meData[i].ky  ? "" : "none"};" >{data.datef}</h1></td>
      {/each}
    </tr> <tr>
      <th>הערות מיוחדות</th>
      {#each meData as data, i}
      <td>
 {data.spnot}</td>
        {/each}
  </tr> <tr>
      <th>עלות</th>
      {#each meData as data, i}
      <td>
  <small for="name" class='label'>שווי כספי <span style="display:{ meData[i].m  ? "" : "none"};">לכל חודש</span><span style="display:{ meData[i].y  ? "" : "none"};">לכל שנה</span><span style="display:{ meData[i].r  ? "" : "none"};">לכל התקופה</span><span style="display:{meData[i].kc ? "" : "none"};">ליחידה</span> </small>>
  <h2>{data.price}</h2>  
  {/each}
    </tr><tr>
      <th>שווי מקסימלי לחישוב בריקמה</th>
      {#each meData as data, i}
      <td>
  <small for="name" class='label'>שווי כספי <span style="display:{ meData[i].m  ? "" : "none"};">לכל חודש</span><span style="display:{ meData[i].y  ? "" : "none"};">לכל שנה</span><span style="display:{ meData[i].r  ? "" : "none"};">לכל התקופה</span><span style="display:{meData[i].kc ? "" : "none"};">ליחידה</span> </small>>
        {data.easy}
      {/each}
    </tr><tr style="display:{kc || ky ? "" : "none"};" >
      <th>עלות סה"כ</th>
      {#each meData as data, i}
      <td  >
      <h3 style="display:{meData[i].m || meData[i].y  || meData[i].kc ? "" : "none"};">{data.total}</h3>
      {/each}
    </tr><tr style="display:{kc || ky ? "" : "none"};">
      <th>שווי מקסימלי סה"כ</th>
      {#each meData as data, i}
      <td   >
       <h3 style="display:{meData[i].m || meData[i].y  || meData[i].kc ? "" : "none"};">{data.totaltotal}</h3>
      {/each}
    </tr> <tr>
      <th>לינק לפרטי מוצר\ מחיר \ רכישה</th>
      {#each meData as data, i}
      <td>{data.linkto}
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