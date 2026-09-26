<script>
  import { t } from '$lib/translations';
  import RikmaPreview from '$lib/components/assistant/RikmaPreview.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.view.name} · {$t('rikmaImport.preview.title')} · 1💗1</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<RikmaPreview view={data.view} expiresAt={data.expiresAt} projectId={data.projectId} loggedIn={!!data.tok} />
