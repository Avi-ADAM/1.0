<script>
  import Kanbanboard from '$lib/components/prPr/Kanbanboard.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  const moachStore = getMoachStore();
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { lang } from '$lib/stores/lang.js';

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

  function handleActClick(act) {
    moachStore.openActModal(act);
  }

  async function handleMissionMoved(event) {
    const { missionId, itemType, destKind } = event;
    if (destKind === 'done' && itemType === 'mission') {
      moachStore.openModal('done', missionId);
      return;
    }
    moachStore.invalidate(projectId, 'missions');
  }

  function handleCardClick(e) {
    moachStore.openModal(e.kind, e.id);
  }
</script>

<svelte:head>
  <title>{page.data.projectBase?.projectName ? `${page.data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'קאנבן' : $lang === 'ar' ? 'كانبان' : 'Kanban'} · 1lev1</title>
</svelte:head>

<div class="kanban-page p-2">
  {#if loading && !missions}
    <div class="flex justify-center p-12">
      <Lowding />
    </div>
  {:else if missions}
    <Kanbanboard
      openMissions={missions.open_missions?.data || []}
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
