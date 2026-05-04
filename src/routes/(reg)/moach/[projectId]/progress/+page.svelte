<script>
  const moachStore = getMoachStore();
  import Bethas from '$lib/components/prPr/bethas.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let missions = $derived(projectData?.missions);

  let loading = $state(false);

  onMount(async () => {
    if (!moachStore.isDataFresh(projectId, 'missions')) {
      loading = true;
      try {
        const res = await sendToSer({ pid: projectId }, 'getProjectMissions', null, null, false, fetch);
        if (res?.data?.project?.data?.attributes) {
          moachStore.updateProjectData(projectId, 'missions', res.data.project.data.attributes);
        }
      } finally {
        loading = false;
      }
    }
  });

  import ActionModal from '$lib/components/moach/ActionModal.svelte';

  function handleChat(id) {
    console.log('Open chat', id);
    modalState.who = id;
    modalState.a = 8; // Diun (Not yet fully ported but reserving)
    modalState.isOpen = true;
  }

  function handleActClick(act) {
    console.log('Act clicked', act);
    modalState.who = act.id;
    modalState.a = 9; // ChooseM
    modalState.isOpen = true;
  }

  let modalState = $state({
    isOpen: false,
    a: 0,
    who: null
  });
</script>

<div class="progress-page rounded-lg overflow-auto"
     style="margin: 20px auto; background: linear-gradient(to right, #25c481, #25b7c4);">
  <ActionModal
    bind:isOpen={modalState.isOpen}
    bind:a={modalState.a}
    who={modalState.who}
    projectId={projectId}
    projectData={projectData}
  />

  {#if loading && !missions}
    <div class="flex justify-center p-12">
      <Lowding />
    </div>
  {:else if missions}
    <Bethas
      bmiData={missions.mesimabetahaliches?.data || []}
      onChat={handleChat}
      onActClick={handleActClick}
    />
  {/if}
</div>
