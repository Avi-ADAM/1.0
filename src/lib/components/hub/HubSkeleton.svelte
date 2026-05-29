<script lang="ts">
  // Shown while hub data is streaming
</script>

<div class="animate-pulse space-y-3 p-4" dir="rtl">
  <!-- KPI bar skeleton -->
  <div class="flex gap-2 flex-wrap">
    {#each [80, 70, 90, 65, 75] as w (w)}
      <div class="h-8 rounded-full bg-white/10" style="width:{w}px"></div>
    {/each}
  </div>

  <!-- CTA skeleton -->
  <div class="h-14 rounded-2xl bg-white/10"></div>

  <!-- Cards skeleton -->
  {#each [1, 2, 3] as n (n)}
    <div class="h-24 rounded-2xl bg-white/10"></div>
  {/each}

  <!-- Shortcuts skeleton -->
  <div class="flex gap-3">
    {#each [4, 5, 6] as n (n)}
      <div class="h-20 w-20 rounded-2xl bg-white/10"></div>
    {/each}
  </div>
</div>
