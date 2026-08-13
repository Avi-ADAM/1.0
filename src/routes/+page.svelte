<script>
  import Fpage from '$lib/components/main/fpage.svelte';
</script>

<!-- No <svelte:head> here on purpose. Fpage carries the homepage's <Head>
     (title, description, canonical, og, twitter) and is also what /he, /en and
     /ar render — declaring a second title here gave `/` two <title> tags and
     two og:title values, and crawlers keep the first one they see. -->
<Fpage />
