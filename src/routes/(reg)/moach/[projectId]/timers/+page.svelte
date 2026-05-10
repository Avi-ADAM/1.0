<script>
  import { page } from '$app/state';
  import TimersOfUsers from '$lib/components/prPr/timersOfUsers.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import ActionModal from '$lib/components/moach/ActionModal.svelte';

  const moachStore = getMoachStore();
  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);

  let modalState = $state({
    isOpen: false,
    a: 0,
    who: null
  });

  function handleMission(e) {
    modalState.who = e.id;
    if (e.kind === 'betha') modalState.a = 5;
    modalState.isOpen = true;
  }
</script>

<div class="timers-page">
  <ActionModal
    bind:isOpen={modalState.isOpen}
    bind:a={modalState.a}
    who={modalState.who}
    projectId={projectId}
    projectData={projectData}
  />
  <TimersOfUsers {projectId} onMission={handleMission} />
</div>
