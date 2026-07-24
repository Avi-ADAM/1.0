<script>
  import Fpage from '$lib/components/main/fpage.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
</script>

<svelte:head>
  <title>{$t('pages.homeTitle')}</title>
  <meta name="description" content={$t('pages.homeDescription')} />
  <meta property="og:title" content={$t('pages.homeTitle')} />
  <meta property="og:description" content={$t('pages.homeDescription')} />
  <meta property="og:type" content="website" />
</svelte:head>

<Fpage/>
