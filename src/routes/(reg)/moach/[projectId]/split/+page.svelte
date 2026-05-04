<script>
  const moachStore = getMoachStore();
  import Fini from '$lib/components/prPr/fini.svelte';
  import Hach from '$lib/components/prPr/hachcal.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { lang } from '$lib/stores/lang.js';

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

  const i18n = {
    he: { calc: 'מחשבון חלוקה', status: 'מצב חלוקות' },
    en: { calc: 'Split Calculator', status: 'Split Status' },
    ar: { calc: 'حاسبة التقسيم', status: 'حالة التقسيم' }
  };
  let t = $derived(i18n[$lang] || i18n.en);
</script>

<div class="split-page space-y-8">
  {#if loading && !financials}
    <div class="flex justify-center p-12">
      <Lowding />
    </div>
  {:else if financials}
    <section class="bg-white p-6 rounded-xl shadow-sm">
      <h2 class="text-xl font-bold mb-4 text-primary">{t.calc}</h2>
      <Hach
        fmiData={financials.finnished_missions?.data || []}
        rikmashes={financials.rikmashes?.data || []}
        projectUsers={base?.user_1s?.data || []}
        restime={base?.restime}
      />
    </section>

    <section class="bg-white p-6 rounded-xl shadow-sm">
      <h2 class="text-xl font-bold mb-4 text-primary">{t.status}</h2>
      <Fini
        trili={financials.tosplits?.data || []}
        projectUsers={base?.user_1s?.data || []}
      />
    </section>
  {/if}
</div>
