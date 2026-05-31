<script>
  import Fpage from '$lib/components/main/fpage.svelte';
  import { lang } from '$lib/stores/lang.js';
  import tr from '$lib/translations/tr.json';
</script>

<svelte:head>
  <title>{tr.pages.homeTitle[$lang]}</title>
  <meta name="description" content={tr.pages.homeDescription[$lang]} />
  <meta property="og:title" content={tr.pages.homeTitle[$lang]} />
  <meta property="og:description" content={tr.pages.homeDescription[$lang]} />
  <meta property="og:type" content="website" />
</svelte:head>

<Fpage/>
