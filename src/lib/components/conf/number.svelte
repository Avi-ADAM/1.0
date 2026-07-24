<script>

    import RangeSlider from "svelte-range-slider-pips";
    import Barb from './barb.svelte'
  import { t } from '$lib/translations';


  import Close from '$lib/celim/close.svelte';
import { lang } from '$lib/stores/lang.js'
  /**
   * @typedef {Object} Props
   * @property {any} [old]
   * @property {any} [status]
   * @property {any} [splebel]
   * @property {number} [stepState] - original and edit, 3 is original second and edit
   * @property {any} number
   * @property {any} [numberb]
   * @property {any} lebel
   */

  /** @type {Props} */
  let {
    old = [],
    status = [10,20],
    splebel = null,
    stepState = 2,
    number,
    numberb = $bindable(),
    lebel
  } = $props();
    let edit = $state(false)
let show2 = $state(false)
let datai = $state([])
const fieldId = `number-${Math.random().toString(36).slice(2, 9)}`

function commitEdit() {
  const n = Number(numberb)
  if (n >= 0) {
    numberb = n
    edit = false
    checkAll(number, numberb)
    updateDatai()
  } else {
    alert($t('common.noLesFromZero'))
  }
}
function checkAll(a,b){
  datai[0].value = b
  datai[1].value = a
}

function updateDatai() {
  const oldValues = old ?? [];
  const items = [
    { leb: `${$t('nego.new')},${numberb}`, value: Number(numberb) },
    { leb: `${$t('nego.original')},${number}`, value: Number(number) }
  ];
  if (oldValues.length > 0) {
    for (let i = 0; i < oldValues.length; i++) {
      console.log(oldValues[i]);
      if (oldValues[i] != null) {
        items.push({ value: Number(oldValues[i]), leb: `${$t('nego.oldno')}-${i + 1},${oldValues[i]}` });
      }
    }
  }
  datai = items;
}

$effect.pre(() => {
  updateDatai();
});
</script>
    <div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">
 {#if edit == false}
    <div class="flex hi flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{lebel}: <span class:line-through={splebel == false}
           class:text-barbi={splebel == false}
           class:text-wow={splebel == true}
           class:hidden={splebel == null}>{$t('mission.perMonth')}</span></h2>
       {#if Number(number) === Number(numberb)} 
       <p class="text-gold">{number}</p>
       {:else}
       <div dir="rtl" class='w-1/2 mx-auto'>
        {#key datai}
       <Barb {datai} />
       {/key}
       </div>
        {/if}
       <button onclick={()=>edit = true}>
            {#if Number(number) === Number(numberb)}🖍️{:else}✏️{/if}</button>
        {#if Number(number) !== Number(numberb) && show2 != true}
        <button onclick={()=>show2 = true}>📑</button>
        {:else if show2 == true}
        <div class="flex flex-col items-center flex-wrap justify-center m-4">
        <button onclick={()=>show2 = false}><Close width={10} height={10}/></button>
        <div class="flex flex-row">
        <small class:text-right={$lang == "he"}>{$t('nego.original')}:</small>
        <p>{number}</p>
      </div>
      <div class="flex flex-row">
        <small class:text-right={$lang == "he"} class="text-gold">{$t('nego.sugestion')}:</small>
        <p class="text-gold">{numberb}</p>
        </div>
        {#each old ?? [] as o, i}
        <div class="flex flex-row justify-center items-center">
        <small class:text-right={$lang == "he"} class="text-gold p-4">{$t('nego.oldno')}:{i+1}</small>
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
  <input
    type="number"
    id={fieldId}
    name={fieldId}
    value={numberb}
    oninput={(e) => {
      numberb = e.currentTarget.valueAsNumber;
    }}
    class="input"
    required
  />
  <label for={fieldId} class='label' >{lebel}</label>
  <span class='line '></span>
</div><button onclick={commitEdit}>✅</button>
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
