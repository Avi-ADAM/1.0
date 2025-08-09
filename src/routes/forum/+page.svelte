<script>
    // your script goes here

  import Card from "$lib/components/forum/card.svelte";
    let arr = Array(40)
</script>
<div class="container flex items-center justify-evenly flex-wrap">
{#each arr as a}
    <Card />
{/each}
</div>