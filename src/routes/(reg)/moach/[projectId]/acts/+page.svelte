<script>
  import ActsTable from '$lib/components/prPr/tasks/actsTable.svelte';
  import CrTask from '$lib/components/prPr/tasks/crtask.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js';

  const moachStore = getMoachStore();

  let { data } = $props();

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let acts = $derived(projectData?.base?.acts?.data || []);

  let showCreate = $state(false);

  let bmiData = $derived(data.bmiData ?? []);

  let proles = $derived.by(() => {
    /** @type {{ id: string; name: string }[]} */
    const roles = [];
    const seen = new Set();
    for (const bmi of bmiData) {
      for (const t of bmi.attributes?.tafkidims?.data ?? []) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          roles.push({ id: t.id, name: t.attributes?.roleDescription ?? '' });
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
    showCreate = false;
    await invalidateAll();
  }
</script>

<svelte:head>
  <title>{data.projectBase?.projectName ? `${data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'פעולות' : $lang === 'ar' ? 'أعمال' : 'Acts'} · 1lev1</title>
</svelte:head>

<div class="acts-page">
  <ActsTable
    {acts}
    onTaskClick={handleTaskClick}
    onRowClick={handleRowClick}
    onCreateClick={() => (showCreate = true)}
  />
</div>

{#if showCreate}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onclick={(e) => { if (e.target === e.currentTarget) showCreate = false; }}
  >
    <div class="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl bg-white border border-zinc-200">
      <div class="sticky top-0 z-10 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-zinc-200 px-6 py-4">
        <h2 class="font-bold text-lg text-barbi">יצירת מטלה חדשה</h2>
        <button
          onclick={() => (showCreate = false)}
          class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
          aria-label="סגור"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
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
          onDone={handleTaskCreated}
        />
      </div>
    </div>
  </div>
{/if}
