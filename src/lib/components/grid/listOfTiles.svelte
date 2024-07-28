<script>
  import Tile from "$lib/celim/tile.svelte";
    export let color = 'pink'
    export let items = []
</script>
<div class="flex sm:flex-row flex-wrap justify-center align-middle d  ">
    {#each items as item}
    <p 
    on:mouseenter={()=>hover({"he":"הכישורים הנדרשים","en": "needed skills"})} 
    on:mouseleave={()=>hover("0")}  >
        <Tile sm={false} big={false}  bg={color} word={item}/></p>
            {/each}
            </div>