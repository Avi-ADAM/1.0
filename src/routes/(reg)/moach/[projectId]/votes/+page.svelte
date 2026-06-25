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
  // Open proposals the project still has to vote on (resources + missions).
  // Each links to its focused, deep-linkable page; the heavy interactive card
  // lives there, keeping this tab a light, scannable index.
  let pendms = $state([]);
  let pmashes = $state([]);
  let loading = $state(true);

  function voteCount(item) {
    return item?.attributes?.users?.length || 0;
  }

  async function loadVotes() {
    try {
      const [votesRes, missionsRes] = await Promise.all([
        sendToSer({ pid: projectId }, 'getProjectVotes', null, null, false, fetch),
        sendToSer({ pid: projectId }, 'getProjectMissions', null, null, false, fetch)
      ]);
      votesData = votesRes?.data?.project?.data?.attributes;
      const m = missionsRes?.data?.project?.data?.attributes;
      pendms = m?.pendms?.data ?? [];
      pmashes = m?.pmashes?.data ?? [];
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
    he: { title: 'הצבעות פתוחות', splitVotes: 'הצבעות חלוקה', joinVotes: 'בקשות הצטרפות', decisionVotes: 'החלטות', resourceProposals: 'הצעות משאב', missionProposals: 'הצעות משימה', votes: 'הצבעות', toVote: 'להצבעה', noneOpen: 'אין הצבעות פתוחות כרגע 🎉' },
    en: { title: 'Open Votes', splitVotes: 'Split Votes', joinVotes: 'Join Requests', decisionVotes: 'Decisions', resourceProposals: 'Resource proposals', missionProposals: 'Mission proposals', votes: 'votes', toVote: 'Vote', noneOpen: 'No open votes right now 🎉' },
    ar: { title: 'تصويتات مفتوحة', splitVotes: 'تصويتات التقسيم', joinVotes: 'طلبات الانضمام', decisionVotes: 'قرارات', resourceProposals: 'مقترحات الموارد', missionProposals: 'مقترحات المهام', votes: 'أصوات', toVote: 'تصويت', noneOpen: 'لا توجد تصويتات مفتوحة حالياً 🎉' }
  };
  let t = $derived(i18n[$lang] || i18n.en);

  // Join requests live nested inside the open missions (field is `open_missions`
  // in the query; older code referenced `openMissions`, so accept both).
  let joinList = $derived(
    (votesData?.open_missions?.data ?? votesData?.openMissions?.data ?? []).flatMap(
      (m) => m.attributes?.asks?.data ?? []
    )
  );

  // Overview: count of open items awaiting a vote, per category. Each tile
  // jumps to its section below, where every item links to its focused page.
  let summary = $derived([
    { key: 'pmash', label: t.resourceProposals, count: pmashes.length, anchor: '#sec-pmash', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'pendm', label: t.missionProposals, count: pendms.length, anchor: '#sec-pendm', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { key: 'split', label: t.splitVotes, count: votesData?.tosplits?.data?.length ?? 0, anchor: '#sec-split', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'join', label: t.joinVotes, count: joinList.length, anchor: '#sec-join', color: 'bg-amber-50 text-amber-700 border-amber-200' }
  ]);
  let totalOpen = $derived(summary.reduce((s, c) => s + c.count, 0));
</script>

<svelte:head>
  <title>{page.data.projectBase?.projectName ? `${page.data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'הצבעות' : $lang === 'ar' ? 'التصويتات' : 'Votes'} · 1lev1</title>
</svelte:head>

<div class="votes-page space-y-8">
  <h1 class="text-2xl font-bold text-primary">{t.title}</h1>

  {#if loading}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else}
    <!-- Overview: counts per category, each jumps to its section -->
    {#if totalOpen > 0}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {#each summary as cat (cat.key)}
          <a
            href={cat.count > 0 ? cat.anchor : undefined}
            class="flex flex-col items-center justify-center p-4 rounded-xl border {cat.color} {cat.count > 0 ? 'hover:shadow-md transition-shadow' : 'opacity-40 pointer-events-none'}"
          >
            <span class="text-3xl font-extrabold leading-none">{cat.count}</span>
            <span class="text-xs font-medium mt-1 text-center">{cat.label}</span>
          </a>
        {/each}
      </div>
    {:else}
      <p class="text-center text-gray-400 py-8">{t.noneOpen}</p>
    {/if}

    <!-- Resource proposals (pmash) -->
    {#if pmashes.length > 0}
      <section id="sec-pmash" class="bg-white p-6 rounded-xl shadow-sm scroll-mt-24">
        <h2 class="text-lg font-bold mb-4">{t.resourceProposals}</h2>
        <div class="space-y-4">
          {#each pmashes as pmash (pmash.id)}
            <button
              onclick={() => goto(`/moach/${projectId}/votes/pmash/${pmash.id}`)}
              class="w-full text-start p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center gap-3"
            >
              <span class="font-medium">{pmash.attributes.name}</span>
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded shrink-0"
                >{t.toVote} · {voteCount(pmash)} {t.votes}</span
              >
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Mission proposals (pendm) -->
    {#if pendms.length > 0}
      <section id="sec-pendm" class="bg-white p-6 rounded-xl shadow-sm scroll-mt-24">
        <h2 class="text-lg font-bold mb-4">{t.missionProposals}</h2>
        <div class="space-y-4">
          {#each pendms as pendm (pendm.id)}
            <button
              onclick={() => goto(`/moach/${projectId}/votes/pendm/${pendm.id}`)}
              class="w-full text-start p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center gap-3"
            >
              <span class="font-medium">{pendm.attributes.name}</span>
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded shrink-0"
                >{t.toVote} · {voteCount(pendm)} {t.votes}</span
              >
            </button>
          {/each}
        </div>
      </section>
    {/if}
  {/if}

  {#if !loading && votesData}
    <!-- Split Votes -->
    {#if votesData.tosplits?.data?.length > 0}
      <section id="sec-split" class="bg-white p-6 rounded-xl shadow-sm scroll-mt-24">
        <h2 class="text-lg font-bold mb-4">{t.splitVotes}</h2>
        <div class="space-y-4">
          {#each votesData.tosplits.data as split (split.id)}
            <button onclick={() => goto(`/moach/${projectId}/splits/${split.id}`)}
                    class="w-full text-left p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
              <span>{split.attributes.name}</span>
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">{split.attributes.vots?.length || 0} votes</span>
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Join Requests (nested inside open missions) -->
    {#if joinList.length > 0}
      <section id="sec-join" class="bg-white p-6 rounded-xl shadow-sm scroll-mt-24">
        <h2 class="text-lg font-bold mb-4">{t.joinVotes}</h2>
        <div class="space-y-4">
          {#each (votesData.open_missions?.data ?? votesData.openMissions?.data ?? []) as mission (mission.id)}
            {#each mission.attributes.asks?.data || [] as ask (ask.id)}
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
