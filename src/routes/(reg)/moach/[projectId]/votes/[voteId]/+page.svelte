<script>
  const moachStore = getMoachStore();
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  let projectId = $derived(page.params.projectId);
  let voteId = $derived(page.params.voteId);

  let vote = $state(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await sendToSer({ id: voteId }, 'getVote', null, null, false, fetch);
      vote = res?.data?.vot?.data;
      if (vote) {
        moachStore.updateEntity(projectId, voteId, vote);
      }
    } finally {
      loading = false;
    }
  });

  const i18n = {
    he: { proposal: 'הצעה', reason: 'נימוק', participants: 'מצביעים', actions: 'פעולות', voteYes: 'בעד', voteNo: 'נגד' },
    en: { proposal: 'Proposal', reason: 'Reason', participants: 'Voters', actions: 'Actions', voteYes: 'In Favor', voteNo: 'Against' },
    ar: { proposal: 'اقتراح', reason: 'سبب', participants: 'المصوتون', actions: 'إجراءات', voteYes: 'مؤيد', voteNo: 'معارض' }
  };
  let t = $derived(i18n[$lang] || i18n.en);

  let jsonLd = $derived(vote ? {
    "@context": "https://schema.org",
    "@type": "MoachEntity",
    "entityType": "vote",
    "id": voteId,
    "projectId": projectId,
    "title": vote.attributes.what,
    "status": "open",
    "availableActions": [
      { "id": "vote-yes", "label": t.voteYes, "method": "POST", "actionKey": "voteYes" },
      { "id": "vote-no", "label": t.voteNo, "method": "POST", "actionKey": "voteNo" }
    ]
  } : null);
</script>

<svelte:head>
  {#if vote}
    <title>{vote.attributes.what} — Vote</title>
    <meta name="moach:entity-type" content="vot" />
    <meta name="moach:entity-id" content={voteId} />
    <meta name="moach:project-id" content={projectId} />
    <script type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </script>
  {/if}
</svelte:head>

<div class="vote-entity-page space-y-6">
  {#if loading}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if vote}
    <header id="header" class="bg-white p-6 rounded-xl shadow-sm">
      <nav class="text-sm text-gray-500 mb-2">
        Moach > {projectId} > Votes
      </nav>
      <h1 class="text-2xl font-bold text-gray-900">{vote.attributes.what}</h1>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <section id="description" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">{t.reason}</h2>
          <p class="text-gray-700 whitespace-pre-wrap">{vote.attributes.why || 'No reason provided.'}</p>
        </section>
      </div>

      <div class="space-y-6">
        <section id="participants" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">{t.participants}</h2>
          <div class="flex items-center gap-3">
             <span class="font-medium">{vote.attributes.users_permissions_user?.data?.attributes?.username}</span>
          </div>
        </section>

        <aside id="actions" aria-label="actions" class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">{t.actions}</h2>
          <div class="grid grid-cols-2 gap-4">
            <button class="py-2 px-4 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors">
              {t.voteYes}
            </button>
            <button class="py-2 px-4 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors">
              {t.voteNo}
            </button>
          </div>
        </aside>
      </div>
    </div>
  {:else}
    <div class="p-12 text-center text-gray-500">Vote not found.</div>
  {/if}
</div>
