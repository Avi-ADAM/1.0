<script>
    import { onMount } from 'svelte';
 import { createEventDispatcher } from 'svelte';
  import { RingLoader
} from 'svelte-loading-spinners'
	import { beforeUpdate } from 'svelte';

 const dispatch = createEventDispatcher();
  let token; 
  export let needr = [];
export let meData = [];
  let miDatan = [];
    let error1 = null;
async function upd (){
            
      
}
function vfor(){
  for (let i = 0; i < meData.length; i++) {
    const id = meData[i].id
    meData[i] = meData[i].attributes;
    meData[i].id = id
    
  }
}
  onMount(async () => {
    vfor()
   myMissionH()
              myMi ()  
              });
    beforeUpdate(async () => {
   myMissionH()

    })
 let already = false;
 let idL;

async function han (){
    console.log(meData)
    let d = new Date
    already = true;
 const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
 
  for (const element of meData) {
  const hm = (element.hm > 0) ? element.hm : 1;
  const price = (element.price > 0) ? element.price : 0;
  const easy = (element.easy > 0) ? element.easy : 0;
  const sdate = (element.dates !== undefined) ? `sdate: "${new Date(element.dates).toISOString()}",` : ``;
   const fdate = (element.datef !== undefined) ? `fdate: "${new Date(element.datef).toISOString()}" ,` : ``;
 let linkgra = 'https://strapi-87gh.onrender.com/graphql';
    try {
             await fetch(linkgra, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { createSp(
      data: { 
          name: "${element.name}",
             descrip: "${element.descrip}",
             kindOf: ${element.kindOf},
             unit: ${hm},
             spnot: "${element.spnot}",  
             price: ${price},
             myp: ${easy},   
             linkto: "${element.linkto}",
             users_permissions_user: "${idL}",
             mashaabim: "${element.id}", 
             publishedAt: "${d.toISOString()}",        
             ${sdate} 
             ${fdate}
    }
  )  {data{id attributes{ name}}}
} `   
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
             dispatch('close', {
                 id: miDatan.data.createSp.data.id,
                 name: miDatan.data.createSp.data.attributes.name,
                 skob: miDatan.data.createSp.data
             });
        } catch (e) {
            error1 = e
        }
        
	}

}
function remove (id) {
  dispatch("remove",{
    id: id,
   data: meData
  })
}

  let ky = false;
  let kc = false;
  let km  = false;
function myMi ()  {
  for (var i = 0; i <meData.length; i++) {
    meData[i].hm = 1;
    meData[i].easy = meData[i].price;
        meData[i].dates = new Date().toISOString().slice(0, -1)
   meData[i].datef =  new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().slice(0, -1)
  }
}

function myMissionH ()  {
  km = false;
  ky = false;
  kc = false;
  let is = [];

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
        console.log(i,"y")
    ky = true;
    meData[i].y = true;
        meData[i].m = false;
          meData[i].r = false;

     meData[i].ky = true;
              meData[i].kc = false;

    } else if (meData[i].kindOf === "rent"){
        console.log(i,"y")
            meData[i].y = false;
    ky = true;
    meData[i].r = true;
     meData[i].ky = true;
             meData[i].m = false;

         meData[i].kc = false;

    } else if (meData[i].kindOf === "perUnit"){
    meData[i].y = false;
    meData[i].kc = true;
         meData[i].ky = false;
                 meData[i].m = false;
          meData[i].r = false;

    kc = true;
  } else {
        meData[i].y = false;
    meData[i].kc = false;
         meData[i].ky = false;
                 meData[i].m = false;
                     meData[i].r = false;


  }
 
}
 
};


</script>
{#if error1 !== null}
{error1}
{:else}
{#each needr as n}
<h1 style="display:none;">{n}</h1>
{/each}
  <div class="dd md:items-center border-2 border-gold rounded">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >משאבים שנבחרו</h1>
    </caption>
        <tr class="gg">
          <th class="gg">הסרת המשאב שנבחר</th>
          {#each meData as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
            <button
             title='הסרה'
             on:click={remove(data.id)}><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path fill="currentColor" d="M4,2H11A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M17.59,12L15,9.41L16.41,8L19,10.59L21.59,8L23,9.41L20.41,12L23,14.59L21.59,16L19,13.41L16.41,16L15,14.59L17.59,12Z" />
          </svg></button></td>
          {/each}
    </tr> <tr class="ggr">
      <th class="ggr">שם</th>
      {#each meData as data, i}
            <td class="ggr">
                <div dir="rtl" class='textinput'>
  <input type="text"  id="nam" name="nam" bind:value={data.name} class='input' required>
  <label for="nam" class='label' >שם</label>
  <span class='line'></span>
</div>
            </td>
            {/each}
          </tr>
  <tr>
      <th>תיאור</th>
      {#each meData as data, i}
      <td>
       <div dir="rtl" class='textinput'>
  <input         bind:value={data.descrip}
 type="text" class='input' required>
  <label for="name" class='label'>תיאור</label>
  <span class='line'></span>
</div>
        </td>
        {/each}
    </tr>  <tr>
      <th>סוג</th>
      {#each meData as data, i}
      <td>
      
        <select  bind:value={data.kindOf} on:change={() => myMissionH()} class="round form-select appearance-none
      block
      w-full
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-gold bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-gold focus:border-barbi focus:outline-none">
<option value="total">עלות חד פעמית</option>
<option value="monthly">חודשי</option>
<option value="yearly">שנתי</option>
<option value="perUnit">ליחידה</option>
<option value="rent">השכרה לזמן קצוב</option>
</select>
        </td>
      {/each}
    </tr> <tr style="display:{kc ? "" : "none"};">
      <th>כמות</th>
      {#each meData as data, i}
      <td >
        <div style="display:{meData[i].kc ? "" : "none"};" dir="rtl" class='textinput'>
  <input  bind:value={data.hm}
 type="number"  class='input' required>
  <label for="name" class='label'>כמות</label>
  <span class='line'></span>
</div>
      {/each}
    </tr><tr style="display:{ ky  ? "" : "none"};" >
      <th>תאריך התחלה </th>
      {#each meData as data, i}
      <td ><input class="bg-gold hover:bg-mtork border-2 border-barbi rounded" type="datetime-local" style="display:{ meData[i].ky  ? "" : "none"};"  placeholder="הוספת תאריך התחלה" bind:value={data.dates}></td>
      {/each}
    </tr> <tr style="display:{ ky  ? "" : "none"};" >
      <th >תאריך סיום </th>
      {#each meData as data, i}
      <td ><input class="bg-gold hover:bg-mtork border-2 border-barbi rounded" style="display:{ meData[i].ky  ? "" : "none"};" type="datetime-local" placeholder="הוספת תאריך סיום" bind:value={data.datef}></td>
      {/each}
    </tr> <tr>
      <th>עלות</th>
      {#each meData as data, i}
      <td>
        <div dir="rtl" class='textinput'>
  <input         bind:value={data.price}
 type="number" class='input' required>
  <label for="name" class='label'>שווי כספי <span style="display:{ meData[i].m  ? "" : "none"};">לכל חודש</span><span style="display:{ meData[i].y  ? "" : "none"};">לכל שנה</span><span style="display:{ meData[i].r  ? "" : "none"};">לכל התקופה</span><span style="display:{kc ? "" : "none"};">ליחידה</span> </label>
  <span class='line'></span>
</div>
      {/each}
    </tr><tr>
      <th>שווי להשקעה בריקמה</th>
      {#each meData as data, i}
      <td>
        <div dir="rtl" class='textinput'>
  <input         bind:value={data.easy}
 type="number" class='input' required>
   <label for="name" class='label'>שווי מבוקש <span style="display:{ meData[i].m  ? "" : "none"};">לכל חודש</span><span style="display:{ meData[i].y  ? "" : "none"};">לכל שנה</span><span style="display:{ meData[i].r  ? "" : "none"};">לכל התקופה</span><span style="display:{kc ? "" : "none"};">ליחידה</span> </label>
  <span class='line'></span>
</div>
      {/each}
    </tr><tr>
      <th>הערות מיוחדות</th>
      {#each meData as data, i}
      <td>
  <div dir="rtl" class='textinput'>
  <input         bind:value={data.spnot}
 type="text" class='input' required>
  <label for="name" class='label'>הערות מיוחדות</label>
  <span class='line'></span>
</div>
       </td>
        {/each}
  </tr> <tr>
      <th>לינק לפרטי מוצר\ מחיר \ רכישה</th>
      {#each meData as data, i}
      <td>
  <div dir="rtl" class='textinput'>
  <input         bind:value={data.linkto}
 type='text' class='input' required>
  <label for="name" class='label'>לינק</label>
  <span class='line'></span>
</div></td>
        {/each}
  </tr>
</table>
</div>
<div>
    {#if already === false}
  <button 
  class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full"
  on:click={han}
  >פרסום משאבים</button>
  {:else}
           <RingLoader size="80" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  {/if}
</div> 


</div>
 {/if} 
<style>
  
select.round {
  background-image:
    linear-gradient(315deg, transparent 50%, rgb(0, 174, 255) 50%),
    linear-gradient(225deg, rgb(0, 174, 255) 50%, transparent 50%),
    radial-gradient(#ddd 70%, transparent 72%);
  background-position:
    calc(0% + 20px) calc(1em + 2px),
    calc(0% + 15px) calc(1em + 2px),
    calc(0% + .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
}

select.round:focus {
  background-image:
    linear-gradient(315deg, white 50%, transparent 50%),
    linear-gradient(225deg, transparent 50%, white 50%),
    radial-gradient(gray 70%, transparent 72%);
  background-position:
    calc(0% + 15px) 1em,
    calc(0% + 20px) 1em,
    calc(0% + .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
  border-color: green;
  outline: 0;
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
      z-index: 999;
      overflow-x: auto;
      overflow-y: auto;
     min-width: 96vw;
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
    min-width: 150px;
  }

  th:hover, td:hover {
    background:rgb(132, 241, 223);
  } 

 .textinput {
  position: relative;
  width: 100%;
  display: block;
}

.input {

  border: none;
  margin: 0;
  padding: 10px 0;
  outline: none;
  border-bottom: solid 1px var(--mturk);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
  color:var(--barbi-pink);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}

.label {

  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var( --barbi-pink);
  user-select: none;
}

.line {
  height: 2px;
  background-color: #2196F3;
  position: absolute;
  transform: translateX(-50%);
  left: 50%;
  bottom: 0;
  width: 0;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
}

.input:focus ~ .line, .input:valid ~ .line {
  width: 100%;
}

.input:focus ~ .label, .input:valid ~ .label {
  font-size: 11px;
  color: #2196F3;
  top: 0;
}

@media (max-width:600px){
.textinput {
  position: relative;
  width: 100%;
  display: block;
}
 
}
</style>
