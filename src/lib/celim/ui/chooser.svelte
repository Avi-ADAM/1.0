<script>
     import { createEventDispatcher } from 'svelte';
import {lang} from '$lib/stores/lang.js'    
export let level = []
export let checked = true
export let tr = [], fl = []
 const dispatch = createEventDispatcher();

function ch (){
dispatch("change",{checked:checked})
}
		const uniqueID = Math.floor(Math.random() * 100)
		const uniqueIDD = Math.floor(Math.random() * 100)

</script>

<h2 class="text-barbi ">{level[$lang]}</h2>

<div class="flex items-center justify-center" dir="ltr">
  <label for={`Toggle${uniqueID}+${uniqueIDD}`}  class="inline-flex items-center  p-2 rounded-md cursor-pointer text-gray-800">
    <input id={`Toggle${uniqueID}+${uniqueIDD}`} type="checkbox" class="hidden peer" bind:checked on:change="{ch}">
    <span class="px-4 py-2 rounded-l-md text-barbi peer-checked:text-gold bg-gold peer-checked:bg-barbi no-underline peer-checked:underline font-bold sm:text-2xl">{tr[$lang]}</span>
    <span class="px-4 py-2 rounded-r-md  peer-checked:text-barbi  bg-barbi peer-checked:bg-gold text-gold underline peer-checked:no-underline font-bold sm:text-2xl">{fl[$lang]}</span>
  </label>
  </div>