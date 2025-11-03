<script>
  import { lang } from '$lib/stores/lang.js';
  
  /**
   * @typedef {Object} Props
   * @property {string} label - The label for the comparison (e.g., 'Name:', 'Hours:')
   * @property {string} oldValue - The old/crossed-out value
   * @property {string} newValue - The new/green value
   * @property {string} [oldClass] - Additional CSS classes for old value
   * @property {string} [newClass] - Additional CSS classes for new value
   */

  /** @type {Props} */
  let {
    label,
    oldValue,
    newValue,
    oldClass = '',
    newClass = ''
  } = $props();

  // Arrow direction based on language
  
      let arrow = $derived($lang === 'he' ? '←' : '→');

</script>

<div class="text-sm md:text-base lg:text-lg">
  <span class="font-medium text-blue-700">{label}</span>
  <span class="line-through text-gray-500 {oldClass}">{oldValue}</span>
  <span class="mx-1 text-lg">{arrow}</span>
  <span class="text-green-600 {newClass}">{newValue}</span>
</div>
