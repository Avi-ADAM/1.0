<script>
  // Test stand-in for filter.svelte: hands its props to the test so it can
  // pick a filter the way the real chip would.
  let props = $props();
  $effect.pre(() => {
    globalThis.__levFilterProps = props;
  });
</script>
