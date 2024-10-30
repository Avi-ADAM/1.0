<script>
  import Button from "$lib/celim/ui/button.svelte";
  import {lang} from '$lib/stores/lang'
    export let text = {"he":"אני אבצע", "en":"assign to me"}
    export let onClick = () => {}
</script>
<Button text={text[$lang]} on:click={onClick}/>