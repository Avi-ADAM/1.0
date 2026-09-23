<script>
  // Authenticated wish composer. Shares all logic with the public guest
  // composer (/wish/new) via WishForm; here the user is always logged in
  // (the (reg) layout guards auth), so anon stays false. The loader adds
  // `draft` (?draft=<id>) and `welcome` (end of the customer signup track).
  import WishForm from '$lib/components/concierge/WishForm.svelte';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<WishForm
  data={{
    uid: data.uid || undefined,
    un: data.un || undefined,
    welcome: data.welcome,
    draft: data.draft
  }}
/>
