<script>
 let idNewNeed;
 import { createEventDispatcher } from 'svelte';

           import { lang } from '$lib/stores/lang.js'

 const dispatch = createEventDispatcher();
let token;
let needName;
let  desN = "";
let price = 0;
let valued;
let linkto = "";
let meData = [];
// cando choose
export let onmo = false
async function subm() {
   const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
    let d = new Date
    try {
           const res = await fetch("http://localhost:1337/graphql", {
              method: "POST",
              headers: {
                   'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },  body: JSON.stringify({
                        query: `mutation { createMashaabim(
       data: {
         name: "${needName}",
        price: ${price},
        descrip: "${desN}",
        kindOf: ${valued},
        publishedAt: "${d.toISOString()}",
        linkto: "${linkto}"
        }
    
  ){
  data { id attributes{ name}}
}
}
              `})
})
             .then(r => r.json())
  .then(data => meData = data);
        console.log(meData)
    dispatch("newn",{
  id: meData.data.createMashaabim.data.id,
  skob: meData.data.createMashaabim.data,
  name: meData.data.createMashaabim.data.attributes.name,
       })
addnee = false
                  }
      catch(error) {
        console.log('צריך לתקן:', error.response);
                };
    };
    export let rr = 24;
export let color = "--gold";
export let addnee = false;
  </script>
 {#if addnee === false}

      <button on:click={() => addnee = true} 
        class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-0.5 px-4 rounded-full">הוספת משאב שאינו ברשימה</button>
      {:else if addnee === true}
      <div  class="p-2 m-2 border-2 border-gold rounded " class:bg-slate-900={onmo == true}>
  <button
  title="ביטול"
       on:click={() => addnee = false}
        class=" hover:bg-barbi text-barbi hover:text-gold font-bold p-0.5 rounded-full"
        ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
         <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
     </svg></button>
        <div dir="rtl"   class="flex flex-col items-center text-center">
    <h1 class="text-barbi text-2xl text-center">הוספת משאב חדש</h1>    
   <div style="--the:{`var(${color})`}; width:100%;" class="flex flex-col items-center text-center">
      
<div dir="rtl" class='textinput'>
  <input         bind:value={needName}
 type='text' class='input' required>
  <label for="name" class='label'>שם המשאב</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input         bind:value={desN}
 type='text' class='input' required>
  <label for="name" class='label'>תיאור קצר</label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input         bind:value={linkto}
 type='text' class='input' required>
  <label for="name" class='label'>לינק לפרטי מוצר\ מחיר \ רכישה</label>
  <span class='line'></span>
</div>
 <div dir="rtl" class='textinput'>
  <input         bind:value={price}
 type="number" class='input' required>
  <label for="name" class='label'>שווי כספי </label>
  <span class='line'></span>
</div>

  
   <div dir="rtl"  style="width:80%">
   <h2 class="text-center text-barbi">סוג שווי</h2>
    <select bind:value={valued} class="round form-select appearance-none
      block
      w-full
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
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
</div>
  <button
 on:click={subm} 
 class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 m-4 rounded-full"
 > יצירת משאב חדש</button>
   </div>
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
  border-bottom: solid 1px var(--gold);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
  color:  var(--gold);
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
  color:var( --the, var(--gold));
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

@media (min-width:600px){
.textinput {
  position: relative;
  width: 50%;
  display: block;
}
 
}
   </style>