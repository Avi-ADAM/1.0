<script lang="ts">
  import AuthorityBadge from '$lib/components/ui/AuthorityBadge.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import type { Snippet } from 'svelte';

  interface Props {
    logoSrc?: string;
    projectName: string;
    cardType: string; // סוג הקלף (לצורך הצגה)
    cardTitle: string; // כותרת הקלף
    memberCount?: number;
    glowColor?: string; // צבע זוהר (default: gold)
    onProjectClick?: () => void;
    actions?: Snippet; // Slot לכפתורים מותאמים אישית
  }

  let {
    logoSrc = '',
    projectName,
    cardType,
    cardTitle,
    memberCount = 0,
    glowColor = 'gold',
    onProjectClick,
    actions
  }: Props = $props();
</script>

<div
  class="flex sm:items-center justify-between py-3 px-4 border-b-2 border-b-gray-200 dark:border-b-gray-700 bg-colorfulGrad relative overflow-hidden"
>
  <!-- Glow effect based on card type - overlayed on gold background -->
  <div
    class="absolute inset-0 opacity-20 blur-2xl transition-opacity duration-300 pointer-events-none"
    style:background={glowColor === 'gold'
      ? 'radial-gradient(circle at center, var(--gold), transparent 70%)'
      : glowColor === 'barbi'
        ? 'radial-gradient(circle at center, var(--barbi-pink), transparent 70%)'
        : glowColor === 'blue'
          ? 'radial-gradient(circle at center, var(--blueg), transparent 70%)'
          : glowColor === 'green'
            ? 'radial-gradient(circle at center, var(--wow), transparent 70%)'
            : glowColor === 'orange'
              ? 'radial-gradient(circle at center, var(--oranges), transparent 70%)'
              : glowColor === 'purple'
                ? 'radial-gradient(circle at center, #a855f7, transparent 70%)'
                : glowColor === 'red'
                  ? 'radial-gradient(circle at center, #ef4444, transparent 70%)'
                  : glowColor === 'teal'
                    ? 'radial-gradient(circle at center, #14b8a6, transparent 70%)'
                    : 'radial-gradient(circle at center, var(--gold), transparent 70%)'}
  ></div>

  <div class="relative flex items-center gap-3 z-10">
    <div class="relative">
      <AuthorityBadge
        {logoSrc}
        {projectName}
        {memberCount}
        size={isMobileOrTablet() ? 80 : 120}
      />
    </div>
    <div class="flex flex-col leading-tight">
      <div
        class="text-xl sm:text-2xl uppercase font-semibold text-barbi dark:text-barbi"
      >
        <span style="text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">
          {cardType}
        </span>
      </div>
      <div
        style="text-shadow: 1px 1px white;"
        class="font-bold text-barbi dark:text-barbi sm:text-3xl text-xl"
      >
        {cardTitle}
      </div>
    </div>
  </div>

  <!-- Actions area: either custom slot or default project button -->
  <div class="flex items-center gap-2 z-10 relative">
    {#if actions}
      {@render actions()}
    {:else if onProjectClick}
      <button
        onclick={onProjectClick}
        class="px-3 py-1 text-barbi hover:text-gold hover:bg-barbi bg-gold rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
      >
        {#if $lang === 'he'}
          לצפיה בפרויקט
        {:else}
          View Project
        {/if}
      </button>
    {/if}
  </div>
</div>

<style>
  .bg-colorfulGrad {
    background: linear-gradient(to left, var(--grb), var(--gra), var(--grc));
    position: relative;
  }
</style>
