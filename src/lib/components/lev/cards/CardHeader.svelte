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
    voteSummary?: Snippet; // תצוגת מצביעים קומפקטית (מוצגת בהדר)
  }

  let {
    logoSrc = '',
    projectName,
    cardType,
    cardTitle,
    memberCount = 0,
    glowColor = 'gold',
    onProjectClick,
    actions,
    voteSummary
  }: Props = $props();

  // ניווט לפרויקט בלחיצה על הלוגו/שם הפרויקט (במקום כפתור נפרד)
  function goToProject(e: Event) {
    if (!onProjectClick) return;
    e.stopPropagation();
    onProjectClick();
  }
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

  {#snippet identity()}
    <div class="relative">
      <AuthorityBadge
        {logoSrc}
        {projectName}
        {memberCount}
        size={isMobileOrTablet() ? 80 : 120}
      />
    </div>
    <div class="flex flex-col leading-tight text-start">
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
  {/snippet}

  {#if onProjectClick}
    <button
      type="button"
      class="relative flex items-center gap-3 z-10 bg-transparent border-0 p-0 m-0 cursor-pointer hover:opacity-90 transition-opacity"
      title={$lang === 'he' ? 'לצפיה בפרויקט' : 'View Project'}
      onclick={goToProject}
    >
      {@render identity()}
    </button>
  {:else}
    <div class="relative flex items-center gap-3 z-10">
      {@render identity()}
    </div>
  {/if}

  <!-- Actions area: תצוגת מצביעים קומפקטית ו/או כפתורים מותאמים -->
  {#if voteSummary || actions}
    <div class="flex items-center gap-3 z-10 relative flex-wrap justify-end">
      {#if voteSummary}
        {@render voteSummary()}
      {/if}
      {#if actions}
        {@render actions()}
      {/if}
    </div>
  {/if}
</div>

<style>
  .bg-colorfulGrad {
    background: linear-gradient(to left, var(--grb), var(--gra), var(--grc));
    position: relative;
  }
</style>
