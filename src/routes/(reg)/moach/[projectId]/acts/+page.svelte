<script>
  import ActsTable from '$lib/components/prPr/tasks/actsTable.svelte';
  import CrTask from '$lib/components/prPr/tasks/crtask.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { SvelteSet } from 'svelte/reactivity';

  const moachStore = getMoachStore();

  let { data } = $props();

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let acts = $derived(projectData?.base?.acts?.data || []);

  let showCreate = $state(false);
  const quickCreateAction = $derived(page.url.searchParams.get('action'));

  // The global Quick Create launcher lands directly on this existing form.
  // This query flag opens the dialog only; saving still happens through CrTask.
  $effect(() => {
    if (quickCreateAction === 'createtask') showCreate = true;
  });

  // A real (replacing) navigation, not shallow-routing `replaceState`: that one
  // rewrites the address bar but leaves `page.url` stale, so `?action=` would
  // still read as "createtask" and the next Quick Create — into this rikma or
  // another — would see an unchanged value and never reopen the dialog.
  function clearQuickCreateAction() {
    if (page.url.searchParams.get('action') !== 'createtask') return;
    const url = new URL(page.url);
    url.searchParams.delete('action');
    void goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }

  function dismissCreate() {
    showCreate = false;
    clearQuickCreateAction();
  }

  let bmiData = $derived(data.bmiData ?? []);

  let proles = $derived.by(() => {
    /** @type {{ id: string; name: string }[]} */
    const roles = [];
    const seen = new SvelteSet();
    for (const bmi of bmiData) {
      for (const role of bmi.attributes?.tafkidims?.data ?? []) {
        if (!seen.has(role.id)) {
          seen.add(role.id);
          roles.push({ id: role.id, name: role.attributes?.roleDescription ?? '' });
        }
      }
    }
    return roles;
  });

  function handleTaskClick(e) {
    moachStore.openModal(e.kind, e.id);
  }

  function handleRowClick(row) {
    moachStore.openActModal(row);
  }

  async function handleTaskCreated() {
    dismissCreate();
    await invalidateAll();
  }
</script>

<svelte:head>
  <title
    >{data.projectBase?.projectName
      ? `${data.projectBase.projectName} · `
      : ''}{$lang === 'he' ? 'פעולות' : $lang === 'ar' ? 'أعمال' : 'Acts'} · 1lev1</title
  >
</svelte:head>

<div class="acts-page">
  <ActsTable
    {acts}
    {projectId}
    onTaskClick={handleTaskClick}
    onRowClick={handleRowClick}
    onCreateClick={() => (showCreate = true)}
  />
</div>

{#if showCreate}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) dismissCreate();
    }}
  >
    <div
      class="surface-dialog relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl
             bg-surface text-surfaceInk border border-surfaceLine
             dark:bg-zinc-900 dark:border-zinc-700"
      role="dialog"
      aria-modal="true"
      aria-label={$t('mission.crtask.heading')}
    >
      <div
        class="sticky top-0 z-10 flex items-center justify-between gap-3
               bg-surface/95 dark:bg-zinc-900/95 backdrop-blur-sm
               border-b border-surfaceLine dark:border-zinc-700
               px-6 py-4"
      >
        <h2 class="font-bold text-lg text-barbi">
          {$t('mission.crtask.heading')}
        </h2>
        <button
          onclick={dismissCreate}
          class="p-1.5 rounded-lg text-surfaceMuted hover:text-surfaceInk hover:bg-surface2 dark:hover:bg-zinc-800 transition"
          aria-label="סגור"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="px-6 py-5">
        <CrTask
          {bmiData}
          {proles}
          id={0}
          misid={undefined}
          fromMis={false}
          hideHeading={true}
          onDone={handleTaskCreated}
        />
      </div>
    </div>
  </div>
{/if}
