<!-- @migration-task Error while migrating Svelte code: can't migrate `$: datai = []` to `$state` because there's a variable named state.
     Rename the variable and try again or migrate by hand. -->
<script>
    import RangeSlider from "svelte-range-slider-pips";
    import Barb from './barb.svelte'
    import tr from '$lib/translations/tr.json'
    export let old = []
    export let status = [10,20]
    export let splebel = null
    export let state = 2 // original and edit, 3 is original second and edit
export let number;
export let numberb = number
$: datai = []

$: if(old.length > 0){
  datai = [{"leb":`${tr?.nego?.new[$lang]},${numberb}`,"value":Number(numberb)},{"leb":`${tr?.nego?.original[$lang]},${number}`,"value":Number(number)}]
  for (let i = 0; i < old.length; i++) {
    console.log(old[i])
    if(old[i] != null){
      datai.push({"value":Number(old[i]),"leb":`${tr?.nego?.oldno[$lang]}-${i+1},${old[i]}`})
    }
  }
  datai = datai
}else{
  datai = [{"leb":`${tr?.nego?.new[$lang]},${numberb}`,"value":100},{"leb":`${tr?.nego?.original[$lang]},${number}`,"value":1000}]
  datai = datai
}
export let lebel;
  import Close from '$lib/celim/close.svelte';
import { lang } from '$lib/stores/lang.js'
    let edit = false
let show2 = false
function checkAll(a,b){
  datai[0].value = b
  datai[1].value = a
}
</script>
    <div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">
 {#if edit == false}
    <div class="flex hi flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{lebel}: <span class:line-through={splebel == false}
           class:text-barbi={splebel == false}
           class:text-wow={splebel == true}
           class:hidden={splebel == null}>{tr?.mission.perMonth[$lang]}</span></h2>
       {#if number == numberb} 
       <p class="text-gold">{number}</p>
       {:else}
       <div dir="rtl" class='w-1/2 mx-auto'>
        {#key datai}
       <Barb {datai} />
       {/key}
       </div>
        {/if}
       <button on:click={()=>edit = true}>
            {#if number == numberb}🖍️{:else}✏️{/if}</button>
        {#if number != numberb && show2 != true}
        <button on:click={()=>show2 = true}>📑</button>
        {:else if show2 == true}
        <div class="flex flex-col items-center flex-wrap justify-center m-4">
        <button on:click={()=>show2 = false}><Close width={10} height={10}/></button>
        <div class="flex flex-row">
        <small class:text-right={$lang == "he"}>{tr?.nego.original[$lang]}:</small>
        <p>{number}</p>
      </div>
      <div class="flex flex-row">
        <small class:text-right={$lang == "he"} class="text-gold">{tr?.nego.sugestion[$lang]}:</small>
        <p class="text-gold">{numberb}</p>
        </div>
        {#each old  as o, i}
        <div class="flex flex-row justify-center items-center">
        <small class:text-right={$lang == "he"} class="text-gold p-4">{tr?.nego.oldno[$lang]}:{i+1}</small>
        <p class="text-gold">{o ?? number}</p></div>
        {/each}
        </div>
        {/if}
        </div>
  {:else} 
  <!--    
<RangeSlider bind:values={status} pipstep="20" float pips all="label" hoverable />
--> 
<div dir="rtl" class='textinput max-w-sm mx-auto'>
  <input type="number"  id="numberb" name="numberb" bind:value={numberb} class='input' required>
  <label for="numberb" class='label' >{lebel}</label>
  <span class='line '></span>
</div><button on:click={()=>{if(Number(numberb) >= 0){ edit = false
checkAll(number,numberb)
} else{
  console.log(numberb,Number(numberb))
  alert(tr.common.noLesFromZero[$lang])
}}}>✅</button>
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