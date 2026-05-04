<script>
  const moachStore = getMoachStore();
  import ActsTable from '$lib/components/prPr/tasks/actsTable.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import ActionModal from '$lib/components/moach/ActionModal.svelte';
  import { onMount } from 'svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let acts = $derived(projectData?.base?.acts?.data || []);

  let modalState = $state({
    isOpen: false,
    a: 0,
    who: null
  });

  onMount(async () => {
    if (!moachStore.isDataFresh(projectId, 'missions')) {
      try {
        const res = await sendToSer({ pid: projectId }, 'getProjectMissions', null, null, false, fetch);
        if (res?.data?.project?.data?.attributes) {
          moachStore.updateProjectData(projectId, 'missions', res.data.project.data.attributes);
        }
      } catch (e) {
        console.error('Failed to load missions for modal context', e);
      }
    }
  });

  function handleTaskClick(e) {
    modalState.who = e.id;
    if (e.kind === 'pendm') modalState.a = 4;
    else if (e.kind === 'betha') modalState.a = 5;
    else if (e.kind === 'openM') modalState.a = 6;
    else if (e.kind === 'done') modalState.a = 7;
    else if (e.kind === 'assign') modalState.a = 9;
    modalState.isOpen = true;
  }
</script>

<div class="acts-page">
  <ActionModal
    bind:isOpen={modalState.isOpen}
    bind:a={modalState.a}
    who={modalState.who}
    projectId={projectId}
    projectData={projectData}
  />
  <ActsTable {acts} onTaskClick={handleTaskClick} />
</div>
