<script>
  import AddSheirut from "./sheirut/addSheirut.svelte";
  import SheirutShow from "./sheirut/sheirutShow.svelte";

    export let sheirutim  = [], restime, usersNum
</script>
{#if sheirutim.length >0}
    <SheirutShow/>
    <AddSheirut {restime} {usersNum}/>
{:else}
    <AddSheirut {restime} {usersNum}/>
{/if}