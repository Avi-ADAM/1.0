<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let name = "helper-checkbox"
    export let lebel = {"he":"","en":""}
    export let lang = "he"	
    export let value = false
    export let helpText = null  

    let diff = Math.random()
    function handle (){
        dispatch('change')
    }
</script>
<div class="flex mb-4">
    <div class="flex items-center h-5">
        <input  bind:checked={value}
        on:change={handle} id="{name+diff}" aria-describedby="helper-checkbox-text" type="checkbox" class="w-4 h-4 text-barbi bg-gray-100 border-gray-300 rounded focus:ring-barbi dark:focus:ring-barbi dark:ring-offset-gold dark:focus:ring-offset-gold focus:ring-2 dark:bg-gold dark:border-gold">
    </div>
    <div class="ms-2 text-sm">
        <label for="{name+diff}" class="font-medium text-barbi ">{lebel[lang]}</label>
        {#if helpText != null}
        <p id="helper-checkbox-text" class="text-xs font-normal text-barbi">{helpText[lang]}</p>
        {/if}
    </div>
</div>
