<script>
  /**
   * When — "נשלחה לפני 12 דק׳": when a heart item reached me
   * (PLAN_LEV_TIMESTAMPS).
   *
   * Deliberately unlike the deadline countdown next to it: no clock icon, muted,
   * and phrased backwards ("ago"), so "sent 3 hours ago" and "2 days left" can
   * never be read as each other. The full date is always in the tooltip, and
   * `<time datetime>` gives assistive tech the exact moment.
   *
   * Re-renders once a minute off the shared clock — never its own interval.
   */
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { clock } from '$lib/stores/clock.svelte';
  import { whenLabel } from './cards/cardKinds.js';

  /**
   * @typedef {Object} Props
   * @property {any} item - a DisplayItem; nothing renders without `item.when`
   * @property {boolean} [bare] - the time phrase alone, without the verb
   * @property {string} [class]
   */

  /** @type {Props} */
  let { item, bare = false, class: klass = '' } = $props();

  let label = $derived(
    whenLabel(item, { now: clock.minutes, locale: $lang, t: $t, bare })
  );
</script>

{#if label}
  <time
    class="lev-when {klass}"
    datetime={label.iso}
    title={bare ? `${label.sentence} · ${label.full}` : label.full}
    >{label.text}</time
  >
{/if}

<style>
  .lev-when {
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
</style>
