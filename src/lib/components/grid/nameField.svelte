<script>
    let { value, onClick } = $props();
</script>

<div class="max-w-[20vw] md:max-w-[15vw] lg:max-w-[10vw] break-words whitespace-normal">
    {#if onClick}
        <button onclick={onClick} class="text-start hover:text-gold transition-colors cursor-pointer font-medium">{value}</button>
    {:else}
        {value}
    {/if}
</div>
