<!--
  TranslatedNote — the one muted line that keeps a translation honest.

      תורגם מעברית · תרגום מכונה · הצג מקור

  Split out of `<Translated>` (which renders it by default) for the one shape
  that cannot nest it: a card whose whole body is a single `<a href>`. The
  toggle is a `<button>`, and a button inside an anchor is invalid HTML — the
  browser recovers by breaking the link, the card stops being clickable, and
  nothing warns you. So a linked card renders its text with `showNote={false}`
  and places one note per card *outside* the anchor, which is also the better
  reading: the provenance belongs to the card, not to each of its three fields.

  It never renders when there is no translation, so a caller can place it
  unconditionally and get no layout shift on a cache miss.
-->
<script>
  import { t } from '$lib/translations';
  import { autoTranslate, showOriginals } from '$lib/stores/autoTranslate.js';
  import { isRealTranslation } from '$lib/translation/hits.js';

  /** @typedef {import('$lib/translation/types.js').TranslationHit} TranslationHit */

  let {
    /** The resolved cache row this note is about. */
    hit = /** @type {TranslationHit | undefined} */ (undefined),
    /** Extra classes. The muted, small styling is the component's own. */
    class: className = ''
  } = $props();

  // `off` means the reader asked for the author's words. Honoured here too, so
  // a payload fetched before the setting changed does not keep offering to
  // un-translate something that is no longer translated.
  //
  // `isRealTranslation` is what keeps an **identity row** out: its `text` is
  // the source, so a bare `!!hit.text` told a Hebrew reader that Hebrew had
  // been "translated from Hebrew" and offered them the original of the
  // original. See the header of hits.js.
  const available = $derived(isRealTranslation(hit) && $autoTranslate !== 'off');
  const fromLang = $derived(hit ? $t(`translated.lang.${hit.srcLang}`) : '');
</script>

{#if available && hit}
  <span class="tnote {className}" dir="auto">
    {#if !$showOriginals}
      <!-- What it is and where it came from. A reviewed row has a human behind
           it, so it drops the "machine" wording but still names the source
           language (§9.1) — a translation is never presented as the author's
           own words. -->
      <span>
        {$t('translated.from', { lang: fromLang })}{#if hit.quality !== 'reviewed'}
          · {$t('translated.machineNotice')}{/if}
      </span>
      <button type="button" onclick={() => showOriginals.set(true)}>
        {$t('translated.showOriginal')}
      </button>
    {:else}
      <button type="button" onclick={() => showOriginals.set(false)}>
        {$t('translated.showTranslation')}
      </button>
    {/if}
  </span>
{/if}

<style>
  .tnote {
    display: block;
    margin-top: 0.15rem;
    font-size: 0.72rem;
    line-height: 1.4;
    color: var(--tm, #71717a);
  }

  .tnote button {
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .tnote button:hover {
    color: var(--ink, #3f3f46);
  }
</style>
