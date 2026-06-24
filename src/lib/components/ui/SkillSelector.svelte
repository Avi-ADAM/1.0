<script>
  // Back-compat wrapper around the unified VocabSelector. Keeps the original
  // `selectedSkills` prop so existing call sites need no changes.
  import VocabSelector from './VocabSelector.svelte';

  let {
    selectedSkills = $bindable([]),
    placeholder = undefined,
    color = '--gold',
    autoCreate = true,
    onadd = undefined,
    onremove = undefined
  } = $props();
</script>

<VocabSelector
  kind="skills"
  bind:selected={selectedSkills}
  {placeholder}
  {color}
  {autoCreate}
  {onadd}
  {onremove}
/>
