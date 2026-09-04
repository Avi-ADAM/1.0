<script>
  import Fpage from '$lib/components/main/fpage.svelte';

  let { data } = $props();
</script>

<!-- No <svelte:head> here on purpose. Fpage carries the homepage's <Head>
     (title, description, canonical, og, twitter) and is what `/` renders -
     declaring a second title here gave `/` two <title> tags and two og:title
     values, and crawlers keep the first one they see. -->
<Fpage stats={data.stats} />
