<script>
  const moachStore = getMoachStore();
  import Hamatanot from '$lib/components/prPr/hamatanot.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let financials = $derived(projectData?.financials);
  let base = $derived(projectData?.base);

  let loading = $state(false);

  onMount(async () => {
    if (!moachStore.isDataFresh(projectId, 'financials')) {
      loading = true;
      try {
        const res = await sendToSer({ pid: projectId }, 'getProjectFinancials', null, null, false, fetch);
        if (res?.data?.project?.data?.attributes) {
          moachStore.updateProjectData(projectId, 'financials', res.data.project.data.attributes);
        }
      } finally {
        loading = false;
      }
    }
  });
</script>

<div class="sales-page p-4">
  {#if loading && !financials}
    <div class="flex justify-center p-12">
      <Lowding />
    </div>
  {:else if financials}
    <Hamatanot
      trili={financials.tosplits?.data || []}
      fmiData={financials.finnished_missions?.data || []}
      rikmashes={financials.rikmashes?.data || []}
      salee={financials.sales?.data || []}
      restime={base?.restime}
      projectUsers={base?.user_1s?.data || []}
      bmiData={financials.matanotofs?.data || []}
    />
  {/if}
</div>
