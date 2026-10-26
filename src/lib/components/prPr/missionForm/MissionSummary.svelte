<script>
  /**
   * The summary beside the mission form: what is being proposed, what it is
   * worth, what is still missing, and the publish action.
   * @typedef {{ label: string, done: boolean, optional?: boolean }} Check
   * @typedef {Object} Props
   * @property {string} heading
   * @property {string} name
   * @property {string} meta - e.g. "one-time · one person"
   * @property {string} valueLabel
   * @property {string} total
   * @property {string} formula
   * @property {Check[]} checks
   * @property {string} [note]
   * @property {boolean} [wide] - lay the card out in two columns from `sm` up.
   * @property {import('svelte').Snippet} [actions]
   */
  /** @type {Props} */
  let { heading, name, meta, valueLabel, total, formula, checks, note = '', wide = false, actions } = $props();
</script>

<div
  class="flex flex-col gap-4 rounded-[20px] border-[1.5px] border-[#eee2a6] bg-[#fffdf7] p-5 text-start text-[#2a1420] shadow-[0_20px_50px_rgba(0,0,0,.2)] sm:p-6"
>
  <span class="text-xs font-bold tracking-wide text-[#6b5560]">{heading}</span>
  <div class="grid gap-5 {wide ? 'sm:grid-cols-2 sm:items-start sm:gap-8' : ''}">
    <div class="flex flex-col gap-4">
      <div>
        <strong class="block break-words text-xl font-extrabold">{name || '—'}</strong>
        <span class="text-sm text-[#6b5560]">{meta}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm text-[#6b5560]">{valueLabel}</span>
        <strong class="text-4xl font-extrabold leading-tight text-[#c8155f]" dir="auto">{total}</strong>
        <span class="text-sm text-[#6b5560]" dir="auto">{formula}</span>
      </div>
    </div>
    <div class="flex flex-col gap-4">
      <ul
        class="m-0 flex list-none flex-col gap-2.5 border-t border-[#efe6d3] p-0 pt-3.5 text-sm {wide
          ? 'sm:border-t-0 sm:pt-0'
          : ''}"
      >
        {#each checks as c (c.label)}
          <li class="flex items-center gap-2.5 {c.done ? '' : 'text-[#6b5560]'}">
            {#if c.done}
              <span
                class="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[#1f9d6b] text-white"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg>
              </span>
            {:else}
              <span class="h-[22px] w-[22px] flex-none rounded-full border-2 border-[#d8cbb0]" aria-hidden="true"></span>
            {/if}
            {c.label}
          </li>
        {/each}
      </ul>
      {@render actions?.()}
      {#if note}
        <p class="m-0 text-xs leading-relaxed text-[#6b5560]">{note}</p>
      {/if}
    </div>
  </div>
</div>
