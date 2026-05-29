<script>
  /** @type {{ title: string, sub?: string, big?: boolean }} */
  let { title, sub = '', big = false } = $props();
</script>

<div class="plaque">
  <div class="plaque-title" style="font-size: {big ? '26px' : '22px'}">{title}</div>
  {#if sub}
    <div class="plaque-sub">{sub}</div>
  {/if}
</div>
