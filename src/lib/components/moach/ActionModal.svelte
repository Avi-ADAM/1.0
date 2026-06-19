<script>
  import { isRtl } from '$lib/translations';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { lang } from '$lib/stores/lang.js';
  import Lowding from '$lib/celim/lowding.svelte';
  import tr from '$lib/translations/tr.json';

  // Components for different states
  import PendsM from '$lib/components/prPr/pendsM.svelte';
  import Betaha from '$lib/components/prPr/betaha.svelte';
  import OpenM from '$lib/components/prPr/openM.svelte';
  import Finisin from '$lib/components/prPr/finisin.svelte';
  import ChooseM from '$lib/components/prPr/choosMission.svelte';

  let {
    isOpen = $bindable(false),
    a = $bindable(0),
    who = null,
    projectId,
    projectData
  } = $props();

  const errmsg = tr.ui.errorMsg;

  function closer() {
    isOpen = false;
    a = 0;
  }

  // Extract data from projectData which is derived from store
  let pmiData = $derived(projectData?.missions?.pendms?.data || []);
  let bmiData = $derived(projectData?.missions?.mesimabetahaliches?.data || []);
  let omiData = $derived(projectData?.missions?.openMissions?.data || []);
  let fmiData = $derived(projectData?.missions?.finnished_missions?.data || []);
  let projectUsersCount = $derived(projectData?.base?.user_1s?.data?.length || 1);
  let projectName = $derived(projectData?.base?.projectName || '');

</script>

<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer}>
  <div
    class="flex items-center justify-center min-h-screen p-4"
    dir={$isRtl ? 'rtl' : 'ltr'}
  >
    <DialogContent
      class="bg-barbi border-4 border-gold rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
    >
      <button
        onclick={closer}
        class="absolute top-4 end-4 text-gold hover:text-white transition-colors"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="mt-4">
        {#if a == 1}
          <div class="flex justify-center p-8">
            <Lowding />
          </div>
        {:else if a == 2}
          <div class="flex justify-center p-8">
            <Lowding />
          </div>
        {:else if a == 3}
          <div class="text-center p-8">
            <h1 class="text-xl text-white mb-4">{errmsg[$lang]}</h1>
            <button
              class="px-6 py-2 bg-gold text-barbi rounded-full font-bold hover:bg-white transition-colors"
              onclick={() => (a = 0)}
            >
              {tr.ui.tryAgain[$lang]}
            </button>
          </div>
        {:else if a == 4}
          <PendsM {who} {pmiData} user_1s={projectUsersCount} />
        {:else if a == 5}
          <Betaha {who} {bmiData} />
        {:else if a == 6}
          <OpenM {who} {projectName} {omiData} />
        {:else if a == 7}
          <div class="min-h-[400px] flex flex-col items-stretch">
            <Finisin {who} {fmiData} />
          </div>
        {:else if a === 9}
          <ChooseM {bmiData} taskId={who} onClose={closer} />
        {/if}
      </div>
    </DialogContent>
  </div>
</DialogOverlay>

<style>
  :global(.svelte-accessible-dialog-overlay) {
    background-color: rgba(0, 0, 0, 0.75) !important;
    backdrop-filter: blur(4px);
  }
</style>
