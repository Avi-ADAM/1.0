<!--
  Translated — render user-written text in the reader's language, and say so.

  This is the whole visible surface of the UGC translation feature (§4.2 of
  docs/PLAN_UGC_TRANSLATION.md). The convention it implements is the one every
  large platform converged on, because it is honest about provenance and it is
  cheap:

      Development of a booking site for a community clinic
      תורגם מעברית · הצג מקור            ← muted, small, one line

  Three rules it must never break:

  1. **A machine translation is never presented as the author's words.** The
     provenance line is not optional and not behind a setting.
  2. **The original is never destroyed** — one tap away, always.
  3. **`dir="auto"` on the text node.** An LTR translation dropped into an RTL
     page (or the reverse) reorders the entire surrounding run without it, and
     that is not a cosmetic bug: it makes the sentence say something else.

  With no translation available — which is *every* string until the write path
  ships in P2 — it renders exactly what the site renders today: the source, with
  no extra markup, no note, and no layout shift.

  @example Simplest form: hand it the loader's payload and let it find its row.
    <Translated text={project.publicDescription} {translations} />

  @example When the caller already resolved the row.
    <Translated text={m.descrip} hit={translations.hits[hash]} />
-->
<script>
  import { t } from '$lib/translations';
  import { hashSource } from '$lib/translation/normalize.js';
  import { autoTranslate, showOriginals } from '$lib/stores/autoTranslate.js';

  /**
   * @typedef {import('$lib/translation/types.js').TranslationHit} TranslationHit
   * @typedef {import('$lib/translation/types.js').TranslationPayload} TranslationPayload
   */

  let {
    /** The text as its author wrote it. Always the fallback, never discarded. */
    text = '',
    /** The resolved cache row, when the caller already has it. */
    hit = /** @type {TranslationHit | undefined} */ (undefined),
    /** The loader's payload; the row is looked up by the hash of `text`. */
    translations = /** @type {TranslationPayload | undefined} */ (undefined),
    /** Element to render the text in. A description wants `p`, a card title `span`. */
    as = 'span',
    /** Classes for the text element itself. The note has its own, muted. */
    class: className = '',
    /** Hide the provenance line. Only for places that show it once for a group. */
    showNote = true
  } = $props();

  const source = $derived(typeof text === 'string' ? text : '');

  // Resolving the row costs one sync hash of a string already in memory — no
  // query, no await. `hit` wins when given so a caller can override the lookup.
  const row = $derived(
    hit ?? (source && translations ? translations.hits?.[hashSource(source)] : undefined)
  );

  // `off` means the reader asked for the author's words. Honour it here too,
  // not only in the read path, so a payload fetched before the setting changed
  // does not keep rendering translations.
  const available = $derived(!!row?.text && $autoTranslate !== 'off');
  const showing = $derived(available && !$showOriginals ? 'translation' : 'source');
  const body = $derived(showing === 'translation' && row ? row.text : source);

  const fromLang = $derived(row ? $t(`translated.lang.${row.srcLang}`) : '');
</script>

{#if source}
  <svelte:element this={as} class={className} dir="auto">{body}</svelte:element>

  {#if available && showNote && row}
    <span class="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5" dir="auto">
      {#if showing === 'translation'}
        <!-- The honest half: what it is, and where it came from. A reviewed
             row has a human behind it, so it drops the "machine" wording but
             still says which language it was written in (§9.1). -->
        <span>
          {$t('translated.from', { lang: fromLang })}{#if row.quality !== 'reviewed'}
            · {$t('translated.machineNotice')}{/if}
        </span>
        <button
          type="button"
          class="underline hover:text-zinc-700 dark:hover:text-zinc-200"
          onclick={() => showOriginals.set(true)}
        >{$t('translated.showOriginal')}</button>
      {:else}
        <button
          type="button"
          class="underline hover:text-zinc-700 dark:hover:text-zinc-200"
          onclick={() => showOriginals.set(false)}
        >{$t('translated.showTranslation')}</button>
      {/if}
    </span>
  {/if}
{/if}
