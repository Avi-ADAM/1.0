<svelte:head>
  <script bind:this={script} src={url}></script>
</svelte:head>

<script>
  import { onMount } from 'svelte';

  /** @type {{url: any}} */
  let { url, lodaed, error } = $props();
  let script = $state();

  onMount(async () => {
    script.addEventListener('load', () => {
      lodaed()
    })

    script.addEventListener('error', (event) => {
      console.error("something went wrong", event);
      error()
    });
  });
</script>