<script>
  import { toast } from 'svelte-sonner';
  import { lang } from '$lib/stores/lang.js';

  /**
   * @typedef {Object} Props
   * @property {number} [value]
   * @property {string} [topLebel]
   * @property {string} [buttomLebel]
   * @property {boolean} [barbi]
   * @property {boolean} [noNegative]
   * @property {any} [noMoreThen]
   */

  /** @type {Props} */
  let {
    value = $bindable(0),
    topLebel = '',
    buttomLebel = '',
    barbi = false,
    noNegative = false,
    noMoreThen = -1
  } = $props();

  // Localization for toast messages
  const messages = {
    he: {
      maxQuantityReached: 'הגעת לכמות המקסימלית הזמינה',
      minQuantityReached: 'הגעת לכמות המינימלית',
      cannotExceedAvailable: 'לא ניתן לחרוג מהכמות הזמינה: {max}',
      cannotGoBelowZero: 'לא ניתן לרדת מתחת לאפס'
    },
    en: {
      maxQuantityReached: 'Maximum available quantity reached',
      minQuantityReached: 'Minimum quantity reached',
      cannotExceedAvailable: 'Cannot exceed available quantity: {max}',
      cannotGoBelowZero: 'Cannot go below zero'
    }
  };

  // Reactive variables for button states
  let isIncrementDisabled = $derived(noMoreThen >= 0 && value >= noMoreThen);
  let isDecrementDisabled = $derived(noNegative && value <= 0);
  let currentMessages = $derived(messages[$lang] || messages.he);

  // Function to handle incrementing value
  function increment() {
    if (noMoreThen >= 0 && value >= noMoreThen) {
      // Show toast when trying to exceed maximum
      toast.warning(
        currentMessages.cannotExceedAvailable.replace(
          '{max}',
          noMoreThen.toString()
        )
      );
      return;
    }

    if (noMoreThen >= 0) {
      value = Math.min(noMoreThen, value + 1);
    } else {
      value++;
    }
  }

  // Function to handle decrementing value
  function decrement() {
    if (noNegative && value <= 0) {
      // Show toast when trying to go below minimum
      toast.warning(currentMessages.cannotGoBelowZero);
      return;
    }

    if (noNegative) {
      value = Math.max(0, value - 1);
    } else {
      value--;
    }
  }

  // Function to handle input change
  function handleInput(event) {
    let newValue = Number(event.target.value);
    if ((noNegative && newValue < 0) || isNaN(newValue)) {
      value = 0; // Reset to zero if negative
    } else {
      value = newValue; // Set to the new value
    }
  }
</script>

<form class="max-w-xs mx-auto flex items-center justify-center flex-col">
  <label
    for="quantity-input"
    class="block mb-2 text-sm font-medium {barbi
      ? 'text-barbi'
      : 'text-gray-900 dark:text-white'}">{topLebel}:</label
  >
  <div class="relative flex items-center max-w-[8rem]">
    <button
      type="button"
      onclick={decrement}
      disabled={isDecrementDisabled}
      aria-label="Decrease value"
      class="border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-2 focus:outline-none transition-all duration-200
                 {isDecrementDisabled
        ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-700'
        : 'bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 focus:ring-gray-100 dark:focus:ring-gray-700'}"
    >
      <svg
        class="w-3 h-3 {isDecrementDisabled
          ? 'text-gray-400 dark:text-gray-600'
          : 'text-gray-900 dark:text-white'}"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 18 2"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M1 1h16"
        />
      </svg>
    </button>
    <input
      type="text"
      bind:value
      oninput={handleInput}
      aria-describedby="helper-text-explanation"
      class="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      placeholder="999"
      required
    />
    <button
      type="button"
      onclick={increment}
      disabled={isIncrementDisabled}
      aria-label="Increase value"
      class="border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-2 focus:outline-none transition-all duration-200
                 {isIncrementDisabled
        ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-700'
        : 'bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 focus:ring-gray-100 dark:focus:ring-gray-700'}"
    >
      <svg
        class="w-3 h-3 {isIncrementDisabled
          ? 'text-gray-400 dark:text-gray-600'
          : 'text-gray-900 dark:text-white'}"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 18 18"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 1v16M1 9h16"
        />
      </svg>
    </button>
  </div>
  <p
    id="helper-text-explanation"
    class="mt-2 text-sm text-gray-500 dark:text-gray-400"
  >
    {buttomLebel}
  </p>
</form>
