<script>
  // Public guest entry to the concierge (demand-first onboarding). Reuses the
  // shared WishForm; `anon` is on whenever there is no logged-in user, which
  // masks supplier identities and turns "publish" into "register to publish".
  import WishForm from '$lib/components/concierge/WishForm.svelte';

  /** @type {{ data: { uid?: string | null; un?: string | null } }} */
  let { data } = $props();
</script>

<WishForm
  data={{ uid: data.uid ?? undefined, un: data.un ?? undefined }}
  anon={!data.uid}
/>
