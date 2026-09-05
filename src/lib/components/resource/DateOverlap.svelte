<script>
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';

  /**
   * "They asked 1 May – 1 June · you are free 3–20 May · 17 days overlap"
   * (docs/PLAN_RESOURCE_CALENDAR.md §6.4).
   *
   * Renders nothing when the offer already covers the request — `dateMatchFrom`
   * returns null there, and a line that says "yes, fine" on every card is noise.
   *
   * A partial overlap is not a refusal. The counter button hands the holder the
   * existing date negotiation instead of leaving them with an all-or-nothing
   * choice, which is what the consent model asks for.
   *
   * @typedef {import('$lib/resources/dateMatchView.js').DateMatch} DateMatch
   */

  let {
    /** @type {DateMatch | null} */
    match = null,
    /** @type {(() => void) | undefined} fires the date counter-proposal */
    onCounter = undefined
  } = $props();

  let fmt = $derived(new Intl.DateTimeFormat($lang, { day: 'numeric', month: 'short' }));

  /** @param {string | null} iso */
  function day(iso) {
    return iso ? fmt.format(new Date(iso)) : '';
  }

  /** @param {string | null} from @param {string | null} to */
  function span(from, to) {
    if (from && to) return `${day(from)} – ${day(to)}`;
    if (from) return `${day(from)} · ${$t('resources.calendar.open_ended')}`;
    return day(to);
  }
</script>

{#if match}
  <div
    class="text-xs rounded-xl px-2.5 py-1.5 border {match.kind === 'none'
      ? 'border-surfaceLine text-surfaceMuted'
      : 'border-gold text-surfaceInk bg-gold/10'}"
  >
    <span class="block">
      {$t('resources.overlap.requested')}: {span(match.requestStart, match.requestEnd)}
    </span>
    <span class="block">
      {$t('resources.overlap.free')}: {span(match.offerStart, match.offerEnd)}
    </span>
    <span class="block font-semibold">
      {#if match.kind === 'none'}
        {$t('resources.overlap.none')}
      {:else}
        {$t('resources.overlap.days', { count: match.days })}
      {/if}
    </span>
    {#if onCounter}
      <button type="button" class="mt-1 underline text-barbi" onclick={onCounter}>
        {$t('resources.overlap.propose_other')}
      </button>
    {/if}
  </div>
{/if}
