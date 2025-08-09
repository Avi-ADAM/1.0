<svelte:head>
  <script bind:this={script} src={url}></script>
</svelte:head>

<script>
  import { onMount } from 'svelte';

  /**
   * @typedef {Object} Props
   * @property {string} url - The URL of the script to load.
   * @property {() => void} [onLoaded] - Callback for when the script is successfully loaded.
   * @property {() => void} [onError] - Callback for when an error occurs during script loading.
   */

  /** @type {Props} */
  let { url, onLoaded, onError } = $props();
  let script = $state();

  onMount(async () => {
    script.addEventListener('load', () => {
      onLoaded?.();
    })

    script.addEventListener('error', (event) => {
      console.error("something went wrong", event);
      onError?.();
    });
  });
</script>
