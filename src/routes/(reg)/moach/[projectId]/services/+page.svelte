<script>
  import Sheirut from '$lib/components/prPr/sheirut.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';

  const moachStore = getMoachStore();

  let projectId = $derived(page.params.projectId);
  let projectBase = $derived(moachStore.state.projects[projectId]?.base);

  // Note: Tab 6 was commented out in the monolith, but structure is here for restoration.
</script>

<div class="services-page p-8 bg-white rounded-xl shadow-sm">
  {#if projectBase}
    <Sheirut
      sheirutim={projectBase.sheiruts}
      pn={projectBase.projectName}
      restime={projectBase.restime}
      usersNum={projectBase.user_1s?.data?.length || 0}
    />
  {:else}
    <div class="animate-pulse flex space-y-4 flex-col">
      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  {/if}
</div>
