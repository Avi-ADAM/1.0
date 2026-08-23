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
   *
   * LAYOUT CONTRACT — three bands, and nothing may cross one:
   *   head   fixed height · logo · kind badge · countdown
   *   body   whatever is left · title · figures · description
   *   foot   fixed height · rikma · tally · actions
   * It is a `grid-template-rows: auto minmax(0, 1fr) auto`, and every band is
   * itself a grid whose flexible cell is `minmax(0, 1fr)`. That is what keeps a
   * long Hebrew rikma name from pushing the countdown off the card, or a
   * three-line title from swallowing the action bar, at any height the clamp
   * can produce. Content is clipped, never displaced.
   *
   * The whole card is clickable through a stretched overlay button rather than
   * by being a `<button>` itself — the action bar's own buttons live inside it,
   * and a button inside a button is invalid HTML that Safari drops on the floor.
   */
  import { t, isRtl } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { msLeft } from '$lib/stores/clock.svelte';
  import {
    kindAccent,
    rowContent,
    rowCtaKey,
    rowTimegrama,
    rowIsActionable
  } from '../cards/cardKinds.js';

  /**
   * @typedef {Object} Props
   * @property {any} item - a DisplayItem off finalSwiperArray
   * @property {() => void} onOpen - expand this item into its full card
   * @property {(payload: any) => void} [onProj] - jump to the rikma
   * @property {(payload: any) => void} [onChat] - open this item's forum
   */

  /** @type {Props} */
  let { item, onOpen, onProj, onChat } = $props();

  let accent = $derived(kindAccent(item.ani));
  let content = $derived(rowContent(item));
  let deadline = $derived(rowTimegrama(item));
  let actionable = $derived(rowIsActionable(item));

  // `{ text }` is data the processor already produced; `{ key, params }` is a
  // lookup this module could not do (cardKinds.js is pure and has no store).
  let title = $derived(
    content.title?.text ??
      (content.title?.key ? $t(content.title.key, content.title.params) : '')
  );
  let subtitle = $derived(
    content.subtitle?.text ??
      (content.subtitle?.key
        ? $t(content.subtitle.key, content.subtitle.params)
        : '')
  );

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

  // Under a day left is the only state worth colouring: everything on this page
  // has a deadline, so painting them all red would say nothing.
  let urgent = $derived(leftMs !== null && leftMs <= 24 * 3600 * 1000);

  // Vote tallies exist on the consent-style items only; plain numbers instead of
  // avatars keep the row to a single image.
  let ok = $derived(Number(item.noofusersOk ?? 0));
  let waiting = $derived(Number(item.noofusersWaiting ?? 0));
  let hasTally = $derived(
    item.noofusersOk != null || item.noofusersWaiting != null
  );

  // Whichever forum this kind happens to carry. A transfer keeps its chat on the
  // haluka, a site-share payable on the transfer it opened.
  let forumId = $derived(
    item.forumId ?? item.halukaForumId ?? item.transferForumId ?? null
  );

  // The kind label doubles as the accessible name of the stretched button, so a
  // screen reader gets "resource proposal, kitchen renovation" rather than the
  // twelfth unlabelled "open".
  let kindLabel = $derived($t(content.kindKey));
</script>

<article class="lev-row" class:done={!actionable} style:--accent={accent}>
  <span class="wash" aria-hidden="true"></span>
  <span class="rail" aria-hidden="true"></span>

  <button
    type="button"
    class="stretch"
    aria-label={title ? `${kindLabel} · ${title}` : kindLabel}
    onclick={onOpen}
  ></button>

  <header class="head">
    {#if item.src}
      <img class="logo" src={item.src} alt="" loading="lazy" decoding="async" />
    {:else}
      <span class="logo logo-empty" aria-hidden="true"></span>
    {/if}

    <span class="kind">{kindLabel}</span>

    {#if countdown}
      <span class="clock" class:urgent>
        <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          />
          <path
            d="M12 7v5.5l3.5 2"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>
        <span>{countdown}</span>
      </span>
    {/if}
  </header>

  <div class="body">
    <h3 class="title" dir="auto">{title}</h3>

    {#if content.facts.length}
      <div class="facts">
        {#each content.facts as fact (fact.key)}
          <span class="fact">
            {$t(`lev.list.fact.${fact.key}`, {
              value:
                typeof fact.value === 'number'
                  ? fact.value.toLocaleString($lang)
                  : fact.value
            })}
          </span>
        {/each}
      </div>
    {/if}

    {#if subtitle}
      <p class="desc" dir="auto">{subtitle}</p>
    {/if}
  </div>

  <footer class="foot">
    <span class="who">
      <span class="project" dir="auto">{item.projectName ?? ''}</span>
      {#if hasTally}
        <span class="tally">
          <span class="ok">{ok}</span><span class="sep">/</span><span
            >{ok + waiting}</span
          >
        </span>
      {/if}
    </span>

    <span class="acts">
      {#if forumId && onChat}
        <button
          type="button"
          class="act"
          aria-label={$t('lev.list.act.chat')}
          onclick={(e) => {
            e.stopPropagation();
            onChat({ forumId });
          }}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path
              d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      {/if}

      {#if item.projectId && onProj}
        <button
          type="button"
          class="act"
          aria-label={$t('lev.list.act.project')}
          onclick={(e) => {
            e.stopPropagation();
            onProj({ id: item.projectId });
          }}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path
              d="M4 20V9l8-5 8 5v11"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <path
              d="M10 20v-6h4v6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      {/if}

      <button type="button" class="cta" onclick={onOpen}>
        {$t(rowCtaKey(item))}
        <span class="chev" aria-hidden="true">{$isRtl ? '‹' : '›'}</span>
      </button>
    </span>
  </footer>
</article>

<style>
  .lev-row {
    /* Two roles for one hue. `--accent` is the *colour* — the rail, the corner
       bloom, the chip fills, the coloured shadow, where any lightness reads
       fine. `--ink` is that same hue pulled into a readable band for text, and
       only `--ink` may colour a word.

       This is not a nicety. Measured against the row surface, the raw tokens
       are mostly unreadable as text: on white, `--wow` (#02ffbb) sits at
       1.31:1, `--oranges` at 1.88, `--blueg` at 1.97, teal at 2.49 — they were
       chosen as *glows* behind a card header, never as ink. On #1f2937 a
       different three fail: the brand pink at 2.27, purple at 3.71, red at
       3.90. Only gold passed in both.

       Clamping lightness in oklch fixes every one of them (measured 4.6–6.5:1
       light, 5.9–11.2:1 dark) while keeping hue and chroma, so a kind is still
       recognisably "the green one". Doing it in the colour space rather than
       with a hand-written second palette is what keeps the business theme
       working: `--barbi-pink`, `--wow` and friends are theme tokens that turn
       blue there, and a literal pink hard-coded here would have overridden it.
       Without relative-colour support the fallback is the raw accent — exactly
       what the row did before, no worse. */
    --ink: var(--accent);

    /* Height is fixed on purpose: the list reserves exactly this much for an
       off-screen row (contain-intrinsic-size), so a content-driven height
       would make the scrollbar jump as rows render. */
    height: var(--lev-row-h);
    width: 100%;
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border-radius: 1rem;
    padding: 0.7rem 0.85rem 0.6rem;
    padding-inline-start: 1.15rem;
    text-align: start;

    /* The three bands. `minmax(0, 1fr)` on the body, not `1fr`: a bare `1fr`
       floors at the content's min-content height, which is how a long title
       used to shove the action bar out through the bottom of the card. */
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 0.45rem;

    background: var(--lev-row-bg, #fff);
    border: 1px solid rgba(0, 0, 0, 0.07);
    /* Two shadows: a neutral contact shadow so the card sits on the page, and a
       wide, low-opacity one in the card's own accent — the "shade in the
       kind's colour" that lets you find a card type by glancing down the
       scroll, before reading a single word. */
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.05),
      0 10px 22px -16px color-mix(in srgb, var(--accent) 85%, transparent);
    /* No transition/transform anywhere in this component — a fast overview is
       the whole point, and animated rows are what makes a long scroll stutter. */
  }

  @supports (color: oklch(from red l c h)) {
    .lev-row {
      --ink: oklch(from var(--accent) min(l, 0.52) c h);
    }
    :global(html.dark) .lev-row {
      --ink: oklch(from var(--accent) max(l, 0.8) c h);
    }
  }

  :global(html.dark) .lev-row {
    background: var(--lev-row-bg, #1f2937);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.3),
      0 10px 24px -16px color-mix(in srgb, var(--accent) 70%, transparent);
  }

  /* The tint itself. A single element rather than a background on .lev-row so
     the accent wash can sit *under* the content without tinting the text, and
     so the two gradients compose: a corner bloom (the same radial glow
     CardHeader puts behind a full card, at a fraction of the strength) over a
     whole-card haze that fades out before it reaches the body copy. */
  .wash {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(
        130% 75% at var(--bloom-x, 100%) 0%,
        color-mix(in srgb, var(--accent) 20%, transparent),
        transparent 62%
      ),
      linear-gradient(
        to bottom,
        color-mix(in srgb, var(--accent) 7%, transparent),
        transparent 55%
      );
  }
  :global([dir='ltr']) .wash {
    --bloom-x: 0%;
  }

  .lev-row.done {
    opacity: 0.55;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .rail {
    position: absolute;
    inset-inline-start: 0;
    inset-block: 0;
    width: 4px;
    /* Brightest at the header end, where the kind badge is, then fading — the
       spine reads as belonging to the badge rather than as a stray border. */
    background: linear-gradient(
      to bottom,
      var(--accent),
      color-mix(in srgb, var(--accent) 35%, transparent)
    );
  }

  /* The whole-card click target. It covers the card at z-index 0 while the
     action bar sits at z-index 1, so a tap anywhere else opens the card and a
     tap on a button does that button's job. */
  .stretch {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    background: transparent;
    border: 0;
    padding: 0;
    border-radius: inherit;
    cursor: pointer;
  }
  .stretch:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -3px;
  }
  .stretch:hover {
    background: color-mix(in srgb, var(--accent) 6%, transparent);
  }

  /* The three bands sit above the stretched overlay — a positioned `z-index: 0`
     element paints after every non-positioned sibling, so without this the
     overlay's hover wash would cover the text instead of sitting behind it.
     They pass their clicks straight through to it; only `.acts` takes any. */
  .head,
  .body,
  .foot {
    position: relative;
    z-index: 1;
    pointer-events: none;
  }

  /* ── head ──────────────────────────────────────────────────────────────── */
  .head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .logo {
    width: 1.65rem;
    height: 1.65rem;
    border-radius: 9999px;
    object-fit: cover;
    /* A ring in the kind's colour rather than a border, so the logo carries the
       accent too and the badge is not the only place it appears. */
    box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--accent) 55%, transparent);
  }
  .logo-empty {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .kind {
    min-width: 0;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    line-height: 1.1;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: uppercase;
  }

  .clock {
    display: inline-flex;
    align-items: center;
    gap: 0.22rem;
    font-size: 0.68rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    padding: 0.12rem 0.45rem;
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
    background: rgba(239, 68, 68, 0.18);
    color: #fca5a5;
  }

  /* ── body ──────────────────────────────────────────────────────────────── */
  .body {
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .title {
    margin: 0;
    font-size: 0.98rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.005em;
    color: #111827;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    /* Shrinkable, not fixed. On a short viewport --lev-row-h bottoms out and
       the fixed-size children alone would outgrow the card; anything that can
       give up a line has to. */
    flex: 0 1 auto;
    min-height: 0;
  }
  :global(html.dark) .title {
    color: #f3f4f6;
  }

  /* Figures sit directly under the title, above the prose: they are the part a
     scan is actually looking for, and putting them last meant a long
     description pushed them out of a short card. */
  .facts {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.28rem;
    flex: none;
    overflow: hidden;
  }

  .fact {
    font-size: 0.68rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    padding: 0.1rem 0.45rem;
    border-radius: 0.4rem;
    background: color-mix(in srgb, var(--accent) 13%, transparent);
    color: var(--ink);
    /* The last chip is allowed to be cut off rather than to wrap: a wrapped
       chip row is a second line, and the second line belongs to the text. */
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .desc {
    margin: 0;
    font-size: 0.79rem;
    line-height: 1.4;
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

  /* ── foot ──────────────────────────────────────────────────────────────── */
  .foot {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.4rem;
    border-top: 1px solid color-mix(in srgb, var(--accent) 16%, transparent);
    font-size: 0.71rem;
    color: #6b7280;
  }
  :global(html.dark) .foot {
    color: #9ca3af;
  }

  .who {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
  }

  .project {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tally {
    flex: none;
    font-variant-numeric: tabular-nums;
    padding: 0.05rem 0.35rem;
    border-radius: 0.35rem;
    background: rgba(0, 0, 0, 0.04);
  }
  :global(html.dark) .tally {
    background: rgba(255, 255, 255, 0.07);
  }
  .tally .ok {
    color: var(--ink);
    font-weight: 800;
  }
  .tally .sep {
    opacity: 0.45;
    margin: 0 0.08rem;
  }

  /* The only spots on the card that do something other than open it. */
  .acts {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex: none;
  }

  .act {
    width: 1.75rem;
    height: 1.75rem;
    display: grid;
    place-items: center;
    border-radius: 9999px;
    color: #6b7280;
    background: rgba(0, 0, 0, 0.05);
  }
  :global(html.dark) .act {
    color: #d1d5db;
    background: rgba(255, 255, 255, 0.08);
  }
  .act:hover,
  .act:focus-visible {
    color: var(--ink);
    background: color-mix(in srgb, var(--accent) 15%, transparent);
  }

  .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    height: 1.75rem;
    padding: 0 0.6rem;
    border-radius: 9999px;
    font-size: 0.71rem;
    font-weight: 800;
    white-space: nowrap;
    color: var(--ink);
    background: color-mix(in srgb, var(--accent) 13%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
  }
  .cta:hover,
  .cta:focus-visible {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .chev {
    font-size: 0.95rem;
    line-height: 1;
    opacity: 0.75;
  }

  /* A row the user has already answered keeps its shape but stops shouting: no
     accent fills, no coloured shadow — it is history, not a task. */
  .lev-row.done .wash {
    opacity: 0.35;
  }
  .lev-row.done .cta {
    color: #6b7280;
    background: rgba(0, 0, 0, 0.05);
    border-color: transparent;
  }
  :global(html.dark) .lev-row.done .cta {
    color: #d1d5db;
    background: rgba(255, 255, 255, 0.08);
  }
</style>
