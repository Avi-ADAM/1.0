<script>
  import Bethas from '$lib/components/prPr/bethas.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';

  let { data } = $props();
  const moachStore = getMoachStore();

  let projectId = $derived(page.params.projectId);

  // Seed store from server data whenever fresh data arrives
  $effect(() => {
    if (data.missions && projectId) {
      untrack(() => moachStore.updateProjectData(projectId, 'missions', data.missions));
    }
  });

  let projectData = $derived(moachStore.state.projects[projectId]);
  let missions = $derived(projectData?.missions ?? data.missions);

  // Work that has no one on it yet lives on the "open for partners" board —
  // link across instead of duplicating the list here.
  let openCount = $derived(
    (missions?.open_missions?.data?.length ?? 0) +
      (missions?.open_mashaabims?.data?.length ?? 0)
  );

  let modalState = $state({ isOpen: false, a: 0, who: null });

  function handleChat(id) {
    modalState.who = id;
    modalState.a = 8;
    modalState.isOpen = true;
  }

  function handleActClick(act) {
    modalState.who = act.id ?? act;
    modalState.a = 9;
    modalState.isOpen = true;
  }
</script>

<svelte:head>
  <title>{data.projectBase?.projectName ? `${data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'בתהליך' : $lang === 'ar' ? 'قيد التنفيذ' : 'Progress'} · 1lev1</title>
</svelte:head>

{#if openCount > 0}
  <a
    href="/moach/{projectId}/open"
    class="mx-auto mb-3 flex max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-gold/50 bg-slate-900/60 px-4 py-2 text-sm text-gold transition-colors hover:border-gold hover:bg-slate-800/70"
  >
    🤝 <strong>{$t('moach.open.title')}</strong>
    <span class="text-slate-300">{$t('moach.open.progressLink', { count: openCount })}</span>
    <span aria-hidden="true">→</span>
  </a>
{/if}

<div
  class="progress-page rounded-lg overflow-auto"
  style="margin: 20px auto; background: linear-gradient(to right, #25c481, #25b7c4);"
>
  {#if missions}
    <Bethas
      bmiData={missions.mesimabetahaliches?.data ?? []}
      projectId={page.params.projectId}
      onChat={handleChat}
      onActClick={handleActClick}
    />
  {:else}
    <div class="flex justify-center p-12 text-white">טוען...</div>
  {/if}
</div>
