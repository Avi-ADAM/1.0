<script>
  import Bethas from '$lib/components/prPr/bethas.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { untrack } from 'svelte';

  let { data } = $props();
  const moachStore = getMoachStore();

  let projectId = $derived(page.params.projectId);

  // Seed store from server data whenever fresh data arrives
  $effect(() => {
    if (data.missions && projectId) {
      untrack(() => moachStore.updateProjectData(projectId, 'missions', data.missions));
    }
  });

  let projectData = $derived(moachStore.state.projects[projectId]);
  let missions = $derived(projectData?.missions ?? data.missions);

  let modalState = $state({ isOpen: false, a: 0, who: null });

  function handleChat(id) {
    modalState.who = id;
    modalState.a = 8;
    modalState.isOpen = true;
  }

  function handleActClick(act) {
    modalState.who = act.id ?? act;
    modalState.a = 9;
    modalState.isOpen = true;
  }
</script>

<div
  class="progress-page rounded-lg overflow-auto"
  style="margin: 20px auto; background: linear-gradient(to right, #25c481, #25b7c4);"
>
  {#if missions}
    <Bethas
      bmiData={missions.mesimabetahaliches?.data ?? []}
      onChat={handleChat}
      onActClick={handleActClick}
    />
  {:else}
    <div class="flex justify-center p-12 text-white">טוען...</div>
  {/if}
</div>
