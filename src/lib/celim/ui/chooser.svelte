<script>
import {lang} from '$lib/stores/lang.js'    
  /** @type {{level?: any, checked?: boolean, tr?: any, fl?: any,change?: any}} */
  let {
    level = [],
    checked = $bindable(true),
    tr = [],
    fl = [],
    change
  } = $props();

		const uniqueID = Math.floor(Math.random() * 100)
		const uniqueIDD = Math.floor(Math.random() * 100)

</script>
{#if level.length >0}
<h2 class="text-barbi ">{level[$lang]}</h2>
{/if}
<div class="flex items-center justify-center" dir="ltr">
  <label for={`Toggle${uniqueID}+${uniqueIDD}`}  class="inline-flex items-center  md:p-2 p-1 rounded-md cursor-pointer text-gray-800">
    <input id={`Toggle${uniqueID}+${uniqueIDD}`} type="checkbox" class="hidden peer " bind:checked onchange={change(checked)}>
    <span class="md:px-3 md:py-2 px-2 py-1 rounded-l-md text-barbi peer-checked:text-gold bg-gold peer-checked:bg-barbi no-underline peer-checked:underline font-bold text-lg md:text-xl lg:text-2xl">{tr[$lang]}</span>
    <span class="md:px-3 md:py-2 px-2 py-1 rounded-r-md  peer-checked:text-barbi  bg-barbi peer-checked:bg-gold text-gold underline peer-checked:no-underline text-lg font-bold md:text-xl lg:text-2xl">{fl[$lang]}</span>
  </label>
  </div>