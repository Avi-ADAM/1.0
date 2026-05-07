<script>
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import Gantt from '$lib/components/prPr/gantt/gant.svelte';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  const moachStore = getMoachStore();
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
</script>

<div class="gantt-page p-4 bg-white rounded-xl shadow-sm overflow-hidden">
  {#if loading && !missions}
    <div class="flex justify-center p-12">
      <Lowding />
    </div>
  {:else if missions}
    <Gantt
      bmiData={missions.mesimabetahaliches?.data || []}
      pmiData={missions.pendms?.data || []}
      omiData={missions.open_missions?.data || []}
      fmiData={missions.finnished_missions?.data || []}
    />
  {/if}
</div>
