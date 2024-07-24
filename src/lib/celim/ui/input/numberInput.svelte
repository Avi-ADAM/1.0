
<script>
    import { lang } from '$lib/stores/lang';
    export let name = ""
    export let lebel = {"he":"","en":""}
    export let value = 1
    export let placeholder = 1
    let diff = Math.random()
    export let notMin = true
    $: if (value < 0 && notMin) value = 0
</script>

<form class="max-w-xs mx-auto flex flex-col items-center justify-center align-middle">
    <label for="quantity-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{lebel[$lang]}:</label>
    <div class="relative flex items-center w-[8rem]">
        <button type="button" id="decrement-button-{diff}" on:click={() => value--} class="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none">
            <svg class="md:w-3 w-2  md:h-3 h-2 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h16"/>
            </svg>
        </button>
        <input type="text" id="quantity-input-{diff}" data-input-counter aria-describedby="helper-text-explanation" 
        bind:value={value} class="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" {placeholder} required />
        <button type="button" id="increment-button-{diff}"  on:click={() => value++} class="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none">
            <svg class="md:w-3 w-2  md:h-3 h-2 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16"/>
            </svg>
        </button>
    </div>
</form>
