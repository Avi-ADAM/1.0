<script>
  // Back-compat wrapper around the unified VocabSelector. Keeps the original
  // `selectedValues` prop so existing call sites need no changes.
  import VocabSelector from './VocabSelector.svelte';

  let {
    selectedValues = $bindable([]),
    placeholder = undefined,
    color = '--gold',
    autoCreate = true,
    onadd = undefined,
    onremove = undefined
  } = $props();
</script>

<VocabSelector
  kind="vallues"
  bind:selected={selectedValues}
  {placeholder}
  {color}
  {autoCreate}
  {onadd}
  {onremove}
/>
