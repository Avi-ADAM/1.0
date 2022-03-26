<script>
//טבלת מתנות כפתור מכירה מקפיץ תפריט של איפה הכסף יושב
import New from './newmatana.svelte';
import Sale from './sale.svelte';
 import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';
      import Halu from './whowhat.svelte'
export let fmiData = [];
export let rikmashes = [];
export let projectId;
let isOpen = false;
let a = 0;
export let bmiData = [];
 import { RingLoader
} from 'svelte-loading-spinners'
export let projectUsers = [];
let quant, each, maid;
function sell(id, v, z){
  maid = id;
  each = v;
  quant = z;
isOpen = true;
a = 0;
}
function addnew(){
isOpen = true;
a = 1;
}
const closer = () => {
    isOpen = false;
  a = 0;
};
let hal = false;
const sale = (event) => {
 const  id = event.detail.id
 const  un = event.detail.un
 let oldob = bmiData;
 const x = oldob.map(c => c.id);
 const indexy = x.indexOf(id);
 oldob[indexy].quant = un;
 bmiData = oldob;
    isOpen = false;
  a = 0;
};
function done(event){
   isOpen = false;
  a = 0;
  bmiData.push(event.detail.matana);
  bmiData = bmiData
}
export let salee = [];
function ask (){
hal = true;
//ליצור מטבע אישור של חלוקה ליצור טופס של פרטי חלוקה כמה אחוז לחלק וכמה להעמיד להוצאות
}
let allin = 0;
$: for (let i = 0; i < salee.length; i++){
  allin += salee[i].in
}
</script>
   
<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form">
      <div style="z-index: 400;" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          on:click={closer}>ביטול</button>
          {#if a == 0}
 <Sale {projectUsers} {each} {quant} {maid} on:doner={closer} on:done={sale} on:eror={()=>a=3}/>
          {:else if a == 1}
 <New {projectId} on:done={done}/>

                    {:else if a == 2}

          <div class="sp bg-gold">
            <h3 class="text-barbi">רק רגע בבקשה</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> 
         {:else if a == 3}
         <h1> אירעה שגיאה</h1>
         <button class="hover:bg-barbi text-barbi hover:text-gold bg-gold rounded-full" on:click={()=> a = 0}>לנסות שוב</button>
         {/if}
  </DialogContent>
  </div>
</DialogOverlay>


<div class="dd md:items-center border-2 border-gold rounded">
  <div class="body items-center">
        {#if bmiData.length > 0}

  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >המתנות שלנו</h1>
    </caption>
        <tr class="gg">
          <th class="gg">אפשרויות</th>
          {#each bmiData as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
                    <!--    <button>מחיקה</button>-->
        </td>
          {/each}
    </tr> <tr class="ggr">
      <th class="ggr">שם</th>
      {#each bmiData as data, i}
            <td class="ggr">{data.name}
            </td>
            {/each}
          </tr> <tr>
            <th>מחיר</th>
            {#each bmiData as data, i}
            <td>{data.price}</td>
              {/each}
            </tr>
         <tr >
              <th >כמות מצויה </th>
              {#each bmiData as data, i}
            <td >              
              {#if data.quant > 0}
            <h2 style="display:{data.kindOf == "unlimited" ? "none" : ""} ;">{data.quant}</h2> 
            {/if}
            </td>
            {/each}
          </tr><tr>
          <th> סוג </th>
          {#each bmiData as data, i}
          <td>
            {#if data.kindOf == "total"}
            ליחידה
          {:else if data.kindOf == "monthly"}
          חודשי
          {:else if data.kindOf == "yearly"}
            שנתי
         {:else if data.kindOf == "unlimited"}
          ללא הגבלה
         {/if}
           </td>
           {/each}
      </tr><!--<tr>
        <th> מכירות</th>
        {#each bmiData as data, i}
        <td>          {#if data.sale.in} 

          {data.sale.in} 
          {/if}
         </td>
         {/each} 
    </tr><tr >
      <th>סך הכל הכנסה למתנה</th>
      {#each bmiData as data, i}
      <td>
      {#if data.sale.in > 0 & data.price > 0}
      
      {data.price * data.sale.in}
      
      {:else} <p>0</p>
      {/if}
      </td>
      {/each}
    </tr>-->

    <tr class="ggd">
          <th class="ggd">דיווח על מכירה</th>
          {#each bmiData as data, i}
          <td class="ggd" style="font-size: 3rem">
           
          <button
          class="bg-pink-200 hover:bg-barbi text-mturk rounded-full p-0.5"
          title="דיווח על מכירה"
          on:click={sell(data.id, data.price, data.quant)} 
          ><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 496 496" style=" width:24px;height:24px;" xml:space="preserve">
<g>
	<g>
		<g>
			<path d="M256,32.408V24h-16v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4
				h-8c-2.208,0-4-1.792-4-4v-4h-16v4c0,9.656,6.88,17.736,16,19.592V104h16v-8.408c9.12-1.856,16-9.936,16-19.592
				c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4
				C272,42.344,265.12,34.264,256,32.408z"/>
			<path d="M104,128.408V120H88v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4
				h-8c-2.208,0-4-1.792-4-4v-4H72v4c0,9.656,6.88,17.736,16,19.592V200h16v-8.408c9.12-1.856,16-9.936,16-19.592
				c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4
				C120,138.344,113.12,130.264,104,128.408z"/>
			<path d="M400,48c-35.288,0-64,28.712-64,64c0,32.144,23.848,58.752,54.76,63.256C387.664,184.928,378.688,192,368,192H256
				v-64.552c31.52-3.96,56-30.872,56-63.448c0-35.288-28.712-64-64-64c-35.288,0-64,28.712-64,64c0,32.576,24.48,59.488,56,63.448
				V240H128c-10.688,0-19.664-7.072-22.76-16.744C136.152,218.752,160,192.144,160,160c0-35.288-28.712-64-64-64
				c-35.288,0-64,28.712-64,64c0,32.84,24.872,59.952,56.768,63.56C92.312,242.008,108.536,256,128,256h112v16H104v64h16.76l16,160
				h222.48l16-160H392v-64H256v-64h112c19.464,0,35.688-13.992,39.232-32.44C439.128,171.952,464,144.84,464,112
				C464,76.712,435.288,48,400,48z M96,208c-26.472,0-48-21.528-48-48s21.528-48,48-48s48,21.528,48,48S122.472,208,96,208z
				 M344.76,480H151.24l-14.4-144h222.32L344.76,480z M376,288v32H120v-32H376z M248,112c-26.472,0-48-21.528-48-48s21.528-48,48-48
				s48,21.528,48,48S274.472,112,248,112z M400,160c-26.472,0-48-21.528-48-48s21.528-48,48-48s48,21.528,48,48S426.472,160,400,160
				z"/>
			<path d="M408,80.408V72h-16v8.408c-9.12,1.856-16,9.936-16,19.592c0,11.024,8.976,20,20,20h8c2.208,0,4,1.792,4,4s-1.792,4-4,4
				h-8c-2.208,0-4-1.792-4-4v-4h-16v4c0,9.656,6.88,17.736,16,19.592V152h16v-8.408c9.12-1.856,16-9.936,16-19.592
				c0-11.024-8.976-20-20-20h-8c-2.208,0-4-1.792-4-4s1.792-4,4-4h8c2.208,0,4,1.792,4,4v4h16v-4
				C424,90.344,417.12,82.264,408,80.408z"/>
			<rect x="320" y="352" width="16" height="16"/>
			<rect x="160" y="352" width="144" height="16"/>
 		</g>
 	</g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
 <g>
 </g>
</svg>
          </button> 
         
        </td>
          {/each}
    </tr> 
    </table>
    {/if}

   <button  class="bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink  text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
 on:click={addnew}> הוספת מתנה חדשה</button>
     {#if salee.length > 0}

  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      > מכירות ממתינות לחלוקה</h1>
    </caption>
        <tr class="gg">
          <th class="gg">אפשרויות</th>
          {#each salee as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
                    <!--    <button>מחיקה</button>-->
        </td>
          {/each}
           <td class="gg" style="font-size: 3rem">
             סך הכל
        </td>
    </tr> <tr class="ggr">
      <th class="ggr">שם המתנה</th>
      {#each salee as data, i}
            <td class="ggr">{data.matanot.name}
            </td>
            {/each}
                       <td></td>

          </tr> 
          <tr>
            <th>סכום</th>
            {#each salee as data, i}
            <td>{data.in}</td>
              {/each}
           <td>{allin}</td>
            </tr>
         <tr >
              <th >הכסף ממתין אצל: </th>
              {#each salee as data, i}
            <td >              
              {data.users_permissions_user.username}
            </td>
            {/each}
            <td></td>
          </tr>
    </table> 
    {#if hal === false}
   <button  class="bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
 on:click={ask}>בקשת חלוקה</button>
{:else}
<Halu {salee} {allin} meData={rikmashes} fmiData={fmiData} users={projectUsers} {rikmashes} />
{/if}
    {/if}

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
      overflow-y: auto;
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
      
        
   