<script>
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import Betaha from '$lib/components/prPr/betaha.svelte';
  import PendsM from '$lib/components/prPr/pendsM.svelte';
  import NewOpn from '$lib/components/prPr/newOpn.svelte';
  import Finisin from '$lib/components/prPr/finisin.svelte';
  import ChooseM from '$lib/components/prPr/tasks/chooseM.svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  /**
   * @typedef {Object} Props
   * @property {{ open: boolean, kind: string|null, id: any }} modal
   * @property {string} projectId
   * @property {string} [projectName]
   * @property {any} [missions]
   * @property {() => void} onClose
   * @property {(data: any) => void} onMissionsLoaded
   */

  /** @type {Props} */
  let { modal, projectId, projectName = '', missions, onClose, onMissionsLoaded } = $props();

  let loading = $state(false);

  const kindToDataKey = {
    betha: 'mesimabetahaliches',
    pendm: 'pendms',
    openM: 'open_missions',
    done:  'finnished_missions'
  };

  $effect(() => {
    if (modal.open && !missions && projectId) {
      loading = true;
      sendToSer({ pid: projectId }, 'getProjectMissions', null, null, false, fetch)
        .then((res) => {
          if (res?.data?.project?.data?.attributes) {
            onMissionsLoaded(res.data.project.data.attributes);
          }
        })
        .finally(() => { loading = false; });
    }
  });

  function getDataArray() {
    if (!missions) return [];
    const key = kindToDataKey[modal.kind];
    return missions[key]?.data || [];
  }

  function onKeydown(e) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if modal.open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[700] flex items-center justify-center p-2 md:p-4"
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={onClose}></div>

    <div class="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-auto my-auto rounded-3xl bg-barbi border-4 border-gold shadow-2xl">
      <button
        onclick={onClose}
        class="absolute top-4 end-4 z-20 text-gold hover:text-white transition-colors"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="p-2 md:p-6 mt-6 md:mt-2">
        {#if loading}
          <div class="flex justify-center py-12">
            <Lowding />
          </div>
        {:else if modal.kind === 'betha'}
          <Betaha who={modal.id} bmiData={getDataArray()} />
        {:else if modal.kind === 'pendm'}
          <PendsM who={modal.id} pmiData={getDataArray()} />
        {:else if modal.kind === 'openM'}
          <NewOpn who={modal.id} omiData={getDataArray()} {projectName} />
        {:else if modal.kind === 'done'}
          <Finisin who={modal.id} fmiData={getDataArray()} />
        {:else if modal.kind === 'assign'}
          <ChooseM
            taskId={modal.id}
            bmiData={missions?.mesimabetahaliches?.data || []}
            onClose={onClose}
          />
        {/if}
      </div>
    </div>
  </div>
{/if}
