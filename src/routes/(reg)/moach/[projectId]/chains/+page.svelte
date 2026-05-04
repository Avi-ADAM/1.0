<script>
  const moachStore = getMoachStore();
  import ProcessChainView from '$lib/components/process/ProcessChainView.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { lang } from '$lib/stores/lang.js';

  let { data } = $props();

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let missions = $derived(projectData?.missions);
  let financials = $derived(projectData?.financials);
  let base = $derived(projectData?.base);

  let loading = $state(false);

  onMount(async () => {
    const promises = [];
    if (!moachStore.isDataFresh(projectId, 'missions')) {
      promises.push(sendToSer({ pid: projectId }, 'getProjectMissions', null, null, false, fetch).then(res => {
        if (res?.data?.project?.data?.attributes) moachStore.updateProjectData(projectId, 'missions', res.data.project.data.attributes);
      }));
    }
    if (!moachStore.isDataFresh(projectId, 'financials')) {
      promises.push(sendToSer({ pid: projectId }, 'getProjectFinancials', null, null, false, fetch).then(res => {
        if (res?.data?.project?.data?.attributes) moachStore.updateProjectData(projectId, 'financials', res.data.project.data.attributes);
      }));
    }

    if (promises.length > 0) {
      loading = true;
      await Promise.all(promises);
      loading = false;
    }
  });

  import ActionModal from '$lib/components/moach/ActionModal.svelte';

  let modalState = $state({
    isOpen: false,
    a: 0,
    who: null
  });

  function handleOpenModal(e) {
    modalState.who = e.id;
    if (e.kind === 'pendm') modalState.a = 4;
    else if (e.kind === 'betha') modalState.a = 5;
    else if (e.kind === 'openM') modalState.a = 6;
    else if (e.kind === 'done') modalState.a = 7;
    modalState.isOpen = true;
  }

  function handleOpenActModal(act) {
    modalState.who = act.id;
    modalState.a = 9;
    modalState.isOpen = true;
  }

  function handleOpenChat(id) {
    console.log('Open chat', id);
    // Future chat integration
  }
</script>

<div class="chains-page p-4">
  <ActionModal
    bind:isOpen={modalState.isOpen}
    bind:a={modalState.a}
    who={modalState.who}
    projectId={projectId}
    projectData={projectData}
  />

  {#if loading && (!missions || !financials)}
    <div class="flex justify-center p-12">
      <Lowding />
    </div>
  {:else if missions && financials}
    <ProcessChainView
      pmiData={missions.pendms?.data || []}
      omiData={missions.open_missions?.data || []}
      bmiData={missions.mesimabetahaliches?.data || []}
      fmiData={financials.finnished_missions?.data || []}
      opmash={financials.rikmashes?.data || []}
      rikmashes={financials.rikmashes?.data || []}
      acts={base?.acts?.data ?? []}
      {projectId}
      projectUsers={base?.user_1s?.data || []}
      onOpenModal={handleOpenModal}
      onOpenActModal={handleOpenActModal}
      onOpenChat={handleOpenChat}
      lang={$lang}
    />
  {/if}
</div>
