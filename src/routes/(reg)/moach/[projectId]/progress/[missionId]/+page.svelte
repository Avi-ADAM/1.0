<script>
  const moachStore = getMoachStore();
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';

  let projectId = $derived(page.params.projectId);
  let missionId = $derived(page.params.missionId);

  let mission = $state(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await sendToSer({ id: missionId }, 'getMissionInProgress', null, null, false, fetch);
      mission = res?.data?.mesimabetahalich?.data;
      if (mission) {
        moachStore.updateEntity(projectId, missionId, mission);
      }
    } finally {
      loading = false;
    }
  });

  const i18n = {
    he: { participants: 'משתתפים', discussion: 'דיון', actions: 'פעולות', status: 'סטטוס' },
    en: { participants: 'Participants', discussion: 'Discussion', actions: 'Actions', status: 'Status' },
    ar: { participants: 'المشاركون', discussion: 'مناقشة', actions: 'إجراءات', status: 'حالة' }
  };
  let t = $derived(i18n[$lang] || i18n.en);

  let jsonLd = $derived(mission ? {
    "@context": "https://schema.org",
    "@type": "MoachEntity",
    "entityType": "mesimabetahalich",
    "id": missionId,
    "projectId": projectId,
    "title": mission.attributes.name,
    "status": mission.attributes.status,
    "availableActions": [
      { "id": "markFinished", "label": "Mark Finished", "actionKey": "markFinished" }
    ]
  } : null);
</script>

<svelte:head>
  {#if mission}
    <title>{mission.attributes.name} — Moach</title>
    <meta name="moach:entity-type" content="mesimabetahalich" />
    <meta name="moach:entity-id" content={missionId} />
    <meta name="moach:project-id" content={projectId} />
    <script type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </script>
  {/if}
</svelte:head>

<div class="mission-entity-page space-y-6">
  {#if loading}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if mission}
    <header id="header" class="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
      <div>
        <nav class="text-sm text-gray-500 mb-2">
          Moach > {projectId} > Progress
        </nav>
        <h1 class="text-2xl font-bold text-gray-900">{mission.attributes.name}</h1>
      </div>
      <div class="px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
        {mission.attributes.status}
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <section id="description" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">Description</h2>
          <RichText editable={false} outpot={mission.attributes.descrip} />
        </section>

        <section id="discussion" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">{t.discussion}</h2>
          <div class="p-8 text-center text-gray-400 italic">
            Forum integration coming soon...
          </div>
        </section>
      </div>

      <div class="space-y-6">
        <section id="participants" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">{t.participants}</h2>
          <div class="flex items-center gap-3">
            <img
              class="w-10 h-10 rounded-full"
              src={mission.attributes.users_permissions_user?.data?.attributes?.profilePic?.data?.attributes?.url || 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
              alt=""
            />
            <span class="font-medium">{mission.attributes.users_permissions_user?.data?.attributes?.username}</span>
          </div>
        </section>

        <aside id="actions" aria-label="actions" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">{t.actions}</h2>
          <button class="w-full py-2 px-4 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-opacity">
            Mark as Finished
          </button>
        </aside>
      </div>
    </div>
  {:else}
    <div class="p-12 text-center text-gray-500">Mission not found.</div>
  {/if}
</div>
