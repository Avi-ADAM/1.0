<script>
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  const moachStore = getMoachStore();
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  let projectId = $derived(page.params.projectId);
  let actId = $derived(page.params.actId);

  let act = $state(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await sendToSer({ id: actId }, 'getAct', null, null, false, fetch);
      act = res?.data?.act?.data;
      if (act) {
        moachStore.updateEntity(projectId, actId, act);
      }
    } finally {
      loading = false;
    }
  });

  const i18n = {
    he: { assignee: 'מבצע', validator: 'מאשר', actions: 'פעולות', markDone: 'סימון כבוצע', validate: 'אישור פעולה' },
    en: { assignee: 'Assignee', validator: 'Validator', actions: 'Actions', markDone: 'Mark Done', validate: 'Validate' },
    ar: { assignee: 'المكلف', validator: 'الموثק', actions: 'إجراءات', markDone: 'تحديد كمكتمل', validate: 'توثيق' }
  };
  let t = $derived(i18n[$lang] || i18n.en);

  let jsonLd = $derived(act ? {
    "@context": "https://schema.org",
    "@type": "MoachEntity",
    "entityType": "act",
    "id": actId,
    "projectId": projectId,
    "title": act.attributes.shem,
    "status": act.attributes.status === 1 ? "done" : "open",
    "availableActions": [
      { "id": "markActDone", "label": t.markDone, "actionKey": "markActDone" }
    ]
  } : null);
</script>

<svelte:head>
  {#if act}
    <title>{act.attributes.shem} — Act</title>
    <meta name="moach:entity-type" content="act" />
    <meta name="moach:entity-id" content={actId} />
    <meta name="moach:project-id" content={projectId} />
    <script type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </script>
  {/if}
</svelte:head>

<div class="act-entity-page space-y-6">
  {#if loading}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if act}
    <header id="header" class="bg-white p-6 rounded-xl shadow-sm">
      <nav class="text-sm text-gray-500 mb-2">
        Moach > {projectId} > Acts
      </nav>
      <h1 class="text-2xl font-bold text-gray-900">{act.attributes.shem}</h1>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <section id="description" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">Description</h2>
          <p class="text-gray-700">{act.attributes.des || 'No description provided.'}</p>
          {#if act.attributes.link}
            <a href={act.attributes.link} target="_blank" class="mt-4 text-blue-500 hover:underline block">Related Link</a>
          {/if}
        </section>
      </div>

      <div class="space-y-6">
        <section id="participants" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">{t.assignee}</h2>
          <div class="flex items-center gap-3">
             <span class="font-medium">{act.attributes.my?.data?.attributes?.username || 'Unassigned'}</span>
          </div>
        </section>

        <aside id="actions" aria-label="actions" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">{t.actions}</h2>
          <button class="w-full py-2 px-4 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-opacity">
            {t.markDone}
          </button>
        </aside>
      </div>
    </div>
  {:else}
    <div class="p-12 text-center text-gray-500">Act not found.</div>
  {/if}
</div>
