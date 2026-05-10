<script>
  import ActsTable from '$lib/components/prPr/tasks/actsTable.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';

  const moachStore = getMoachStore();

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let acts = $derived(projectData?.base?.acts?.data || []);

  function handleTaskClick(e) {
    moachStore.openModal(e.kind, e.id);
  }

  function handleRowClick(row) {
    moachStore.openActModal(row);
  }
</script>

<div class="acts-page">
  <ActsTable {acts} onTaskClick={handleTaskClick} onRowClick={handleRowClick} />
</div>
