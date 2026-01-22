<script lang="ts">
  import { lang } from '$lib/stores/lang.js';

  let { buble } = $props();

  const t = {
    request: { he: 'בקשה', en: 'Request', ar: 'طلب' }
  };
</script>

<div
  class="relative group cursor-pointer transition-all duration-300 hover:scale-110"
>
  <!-- Outer Ring (Animated) -->
  <div
    class="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-barbi via-mpink to-gold opacity-70 blur-sm group-hover:opacity-100 animate-pulse"
  ></div>

  <!-- Main Coin Body -->
  <div
    class="relative bg-white dark:bg-gray-800 rounded-full w-full h-full flex items-center justify-center overflow-hidden border-2 border-barbi/30 shadow-inner"
  >
    {#if buble.userSrc}
      <img
        src={buble.userSrc}
        alt={buble.username}
        class="w-full h-full object-cover"
      />
    {:else}
      <div
        class="w-full h-full bg-gradient-to-br from-barbi/20 to-mpink/20 flex items-center justify-center text-barbi text-xl font-black"
      >
        {buble.username?.charAt(0)}
      </div>
    {/if}

    <!-- Project Badge -->
    {#if buble.projectSrc}
      <div
        class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white"
      >
        <img
          src={buble.projectSrc}
          alt="project"
          class="w-full h-full object-cover"
        />
      </div>
    {/if}

    <!-- Title Label (Overlay on hover) -->
    <div
      class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white p-1 text-center transition-opacity duration-200"
    >
      <span class="text-[8px] font-bold uppercase tracking-tighter opacity-80"
        >{t.request[$lang]}</span
      >
      <span class="text-[10px] font-extrabold leading-tight line-clamp-2"
        >{buble.name}</span
      >
    </div>
  </div>

  <!-- Indicator for total -->
  <div
    class="absolute -top-2 -left-2 bg-barbi text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm z-10 border border-white/50"
  >
    {buble.total}
  </div>
</div>
