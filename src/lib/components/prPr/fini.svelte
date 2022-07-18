<script>
  import Tooltip from './../../celim/tooltipb.svelte'

  import {
    createEventDispatcher
} from 'svelte';
        import pic from './../../celim/pic.js' 
export let fmiData = [];
  export let hagdel = false;
   import { onMount } from 'svelte'; 
export let rikmashes = [];
  export let meData = [];
  const dispatch = createEventDispatcher();

//	import SvelteTooltip from 'svelte-tooltip';

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
                     let src22 = ``;
                   if (users[i].profilePic !== null){
                     src22 = users[i].profilePic.url
                   } else {
                     src22 = pic
                   }
      ulist.push({
               total: dictid[filteredw[t]],
                uid: users[i].id,
                   username : users[i].username,
                   src: src22,
                   p: percentage(dictid[filteredw[t]], dictid["net"]),
                   un: users[i].username,
                   s: percentage(dictid[filteredw[t]], dictid["net"]),
                    s2: 101,
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


 
  import moment from 'moment';

  onMount(async () => {
    meData = rikmashes
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
console.log(meData)
for (var i = 0; i <meData.length; i++) {
  if (meData[i].kindOf === "monthly"){
  
    console.log(i,"to to")
    ky = true;
    meData[i].m = true;
    meData[i].ky = true;
         meData[i].kc = false;
                   meData[i].r = false;
    meData[i].y = false;
 
  } else if (meData[i].kindOf === "yearly"){
  
    ky = true;
    meData[i].y = true;
        meData[i].m = false;
          meData[i].r = false;
     meData[i].ky = true;
              meData[i].kc = false;

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
  } else if (meData[i].kindOf === "total"){
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
let fir,ssec;
 function x(a,b,c){
   if (a == "x"){
    fir = b;
    ssec = c.toFixed(2);
       xy = true;
     //  dispatch("tit",{ti: `${fir}: ${ssec}%` })
   } 
 }
 let xy = false;
    </script>

    {#if hagdel === false}
    <div style =" margin-left: auto; margin-right:auto;" >
      <h1 style =" margin-top: 20px ;" class="text-barbi text-bold text-2xl">חלוקת שווי הריקמה</h1>
         <div class="yy">       
           <Tooltip title="{fir}: {ssec}%">


   <svg width="250px" height="250px" style="display: inline; margin: 20px auto;" viewBox="0 0 64 64" class="pie">
        {#each ulist as use, i}
        <defs>
  <pattern id={use.imid} patternUnits="userSpaceOnUse" width="100" height="100">
    <image href={use.src} x="-15" y="-10" width="100" height="100" />
  </pattern>
</defs>
  <circle on:mouseenter={x("x",use.un, use.p )}  r="25%" cx="50%" cy="50%" stroke-dasharray="{use.s+1}, 101" stroke-dashoffset={use.d}  stroke={use.c} animation-delay={"0.25s"}>
 
 </circle>
  {/each}
</svg>    </Tooltip>
</div>
</div>
<button class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2 rounded-full" on:click={() => hagdel = true} >פירוט</button><br>
   
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
            {#if data.noofhours > 0}

           {data.noofhours.toLocaleString('en-US', {maximumFractionDigits:2})}
           {/if}
          </td>
          {/each}
        </tr><tr style="display:''" id="vallueperhourN" >
          <th>כמה שווה שעה</th>
          {#each fmiData as data, i}
          <td>
            {#if data.perhour > 0}

            {data.perhour.toLocaleString('en-US', {maximumFractionDigits:2})}
            {/if}
          </td>
          {/each}
        </tr><tr >
      <th>שווי סך הכל למשימה </th>
      {#each fmiData as data, i}
      <td>
      {data.total.toLocaleString('en-US', {maximumFractionDigits:2})}
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

 
  {#if meData.length > 0}
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >משאבים שהתקבלו ואושרו</h1>
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
      <td> {#if data.deskrip} {data.deskrip}{/if}
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
      <td ><h1 style="display:{ meData[i].ky  ? "" : "none"};"  >{moment(data.sqadualed).format("dddd, MMMM Do YYYY, H:mm:ss ")}</h1></td>
      {/each}
    </tr> <tr style="display:{ ky  ? "" : "none"};" >
      <th >תאריך סיום </th>
      {#each meData as data, i}
      <td ><h1 style="display:{ meData[i].ky  ? "" : "none"};" >{moment(data.sqadualedf).format("dddd, MMMM Do YYYY, H:mm:ss ")}</h1></td>
      {/each}
    </tr> <tr>
      <th>הערות מיוחדות</th>
      {#each meData as data, i}
      <td>{#if data.spnot}
 {data.spnot}{/if}</td>
        {/each}
  </tr> <tr>
      <th>עלות</th>
      {#each meData as data, i}
      <td>
  <small for="name" class='label'>שווי כספי <span style="display:{ meData[i].m  ? "" : "none"};">לכל חודש</span><span style="display:{ meData[i].y  ? "" : "none"};">לכל שנה</span><span style="display:{ meData[i].r  ? "" : "none"};">לכל התקופה</span><span style="display:{meData[i].kc ? "" : "none"};">ליחידה</span> </small>
  <h2>{data.price}</h2>  
  {/each}
    </tr><tr>
      <th>שווי מקסימלי לחישוב בריקמה</th>
      {#each meData as data, i}
      <td>
  <small for="name" class='label'>שווי כספי <span style="display:{ meData[i].m  ? "" : "none"};">לכל חודש</span><span style="display:{ meData[i].y  ? "" : "none"};">לכל שנה</span><span style="display:{ meData[i].r  ? "" : "none"};">לכל התקופה</span><span style="display:{meData[i].kc ? "" : "none"};">ליחידה</span> </small>
        {data.agprice}
      {/each}
    </tr><tr style="display:{kc || ky ? "" : "none"};" >
      <th>עלות סה"כ</th>
      {#each meData as data, i}
      <td  >
      <h3 style="display:{meData[i].m || meData[i].y  || meData[i].kc ? "" : "none"};">{data.total}</h3>
      {/each}
    </tr> <tr>
      <th>לינק לפרטי מוצר\ מחיר \ רכישה</th>
      {#each meData as data, i}
      <td>{#if data.linkto}{data.linkto}{/if}
</td>
        {/each}
  </tr><tr>
            <th>שותף על ידי</th>
            {#each meData as data, i}
            <td>
              {data.users_permissions_user.username}
             </td>
             {/each}
        </tr>
</table>
{/if}
</div>
  </div> 
 
{/if}
  
 
  <style>
    .yy{
      height: 280px;
      width: 280px;
      margin: 0 auto;
    }
.pie {
  width: 250px;
  background: transparent;
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
     max-width: 96vw;
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
      
        
   