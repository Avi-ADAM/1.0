<script>
  /**
   * @type {{
   *   items: { icon: string, label: string }[],
   *   current: number
   * }}
   */
  let { items, current } = $props();
</script>

<div class="tabs">
  {#each items as t, i}
    <div class="tab" class:active={current === i} class:done={current > i}>
      <span>{t.icon}</span>
      <span>{t.label}</span>
      {#if current > i}
        <span style="color: #daa520; font-weight: 900;">✓</span>
      {/if}
    </div>
  {/each}
</div>
<div class="tabs-sep"></div>
