<script>
  /**
   * SiteShareSaleNote — renders the structured site-share Sale `note` as a
   * readable breakdown instead of the raw `site-share · paid=… · from_project=…`
   * string that the moach sales page used to dump verbatim.
   *
   * Site-share income Sales carry no linked product (they showed as
   * "מוצר לא ידוע"); everything meaningful lives in the note. This component
   * parses it once with `parseSiteShareNote` and lays it out as labelled rows.
   *
   * @typedef {Object} Props
   * @property {string} note - The raw Sale note (must be a site-share note).
   */
  import { t, isRtl } from '$lib/translations';
  import { parseSiteShareNote } from '$lib/revenue/parseSiteShareNote';

  /** @type {Props} */
  let { note } = $props();

  const parsed = $derived(parseSiteShareNote(note));
</script>

{#if parsed}
  <div
    class="site-share-note rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-50/80 to-yellow-50/60 dark:from-amber-950/30 dark:to-yellow-950/20 p-3 text-start"
    dir={$isRtl ? 'rtl' : 'ltr'}
  >
    <div class="flex items-center gap-2 mb-2">
      <span aria-hidden="true">💗</span>
      <span class="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        {$t('project.hamatanot.siteShare.label')}
      </span>
    </div>

    <p class="text-xs text-amber-900/70 dark:text-amber-100/70 leading-relaxed mb-3">
      {$t('project.hamatanot.siteShare.body')}
    </p>

    <div class="grid grid-cols-2 gap-2 text-sm">
      <!-- Amount actually paid -->
      {#if parsed.paid !== null}
        <div class="col-span-2 flex items-baseline justify-between bg-white/50 dark:bg-black/20 rounded-lg px-2 py-1.5">
          <span class="text-xs text-amber-800/80 dark:text-amber-200/80">
            {$t('project.hamatanot.siteShare.paid')}
          </span>
          <span class="font-black text-amber-700 dark:text-amber-300">₪{parsed.paid}</span>
        </div>
      {/if}

      <!-- Adjustment (less / more) with original suggestion + reason -->
      {#if parsed.adjustDirection}
        <div class="col-span-2 rounded-lg bg-white/50 dark:bg-black/20 px-2 py-1.5">
          <div class="flex items-baseline justify-between">
            <span class="text-xs text-amber-800/80 dark:text-amber-200/80">
              {parsed.adjustDirection === 'less'
                ? $t('project.hamatanot.siteShare.less')
                : $t('project.hamatanot.siteShare.more')}
            </span>
            {#if parsed.proposed !== null}
              <span class="text-xs text-amber-900/70 dark:text-amber-100/70">
                {$t('project.hamatanot.siteShare.proposed')}: ₪{parsed.proposed}
              </span>
            {/if}
          </div>
          {#if parsed.reason}
            <p class="mt-1 text-xs italic text-amber-900/80 dark:text-amber-100/80 border-t border-amber-400/20 pt-1">
              “{parsed.reason}”
            </p>
          {/if}
        </div>
      {/if}

      <!-- Source rikma -->
      {#if parsed.fromProjectId}
        <div class="flex items-baseline justify-between bg-white/50 dark:bg-black/20 rounded-lg px-2 py-1.5">
          <span class="text-xs text-amber-800/80 dark:text-amber-200/80">
            {$t('project.hamatanot.siteShare.fromRikma')}
          </span>
          <a
            href="/moach/{parsed.fromProjectId}"
            class="font-semibold text-amber-700 dark:text-amber-300 underline decoration-dotted hover:decoration-solid"
          >
            #{parsed.fromProjectId}
          </a>
        </div>
      {/if}

      <!-- Transfer count -->
      {#if parsed.halukaIds.length > 0}
        <div class="flex items-baseline justify-between bg-white/50 dark:bg-black/20 rounded-lg px-2 py-1.5">
          <span class="text-xs text-amber-800/80 dark:text-amber-200/80">
            {$t('project.hamatanot.siteShare.transfers')}
          </span>
          <span class="font-semibold text-amber-700 dark:text-amber-300">{parsed.halukaIds.length}</span>
        </div>
      {/if}
    </div>
  </div>
{/if}
