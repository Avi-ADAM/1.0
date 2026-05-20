<script>
  import '$lib/styles/onboard.css';
  /**
   * @type {{
   *   journey?: import('svelte').Snippet,
   *   tabs?: import('svelte').Snippet,
   *   children: import('svelte').Snippet
   * }}
   */
  let { journey, tabs, children } = $props();
</script>

<div class="onboard-root">
  <div class="screen">
    {#if journey}
      {@render journey()}
    {/if}
    <div class="glass-card">
      {#if tabs}
        {@render tabs()}
      {/if}
      {@render children()}
    </div>
  </div>
</div>
