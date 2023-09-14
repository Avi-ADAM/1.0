<script>
export let state = 2 // original and edit, 3 is original second and edit
export let date;
import SveltyPicker from 'svelty-picker'

export let lebel = {"he":"עריכה", "en": "edit"}
import tr from '$lib/translations/tr.json'
  import Close from '$lib/celim/close.svelte';
import { lang } from '$lib/stores/lang.js'
  import { onMount } from 'svelte';
  let htmlon = ``
    export let long = false
    const und = {"he":"לא הוגדר","en":"undefined"}
onMount(()=>{
    if (date == dateb){
        if(date == undefined || "undefined"){
            htmlon = und[$lang]
        }else{
                htmlon = date

        }
    } else{
    checkAll(date,dateb)
    }
})
let edit = false
let show2 = false
export let dateb = date
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
        htmlon += `${al} `
    } else{
             if(al != undefined){
        htmlon+= `<span class="line-through text-barbi">${al}</span> `
        }
        htmlon += `<span class="text-wow">${bl} </span>`
    }
    }
 
    </script>
    <div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">

    {#if edit == false}
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{lebel[$lang]}: </h2>
        <p class="text-gold">{@html htmlon}</p><button on:click={()=>edit = true}>
            {#if date == dateb}🖍️{:else}✏️{/if}</button>
        {#if date != dateb && show2 != true}
        <button on:click={()=>show2 = true}>📑</button>
        {:else if show2 == true}
        <div class="flex flex-col align-middle justify-center ">
        <button on:click={()=>show2 = false}><Close/></button>
        <small class:text-right={$lang == "he"}>{tr?.nego.original[$lang]}:</small>
        <p>{date}</p>
        <small class:text-right={$lang == "he"} class="text-gold">{tr?.nego.sugestion[$lang]}:</small>
        <p class="text-gold">{dateb}</p>
        </div>
        {/if}
        </div>
{:else}

<div dir="rtl" class='textinput max-w-sm mx-auto'>
    <SveltyPicker inputClasses="form-control" format="hh:ii dd/mm/yyyy " bind:value={dateb}></SveltyPicker>
  <label for="des" class='label' >{lebel[$lang]}</label>
</div><button on:click={()=>{edit = false
checkAll(date,dateb)
}}>✅</button>
{/if}
</div>
