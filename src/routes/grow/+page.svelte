<script>
  import GrowPage from '$lib/components/main/growpage.svelte';
  import { t } from '$lib/translations';
</script>

<svelte:head>
  <title>{$t('grow.meta.title')}</title>
  <meta name="description" content={$t('grow.meta.description')} />
  <meta property="og:title" content={$t('grow.meta.title')} />
  <meta property="og:description" content={$t('grow.meta.description')} />
  <meta property="og:type" content="website" />
</svelte:head>

<GrowPage />
