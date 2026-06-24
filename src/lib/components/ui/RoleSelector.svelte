<script>
  // Back-compat wrapper around the unified VocabSelector. Keeps the original
  // `selectedRoles` prop so existing call sites need no changes.
  import VocabSelector from './VocabSelector.svelte';

  let {
    selectedRoles = $bindable([]),
    placeholder = undefined,
    color = '--gold',
    autoCreate = true,
    onadd = undefined,
    onremove = undefined
  } = $props();
</script>

<VocabSelector
  kind="roles"
  bind:selected={selectedRoles}
  {placeholder}
  {color}
  {autoCreate}
  {onadd}
  {onremove}
/>
