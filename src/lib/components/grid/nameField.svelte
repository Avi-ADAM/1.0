<script>
    let { value, onClick } = $props();
</script>

<div class="max-w-[20vw] md:max-w-[15vw] lg:max-w-[10vw] break-words whitespace-normal">
    {#if onClick}
        <!-- `hover:text-gold` was invisible on the grid's near-white hover row:
             in the business/"professional" theme --gold is #f8fafc. --goldink is
             the readable ink counterpart in every theme; the underline keeps the
             affordance even where the two colours sit close. -->
        <button onclick={onClick} class="text-start hover:text-goldink hover:underline transition-colors cursor-pointer font-medium">{value}</button>
    {:else}
        {value}
    {/if}
</div>
