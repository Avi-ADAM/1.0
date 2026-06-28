<script>
  // Authenticated wish composer. Shares all logic with the public guest
  // composer (/wish/new) via WishForm; here the user is always logged in
  // (the (reg) layout guards auth), so anon stays false.
  import WishForm from '$lib/components/concierge/WishForm.svelte';

  /** @type {{ data: { uid?: string; un?: string } }} */
  let { data } = $props();
</script>

<WishForm {data} />
