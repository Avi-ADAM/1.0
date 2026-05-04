<script>
  const moachStore = getMoachStore();
  import Kanbanboard from '$lib/components/prPr/Kanbanboard.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let missions = $derived(projectData?.missions);
  let base = $derived(projectData?.base);

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

  function handleCardClick(e) {
    console.log('Card clicked', e);
  }

  import ActionModal from '$lib/components/moach/ActionModal.svelte';

  function handleActClick(act) {
    console.log('Act clicked', act);
    modalState.who = act.id;
    modalState.a = 9; // ChooseM / Details
    modalState.isOpen = true;
  }

  let modalState = $state({
    isOpen: false,
    a: 0,
    who: null
  });

  async function handleMissionMoved(event) {
    const { missionId, itemType, destKind } = event;
    if (destKind === 'done' && itemType === 'mission') {
      modalState.who = missionId;
      modalState.a = 7; // Finisin
      modalState.isOpen = true;
      return;
    }
    // Invalidate missions cache on move to trigger re-fetch if needed
    moachStore.invalidate(projectId, 'missions');
  }

  function handleCardClick(e) {
    modalState.who = e.id;
    if (e.kind === 'pendm') modalState.a = 4;
    else if (e.kind === 'betha') modalState.a = 5;
    else if (e.kind === 'openM') modalState.a = 6;
    else if (e.kind === 'done') modalState.a = 7;
    else if (e.kind === 'assign') modalState.a = 9;
    modalState.isOpen = true;
  }
</script>

<div class="kanban-page p-2">
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
    <Kanbanboard
      openMissions={missions.openMissions?.data || []}
      pendingMissions={missions.pendms?.data || []}
      inProgressMissions={missions.mesimabetahaliches?.data || []}
      finishedMissions={missions.finnished_missions?.data || []}
      acts={base?.acts?.data ?? []}
      onCardClick={handleCardClick}
      onActClick={handleActClick}
      onMissionMoved={handleMissionMoved}
    />
  {/if}
</div>
