<script>
  import RikmaApiPanel from '$lib/components/prPr/api/RikmaApiPanel.svelte';

  let { data } = $props();

  // Members come from the moach layout's base load — no extra round trip.
  let members = $derived(data.projectBase?.user_1s?.data ?? []);
</script>

<RikmaApiPanel
  projectId={data.projectId}
  missions={data.missions ?? []}
  roles={data.roles ?? []}
  {members}
/>
