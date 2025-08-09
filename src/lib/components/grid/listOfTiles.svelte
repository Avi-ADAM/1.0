<script>
  import Tile from "$lib/celim/tile.svelte";
  /**
   * @typedef {Object} Props
   * @property {string} [color]
   * @property {any} [items]
   */

  /** @type {Props} */
  let { color = 'pink', items = [] } = $props();
</script>
<div class="flex sm:flex-row flex-wrap justify-center align-middle d  ">
    {#each items as item}
    <p>
        <Tile sm={false} big={false}  bg={color} word={item}/></p>
            {/each}
            </div>