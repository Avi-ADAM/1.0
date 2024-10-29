<script>
  import Tile from "$lib/celim/tile.svelte";
    export let color = 'pink'
    export let items = []
</script>
<div class="flex sm:flex-row flex-wrap justify-center align-middle d  ">
    {#each items as item}
    <p>
        <Tile sm={false} big={false}  bg={color} word={item}/></p>
            {/each}
            </div>