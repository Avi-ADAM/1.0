<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import EditProjectDetails from '$lib/components/prPr/EditProjectDetails.svelte';

  let { data } = $props();

  let projectBase = $derived(data.projectBase);
  let projectId = $derived(page.params.projectId);
  let memberCount = $derived(data.memberCount ?? 1);

  function close() {
    goto(`/moach/${projectId}/main`);
  }
</script>

<div class="max-w-4xl mx-auto py-8">
  {#if projectBase}
    <EditProjectDetails
      {projectBase}
      {projectId}
      {memberCount}
      onSuccess={close}
      onCancel={close}
    />
  {:else}
    <div class="flex items-center justify-center h-40">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {/if}
</div>
