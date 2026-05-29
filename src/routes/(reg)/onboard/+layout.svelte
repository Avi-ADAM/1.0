<script>
  import { onMount, onDestroy } from 'svelte';
  import { showFoot } from '$lib/stores/showFoot.js';
  let { children } = $props();
  onMount(() => showFoot.set(false));
  onDestroy(() => showFoot.set(true));
</script>

{@render children?.()}
