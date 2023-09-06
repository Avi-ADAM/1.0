<script>
    import RangeSlider from "svelte-range-slider-pips";
    import Barb from './barb.svelte'
    export let status = [10,20]
    export let state = 2 // original and edit, 3 is original second and edit
export let number;
export let lebel = {"he":"עריכה", "en": "edit"}
  import Close from '$lib/celim/close.svelte';
import { lang } from '$lib/stores/lang.js'
let datai = [{"leb":"הצעה","value":100},{"leb":"מקור","value":1000}]
    let edit = false
let show2 = false
export let numberb = number
function checkAll(a,b){
  datai[0].value = b
  datai[1].value = a
}
</script>
    <div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">
 {#if edit == false}
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline underline-lturk">{lebel[$lang]}: </h2>
       {#if number == numberb} 
       <p class="text-gold">{number}</p>
       {:else}
       <Barb {datai} />
        {/if}
       <button on:click={()=>edit = true}>
            {#if number == numberb}🖍️{:else}✏️{/if}</button>
        {#if number != numberb && show2 != true}
        <button on:click={()=>show2 = true}>📑</button>
        {:else if show2 == true}
        <button on:click={()=>show2 = false}><Close/></button>
        <small class:text-right={$lang == "he"}>מקורי:</small>
        <p>{number}</p>
        <small class:text-right={$lang == "he"} class="text-gold">הצעה:</small>
        <p class="text-gold">{numberb}</p>
        {/if}
        </div>
  {:else} 
  <!--    
<RangeSlider bind:values={status} pipstep="20" float pips all="label" hoverable />
--> 
<div dir="rtl" class='textinput max-w-sm mx-auto'>
  <input type="number" on:input={(e)=>console.log(e)} id="numberb" name="numberb" bind:value={numberb} class='input' required>
  <label for="numberb" class='label' >{lebel[$lang]}</label>
  <span class='line '></span>
</div><button on:click={()=>{edit = false
checkAll(number,numberb)
}}>✅</button>
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
  border-bottom: solid 1px var(--mturk);
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
  color:var(--mturk);
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