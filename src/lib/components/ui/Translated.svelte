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
  import { hashSource } from '$lib/translation/normalize.js';
  import { autoTranslate, showOriginals } from '$lib/stores/autoTranslate.js';
  import { isRealTranslation } from '$lib/translation/hits.js';
  import TranslatedNote from './TranslatedNote.svelte';

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
  //
  // An **identity row** is not a translation — its `text` is the source (§2.2)
  // — so it renders as a plain source string with no note and no toggle. See
  // the header of hits.js.
  const available = $derived(isRealTranslation(row) && $autoTranslate !== 'off');
  const showing = $derived(available && !$showOriginals ? 'translation' : 'source');
  const body = $derived(showing === 'translation' && row ? row.text : source);
</script>

{#if source}
  <svelte:element this={as} class={className} dir="auto">{body}</svelte:element>

  <!-- The provenance line lives in its own component because a card whose body
       is one <a href> cannot nest a <button>; it renders one note per card
       outside the anchor instead. Same markup, one implementation. -->
  {#if showNote}
    <TranslatedNote hit={available ? row : undefined} />
  {/if}
{/if}
