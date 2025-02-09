<script>
  import { run } from 'svelte/legacy';

  	import 'dayjs/locale/he.js';
	import dayjs from 'dayjs';

  	import { Datepicker } from 'svelte-calendar';
  import { lang } from '$lib/stores/lang.js'
import MultiSelect from 'svelte-multiselect';
import { idPr } from '../../stores/idPr.js'
 import { createEventDispatcher } from 'svelte';
  import NumberInput from '$lib/celim/ui/numberInput.svelte';
  import { toast } from 'svelte-sonner';
  import {SendTo} from '$lib/send/sendTo.svelte';

 const dispatch = createEventDispatcher();
 	run(() => {
    dayjs.locale($lang);
  });
let locale = $lang
<<<<<<< HEAD
let store = $state()
let selected = $state();
let total = $state(0);
let hm = $state(0);
let where = [];
let placeholder = `אצל מי הכסף`;
let already = $state(false);
  /** @type {{projectUsers?: any, quant: any, each?: number, kindUlimit?: boolean, maid: any}} */
  let {
    projectUsers = [],
    quant = $bindable(),
    each = $bindable(0),
    kindUlimit = $bindable(false),
    maid
  } = $props();
let valid = $state(true);
run(() => {
    if (kindUlimit = false ){ 
          if (hm > quant){
    valid = false;
          } else {
      valid = true;
          }
  } else if (kindUlimit = true ){
      valid = true;
      quant = -1
  }
  });
run(() => {
    if (hm > 0 && each > 0 ){
    total = hm * each;
    each = total / hm;
  }
  });
run(() => {
    if (hm > 0 && total > 0 ){
    each = total / hm;
  }
  });
=======
let store
export let quant;
console.log(quant)
let selected;
let total = 0;
export let each = 0;
export let kindUlimit = false 
 let kindOf = 'monthly';
let hm = 1;
let where = [];
let placeholder = `אצל מי הכסף`;                          
let already = false;
export let maid;
let per = false;

$:if (kindOf == "monthly" || kindOf == "yearly") {
 if(dates !== null && datef !== null) {
  per = false;
  total = 0;
  let a = new Date(dates);
  let b = new Date(datef);
  if (kindOf == 'monthly') {
    total =
      ((b.getFullYear() - a.getFullYear()) * 12 +
      (b.getMonth() - a.getMonth())) *
        each *
         hm;
  } else if (kindOf == 'yearly') {
    total = (b.getFullYear() - a.getFullYear()) *
     each * 
     hm;
  }
}else{
  total = hm * each;
  per = true;
}
  }else{
    per = false;
  total = hm * each;
}
>>>>>>> main


let bearer1;
let token;
let error1;
let idL;
let miDatan = [];
const baseUrl = import.meta.env.VITE_URL

let linkg = baseUrl+'/graphql';
    function find_user_id(user_name_arr){
     var  id = 0;
      for (let i = 0; i< projectUsers.length; i++){
        if(projectUsers[i].attributes.username === user_name_arr[0]){
          id = projectUsers[i].id
        }
      }
      return id;
     };
let theme = {
  calendar: {
    width: '400px',
    maxWidth: '100vw',
    legend: {
      height: '45px',
    },
    shadow: '0px 10px 26px rgba(0, 0, 0, 0.25)',
    colors: {
      text: {
        primary: '#EEE8AA',
        highlight: '#CCFBF1',
      },
      background: {
        primary: '#333',
        highlight: '#FF0092',
        hover: '#222',
      },
      border: '#222',
    },
    font: {
      regular: '1.5em',
      large: '26em',
    },
    grid: {
      disabledOpacity: '.5',
      outsiderOpacity: '.7',
    },
  },
};
let noSelectedE = false
async function add() {
  if(selected[0] == null){
    console.log(dates)
    noSelectedE = true
    toast.error(noSelected[$lang])
    return
  }
    already = true;
    
    let quanter = ``;
    if (hm > 0) {
      const quantnew = quant - hm;
      quanter = `updateMatanot( id: ${maid}
      data:  {quant: ${quantnew} } ){
        data {id attributes{ quant}}
      }
`;
    }
    let d = new Date();
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    idL = cookieValueId;
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
    try {
      const sdate = new Date(dates) || null;
      const fdate = new Date(datef) || null;

      let saleDate = dayjs($store?.selected);
      let saleData = {
        project: `${$idPr}`,
        matanot: `${maid}`,
        users_permissions_user: `${find_user_id(selected)}`,
        in: total,
        unit: hm,
        date: saleDate.toISOString(),
        publishedAt: d.toISOString(),
      };

      if (kindOf === 'monthly' || kindOf === 'yearly') {
        if(dates !== null) {
          datesE = false
          saleData.startDate = sdate.toISOString();
        }else{
          //stop the function here
          datesE = true
          toast.warning(datesEmessage[$lang])
          return
        }
        if(datef !== null) {
          saleData.finishDate = fdate.toISOString();
        }
      }

      await fetch(linkg, {
        method: 'POST',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `mutation 
                        { createSale(
      data: ${JSON.stringify(saleData).replace(/"([^(")"]+)":/g, '$1:')}
    ) {data{id attributes{ in}}}
  ${quanter}
}
`,
        }),
      })
        .then((r) => r.json())
        .then((data) => (miDatan = data));
      if (hm > 0) {
        if (kindOf === 'monthly' || kindOf === 'yearly') {
          let chiluzh = miDatan.data.createSale.data.id;
         let monti = `mutation{
            createMonter(
              data:{
                sale: "${chiluzh}",
                ani: "sale"
               start: "${sdate.toISOString()}"
             ${datef !== null ? `finish: "${fdate.toISOString()}" ` : ``}
              }
            ){data{id}}
            }
          `
         await SendTo(monti).then(console.log("res8 ")).catch(console.log("res8 eror"))
        }
        dispatch('done', {
          id: miDatan.data.updateMatanot.data.id,
          in: miDatan.data.createSale.data.attributes.in,
          un: miDatan.data.updateMatanot.data.attributes.quant,
        });
      } else {
        dispatch('doners');
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
      dispatch('eror');
    }
  } 
const optional = {
  he: 'אין תאריכי התחלה וסיום מוגדרים יהיה צורך לאשרר בכל חודש קבלה',
  en: 'No start and end dates were provided. Confirmation will be needed each month',
};

   const change = {"he":"שינוי תאריך מכירה", "en":"change sale date"}
<<<<<<< HEAD

</script>
<div dir="rtl" class='textinput'>
  <input max={quant} type="number" id="hoursn" name="hoursn"  bind:value={hm} class='input' required>
  <label for="hoursn" class='label'>כמה יחידות? </label>
  <span class='line'></span>
  <small style="color: red; display: {valid ? "none" : ""};">מספר היחידות לא יכול להיות גבוה יותר מ{quant}</small>
</div>
<div dir="rtl" class='textinput'>
  <input step="0.01" type="number" id="hoursn" name="hoursn"  bind:value={each} class='input' required>
  <label for="hoursn"  class='label'>כמה ליחידה? </label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input step="0.01" type="number" id="hoursn" name="hoursn"  bind:value={total} class='input' required>
  <label for="hoursn" class='label'>סך הכל </label>
  <span class='line'></span>
</div>
<div class="grid justify-center align-center ">
  <h3>{change[$lang]}</h3>
<Datepicker  bind:store theme={theme} format={$lang == "en" ? 'MM/DD/YYYY' :'DD/MM/YYYY'}/>

</div>

      
  <div>
      <MultiSelect
      maxSelect={1}
      bind:selected
      {placeholder}
      options={projectUsers.map(c => c.attributes.username)}
      />
     </div>
{#if already == false}
<div class="flex items-center justify-center">
<button style="margin: 5px auto;"  class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full"
 onclick={add} >דיווח</button>
 </div>
 {/if}<style>
       .textinput {
  position: relative;
  width: 100%;
  display: block;
=======
   let dates = null,
  datef = null
const quantT = {
  he: 'כמה יחידות?',
  en: 'How many units?',
};
const forEachT = {
  he: 'כמה ליחידה?',
  en: 'How many per unit?',
>>>>>>> main
}
const perMonth = {
  he: 'לחודש',
  en: 'per month',
}
const perYear = {
  he: 'לשנה',
  en: 'per year',
}
let datesE = false
let datesEmessage = {
  he: 'אין תאריך התחלה',
  en: 'No start date'
}
const noFinnish = {
  he: 'אין תאריך סיום, ניתן להשאיר ירק אם רוצים מכירה מתמשכת עד אשר תבוטל באופן יזום',
  en: 'No finish date is provided, it is possible to leave it blank if you want a perpetual sale until canceled'
}
const noSelected = {
  he: ' שדה אצל מי הכסף נשאר ריק ',  
  en: 'No user selected'
}
const start = {
  he: 'תאריך התחלה',
  en: 'Start Date'
}
const end = {
  he: 'תאריך סיום',
  en: 'End Date'
}
const addL = {
  he: 'הוספת מכירה',
  en: 'Add Sale'
}
</script>
<div class="flex flex-col align-middle justify-center gap-x-2">

{#if kindOf !== "total"}
<NumberInput bind:value={hm} topLebel={quantT[$lang]} barbi={true} noNegative={true} noMoreThen={quant} />
{/if}
<NumberInput bind:value={each} topLebel={forEachT[$lang]} barbi={true} noNegative={true} />

{#if kindOf == 'monthly' || kindOf == 'yearly'}
  <small class="text-barbi text-center">{start[$lang]}</small>
  <input
    class="bg-gold hover:bg-mtork border-2 border-barbi rounded"
    type="datetime-local"
    placeholder="הוספת תאריך התחלה"
    bind:value={dates}
  />
  {#if datesE}
    <small class="text-barbi text-cente"><mark>{datesEmessage[$lang]}</mark></small>
  {/if}
  <small class="text-barbi text-center">{end[$lang]}</small>
  <input
    class="bg-gold hover:bg-mtork border-2 border-barbi rounded"
    type="datetime-local"
    placeholder="הוספת תאריך סיום"
    bind:value={datef}
    min={dates}
  />
  {#if datef === null}
  <small class="text-barbi text-center "><mark>{noFinnish[$lang]}</mark></small>
  {/if}
{/if}


<div class="grid justify-center align-center ">
  <h3 class="text-center text-barbi">{change[$lang]}</h3>
  <Datepicker bind:store theme={theme} format={$lang == 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'} />
</div>

<div>
  <MultiSelect
    maxSelect={1}
    bind:selected
    {placeholder}
    options={projectUsers.map((c) => c.attributes.username)}
  />
  {#if noSelectedE}
    <small class="text-barbi text-center"><mark>{noSelected[$lang]}</mark></small>
  {/if}
</div>
  <small class="text-barbi text-center">סה"כ 
    {#if per == true}
      {kindOf === 'monthly' ? perMonth[$lang] : perYear[$lang]}
    {/if}
  </small>
  <p class="text-center text-barbi"> {total}</p>

{#if already == false}
  <div class="flex items-center justify-center">
    <button
      style="margin: 5px auto;"
      class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full"
      on:click={add}
    >
      {addL[$lang]}    </button>
  </div>
{/if}
</div>
<style>
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
 color:  var(--barbi-pink);
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
  color:var(--barbi-pink);
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
.input:invalid ~ .line {
    background-color: #f00000;
}
.input:invalid  {
border-bottom: solid 1px #f00000;
}

.input:focus ~ .label, .input:valid ~ .label {
  font-size: 11px;
  color: var(--barbi-pink);
  top: 0;
} 

</style>
