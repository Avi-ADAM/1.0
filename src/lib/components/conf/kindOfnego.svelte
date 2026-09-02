<script>

  import { t } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
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
    lebel = '',
    kindOfb = $bindable(kindOf),
    long = false
  } = $props();onMount(()=>{
    console.log(kindOf,kindOfb,get(t)(`mash.${kindOf}`))
    if (kindOf == kindOfb){
        if(kindOf == undefined ||kindOf == "undefined"){
            htmlon = $t('nego.conf.undefinedVal')
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
</script>
    <div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">

    {#if edit == false}
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{lebel}: </h2>
        <p class="text-gold">{#if htmlon.length > 0}{@html htmlon} {:else} {first}{/if}</p><button onclick={()=>edit = true}>
            <EntityIcon kind={kindOf == kindOfb ? "edited" : "edit"} size={15} /></button>
        {#if kindOf != kindOfb && show2 != true}
        <button onclick={()=>show2 = true}><EntityIcon kind="document" size={15} /></button>
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
   <h2 class="text-center text-barbi">{$t('nego.conf.kindOfValue')}: </h2>
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
<option value="total">{$t('nego.conf.oneTimeCost')}</option>
<option value="monthly">{$t('nego.conf.monthly')}</option>
<option value="yearly">{$t('nego.conf.yearly')}</option>
<option value="perUnit">{$t('nego.conf.perUnit')}</option>
<option value="rent">{$t('nego.conf.rent')}</option>
</select>
</div>  
<button onclick={()=>{edit = false
checkAll(kindOf,kindOfb)
}}><EntityIcon kind="done" size={15} /></button>
{/if}
</div>
