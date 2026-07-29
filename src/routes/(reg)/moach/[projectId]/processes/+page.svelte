<script>
  import { t } from '$lib/translations';

  // Object types a project can hold; their labels live in moach.objectTypes.*
  const OBJECT_TYPES = [
    'pendm', 'openMission', 'ask', 'betahalich', 'act', 'finiapruval', 'finnished',
    'pmash', 'openMashaabim', 'askm', 'maap', 'rikmash', 'matanot', 'sale'
  ];
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { loadProjectProcesses } from '$lib/utils/processes';
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
      processes = await loadProjectProcesses(projectId, fetch);
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });

  // Quick access to the per-type object indexes (object/[type]) — every
  // lifecycle object also has a standalone page, independent of its process.</script>

<svelte:head>
  <title>{page.data.projectBase?.projectName ? `${page.data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'תהליכים' : $lang === 'ar' ? 'العمليات' : 'Processes'} · 1lev1</title>
</svelte:head>

<div class="processes-page space-y-6">
  <h1 class="text-2xl font-bold text-primary">{$t('moach.processes.title')}</h1>

  <div class="flex flex-wrap items-center justify-center gap-1.5 text-xs">
    <span class="text-slate-400 font-semibold me-1">{$t('moach.processes.objects')}</span>
    {#each OBJECT_TYPES as key (key)}
      <a
        href="/moach/{projectId}/object/{key}"
        class="px-2.5 py-0.5 rounded-full border border-slate-500 text-slate-300 hover:text-gold hover:border-gold whitespace-nowrap transition-colors"
      >
        {$t(`moach.objectTypes.${key}`)}
      </a>
    {/each}
  </div>

  {#if loading}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if processes.length > 0}
    <ProcessBoard
      {processes}
      selectable={true}
      onSelect={(p) => goto(`/moach/${projectId}/processes/${p.id}`)}
    />
  {:else}
    <div class="p-12 text-center text-gray-400 italic">{$t('moach.processes.empty')}</div>
  {/if}
</div>
