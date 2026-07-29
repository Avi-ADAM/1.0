<script>
  import Button from "$lib/celim/ui/button.svelte";
  let { text = '', onClick = () => {} } = $props();
</script>
<Button {text} onClick={onClick}/>