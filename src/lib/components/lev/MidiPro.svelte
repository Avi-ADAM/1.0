<script>
  /**
   * MidiPro — the heart's centre, in the professional ("business") identity.
   *
   * `sv.svelte` is a 380KB hand-drawn SVG: a beating heart ringed by twelve
   * faceted diamonds, each one a filter. It is the personal identity's whole
   * personality and it should stay exactly as it is — but it is also the one
   * element on the lev page that cannot be talked into looking like a business
   * tool by swapping CSS variables, which is how every other surface switches
   * identity (`html.business { … }` in app.postcss).
   *
   * So this is the parallel element, not a restyling of that one, and it keeps
   * the original's *shape* as well as its job: a disc with the member at the
   * centre and the eleven filters as counted studs around its rim, in the same
   * clockwise ring the diamonds sit on. A rectangle in the middle of a radial
   * field of coins reads as a dialog that failed to close; a medallion reads as
   * the centre of the thing.
   *
   * Same props, same callbacks, same translation keys as the diamonds: the stud
   * labels are the ones the cards and list views already show in their filter
   * strip (`lev.cards.filter.items.*`, which carry the count inside the phrase
   * in all five locales) and the hover hints are the diamonds' own
   * (`lev.diamonds.*`), so the two identities describe the heart identically
   * and nothing new had to be translated.
   *
   * The toggle itself stays in `midi.svelte`: this component is handed the
   * currently-soloed kind and reports which one was clicked, exactly like a
   * diamond does.
   *
   * EVERY CLASS HERE IS PREFIXED `lmp-`, and that is not a style preference.
   * app.postcss carries unscoped global rules for several ordinary words —
   * `.label` (line 287) is `position:absolute; top:22px; color:var(--gold)`,
   * part of a floating-label input — and Svelte's scoping does not protect a
   * component from a global rule reaching *in*. The first draft of this file
   * used `.label` for the stud text and every one of them was yanked out of
   * flow onto the same 22px line in near-white: the rows collapsed to their
   * padding and the labels piled up on top of each other. `.ring` is global
   * too. A prefix is the only reliable defence.
   */
  import { t } from '$lib/translations';
  import LevViewSwitch from './LevViewSwitch.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} [picLink] - the member's profile picture
   * @property {any} [pic] - fallback image, shared with sv.svelte
   * @property {string} [name]
   * @property {number} [sug]
   * @property {number} [pen]
   * @property {number} [ask]
   * @property {number} [wel]
   * @property {number} [beta]
   * @property {number} [des]
   * @property {number} [fia]
   * @property {number} [pmash]
   * @property {number} [mashs]
   * @property {number} [maap]
   * @property {number} [askma]
   * @property {boolean} [low] - the feed is still loading; no view switch yet
   * @property {string | null} [soleKey] - the kind currently shown alone, if any
   * @property {(key: string) => void} [onPick] - a stud was clicked
   * @property {(payload: { id: any }) => void} [onHover]
   * @property {(view: 'list' | 'cards' | 'coins') => void} [onView]
   */

  /** @type {Props} */
  let {
    picLink,
    pic,
    name = '',
    sug = 0,
    pen = 0,
    ask = 0,
    wel = 0,
    beta = 0,
    des = 0,
    fia = 0,
    pmash = 0,
    mashs = 0,
    maap = 0,
    askma = 0,
    low = true,
    soleKey = null,
    onPick,
    onHover,
    onView
  } = $props();

  /**
   * The eleven diamonds, in one table instead of twelve `if/else` branches.
   * `key` is the `milon` key the filter toggles on; `hint` is the sentence the
   * matching diamond puts in the tooltip when the pointer is over it.
   */
  let studs = $derived(
    [
      { key: 'sugg', count: sug, hint: 'lev.diamonds.onlySuggestedMissions' },
      { key: 'pend', count: pen, hint: 'lev.diamonds.onlyNewMissionVotes' },
      { key: 'asks', count: ask, hint: 'lev.diamonds.onlyJoinRequests' },
      { key: 'welc', count: wel, hint: 'lev.diamonds.onlyWelcomes' },
      { key: 'betaha', count: beta, hint: 'lev.diamonds.onlyInProgress' },
      { key: 'desi', count: des, hint: 'lev.diamonds.onlyMoneySplitVotes' },
      { key: 'fiap', count: fia, hint: 'lev.diamonds.onlyFinishedApprovals' },
      { key: 'ppmash', count: pmash, hint: 'lev.diamonds.onlyResourceRequestVotes' },
      { key: 'pmashs', count: mashs, hint: 'lev.diamonds.onlyResourceInvestmentOffers' },
      { key: 'pmaap', count: maap, hint: 'lev.diamonds.onlyResourceReceiptApprovals' },
      { key: 'askmap', count: askma, hint: 'lev.diamonds.onlyJoinAndInvestRequests' }
    ]
      .filter((s) => Number(s.count) > 0)
      /* Placed by trigonometry rather than by a hand-tuned transform per stud —
         which is what the twelve `translate(…)` strings in midi.svelte are —
         so a heart with three live kinds is as evenly spaced as one with
         eleven. Clockwise from twelve o'clock, the diamonds' own order. */
      .map((s, i, all) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / all.length;
        return { ...s, cos: Math.cos(angle).toFixed(4), sin: Math.sin(angle).toFixed(4) };
      })
  );

  let total = $derived(studs.reduce((n, s) => n + Number(s.count), 0));

  /** @param {{ key: string, count: number }} s */
  const studLabel = (s) => $t(`lev.cards.filter.items.${s.key}`, { count: s.count });

  /**
   * The line under the name. While a filter is on it names that filter, so the
   * medallion answers "why am I seeing only these?" on touch too — where there
   * is no hover to put the diamonds' sentence in the page tooltip.
   */
  let note = $derived.by(() => {
    const on = studs.find((s) => s.key === soleKey);
    return on ? studLabel(on) : $t('lev.list.count', { count: total });
  });
</script>

<div
  class="lmp"
  dir="auto"
  role="group"
  aria-label={$t('lev.page.heartTitle')}
  onmouseleave={() => onHover?.({ id: $t('lev.page.studsHint') })}
>
  <a
    class="lmp-core"
    href="/me"
    data-sveltekit-preload-data
    onmouseenter={() => onHover?.({ id: $t('lev.diamonds.toControlRoom') })}
  >
    <img class="lmp-face" src={picLink || pic} alt="" width="40" height="40" />
    <span class="lmp-name">{name}</span>
    <span class="lmp-note" class:on={soleKey}>{note}</span>
    {#if low !== true}
      <span class="lmp-foot">
        <LevViewSwitch compact value="coins" onChange={(v) => onView?.(v)} />
      </span>
    {/if}
  </a>

  {#each studs as stud (stud.key)}
    <button
      type="button"
      class="lmp-stud"
      class:on={soleKey === stud.key}
      style:--cos={stud.cos}
      style:--sin={stud.sin}
      aria-pressed={soleKey === stud.key}
      aria-label={studLabel(stud)}
      title={studLabel(stud)}
      onclick={() => onPick?.(stud.key)}
      onmouseenter={() => onHover?.({ id: $t(stud.hint) })}
    >
      <span class="lmp-n">{stud.count}</span>
    </button>
  {/each}
</div>

<style>
  /* Every colour here is an appearance token, so the medallion follows the
     business palette in both light and dark mode without a second block. */
  .lmp {
    --lmp-size: clamp(15rem, 76vw, 19.5rem);
    --lmp-stud: 2.375rem;
    /* The studs are centred on this radius, so their outer edge lands exactly
       on the medallion's bounding box and nothing spills onto the coins. */
    --lmp-ring: calc(50% - var(--lmp-stud) / 2);

    position: relative;
    width: var(--lmp-size);
    height: var(--lmp-size);
    font-size: 0.8125rem;
    line-height: 1.35;
    color: var(--text, #0f172a);
  }

  /* The disc. Its diameter leaves exactly one stud's width of ring on each
     side, plus 2px so a stud never touches the core's edge. */
  .lmp-core {
    position: absolute;
    inset: calc(var(--lmp-stud) + 2px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    /* A circle is a hostile text box: keep the writing inside the widest band
       of it and let the shoulders stay empty. */
    padding: 0 18%;
    border-radius: 50%;
    background: var(--s1, #fff);
    border: 1px solid var(--border, rgb(15 23 42 / 0.12));
    box-shadow: 0 10px 30px rgb(2 6 23 / 0.35);
    text-align: center;
    text-decoration: none;
    color: inherit;
  }
  .lmp-core:hover,
  .lmp-core:focus-visible {
    background: var(--s2, #f8fafc);
  }

  .lmp-face {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    object-fit: cover;
    flex: none;
    background: var(--s3, #f1f5f9);
    border: 1px solid var(--border, rgb(15 23 42 / 0.12));
  }

  .lmp-name {
    max-width: 100%;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Two lines at most: a filter name is longer than "121 items" and the disc
     has no room for a third. */
  .lmp-note {
    max-width: 100%;
    font-size: 0.75rem;
    color: var(--tm, #475569);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
  .lmp-note.on {
    color: var(--barbi-pink, #1d4ed8);
    font-weight: 600;
  }

  .lmp-foot {
    margin-top: 0.125rem;
  }

  /* One filter: its count, on the ring where its diamond used to be. The kind
     itself is in `title`, in `aria-label`, and — the moment the pointer is on
     it — in the page's own tooltip, which is where the diamonds put it too. */
  .lmp-stud {
    position: absolute;
    width: var(--lmp-stud);
    height: var(--lmp-stud);
    left: calc(50% + var(--lmp-ring) * var(--cos));
    top: calc(50% + var(--lmp-ring) * var(--sin));
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid var(--border, rgb(15 23 42 / 0.12));
    border-radius: 50%;
    background: var(--s2, #f8fafc);
    color: inherit;
    font: inherit;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 2px 6px rgb(2 6 23 / 0.3);
    transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  }
  .lmp-stud:hover,
  .lmp-stud:focus-visible {
    background: var(--s3, #f1f5f9);
    border-color: var(--barbi-pink, #1d4ed8);
  }

  /* The soloed kind. The stud that clears the filter is the one that set it —
     the same toggle the diamonds have, said with a state instead of a shape.
     --gold on --barbi-pink is the pair app.postcss guarantees ≥4.5:1 in both
     modes; nothing else here may colour a word. */
  .lmp-stud.on {
    background: var(--barbi-pink, #1d4ed8);
    border-color: var(--barbi-pink, #1d4ed8);
    color: var(--gold, #f8fafc);
  }

  /* Four digits would not fit; 999 is already three at 12px in a 38px circle. */
  .lmp-n {
    font-size: 0.75rem;
    max-width: 100%;
    overflow: hidden;
  }

  @media (max-width: 380px) {
    .lmp {
      --lmp-stud: 2rem;
    }
    .lmp-face {
      width: 2rem;
      height: 2rem;
    }
  }
</style>
