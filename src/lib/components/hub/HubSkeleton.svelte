<script lang="ts">
  // Shown while hub data is streaming — mirrors the real layout to avoid a jump
</script>

<div class="animate-pulse space-y-5">
  <!-- Header skeleton: avatar + greeting lines -->
  <div class="flex items-center gap-3.5">
    <div class="w-14 h-14 rounded-full bg-white/10 shrink-0"></div>
    <div class="flex-1 space-y-2">
      <div class="h-3 w-28 rounded-full bg-white/10"></div>
      <div class="h-5 w-40 rounded-full bg-white/10"></div>
    </div>
  </div>

  <!-- Hero votes card skeleton -->
  <div class="h-24 rounded-3xl bg-white/10"></div>

  <!-- Stat tiles skeleton -->
  <div class="grid grid-cols-3 gap-3">
    {#each [1, 2, 3] as n (n)}
      <div class="h-24 rounded-2xl bg-white/10"></div>
    {/each}
  </div>

  <!-- CTA skeleton -->
  <div class="h-16 rounded-2xl bg-white/10"></div>

  <!-- Shortcuts skeleton -->
  <div class="space-y-2">
    <div class="h-3 w-24 rounded-full bg-white/10"></div>
    <div class="flex gap-3">
      {#each [1, 2, 3] as n (n)}
        <div class="h-20 flex-1 rounded-2xl bg-white/10"></div>
      {/each}
    </div>
  </div>
</div>
