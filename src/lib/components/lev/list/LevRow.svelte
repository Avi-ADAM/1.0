<script>
  /**
   * LevRow — one heart item as a condensed card, roughly a third of a phone
   * screen, cheap enough that scrolling forty of them costs nothing.
   *
   * It renders only what the DisplayItem already carries (see levProcessors'
   * DisplayItem): no extra query, no child card component, and exactly one
   * image — the project logo, which repeats across rows and so is served from
   * cache after the first. Member avatars are deliberately *not* here: a row
   * per member would be a request per member per row, which is the opposite of
   * an overview.
   *
   * Off-screen rows are skipped entirely by the browser via
   * `content-visibility: auto` on the list container's children, which is why
   * the height is a fixed variable rather than content-driven — the reserved
   * box has to match what the row will actually be.
   */
  import { t, isRtl } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { msLeft } from '$lib/stores/clock.svelte';
  import {
    kindLabelKey,
    kindAccent,
    rowTitle,
    rowSubtitle,
    rowFacts,
    rowTimegrama,
    rowIsActionable
  } from '../cards/cardKinds.js';

  /**
   * @typedef {Object} Props
   * @property {any} item - a DisplayItem off finalSwiperArray
   * @property {() => void} onOpen - expand this item into its full card
   */

  /** @type {Props} */
  let { item, onOpen } = $props();

  let accent = $derived(kindAccent(item.ani));
  let title = $derived(rowTitle(item));
  let subtitle = $derived(rowSubtitle(item));
  let facts = $derived(rowFacts(item));
  let deadline = $derived(rowTimegrama(item));
  let actionable = $derived(rowIsActionable(item));

  // One shared clock drives this; see $lib/stores/clock.svelte. A day-scale
  // countdown produces the same string for a whole day, so re-deriving it each
  // second costs a comparison and no DOM write.
  let leftMs = $derived(deadline ? msLeft(deadline) : null);

  // Rounded *up*, which is how a deadline reads: with 47h to go you have two
  // days left, not one. Hebrew (and every other locale here) does not agree
  // with a bare "{{count}} ימים" at one, so each unit carries its own singular.
  let countdown = $derived.by(() => {
    if (leftMs === null) return null;
    if (leftMs <= 0) return $t('lev.list.time.over');
    const secs = Math.ceil(leftMs / 1000);
    // Pick the unit from the *rounded* value, not the raw one: 23h59m rounds to
    // 24 hours, which should read as one day rather than "24 hours".
    const days = Math.ceil(secs / 86400);
    const hours = Math.ceil(secs / 3600);
    const mins = Math.ceil(secs / 60);
    const [key, count] =
      hours >= 24
        ? ['d', days]
        : mins >= 60
          ? ['h', hours]
          : secs >= 60
            ? ['m', mins]
            : ['s', secs];
    return count === 1
      ? $t(`lev.list.time.${key}One`)
      : $t(`lev.list.time.${key}`, { count });
  });

  // Vote tallies exist on the consent-style items only; plain numbers instead of
  // avatars keep the row to a single image.
  let ok = $derived(Number(item.noofusersOk ?? 0));
  let waiting = $derived(Number(item.noofusersWaiting ?? 0));
  let hasTally = $derived(
    item.noofusersOk != null || item.noofusersWaiting != null
  );
</script>

<button
  type="button"
  class="lev-row"
  class:done={!actionable}
  style:--accent={accent}
  onclick={onOpen}
>
  <span class="rail" aria-hidden="true"></span>

  <span class="top">
    {#if item.src}
      <img class="logo" src={item.src} alt="" loading="lazy" decoding="async" />
    {:else}
      <span class="logo logo-empty" aria-hidden="true"></span>
    {/if}
    <span class="kind">{$t(kindLabelKey(item.ani))}</span>
    {#if countdown}
      <span class="clock" class:urgent={leftMs !== null && leftMs <= 0}>
        {countdown}
      </span>
    {/if}
  </span>

  <span class="title" dir="auto">{title}</span>

  {#if subtitle}
    <span class="desc" dir="auto">{subtitle}</span>
  {/if}

  {#if facts.length}
    <span class="facts">
      {#each facts as fact (fact.key)}
        <span class="fact">
          {$t(`lev.list.fact.${fact.key}`, {
            value: fact.value.toLocaleString($lang)
          })}
        </span>
      {/each}
    </span>
  {/if}

  <span class="bottom">
    <span class="project" dir="auto">{item.projectName ?? ''}</span>
    {#if hasTally}
      <span class="tally">
        <span class="ok">{ok}</span>
        <span class="sep">/</span>
        <span class="waiting">{ok + waiting}</span>
      </span>
    {/if}
    <span class="chev" aria-hidden="true">{$isRtl ? '‹' : '›'}</span>
  </span>
</button>

<style>
  .lev-row {
    /* Height is fixed on purpose: the list reserves exactly this much for an
       off-screen row (contain-intrinsic-size), so a content-driven height
       would make the scrollbar jump as rows render. */
    height: var(--lev-row-h);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.3rem;
    position: relative;
    text-align: start;
    padding: 0.75rem 0.9rem;
    padding-inline-start: 1.15rem;
    border-radius: 1rem;
    background: var(--lev-row-bg, #fff);
    border: 1px solid rgba(0, 0, 0, 0.07);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    /* No transition/transform anywhere in this component — a fast overview is
       the whole point, and animated rows are what makes a long scroll stutter. */
  }

  :global(html.dark) .lev-row {
    background: var(--lev-row-bg, #1f2937);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .lev-row.done {
    opacity: 0.55;
  }

  .rail {
    position: absolute;
    inset-inline-start: 0;
    inset-block: 0;
    width: 4px;
    background: var(--accent);
  }

  .top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex: none;
  }

  .logo {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 9999px;
    object-fit: cover;
    flex: none;
  }
  .logo-empty {
    background: var(--accent);
    opacity: 0.25;
  }

  .kind {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--accent);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .clock {
    margin-inline-start: auto;
    flex: none;
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
    padding: 0.1rem 0.5rem;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.05);
    color: #4b5563;
  }
  :global(html.dark) .clock {
    background: rgba(255, 255, 255, 0.08);
    color: #d1d5db;
  }
  .clock.urgent {
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
  }
  :global(html.dark) .clock.urgent {
    color: #fca5a5;
  }

  .title {
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.3;
    color: #111827;
    display: -webkit-box;
    /* Two lines now that a description follows it; the row is a fixed height
       and the description is the part that tells you what this actually is. */
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    /* Shrinkable, not fixed. On a short viewport --lev-row-h bottoms out and
       the fixed-size children alone would outgrow the card; anything that can
       give up a line has to, or the row's own overflow:hidden would clip the
       bottom line — the one carrying the project and the vote tally. */
    flex: 0 1 auto;
    min-height: 0;
  }
  :global(html.dark) .title {
    color: #f3f4f6;
  }

  .desc {
    font-size: 0.8rem;
    line-height: 1.35;
    color: #4b5563;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    /* Takes whatever vertical room is left over, so a row with a long
       description fills the card and a row without one simply has less. */
    flex: 1 1 auto;
    min-height: 0;
  }
  :global(html.dark) .desc {
    color: #9ca3af;
  }

  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    /* One line of chips at most, and the first thing to go when the card is
       short — the figures are a bonus, the bottom line is not. */
    flex: 0 1 auto;
    min-height: 0;
    overflow: hidden;
    max-height: 1.5rem;
  }

  .fact {
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    padding: 0.1rem 0.45rem;
    border-radius: 0.4rem;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--accent);
    font-weight: 600;
  }

  .bottom {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex: none;
    font-size: 0.72rem;
    color: #6b7280;
  }
  :global(html.dark) .bottom {
    color: #9ca3af;
  }

  .project {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tally {
    margin-inline-start: auto;
    flex: none;
    font-variant-numeric: tabular-nums;
  }
  .tally .ok {
    color: var(--accent);
    font-weight: 700;
  }
  .tally .sep {
    opacity: 0.5;
    margin: 0 0.1rem;
  }

  .chev {
    flex: none;
    font-size: 1.1rem;
    line-height: 1;
    opacity: 0.5;
  }
  .tally + .chev {
    margin-inline-start: 0;
  }
  .project + .chev {
    margin-inline-start: auto;
  }
</style>
