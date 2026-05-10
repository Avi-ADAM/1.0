<script>
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import ProcessBoard from '$lib/components/process/ProcessBoard.svelte';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { goto } from '$app/navigation';

  const moachStore = getMoachStore();
  let projectId = $derived(page.params.projectId);

  let processes = $state([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await sendToSer({ pid: projectId }, 'getProjectProcesses', null, null, false, fetch);
      processes = res?.data?.project?.data?.attributes?.processes?.data || [];
    } finally {
      loading = false;
    }
  });

  const i18n = {
    he: { title: 'תהליכים', empty: 'אין תהליכים בפרויקט זה עדיין' },
    en: { title: 'Processes', empty: 'No processes in this project yet' },
    ar: { title: 'العمليات', empty: 'لا توجد عمليات في هذا المشروع بعد' }
  };
  let t = $derived(i18n[$lang] || i18n.en);
</script>

<div class="processes-page space-y-6">
  <h1 class="text-2xl font-bold text-primary">{t.title}</h1>

  {#if loading}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if processes.length > 0}
    <ProcessBoard
      {processes}
      selectable={true}
      onSelect={(p) => goto(`/moach/${projectId}/processes/${p.id}`)}
    />
  {:else}
    <div class="p-12 text-center text-gray-400 italic">{t.empty}</div>
  {/if}
</div>
