<script>
  // Back-compat wrapper around the unified VocabSelector. Keeps a dedicated
  // `selectedWorkways` prop so call sites read clearly.
  import VocabSelector from './VocabSelector.svelte';

  let {
    selectedWorkways = $bindable([]),
    placeholder = undefined,
    color = '--gold',
    autoCreate = true,
    onadd = undefined,
    onremove = undefined
  } = $props();
</script>

<VocabSelector
  kind="workways"
  bind:selected={selectedWorkways}
  {placeholder}
  {color}
  {autoCreate}
  {onadd}
  {onremove}
/>
