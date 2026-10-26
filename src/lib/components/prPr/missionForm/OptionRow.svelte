<script>
  /**
   * A collapsible row under "more options" of the mission form: an icon, a
   * title, a one-line status, and the existing editor revealed in place.
   * @typedef {Object} Props
   * @property {any} icon - an icon component from the lucide set.
   * @property {string} title
   * @property {string} [status]
   * @property {boolean} [open]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props} */
  let { icon: Icon, title, status = '', open = $bindable(false), children } = $props();
  const uid = $props.id();
</script>

<div
  class="rounded-2xl border-[1.5px] bg-[#fffdf8] transition-colors {open
    ? 'border-[#d9a5bb]'
    : 'border-[#efe6d3] hover:border-[#d9a5bb]'}"
>
  <button
    type="button"
    class="flex min-h-[60px] w-full items-center gap-3 p-3 text-start sm:p-4"
    aria-expanded={open}
    aria-controls="opt-{uid}"
    onclick={() => (open = !open)}
  >
    <span
      class="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#fdeef4] text-[#c8155f]"
      aria-hidden="true"><Icon size={20} /></span
    >
    <span class="min-w-0 flex-1">
      <strong class="block text-base text-[#2a1420]">{title}</strong>
      {#if status}<span class="block truncate text-sm text-[#6b5560]">{status}</span>{/if}
    </span>
    <svg
      class="h-5 w-5 flex-none text-[#6b5560] transition-transform {open ? 'rotate-180' : ''}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg
    >
  </button>
  {#if open}
    <div id="opt-{uid}" class="border-t border-[#efe6d3] p-3 text-[#2a1420] sm:p-4">
      {@render children?.()}
    </div>
  {/if}
</div>
