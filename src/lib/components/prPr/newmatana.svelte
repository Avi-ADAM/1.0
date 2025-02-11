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
  import { effect } from '@melt-ui/svelte/internal/helpers';
  let oneForeProject = false
  let description = '';
  let loading = false;
  let success = false;
  let error = false;
  let unlimitedM = false;
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

  let croppedImage = null;
  const baseUrl = import.meta.env.VITE_URL;

  let url1 = baseUrl + '/api/upload';



  const descriptionT = { he: 'תיאור', en: 'Description' };
  let already = $state(false);
let price = $state(0);
let quant = $state(1);
let kindOf = $state('total');
let name = $state();
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
        const result = await response.json()
        miDatan = result
        console.log(miDatan)
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
  let totalV = $state(0);
  let  dates = null, datef = null;
  $effect(()=>{ if (dates !== null && datef !== null) {
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
})
  //תמונה מלבנית
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
