<script>
  import Tile from "$lib/celim/tile.svelte";
  /** @type {{color?: string, items?: any}} */
  let { color = 'pink', items = [] } = $props();
</script>
<div class="flex sm:flex-row flex-wrap justify-center align-middle d  ">
    {#each items as item}
    <p>
        <Tile sm={false} big={false}  bg={color} word={item}/></p>
            {/each}
            </div>