<script>
  /**
   * One numbered step of the mission form (PLAN_MISSION_FORM_REDESIGN).
   * @typedef {Object} Props
   * @property {number|null} [step] - the step number shown in the badge; none for unnumbered blocks.
   * @property {string} title
   * @property {string} [subtitle]
   * @property {string} [badge] - a short tag beside the title, e.g. "optional".
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props} */
  let { step = null, title, subtitle = '', badge = '', children } = $props();
</script>

<section
  class="flex flex-col gap-4 rounded-2xl text-start border border-[#efe6d3] bg-white p-4 text-[#2a1420] shadow-sm sm:gap-5 sm:p-7"
>
  <header class="flex items-center gap-3">
    {#if step != null}
      <span
        class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#c8155f] text-sm font-extrabold text-white sm:h-8 sm:w-8"
        aria-hidden="true">{step}</span
      >
    {/if}
    <div class="min-w-0 flex-1">
      <h2 class="m-0 text-lg font-extrabold leading-tight sm:text-xl">{title}</h2>
      {#if subtitle}
        <p class="m-0 mt-0.5 text-sm text-[#6b5560]">{subtitle}</p>
      {/if}
    </div>
    {#if badge}
      <span class="flex-none rounded-full bg-[#f6f0e4] px-2.5 py-1 text-xs text-[#5a4a2a]">{badge}</span>
    {/if}
  </header>
  {@render children?.()}
</section>
