<script>
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount, onDestroy } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { goto } from '$app/navigation';
  import { socketClient } from '$lib/stores/socketClient';

  let projectId = $derived(page.params.projectId);
  let votesData = $state(null);
  let loading = $state(true);

  async function loadVotes() {
    try {
      const res = await sendToSer({ pid: projectId }, 'getProjectVotes', null, null, false, fetch);
      votesData = res?.data?.project?.data?.attributes;
    } finally {
      loading = false;
    }
  }

  // Realtime: refresh the open-votes list whenever a vote lands for this project.
  const VOTE_TYPES = ['pendmVote', 'pmashVote', 'maapVote', 'decisionVote', 'voteUpdate'];
  let socketUnsub;

  onMount(() => {
    loadVotes();
    socketUnsub = socketClient.onNotification((n) => {
      const type = n?.metadata?.type || n?.data?.type;
      const notifProjectId = n?.actionParams?.projectId || n?.data?.projectId;
      if (
        notifProjectId &&
        String(notifProjectId) === String(projectId) &&
        type &&
        VOTE_TYPES.includes(type)
      ) {
        loadVotes();
      }
    });
  });

  onDestroy(() => socketUnsub?.());

  const i18n = {
    he: { title: 'הצבעות פתוחות', splitVotes: 'הצבעות חלוקה', joinVotes: 'בקשות הצטרפות', decisionVotes: 'החלטות' },
    en: { title: 'Open Votes', splitVotes: 'Split Votes', joinVotes: 'Join Requests', decisionVotes: 'Decisions' },
    ar: { title: 'تصويتات مفتوحة', splitVotes: 'تصويتات التقسيم', joinVotes: 'طلبات الانضمام', decisionVotes: 'قرارات' }
  };
  let t = $derived(i18n[$lang] || i18n.en);
</script>

<svelte:head>
  <title>{page.data.projectBase?.projectName ? `${page.data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'הצבעות' : $lang === 'ar' ? 'التصويتات' : 'Votes'} · 1lev1</title>
</svelte:head>

<div class="votes-page space-y-8">
  <h1 class="text-2xl font-bold text-primary">{t.title}</h1>

  {#if loading}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if votesData}
    <!-- Split Votes -->
    {#if votesData.tosplits?.data?.length > 0}
      <section class="bg-white p-6 rounded-xl shadow-sm">
        <h2 class="text-lg font-bold mb-4">{t.splitVotes}</h2>
        <div class="space-y-4">
          {#each votesData.tosplits.data as split}
            <button onclick={() => goto(`/moach/${projectId}/splits/${split.id}`)}
                    class="w-full text-left p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
              <span>{split.attributes.name}</span>
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">{split.attributes.vots?.length || 0} votes</span>
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Join Requests (nested inside openMissions) -->
    {#if votesData.openMissions?.data?.some(m => m.attributes.asks?.data?.length > 0)}
      <section class="bg-white p-6 rounded-xl shadow-sm">
        <h2 class="text-lg font-bold mb-4">{t.joinVotes}</h2>
        <div class="space-y-4">
          {#each votesData.openMissions.data as mission}
            {#each mission.attributes.asks?.data || [] as ask}
              <div class="p-4 border rounded-lg flex justify-between items-center">
                <span>{t.joinVotes}: {mission.attributes.name}</span>
                <span class="text-xs bg-gray-100 px-2 py-1 rounded">{ask.attributes.vots?.length || 0} votes</span>
              </div>
            {/each}
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
