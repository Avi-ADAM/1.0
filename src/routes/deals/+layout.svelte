<script lang="ts">
  import AppHeader from '$lib/components/AppHeader.svelte';

  let { children } = $props();
</script>

<AppHeader />
{@render children?.()}
