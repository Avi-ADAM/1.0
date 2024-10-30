<script>
    export let src = '';
    export let pname = '';
    export let mname = '';
    export let type = '';
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
{:else}
<Button text={text} on:click={onClick}/>
{/if}