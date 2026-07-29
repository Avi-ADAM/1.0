<script>
    /**
     * @typedef {Object} Props
     * @property {string} [name]
     * @property {any} [lebel]
     * @property {string} [lang]
     * @property {boolean} [value]
     * @property {any} [helpText]
     * @property {() => void} [onChange]
     */

    /** @type {Props} */
    let {
        name = "helper-checkbox",
        lebel = '',
        lang = "he",
        value = $bindable(false),
        helpText = null,
        onChange
    } = $props();

    let diff = Math.random()
    function handle (){
        onChange?.()
    }

    let displayLabel = $derived(
        typeof lebel === 'object' && lebel !== null
            ? (lebel[lang] || lebel['he'] || lebel['en'] || '')
            : (lebel ?? '')
    );
    let displayHelp = $derived(
        typeof helpText === 'object' && helpText !== null
            ? (helpText[lang] || helpText['he'] || helpText['en'] || '')
            : (helpText ?? '')
    );
</script>
<div class="flex mb-4">
    <div class="flex items-center h-5">
        <input  bind:checked={value}
        onchange={handle} id="{name+diff}" aria-describedby="helper-checkbox-text" type="checkbox" class="w-4 h-4 text-barbi bg-gray-100 border-gray-300 rounded focus:ring-barbi dark:focus:ring-barbi dark:ring-offset-gold dark:focus:ring-offset-gold focus:ring-2 dark:bg-gold dark:border-gold">
    </div>
    <div class="ms-2 text-sm">
        <label for="{name+diff}" class="font-medium text-lg text-barbi ">{displayLabel}</label>
        {#if helpText != null}
        <p id="helper-checkbox-text" class="text-sm font-normal text-barbi">{displayHelp}</p>
        {/if}
    </div>
</div>
