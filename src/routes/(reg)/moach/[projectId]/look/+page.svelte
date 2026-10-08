<script>
  import { page } from '$app/state';
  import { t } from '$lib/translations';
  import LookEditor from '$lib/components/rikmaPublic/LookEditor.svelte';

  let { data } = $props();
  let projectId = $derived(page.params.projectId);
</script>

<svelte:head>
  <title>{$t('rikmaLook.editor.title')} · 1lev1</title>
</svelte:head>

<LookEditor {data} {projectId} />
