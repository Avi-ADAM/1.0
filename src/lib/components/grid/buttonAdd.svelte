<script>
  import Button from "$lib/celim/ui/button.svelte";
  import {lang} from '$lib/stores/lang'
  let { text = {"he":"אני אבצע", "en":"assign to me"}, onClick = () => {} } = $props();
</script>
<Button text={text[$lang]} on:click={onClick}/>