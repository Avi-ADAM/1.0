<script>
  import { t } from '$lib/translations';
  import { page } from '$app/state';
  import RikmaPreview from '$lib/components/assistant/RikmaPreview.svelte';
  import ExhibitHandoff from '$lib/components/exhibit/ExhibitHandoff.svelte';

  let { data } = $props();
  // Opened from the fair stand's QR (docs/inprogress/PLAN_EXHIBITION_MODE.md §7).
  let fromExhibit = $derived(page.url.searchParams.get('ref') === 'exhibit');
</script>

<svelte:head>
  <title>{data.view.name} · {$t('rikmaImport.preview.title')} · 1💗1</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<RikmaPreview view={data.view} expiresAt={data.expiresAt} projectId={data.projectId} loggedIn={!!data.tok}>
  {#snippet top()}
    {#if fromExhibit}
      <ExhibitHandoff shareKey={page.params.shareKey ?? ''} />
    {/if}
  {/snippet}
</RikmaPreview>
