<script>
  import { run } from 'svelte/legacy';

  	import 'dayjs/locale/he.js';
	import dayjs from 'dayjs';

  	import { Datepicker } from 'svelte-calendar';
  import { lang } from '$lib/stores/lang.js'
import MultiSelect from 'svelte-multiselect';
import { idPr } from '../../stores/idPr.js'
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 	run(() => {
    dayjs.locale($lang);
  });
let locale = $lang
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
  "calendar": {
    "width": "400px",
    "maxWidth": "100vw",
    "legend": {
      "height": "45px"
    },
    "shadow": "0px 10px 26px rgba(0, 0, 0, 0.25)",
    "colors": {
      "text": {
        "primary": "#EEE8AA",
        "highlight": "#CCFBF1"
      },
      "background": {
        "primary": "#333",
        "highlight": "#FF0092",
        "hover": "#222"
      },
      "border": "#222"
    },
    "font": {
      "regular": "1.5em",
      "large": "26em"
    },
    "grid": {
      "disabledOpacity": ".5",
      "outsiderOpacity": ".7"
    }
  }
}
async function add (){

if (valid === true){
already = true;
let quanter = ``
if (hm > 0){
  const quantnew = quant - hm;
  quanter = `updateMatanot( id: ${maid}
      data:  {quant: ${quantnew} } ){
        data {id attributes{ quant}}
      }
`
}
let d = new Date
 const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
         const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    idL = cookieValueId;
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        { createSale(
      data: {project: "${$idPr}",
             matanot:  "${maid}",
             users_permissions_user: "${find_user_id(selected)}",
             in: ${total},
             unit: ${hm},
             date: "${dayjs($store?.selected).toISOString()}",
                          publishedAt: "${d.toISOString()}"
    }
  ) {data{id attributes{ in}}}
  ${quanter}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            if(hm > 0){
            dispatch('done', {
                id: miDatan.data.updateMatanot.data.id,
                in:  miDatan.data.createSale.data.attributes.in,
                un: miDatan.data.updateMatanot.data.attributes.quant
            })
          } else {
              dispatch('doners')
          }
        } catch (e) {
            error1 = e
            dispatch('eror')
        }
      } else {
        alert("יש לבדוק אם מספר היחידות שהוזן גבוה ממספר היחידות הקיימות למתנה זו")
      }
}
   const change = {"he":"שינוי תאריך מכירה", "en":"change sale date"}

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