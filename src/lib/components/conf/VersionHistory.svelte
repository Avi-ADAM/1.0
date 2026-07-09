<script>
  /**
   * VersionHistory — a compact, reusable side-by-side history of successive
   * versions/rounds of a negotiated thing (a saleClaim's negom rounds, a pmash's
   * precision rounds, an askm's proposals…). Renders each version as a column in
   * a horizontally-scrollable row; the aligned field rows make it easy to read
   * "what changed between round 2 and round 3" across the whole history.
   *
   * It is presentation-only: the caller normalizes its data into `versions`,
   * pre-computing per-field `changed` (vs. the previous version) and marking the
   * one that is `current` (on the table). Styled with Tailwind `dark:` variants
   * (the project's dark-mode mechanism) so it has proper contrast in both themes,
   * and RTL-aware — any card on the site can reuse it.
   *
   * @typedef {Object} VHField
   * @property {string} label   Row label (already localized).
   * @property {string|number|null} value  Display value ('—' when empty).
   * @property {boolean} [changed]    Highlight — differs from the previous version.
   * @property {boolean} [emphasize]  Bolder accent (e.g. a total).
   *
   * @typedef {Object} VHVersion
   * @property {string} title       Column heading, e.g. "סבב 2".
   * @property {string} [by]        Who proposed it.
   * @property {boolean} [current]  The version currently on the table.
   * @property {VHField[]} fields
   */
  import { lang } from '$lib/stores/lang.js';
  import { isRtl } from '$lib/translations';

  /**
   * @typedef {Object} Props
   * @property {VHVersion[]} versions
   * @property {string} [label]  Optional section heading.
   */
  /** @type {Props} */
  let { versions = [], label = '' } = $props();
</script>

{#if versions.length > 0}
  <div dir={$isRtl ? 'rtl' : 'ltr'} class="w-full">
    {#if label}
      <div
        class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1.5"
      >
        🕓 {label}
      </div>
    {/if}
    <div class="vh-track flex gap-2 overflow-x-auto pb-1.5 snap-x">
      {#each versions as v, i (i)}
        <div
          class="flex-none min-w-[8.5rem] max-w-[12rem] snap-start rounded-xl border p-2 {v.current
            ? 'border-barbi dark:border-mpink ring-1 ring-barbi/50 dark:ring-mpink/50 bg-barbi/5 dark:bg-mpink/10'
            : 'border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/60'}"
        >
          <div class="flex items-center justify-between gap-1 mb-0.5">
            <span class="text-xs font-bold text-barbi dark:text-mpink">{v.title}</span>
            {#if v.current}
              <span
                class="text-[0.6rem] font-bold uppercase text-barbi dark:text-mpink bg-barbi/10 dark:bg-mpink/20 rounded-full px-1.5 py-0.5 whitespace-nowrap"
              >
                {$lang === 'he' ? 'על השולחן' : 'on table'}
              </span>
            {/if}
          </div>
          {#if v.by}
            <div class="text-[0.65rem] text-gray-500 dark:text-gray-400 mb-1.5 truncate">
              {v.by}
            </div>
          {/if}
          <div class="flex flex-col gap-0.5">
            {#each v.fields as f (f.label)}
              <div
                class="flex items-baseline justify-between gap-1.5 px-1 py-0.5 rounded-md {f.changed
                  ? 'bg-amber-100 dark:bg-amber-400/20'
                  : ''}"
              >
                <span class="text-[0.65rem] text-gray-500 dark:text-gray-400 flex-none">
                  {f.label}
                </span>
                <span
                  class="text-xs text-end break-words {f.emphasize
                    ? 'font-extrabold text-barbi dark:text-mpink'
                    : 'font-semibold text-gray-900 dark:text-gray-50'}"
                >
                  {f.value === null || f.value === '' ? '—' : f.value}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  /* Slim horizontal scrollbar; colours come from Tailwind classes above. */
  .vh-track::-webkit-scrollbar {
    height: 5px;
  }
  .vh-track::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.4);
    border-radius: 999px;
  }
</style>
