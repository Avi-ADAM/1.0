<script>
export let state = 2 // original and edit, 3 is original second and edit
export let kindOf;

export let lebel = {"he":"עריכה", "en": "edit"}
import tr from '$lib/translations/tr.json'
  import Close from '$lib/celim/close.svelte';
import { lang } from '$lib/stores/lang.js'
  import { onMount } from 'svelte';
  let htmlon = ``
  export let kindOfb = kindOf

    export let long = false
    const und = {"he":"לא הוגדר","en":"undefined"}
onMount(()=>{
    console.log(kindOf,kindOfb,tr?.mash[kindOf][$lang])
    if (kindOf == kindOfb){
        if(kindOf == undefined ||kindOf == "undefined"){
            htmlon = und[$lang]
        }else{
            //htmlon = tr?.mash[kindOf][$lang]
        }
    } else{
        console.log("HEE")
    checkAll(kindOf,kindOfb)
    }
})
let edit = false
let show2 = false
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
    let t = 0
    htmlon = ``

    if (check(al, bl) == true){
        htmlon += `${tr?.mash[al][$lang]} `
    } else{
             if(al != undefined){
        htmlon+= `<span class="line-through text-barbi">${tr?.mash[al][$lang]}</span> `
        }
        htmlon += `<span class="text-wow">${tr?.mash[bl][$lang]} </span>`
    }
    }
    $: first = tr?.mash[kindOf][$lang]
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
        <p class="text-gold">{#if htmlon.length > 0}{@html htmlon} {:else} {first}{/if}</p><button on:click={()=>edit = true}>
            {#if kindOf == kindOfb}🖍️{:else}✏️{/if}</button>
        {#if kindOf != kindOfb && show2 != true}
        <button on:click={()=>show2 = true}>📑</button>
        {:else if show2 == true}
        <div class="flex flex-col align-middle justify-center ">
        <button on:click={()=>show2 = false}><Close/></button>
        <small class:text-right={$lang == "he"}>{tr?.nego.original[$lang]}:</small>
        <p>{tr?.mash[kindOf][$lang]}</p>
        <small class:text-right={$lang == "he"} class="text-gold">{tr?.nego.sugestion[$lang]}:</small>
        <p class="text-gold">{tr?.mash[kindOfb][$lang]}</p>
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
<button on:click={()=>{edit = false
checkAll(kindOf,kindOfb)
}}>✅</button>
{/if}
</div>
