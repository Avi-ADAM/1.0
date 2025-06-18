<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    /**
     * @typedef {Object} Props
     * @property {string} [name]
     * @property {any} [lebel]
     * @property {string} [lang]
     * @property {boolean} [value]
     * @property {any} [helpText]
     */

    /** @type {Props} */
    let {
        name = "helper-checkbox",
        lebel = {"he":"","en":""},
        lang = "he",
        value = $bindable(false),
        helpText = null
    } = $props();

    let diff = Math.random()
    function handle (){
        dispatch('change')
    }
</script>
<div class="flex mb-4">
    <div class="flex items-center h-5">
        <input  bind:checked={value}
        onchange={handle} id="{name+diff}" aria-describedby="helper-checkbox-text" type="checkbox" class="w-4 h-4 text-barbi bg-gray-100 border-gray-300 rounded focus:ring-barbi dark:focus:ring-barbi dark:ring-offset-gold dark:focus:ring-offset-gold focus:ring-2 dark:bg-gold dark:border-gold">
    </div>
    <div class="ms-2 text-sm">
        <label for="{name+diff}" class="font-medium text-barbi ">{lebel[lang]}</label>
        {#if helpText != null}
        <p id="helper-checkbox-text" class="text-xs font-normal text-barbi">{helpText[lang]}</p>
        {/if}
    </div>
</div>
