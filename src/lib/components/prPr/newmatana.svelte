<script>
	import { mi } from '$lib/components/prPr/mi.js';
  import { idPr } from '../../stores/idPr.js';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  import { lang } from '$lib/stores/lang.js';
  import Checkbox from '$lib/celim/ui/input/checkbox.svelte';
  import TextInput from '$lib/celim/ui/input/textInput.svelte';
  import NumberInput from '$lib/celim/ui/numberInput.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import UploadPic from '../userPr/uploadPic.svelte';
  import PicInput from '$lib/celim/ui/input/picInput.svelte';
  import axios from 'axios';
  let oneForeProject = false
  let description = '';
  let loading = false;
  let success = false;
  let error = false;
  let price = 0;
  let unlimitedM = false;
  let quant = 1;
  let kindOf = 'total';
  let name;
  let bearer1;
  let token;
  let error1;
  let miDatan = [];
  let linkg = import.meta.env.VITE_URL + '/graphql';
  const unlimited = { he: 'ללא הגבלה', en: 'unlimited' };
  const cr = { he: ' יצירת מתנה חדשה', en: 'create new gift' };
  const unlimitedMo = { he: 'לכל יחידה', en: 'for each unit' };
  const ot = { he: 'עלות חד פעמית', en: 'one time' };
  const py = { he: 'ליחידה', en: 'per unit' };
  const pm = { he: 'חודשי', en: 'monthly' };
  const pye = { he: 'שנתי', en: 'yearly' };
  const avail = { he: 'כמות מצויה', en: 'Available Quantity' };
  const nameT = { he: 'שם', en: 'Name' };
  const priceT = { he: 'מחיר', en: 'Price' };
  const typeT = { he: 'סוג', en: 'Type' };
  const startT = { he: 'תאריך התחלת זמינות', en: 'Start Availablity Date' };
  const endT = { he: 'תאריך סיום זמינות', en: 'End Availablity Date' };
  const totalT = { he: 'סהכ', en: 'Total' };
  const addG = { he: 'הוספת מתנה', en: 'Add Gift' };
  const optional = { he: 'לא חובה למלא', en: 'optional' };

<<<<<<< HEAD
let price = $state();
let quant = $state();
let kindOf = $state([]);
let name = $state();
let bearer1;
let token;
let error1;
let miDatan = [];
let linkg =  import.meta.env.VITE_URL + "/graphql";
async function add (){
quant = quant > 0 ? quant : 0;
price = price > 0 ? price : 0;
let d = new Date
already = true;
 const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
=======
  let croppedImage = null;
  const baseUrl = import.meta.env.VITE_URL;

  let url1 = baseUrl + '/api/upload';



  const descriptionT = { he: 'תיאור', en: 'Description' };

  async function add() {
    loading = true;

    let imageId = null;
    quant = quant > 0 ? quant : 1;
    price = price > 0 ? price : 0;

    let d = new Date();
    already = true;
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
>>>>>>> main
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
    try {
      if (croppedImage) {
  try {
    const response = await axios.post(url1, croppedImage, {
      headers: {
        Authorization: bearer1
      }
    });
    imageId = response.data[0].id;
    console.log('imageId', imageId);
  } catch (error) {
    console.log('צריך לתקן:', error.response);
  }
}
        // GraphQL mutation without image
        console.log(dates,datef)
        const sdate = new Date(dates) || null;
        const fdate = new Date(datef) || null;
        const response = await fetch(linkg, {
          method: 'POST',
          headers: {
            Authorization: bearer1,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `mutation {
              createMatanot(
                data: {
                ${imageId ? `pic: "${imageId}",` : ``}
                  projectcreates: "${$idPr}"
                  name: """${name}"""
                  price: ${price}
                  quant: ${unlimitedM ? -1 :quant}
                  desc: """${description}"""	
                  publishedAt: "${d.toISOString()}"
                  kindOf: ${kindOf}
                 ${sdate !== null  ? `	 startDate: "${sdate.toISOString()}" ` : ``}	
                 ${fdate !== null ? `	finnishDate: "${fdate.toISOString()}" ` : ``}
                  oneForeProject: ${oneForeProject}
                }
              ) {
                data {
                  id
                  attributes {
                    name
                    price
                    quant
                    kindOf
                  }
                }
              }
            }`,
          }),
        });

        const result = await response.json();
        miDatan = result;

<<<<<<< HEAD
        } catch (e) {
            error1 = e
            console.log(error1);
        }
}
let already = $state(false);
=======
        console.log(miDatan);
        loading = false;
        success = true;
        error = false
        dispatch('done', {
          matana: miDatan.data.createMatanot.data,
        });
      
    } catch (e) {
      error1 = e;
      console.log(error1);
      error = true;
      loading = false;
    }
  }
  $: totalV = 0;
  let already = false, dates = null, datef = null;
  $: if (dates !== null && datef !== null) {
    totalV = 0;
    let quanter = unlimitedM === true ? 1 : quant;
    let a = new Date(dates);
    let b = new Date(datef);
    if (kindOf == 'monthly') {
      totalV =
        ((b.getFullYear() - a.getFullYear()) * 12 +
          (b.getMonth() - a.getMonth())) *
        price *
        quanter;
      console.log(
        (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()),
        price,
        quant,
        totalV
      );
    } else if (kindOf == 'yearly') {
      totalV = (b.getFullYear() - a.getFullYear()) * price * quant;
    }
  } else {
    let quanter = unlimitedM === true || kindOf == 'unlimited' ? 1 : quant;
    totalV = price * quanter;
  }
  //תמונה מלבנית
>>>>>>> main
</script>
  <div class="flex flex-col align-middle justify-center gap-x-2">
  <h2 class="text-barbi font-bold text-center underline">{cr[$lang]}</h2>
   <TextInput  lebel={nameT} bind:text={name}/>
   <br>
   <small class="text-center text-barbi">{descriptionT[$lang]}:</small>
   <RichText bind:outpot={description} editable={true} /> 
  <NumberInput bind:value={price} topLebel={priceT[$lang]} barbi={true} noNegative={true} />

        <h2 class="text-center text-barbi"> {typeT[$lang]} </h2>
          <select  bind:value={kindOf} class="round form-select appearance-none
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
        <option value="" disabled selected hidden>{py[$lang]}</option> 
  <option value="monthly">{pm[$lang]}</option>
  <option value="yearly">{pye[$lang]}</option>
  <option value="total" >{py[$lang]}</option>
  <option value="unlimited">{unlimited[$lang]}</option>
  </select>
  {#key unlimitedM}
  {#if kindOf !== "unlimited" && unlimitedM === false}
  <NumberInput bind:value={quant} topLebel={avail[$lang]} barbi={true} noNegative={true} />

  {/if}
  {/key}
  {#if kindOf == "monthly" || kindOf == "yearly"}
  <Checkbox bind:value={unlimitedM} lebel={unlimited} />
    <small class="text-center text-barbi">{startT[$lang]} - {optional[$lang]}</small>
      <input
          class="bg-gold hover:bg-mtork border-2 border-barbi rounded max-w-full"
          type="datetime-local"
          placeholder="{startT[$lang]}"
          bind:value={dates}
        />
        <br>
    <small class="text-center text-barbi">{endT[$lang]} - {optional[$lang]}</small>
  <input
          class="bg-gold hover:bg-mtork border-2 border-barbi rounded max-w-full"
          type="datetime-local"
          placeholder="{endT[$lang]}"
          bind:value={datef}
          min={dates}
        />
        <br>
       
  {/if}
  <small class="text-center text-barbi">{totalT[$lang]}:</small>
  <h2 class="text-center text-barbi"> {totalV.toLocaleString()} 
   {#if unlimitedM === true || kindOf == "unlimited"}
   {unlimitedMo[$lang]}
   {/if}
  </h2>

  <br>
  <PicInput aspect={16/9} bind:files={croppedImage}/>
  <br>
  <Checkbox bind:value={oneForeProject} lebel={{he:"מתנה יחידה לפרויקט",en:"one gift for one project"}} />
  <Button text={addG} on:click={add} {loading} {success} {error} />
</div>
<<<<<<< HEAD
<div dir="rtl" class='textinput'>
  <input type="number" id="hoursn" name="hoursn"  bind:value={price} class='input' required>
  <label for="hoursn" class='label'>מחיר </label>
  <span class='line'></span>
</div>
      <h2 class="text-center text-barbi">  סוג </h2>
        <select  bind:value={kindOf} class="round form-select appearance-none
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
<option value="monthly">חודשי</option>
<option value="yearly">שנתי</option>
<option value="total" selected>ליחידה</option>
<option value="unlimited">ללא הגבלה</option>
</select>

{#if kindOf !== "unlimited"}
<div dir="rtl" class='textinput'>
  <input type="number" id="hoursn" name="hoursn"  bind:value={quant} class='input' required>
  <label for="hoursn" class='label'>כמות מצויה </label>
  <span class='line'></span>
</div>
{/if}
{#if already == false}
<button  class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
 onclick={add} >הוספת מתנה</button>
 {/if}
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

.input:focus ~ .label, .input:valid ~ .label {
  font-size: 11px;
  color: var(--barbi-pink);
  top: 0;
} 
</style>
=======
>>>>>>> main
