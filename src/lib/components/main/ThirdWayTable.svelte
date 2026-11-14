<!--
  The employee / solo founder / rikma comparison: three columns, the rikma one
  highlighted. Copy is `home.sections.col*` (global namespace), so any page
  can mount it. Used by /no-boss (inside NoBossCase) and /freelance.
-->
<script>
  import { t } from '$lib/translations';
</script>

<!-- Both column fills are fixed light in BOTH modes - a gold gradient
     for the rikma column, slate for the other two - so nothing in here
     takes a `dark:` ink partner. The blanket contrast pass that gave the
     rest of the page its dark-mode ink handed these cards one too, and
     `dark:text-gold` (#eee8aa) landed on a gold gradient at 1:1 while
     `dark:text-surfaceInk` (#ede5d8) sat near-white on amber. The fills
     are also opaque now: at 70% over the surface the slate columns
     composited to a pale grey that put `text-slate-500` at 2.1:1. -->
<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
  {#each [['colEmployee', false], ['colSolo', false], ['colRikma', true]] as [key, highlight]}
    <div
      class="relative flex flex-col rounded-2xl p-4 {highlight
        ? 'bg-gradient-to-br from-amber-200 via-gold to-rose-200 border-2 border-gold shadow-xl ring-2 ring-gold/50'
        : 'bg-slate-100 border border-slate-300 shadow-sm'}"
    >
      {#if highlight}
        <span
          class="absolute -top-3 left-1/2 -translate-x-1/2 bg-barbi text-gold text-xs font-bold px-3 py-1 rounded-full shadow whitespace-nowrap"
          >{$t('home.sections.colRikma_badge')}</span
        >
      {/if}
      <h3
        class="font-bold text-lg sm:text-base mb-3 text-center {highlight
          ? 'text-rose-800 mt-1'
          : 'text-slate-600'}"
      >
        {$t(`home.sections.${key}_t`)}
      </h3>
      <ul class="flex flex-col gap-2">
        {#each $t(`home.sections.${key}_d`).split('•') as item}
          <li
            class="flex items-start gap-2 text-sm text-start {highlight
              ? 'text-slate-900 font-medium'
              : 'text-slate-700'}"
          >
            <span
              class="shrink-0 {highlight
                ? 'text-emerald-800'
                : 'text-rose-700'}">{highlight ? '✓' : '✕'}</span
            >
            <span>{item.trim()}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>
