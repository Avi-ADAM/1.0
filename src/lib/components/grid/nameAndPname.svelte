<script>
    export let src = '';
    export let pname = '';
    export let mname = '';
    export let type = '';
    export let isOpen = false
    export let isPend = false
  import Tile from "$lib/celim/tile.svelte";
    import Button from "$lib/celim/ui/button.svelte";
import {lang} from '$lib/stores/lang'
  export let text = {"he":"אני אבצע", "en":"assign to me"}
  export let onClick = () => {}
</script>{#if type !== "button"}
<div class="flex items-center gap-2">
    {#if src}
        <img src={src} alt={pname} class="w-8 h-8 rounded-full" />
    {/if}
    <div class="flex flex-col text-start">
        {#if pname}
            <span>{pname}</span>
        {/if}
        {#if mname}
            <span 
                class="text-blue-500 cursor-pointer hover:underline" 
                role="button"
                tabindex=0
                on:click={onClick}
            
            >
                {mname}
            </span>
        {/if}
    </div>
</div>
    {#if !pname && !mname}
        {#if isOpen}
        <button on:click={onClick} >
        <Tile bg="pink" word={isOpen.name}/>
        </button>
        {:else if isPend}
        <button on:click={onClick} >
        <Tile bg="gold" word={isPend.name}/>
        </button>
        {/if}
        {/if}
{:else}
<Button text={text} on:click={onClick}/>
{/if}