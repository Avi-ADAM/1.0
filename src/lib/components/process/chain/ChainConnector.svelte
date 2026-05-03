<script>
  let { lang } = $props();
</script>

<span class="conn" aria-hidden="true">
  <svg viewBox="0 0 16 16" class="conn-arrow">
    {#if lang === 'he'}
      <polyline points="11 3 5 8 11 13" />
    {:else}
      <polyline points="5 3 11 8 5 13" />
    {/if}
  </svg>
</span>

<style>
  .conn {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    align-self: center;
    margin: 0 2px;
  }
  .conn-arrow {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: var(--gold, #f59e0b);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.5;
  }
</style>
