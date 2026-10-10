<script>
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { t } from '$lib/translations';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import OpenBoard from '$lib/components/prPr/open/OpenBoard.svelte';

  let { data } = $props();
  const moachStore = getMoachStore();

  let projectId = $derived(page.params.projectId);
  let loaded = $derived(data.projectMissionsData);

  // Same payload shape the create/progress pages seed, so navigating between
  // them reuses one cache entry.
  let seededFor = $state(/** @type {string | null} */ (null));
  $effect(() => {
    if (projectId && loaded) {
      untrack(() => moachStore.updateProjectData(projectId, 'missions', loaded));
      seededFor = projectId;
    }
  });

  // The realtime adapter re-reads `missions` into the store when another member
  // changes one (PLAN_REALTIME_MIGRATION §3.4), so once this page has seeded the
  // store the board reads it. Before that, the store may hold a previous visit's.
  let attrs = $derived(
    seededFor === projectId ? (moachStore.state.projects[projectId]?.missions ?? loaded) : loaded
  );

  let missions = $derived(attrs?.open_missions?.data ?? []);
  let pendms = $derived(attrs?.pendms?.data ?? []);
  let resources = $derived(attrs?.open_mashaabims?.data ?? []);
  let pmashes = $derived(attrs?.pmashes?.data ?? []);
  let projectName = $derived(data.projectBase?.projectName ?? '');
</script>

<svelte:head>
  <title
    >{projectName ? `${projectName} · ` : ''}{$t('moach.open.title')} · 1lev1</title
  >
</svelte:head>

<OpenBoard
  {projectId}
  {projectName}
  {missions}
  {pendms}
  {resources}
  {pmashes}
  only="all"
/>
