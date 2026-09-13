<script lang="ts">
  import { t } from '$lib/translations';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { idPr } from '$lib/stores/idPr.js';
  import CrNewProject from '$lib/celim/icons/crNewProject.svelte';
  interface Project {
    id: string;
    projectName: string;
    profilePic: string | null;
  }

  let { data }: { data: { projects: Project[] } } = $props();

  let query = $state('');

  const all = $derived((data.projects ?? []).filter(Boolean));
  const showSearch = $derived(all.length > 5);
  const shown = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q || !showSearch) return all;
    return all.filter((p) => (p.projectName ?? '').toLowerCase().includes(q));
  });

  onMount(() => {
    if ($idPr && $idPr !== 0) {
      goto(`/moach/${$idPr}`);
    }
  });

  function selectProject(id: string) {
    goto(`/moach/${id}`);
    idPr.set(id);
  }

  function getImageUrl(url: string | null) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const base = import.meta.env.VITE_URL || '';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  }
</script>

<svelte:head>
  <title>{$t('moach.list.myProjects')} · 1lev1</title>
</svelte:head>

<div
  class="alli bg-[radial-gradient(circle_at_50%,theme(colors.slate.400),theme(colors.slate.500)_10%,theme(colors.slate.600)_20%,theme(colors.slate.800),theme(colors.slate.900),#19031d)]"
></div>

<div class="border-2 border-barbi rounded m-4 p-4">
  <h1
    class="text-barbi underline text-2xl decoration-lturk font-bold py-2 px-4 mb-4 text-center rounded-full"
  >
    {$t('moach.list.choose')}
  </h1>
  {#if showSearch}
    <div class="mb-4 flex flex-col items-center gap-1">
      <div class="relative w-full max-w-sm">
        <input
          type="search"
          bind:value={query}
          placeholder={$t('moach.list.search')}
          aria-label={$t('moach.list.search')}
          onkeydown={(e) => e.key === 'Escape' && (query = '')}
          class="search w-full rounded-full border-2 border-barbi/70 focus:border-gold bg-slate-900/60 text-gold placeholder:text-barbi/70 py-2 ps-4 pe-10 outline-none transition-colors"
        />
        {#if query}
          <button
            type="button"
            onclick={() => (query = '')}
            title={$t('moach.list.clearSearch')}
            aria-label={$t('moach.list.clearSearch')}
            class="absolute inset-y-0 end-3 flex items-center text-barbi hover:text-gold"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        {/if}
      </div>
      {#if query.trim()}
        <span class="text-xs text-barbi/80">
          {$t('moach.list.showing', { count: shown.length, total: all.length })}
        </span>
      {/if}
    </div>
  {/if}

  <div class="flex flex-wrap justify-center items-center gap-4">
    {#each shown as project (project.id)}
      {#if project}
        <button
          class="group relative overflow-hidden border-2 border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-gray-700 hover:text-gold p-2 m-1 rounded-xl shadow-lg shadow-fuchsia-400 hover:shadow-2xl hover:shadow-fuchsia-400 transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
          onclick={() => selectProject(project.id)}
        >
          <span class="text-base font-semibold text-center leading-tight"
            >{project.projectName}</span
          >
          {#if project.profilePic}
            <div
              class="w-6 h-6 rounded-full overflow-hidden ring-2 ring-gold/30 group-hover:ring-gold transition-all duration-300 flex-shrink-0"
            >
              <img
                src={getImageUrl(project.profilePic)}
                alt={`${project.projectName} logo`}
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          {:else}
            <div
              class="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-barbi flex items-center justify-center ring-2 ring-gold/30 group-hover:ring-gold transition-all duration-300 flex-shrink-0"
            >
              <span class="text-xl font-bold text-white"
                >{project.projectName.charAt(0).toUpperCase()}</span
              >
            </div>
          {/if}
        </button>
      {/if}
    {/each}
    {#if shown.length === 0}
      <p class="text-barbi py-4">{$t('moach.list.noMatch')}</p>
    {/if}
  </div>
</div>

<div class="flex justify-center items-center pb-64">
  <button
    class="inline-flex items-center gap-2 border-2 border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-3 px-6 m-4 rounded-full shadow-md shadow-fuchsia-400 hover:shadow-2xl hover:shadow-fuchsia-400 transition-all"
    onclick={() => goto('/me?action=createproject')}
    title={$t('moach.list.createNew')}
  >
    <CrNewProject />
    <span class="text-lg md:text-xl">{$t('moach.list.createNew')}</span>
  </button>
</div>

<style>
  /* the browser's own clear affordance — we render our own */
  .search::-webkit-search-cancel-button,
  .search::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }

  .alli {
    /*   background: radial-gradient(circle at 0.9% 49.5%, rgb(0, 250, 255) 0%, rgb(2, 255, 187) 100.2%); */
    /*  background: radial-gradient(
      circle at 0.9%,
      rgb(2, 255, 187) 0%,
      rgb(238 232 170) 50%,
      rgb(2, 255, 187) 100.2%
    );*/
    z-index: -1;
    min-width: 100vw;
    min-height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
  }
</style>
