<script>

  import { t } from '$lib/translations';
  import { get } from 'svelte/store';
  import Close from '$lib/celim/close.svelte';
import { lang } from '$lib/stores/lang.js'
  import { onMount } from 'svelte';
  let htmlon = $state(``)

  /**
   * @typedef {Object} Props
   * @property {number} [stepState] - original and edit, 3 is original second and edit
   * @property {any} kindOf
   * @property {any} [lebel]
   * @property {any} [kindOfb]
   * @property {boolean} [long]
   */

  /** @type {Props} */
  let {
    stepState = 2,
    kindOf,
    lebel = {"he":"עריכה", "en": "edit"},
    kindOfb = $bindable(kindOf),
    long = false
  } = $props();
    const und = {"he":"לא הוגדר","en":"undefined"}
onMount(()=>{
    console.log(kindOf,kindOfb,get(t)(`mash.${kindOf}`))
    if (kindOf == kindOfb){
        if(kindOf == undefined ||kindOf == "undefined"){
            htmlon = und[$lang]
        }else{
            //htmlon = $t(`mash.${kindOf}`)
        }
    } else{
        console.log("HEE")
    checkAll(kindOf,kindOfb)
    }
})
let edit = $state(false)
let show2 = $state(false)
function check (lettera, letterb){
    if(lettera == letterb){
        return true
    }else {
        return false
    }
}
function checkAll (a, b){
    let al = a
    let bl = b
    htmlon = ``

    if (check(al, bl) == true){
        htmlon += `${get(t)(`mash.${al}`)} `
    } else{
             if(al != undefined){
        htmlon+= `<span class="line-through text-barbi">${get(t)(`mash.${al}`)}</span> `
        }
        htmlon += `<span class="text-wow">${get(t)(`mash.${bl}`)} </span>`
    }
    }
    let first = $derived($t(`mash.${kindOf}`))
    const hekind = {"he":"סוג שווי","en":"kind of vallue"}

 const ot = {"he":"עלות חד פעמית","en":"one time"}
const py = {"he":"ליחידה", "en": "per unit"}
const pm = {"he": "חודשי","en": "monthly"}
const pye = {"he": "שנתי", "en": "yearly"}
const re = {"he": "השכרה לזמן קצוב", "en": "rent"}
    </script>
    <div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">

    {#if edit == false}
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{lebel[$lang]}: </h2>
        <p class="text-gold">{#if htmlon.length > 0}{@html htmlon} {:else} {first}{/if}</p><button onclick={()=>edit = true}>
            {#if kindOf == kindOfb}🖍️{:else}✏️{/if}</button>
        {#if kindOf != kindOfb && show2 != true}
        <button onclick={()=>show2 = true}>📑</button>
        {:else if show2 == true}
        <div class="flex flex-col align-middle justify-center ">
        <button onclick={()=>show2 = false}><Close/></button>
        <small class:text-right={$lang == "he"}>{$t('nego.original')}:</small>
        <p>{$t(`mash.${kindOf}`)}</p>
        <small class:text-right={$lang == "he"} class="text-gold">{$t('nego.sugestion')}:</small>
        <p class="text-gold">{$t(`mash.${kindOfb}`)}</p>
        </div>
        {/if}
        </div>
{:else}
 <div dir="rtl"   class="flex items-center justify-center aling-center">
   <h2 class="text-center text-barbi">{hekind[$lang]}: </h2>
    <select bind:value={kindOfb} class="round form-select appearance-none
      block
      w-fit
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
<option value="total">{ot[$lang]}</option>
<option value="monthly">{pm[$lang]}</option>
<option value="yearly">{pye[$lang]}</option>
<option value="perUnit">{py[$lang]}</option>
<option value="rent">{re[$lang]}</option>
</select>
</div>  
<button onclick={()=>{edit = false
checkAll(kindOf,kindOfb)
}}>✅</button>
{/if}
</div>
