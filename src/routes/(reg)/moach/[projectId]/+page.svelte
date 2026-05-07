<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto(`/moach/${page.params.projectId}/main`, { replaceState: true });
  });
</script>
