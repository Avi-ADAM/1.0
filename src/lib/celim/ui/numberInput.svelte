<script>
    /** @type {{value?: number, topLebel?: string, buttomLebel?: string}} */
    let { value = $bindable(0), topLebel = "", buttomLebel = "" ,barbi = false,noNegative = false,noMoreThen = -1} = $props();


  // Function to handle incrementing value
  function increment() {
    if (noMoreThen >= 0) {
      value = Math.min(noMoreThen, value + 1); // Prevent going above the maximum
    } else {
      value++; // Allow incrementing normally
    }
  }
 // Function to handle decrementing value
 function decrement() {
    if (noNegative) {
      value = Math.max(0, value - 1); // Prevent going below zero
    } else {
      value--; // Allow decrementing normally
    }
  }

  // Function to handle input change
  function handleInput(event) {
    let newValue = Number(event.target.value);
    if (noNegative && newValue < 0 || isNaN(newValue)) {
      value = 0; // Reset to zero if negative
    } else {
      value = newValue; // Set to the new value
    }
  }
</script>

<form class="max-w-xs mx-auto flex items-center justify-center flex-col">
    <label for="quantity-input" class="block mb-2 text-sm font-medium {barbi ? "text-barbi" : "text-gray-900 dark:text-white"}">{topLebel}:</label>
    <div class="relative flex items-center max-w-[8rem]">
        <button onclick={decrement} class="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none">
            <svg class="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h16"/>
            </svg>
        </button>
        <input type="text" bind:value={value} on:input={handleInput}   aria-describedby="helper-text-explanation" class="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="999" required />
        <button onclick={increment} class="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none">
            <svg class="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16"/>
            </svg>
        </button>
    </div>
    <p id="helper-text-explanation" class="mt-2 text-sm text-gray-500 dark:text-gray-400">{buttomLebel}</p>
</form>

