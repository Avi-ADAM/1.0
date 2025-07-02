<script>
  	import 'dayjs/locale/he.js';
	import dayjs from 'dayjs';

  	import { Datepicker } from 'svelte-calendar';
  import { lang } from '$lib/stores/lang.js'
import MultiSelect from 'svelte-multiselect';
import { idPr } from '../../stores/idPr.js'
  import NumberInput from '$lib/celim/ui/numberInput.svelte';
  import { toast } from 'svelte-sonner';
  import {SendTo} from '$lib/send/sendTo.svelte';

let locale = $lang
let store = $state()
console.log(quant)
let selected = $state([]);
let total = $state(0);
 let kindOf = 'monthly';
let hm = $state(1);
let where = [];
let placeholder = `אצל מי הכסף`;                          
let already = $state(false);
  /**
   * @typedef {Object} Props
   * @property {any} [projectUsers]
   * @property {any} quant
   * @property {number} [each]
   * @property {boolean} [kindUlimit]
   * @property {any} maid
   * @property {(payload: { id: any; in: any; un: any }) => void} [onDone] - Callback when the sale is successfully added.
   * @property {() => void} [onDoners] - Callback when the sale is successfully added (no updateMatanot).
   * @property {() => void} [onEror] - Callback when an error occurs.
   */

  /** @type {Props} */
  let {
    projectUsers = [],
    quant,
    each = $bindable(0),
    kindUlimit = false,
    maid,
    onDone,
    onDoners,
    onEror
  } = $props();
let per = $state(false);



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
let noSelectedE = $state(false)
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
        onDone?.({
          id: miDatan.data.updateMatanot.data.id,
          in: miDatan.data.createSale.data.attributes.in,
          un: miDatan.data.updateMatanot.data.attributes.quant,
        });
      } else {
        onDoners?.();
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
      onEror?.();
    }
  } 
const optional = {
  he: 'אין תאריכי התחלה וסיום מוגדרים יהיה צורך לאשרר בכל חודש קבלה',
  en: 'No start and end dates were provided. Confirmation will be needed each month',
};

   const change = {"he":"שינוי תאריך מכירה", "en":"change sale date"}
   let dates = $state(null),
  datef = $state(null)
const quantT = {
  he: 'כמה יחידות?',
  en: 'How many units?',
};
const forEachT = {
  he: 'כמה ליחידה?',
  en: 'How many per unit?',
}
const perMonth = {
  he: 'לחודש',
  en: 'per month',
}
const perYear = {
  he: 'לשנה',
  en: 'per year',
}
let datesE = $state(false)
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
$effect(() => {
    dayjs.locale($lang);
  });
$effect(() => {
    if (kindOf == "monthly" || kindOf == "yearly") {
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
  });
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
      onclick={add}
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
