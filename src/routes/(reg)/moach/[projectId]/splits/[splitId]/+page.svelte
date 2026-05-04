<script>
  const moachStore = getMoachStore();
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  let projectId = $derived(page.params.projectId);
  let splitId = $derived(page.params.splitId);

  let split = $state(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await sendToSer({ id: splitId }, 'getProjectFinancials', null, null, false, fetch);
      split = res?.data?.project?.data?.attributes?.tosplits?.data?.find(s => s.id === splitId);
      if (split) {
        moachStore.updateEntity(projectId, splitId, split);
      }
    } finally {
      loading = false;
    }
  });

  const i18n = {
    he: { participants: 'שותפים', actions: 'פעולות', confirm: 'אישור חלוקה', reject: 'התנגדות' },
    en: { participants: 'Partners', actions: 'Actions', confirm: 'Confirm Split', reject: 'Object' },
    ar: { participants: 'شركاء', actions: 'إجراءات', confirm: 'تأكيد التقسيم', reject: 'اعتراض' }
  };
  let t = $derived(i18n[$lang] || i18n.en);

  let jsonLd = $derived(split ? {
    "@context": "https://schema.org",
    "@type": "MoachEntity",
    "entityType": "tosplit",
    "id": splitId,
    "projectId": projectId,
    "title": split.attributes.name,
    "status": split.attributes.finished ? "finished" : "open",
    "availableActions": [
      { "id": "confirmSplit", "label": "Confirm", "actionKey": "confirmSplit" },
      { "id": "rejectSplit", "label": "Reject", "actionKey": "rejectSplit" }
    ]
  } : null);
</script>

<svelte:head>
  {#if split}
    <title>{split.attributes.name} — Split</title>
    <meta name="moach:entity-type" content="tosplit" />
    <meta name="moach:entity-id" content={splitId} />
    <meta name="moach:project-id" content={projectId} />
    <script type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </script>
  {/if}
</svelte:head>

<div class="split-entity-page space-y-6">
  {#if loading}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if split}
    <header id="header" class="bg-white p-6 rounded-xl shadow-sm">
      <nav class="text-sm text-gray-500 mb-2">
        Moach > {projectId} > Splits
      </nav>
      <h1 class="text-2xl font-bold text-gray-900">{split.attributes.name}</h1>
      <div class="mt-2 text-primary font-bold">{split.attributes.prectentage}% Split</div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <section id="description" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">Calculated Shares</h2>
          <div class="space-y-3">
            {#each split.attributes.halukas?.data || [] as haluka}
              <div class="flex justify-between p-3 bg-gray-50 rounded">
                <span>{haluka.attributes.userrecive?.data?.attributes?.username}</span>
                <span class="font-bold">{haluka.attributes.amount}</span>
              </div>
            {/each}
          </div>
        </section>
      </div>

      <div class="space-y-6">
        <aside id="actions" aria-label="actions" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">{t.actions}</h2>
          <div class="space-y-3">
            <button class="w-full py-2 px-4 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-opacity">
              {t.confirm}
            </button>
            <button class="w-full py-2 px-4 border border-red-500 text-red-500 rounded-lg font-bold hover:bg-red-50 transition-colors">
              {t.reject}
            </button>
          </div>
        </aside>
      </div>
    </div>
  {:else}
    <div class="p-12 text-center text-gray-500">Split not found.</div>
  {/if}
</div>
