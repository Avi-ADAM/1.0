<script>
import { idPr } from '../../stores/idPr.js'
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();

let price;
let quant;
let kindOf = [];
let name;
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
                        { createMatanot(
      data: {projectcreate: "${$idPr}",
             name:  "${name}",
             price: ${price},
             quant: ${quant},
            publishedAt: "${d.toISOString()}",
             kindOf: ${kindOf}
                  }
    
  ) {data{id attributes{ name price quant kindOf}}}

}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('done', {
                matana: miDatan.data.createMatanot.data
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }
}
let already = false;
</script>
 <div dir="rtl" class='textinput'>
  <input type="text"  id="hoursn" name="hoursn"  bind:value={name} class='input' required>
  <label for="hoursn" class='label'>שם </label>
  <span class='line'></span>
</div>
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
 on:click={add} >הוספת מתנה</button>
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