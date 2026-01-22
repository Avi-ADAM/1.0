<script lang="ts">
  import AuthorityBadge from '$lib/components/ui/AuthorityBadge.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { isMobileOrTablet } from '$lib/utilities/device';

  interface Props {
    logoSrc?: string;
    projectName: string;
    cardType: string; // סוג הקלף (לצורך הצגה)
    cardTitle: string; // כותרת הקלף
    memberCount?: number;
    glowColor?: string; // צבע זוהר (default: gold)
    onProjectClick?: () => void;
  }

  let {
    logoSrc = '',
    projectName,
    cardType,
    cardTitle,
    memberCount = 0,
    glowColor = 'gold',
    onProjectClick
  }: Props = $props();
</script>

<div
  class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-colorfulGrad relative overflow-hidden"
>
  <!-- Glow effect based on card type -->
  <div
    class="absolute inset-0 opacity-20 blur-2xl transition-opacity duration-300 pointer-events-none"
    style:background={glowColor === 'gold' ? 'radial-gradient(circle at center, var(--gold), transparent 70%)' : 
                      glowColor === 'barbi' ? 'radial-gradient(circle at center, var(--barbi-pink), transparent 70%)' :
                      glowColor === 'blue' ? 'radial-gradient(circle at center, var(--blueg), transparent 70%)' :
                      glowColor === 'green' ? 'radial-gradient(circle at center, var(--wow), transparent 70%)' : 'radial-gradient(circle at center, var(--gold), transparent 70%)'}
  ></div>

  <div class="relative flex items-center space-x-1 z-10">
    <div class="relative">
      <AuthorityBadge
        {logoSrc}
        {projectName}
        {memberCount}
        size={isMobileOrTablet() ? 80 : 120}
      />
    </div>
    <div class="flex flex-col leading-tight ml-4">
      <div class="sm:text-sm text-lg mt-1 flex items-center">
        <span
          class="text-barbi text-center mr-3 sm:text-4xl text-xl font-bold uppercase tracking-wider"
          style="text-shadow: 1px 1px 2px rgba(255,255,255,0.8);"
        >
          {cardType}
        </span>
      </div>
      <span
        style="text-shadow: 1px 1px white;"
        class="pn ml-1 text-lg sm:text-2xl text-barbi font-bold"
      >
        {cardTitle}
      </span>
    </div>
  </div>

  {#if onProjectClick}
    <button
      onclick={onProjectClick}
      class="px-2 mx-2 text-barbi hover:text-gold hover:bg-barbi bg-gold rounded text-sm font-semibold transition-all z-10 relative"
    >
      {#if $lang === 'he'}
        לצפיה בפרויקט
      {:else}
        View Project
      {/if}
    </button>
  {/if}
</div>

<style>
  .bg-colorfulGrad {
    background: linear-gradient(to left, var(--grb), var(--gra), var(--grc));
    position: relative;
  }
</style>